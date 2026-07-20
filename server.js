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
  
  // Create tables if they do not exist
  db.run(`
    CREATE TABLE IF NOT EXISTS events (
      event_id VARCHAR PRIMARY KEY,
      session_id VARCHAR,
      member_number VARCHAR, -- Associated member if logged in
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
      // Migration: Add member_number column to events table if it does not exist
      db.run('ALTER TABLE events ADD COLUMN member_number VARCHAR', (alterErr) => {
        // Catch silently if column already exists
      });
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS members (
      member_number VARCHAR PRIMARY KEY,
      email VARCHAR UNIQUE,
      password VARCHAR,
      last_name_kanji VARCHAR,
      first_name_kanji VARCHAR,
      last_name_kana VARCHAR,
      first_name_kana VARCHAR,
      last_name_romaji VARCHAR,
      first_name_romaji VARCHAR,
      birthdate VARCHAR,
      gender VARCHAR,
      phone_number VARCHAR,
      postal_code VARCHAR,
      address VARCHAR,
      card_type VARCHAR,
      miles INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `, (memberCreateErr) => {
    if (memberCreateErr) {
      console.error('[DuckDB Initialization Error]: Failed to create members table.', memberCreateErr);
    } else {
      console.log('[DuckDB Table Ready] Ensure table "members" exists.');
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
      db.all(sql, ...params, callback);
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
  const { event_id, session_id, member_number, event_name, user_agent, device_type, browser, properties, timestamp } = req.body;

  if (!event_id || !event_name) {
    return res.status(400).json({ error: 'Missing event_id or event_name' });
  }

  const propsStr = typeof properties === 'string' ? properties : JSON.stringify(properties || {});

  db.run(`
    INSERT OR IGNORE INTO events 
    (event_id, session_id, member_number, event_name, user_agent, device_type, browser, properties, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, 
    event_id,
    session_id,
    member_number || null,
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
      console.log(`[DuckDB Loader] Successfully loaded enriched event: "${event_name}" (Member: ${member_number || 'anonymous'})`);
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

// =========================================
// Member Authentication & Registration APIs
// =========================================

// 7. Member Registration (新規会員登録)
app.post('/api/auth/register', async (req, res) => {
  const {
    email,
    password,
    last_name_kanji,
    first_name_kanji,
    last_name_kana,
    first_name_kana,
    last_name_romaji,
    first_name_romaji,
    birthdate,
    gender,
    phone_number,
    postal_code,
    address,
    card_type
  } = req.body;

  if (!email || !password || !last_name_kanji || !first_name_kanji) {
    return res.status(400).json({ error: '必須項目が入力されていません。' });
  }

  try {
    // Check if email already registered
    const existing = await runQuery('SELECT * FROM members WHERE email = ?', [email]);
    if (existing && existing.length > 0) {
      return res.status(400).json({ error: 'このメールアドレスは既に登録されています。' });
    }

    // Generate unique 10-digit member number (e.g. 1000 + 6 random digits)
    let memberNumber = '';
    let isUnique = false;
    while (!isUnique) {
      const randDigits = Math.floor(100000 + Math.random() * 900000).toString();
      memberNumber = `1000${randDigits}`;
      const check = await runQuery('SELECT * FROM members WHERE member_number = ?', [memberNumber]);
      if (!check || check.length === 0) {
        isUnique = true;
      }
    }

    // Award 1000 welcome miles
    const initialMiles = 1000;

    db.run(`
      INSERT INTO members (
        member_number, email, password, last_name_kanji, first_name_kanji,
        last_name_kana, first_name_kana, last_name_romaji, first_name_romaji,
        birthdate, gender, phone_number, postal_code, address, card_type, miles
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      memberNumber, email, password, last_name_kanji, first_name_kanji,
      last_name_kana, first_name_kana, last_name_romaji, first_name_romaji,
      birthdate, gender, phone_number, postal_code, address, card_type, initialMiles,
      (insertErr) => {
        if (insertErr) {
          console.error('[Register Insert Error]:', insertErr);
          return res.status(500).json({ error: insertErr.message });
        }

        console.log(`[Member Register] New member registered: ${memberNumber} (${email})`);
        res.status(200).json({
          status: 'success',
          member: {
            member_number: memberNumber,
            email,
            last_name_kanji,
            first_name_kanji,
            miles: initialMiles,
            card_type
          }
        });
      }
    );
  } catch (err) {
    console.error('[Register Flow Error]:', err);
    res.status(500).json({ error: err.message });
  }
});

// 8. Member Login (ログイン)
app.post('/api/auth/login', async (req, res) => {
  const { loginId, password } = req.body;

  if (!loginId || !password) {
    return res.status(400).json({ error: '会員番号またはメールアドレスと、パスワードを入力してください。' });
  }

  try {
    const rows = await runQuery(
      'SELECT * FROM members WHERE (member_number = ? OR email = ?) AND password = ?',
      [loginId, loginId, password]
    );

    if (!rows || rows.length === 0) {
      return res.status(401).json({ error: '会員番号・メールアドレス、またはパスワードが正しくありません。' });
    }

    const member = rows[0];
    // Remove password before returning
    delete member.password;

    console.log(`[Member Login] Logged in successfully: ${member.member_number}`);
    res.json({ status: 'success', member });
  } catch (err) {
    console.error('[Login Error]:', err);
    res.status(500).json({ error: err.message });
  }
});

// 9. Get Member List (会員マスタ一覧)
app.get('/api/members', async (req, res) => {
  try {
    const members = await runQuery('SELECT * FROM members ORDER BY created_at DESC');
    // Sanitize passwords
    members.forEach(m => delete m.password);
    res.json({ members });
  } catch (err) {
    console.error('[Get Members Error]:', err);
    res.status(500).json({ error: err.message });
  }
});

// 10. Member Analytics KPIs
app.get('/api/analytics/members/kpis', async (req, res) => {
  try {
    const kpiRow = await runQuery(`
      SELECT 
        CAST(COUNT(*) AS INTEGER) as total_members,
        CAST(SUM(miles) AS INTEGER) as total_miles,
        CAST(AVG(miles) AS INTEGER) as avg_miles
      FROM members
    `);

    const genderBreakdown = await runQuery(`
      SELECT gender, CAST(COUNT(*) AS INTEGER) as count 
      FROM members 
      GROUP BY gender
    `);

    const cardBreakdown = await runQuery(`
      SELECT card_type, CAST(COUNT(*) AS INTEGER) as count 
      FROM members 
      GROUP BY card_type
    `);

    res.json({
      kpis: kpiRow[0] || { total_members: 0, total_miles: 0, avg_miles: 0 },
      genderBreakdown,
      cardBreakdown
    });
  } catch (err) {
    console.error('[Member KPIs Error]:', err);
    res.status(500).json({ error: err.message });
  }
});

// 11. Member Registration Trends
app.get('/api/analytics/members/trends', async (req, res) => {
  try {
    const trends = await runQuery(`
      SELECT 
        strftime('%m/%d', created_at) as date_label,
        CAST(COUNT(*) AS INTEGER) as count
      FROM members
      GROUP BY date_label
      ORDER BY min(created_at) ASC
      LIMIT 14
    `);
    res.json({ trends });
  } catch (err) {
    console.error('[Member Trends Error]:', err);
    res.status(500).json({ error: err.message });
  }
});

// 12. Specific Member Activity History
app.get('/api/analytics/members/activity/:member_number', async (req, res) => {
  const { member_number } = req.params;
  try {
    const activities = await runQuery(`
      SELECT * FROM events 
      WHERE member_number = ? 
      ORDER BY timestamp DESC 
      LIMIT 30
    `, [member_number]);
    res.json({ activities });
  } catch (err) {
    console.error('[Member Activity Error]:', err);
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
