// server.js
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import duckdb from 'duckdb';
import { Kafka } from 'kafkajs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const LOG_FILE = path.join(__dirname, 'raw_events.jsonl');
const DB_FILE = path.join(__dirname, 'analytics.db');

app.use(cors());
app.use(express.json());

// Initialize a single persistent DuckDB Database instance (Exclusive read-write lock in Express)
const db = new duckdb.Database(DB_FILE, (err) => {
  if (err) {
    console.error('[DuckDB Initialization Error]: Failed to open database file.', err);
    process.exit(1);
  }
  console.log(`[DuckDB Connected] Persistent read-write connection established to: ${DB_FILE}`);
  
  // Create table if it does not exist
  db.run(`
    CREATE TABLE IF NOT EXISTS events (
      event_id VARCHAR PRIMARY KEY,
      session_id VARCHAR,
      event_name VARCHAR,
      user_agent VARCHAR,
      device_type VARCHAR,
      browser VARCHAR,
      properties VARCHAR, -- Stored as JSON string
      timestamp TIMESTAMP
    )
  `, (createErr) => {
    if (createErr) {
      console.error('[DuckDB Initialization Error]: Failed to create events table.', createErr);
    } else {
      console.log('[DuckDB Table Ready] Ensure table "events" exists.');
    }
  });
});

// Initialize Kafka Client & Producer
const kafka = new Kafka({
  clientId: 'starflyer-gateway',
  brokers: ['localhost:9092'],
  retry: {
    initialRetryTime: 100,
    retries: 8
  }
});

const producer = kafka.producer();

const initKafka = async () => {
  try {
    await producer.connect();
    console.log('[Kafka Connected] Producer is connected to Kafka broker successfully.');
  } catch (err) {
    console.error('[Kafka Connection Error] Failed to connect producer. Pipeline will retry in background:', err.message);
  }
};

// Promisified query helper utilizing the single persistent connection
const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    const callback = (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    };
    if (params && params.length > 0) {
      db.all(sql, params, callback);
    } else {
      db.all(sql, callback);
    }
  });
};

// 1. Ingestion Endpoint (Extract)
// Appends raw event to raw_events.jsonl AND publishes to Kafka topic 'raw-events'
app.post('/api/logs', (req, res) => {
  const eventData = req.body;

  const enrichedRawEvent = {
    ...eventData,
    ip_address: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
    server_timestamp: new Date().toISOString()
  };

  const logLine = JSON.stringify(enrichedRawEvent) + '\n';

  fs.appendFile(LOG_FILE, logLine, 'utf8', async (err) => {
    if (err) {
      console.error('[Ingest Error] Failed to write log:', err);
      return res.status(500).json({ status: 'error', message: 'Failed to write log' });
    }

    console.log(
      `[Ingestion Gateway] Event: "${enrichedRawEvent.event_name}" | Session: ${enrichedRawEvent.session_id.substring(0, 8)}...`
    );

    // Publish to Kafka topic 'raw-events'
    try {
      await producer.send({
        topic: 'raw-events',
        messages: [
          { value: JSON.stringify(enrichedRawEvent) }
        ]
      });
      console.log(`[Kafka Ingestion] Published event "${enrichedRawEvent.event_name}" to Kafka topic 'raw-events'`);
    } catch (kafkaErr) {
      console.error('[Kafka Ingestion Error] Failed to publish message. Is Kafka broker running?:', kafkaErr.message);
    }

    res.status(200).json({ status: 'success' });
  });
});

// 2. Real-Time Event Loader Endpoint (Load)
// Receives enriched event payload from the Apache Beam streaming pipeline and inserts it into DuckDB.
app.post('/api/analytics/events', (req, res) => {
  const { event_id, session_id, event_name, user_agent, device_type, browser, properties, timestamp } = req.body;

  if (!event_id || !event_name) {
    return res.status(400).json({ error: 'Missing event_id or event_name' });
  }

  const propsStr = typeof properties === 'string' ? properties : JSON.stringify(properties || {});

  db.run(`
    INSERT OR IGNORE INTO events 
    (event_id, session_id, event_name, user_agent, device_type, browser, properties, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, 
    event_id,
    session_id,
    event_name,
    user_agent,
    device_type,
    browser,
    propsStr,
    timestamp,
    (err) => {
      if (err) {
        console.error('[DuckDB Insert Error]:', err);
        return res.status(500).json({ error: err.message });
      }
      console.log(`[DuckDB Loader] Successfully loaded enriched event: "${event_name}"`);
      res.status(200).json({ status: 'success' });
    }
  );
});

// 3. Analytics KPI Endpoint
app.get('/api/analytics/kpis', async (req, res) => {
  try {
    const stats = await runQuery(`
      SELECT 
        CAST(COUNT(*) AS INTEGER) as total_events,
        CAST(COUNT(DISTINCT session_id) AS INTEGER) as unique_sessions,
        (
          SELECT (COUNT(DISTINCT session_id) * 100.0) / NULLIF((SELECT COUNT(DISTINCT session_id) FROM events), 0)
          FROM events 
          WHERE event_name='search_flights'
        ) as cvr
      FROM events
    `);

    const searchCountRow = await runQuery("SELECT CAST(COUNT(*) AS INTEGER) as count FROM events WHERE event_name='search_flights'");
    const totalSearches = searchCountRow[0]?.count || 0;

    const result = stats[0] || { total_events: 0, unique_sessions: 0, cvr: 0 };
    res.json({
      total_events: Number(result.total_events || 0),
      unique_sessions: Number(result.unique_sessions || 0),
      searches: Number(totalSearches),
      cvr: parseFloat(Number(result.cvr || 0).toFixed(2))
    });
  } catch (err) {
    console.error('[Analytics KPI Error]:', err);
    res.status(500).json({ error: err.message });
  }
});

// 4. Analytics Devices and Browsers Breakdown
app.get('/api/analytics/devices', async (req, res) => {
  try {
    const devices = await runQuery(`
      SELECT device_type, CAST(COUNT(*) AS INTEGER) as count 
      FROM events 
      GROUP BY device_type
    `);

    const browsers = await runQuery(`
      SELECT browser, CAST(COUNT(*) AS INTEGER) as count 
      FROM events 
      GROUP BY browser
    `);

    res.json({ devices, browsers });
  } catch (err) {
    console.error('[Analytics Devices Error]:', err);
    res.status(500).json({ error: err.message });
  }
});

// 5. Analytics Popular Searched Routes
app.get('/api/analytics/routes', async (req, res) => {
  try {
    const routes = await runQuery(`
      SELECT 
        json_extract_string(properties, '$.from_airport') as departure,
        json_extract_string(properties, '$.to_airport') as arrival,
        CAST(COUNT(*) AS INTEGER) as count
      FROM events 
      WHERE event_name='search_flights' AND properties IS NOT NULL
      GROUP BY departure, arrival
      HAVING departure IS NOT NULL AND arrival IS NOT NULL AND departure != '' AND arrival != ''
      ORDER BY count DESC
      LIMIT 5
    `);

    res.json({ routes });
  } catch (err) {
    console.error('[Analytics Routes Error]:', err);
    res.status(500).json({ error: err.message });
  }
});

// 6. Daily Activity Trend
app.get('/api/analytics/trends', async (req, res) => {
  try {
    const trends = await runQuery(`
      SELECT 
        strftime('%m/%d', timestamp) as date_label,
        CAST(COUNT(*) AS INTEGER) as count
      FROM events
      GROUP BY date_label
      ORDER BY min(timestamp) ASC
      LIMIT 14
    `);

    res.json({ trends });
  } catch (err) {
    console.error('[Analytics Trends Error]:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(` Ingestion & Analytics Server is running on port ${PORT}`);
  console.log(` Appending raw events to: ${LOG_FILE}`);
  console.log(` Database: ${DB_FILE} (Persistent Connection)`);
  console.log(`=========================================`);
  initKafka();
});
