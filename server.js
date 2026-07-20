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

  db.run(`
    CREATE TABLE IF NOT EXISTS flights (
      flight_id VARCHAR PRIMARY KEY,
      flight_number VARCHAR,
      departure_code VARCHAR,
      departure_name VARCHAR,
      arrival_code VARCHAR,
      arrival_name VARCHAR,
      departure_time VARCHAR,
      arrival_time VARCHAR,
      category VARCHAR,
      base_price INTEGER,
      seats_total INTEGER DEFAULT 150
    )
  `, (flightCreateErr) => {
    if (flightCreateErr) {
      console.error('[DuckDB Initialization Error]: Failed to create flights table.', flightCreateErr);
    } else {
      console.log('[DuckDB Table Ready] Ensure table "flights" exists.');
      db.all('SELECT COUNT(*) as count FROM flights', (err, rows) => {
        if (!err && rows && rows[0] && Number(rows[0].count) === 0) {
          console.log('[DuckDB Seeding] Seeding default flight routes...');
          const values = [
            // Domestic HND <=> KKJ
            "('SFJ071', '71', 'HND', '羽田（東京）', 'KKJ', '北九州', '07:40', '09:15', 'domestic', 12800)",
            "('SFJ077', '77', 'HND', '羽田（東京）', 'KKJ', '北九州', '11:15', '12:55', 'domestic', 14800)",
            "('SFJ087', '87', 'HND', '羽田（東京）', 'KKJ', '北九州', '18:30', '20:10', 'domestic', 15800)",
            "('SFJ070', '70', 'KKJ', '北九州', 'HND', '羽田（東京）', '08:00', '09:35', 'domestic', 12800)",
            "('SFJ076', '76', 'KKJ', '北九州', 'HND', '羽田（東京）', '12:00', '13:35', 'domestic', 14800)",
            "('SFJ086', '86', 'KKJ', '北九州', 'HND', '羽田（東京）', '18:00', '19:35', 'domestic', 15800)",
            
            // Domestic HND <=> FUK
            "('SFJ041', '41', 'HND', '羽田（東京）', 'FUK', '福岡', '06:25', '08:15', 'domestic', 13500)",
            "('SFJ047', '47', 'HND', '羽田（東京）', 'FUK', '福岡', '12:00', '13:50', 'domestic', 15500)",
            "('SFJ040', '40', 'FUK', '福岡', 'HND', '羽田（東京）', '08:00', '09:40', 'domestic', 13500)",
            "('SFJ046', '46', 'FUK', '福岡', 'HND', '羽田（東京）', '14:00', '15:40', 'domestic', 15500)",

            // Domestic HND <=> KIX
            "('SFJ021', '21', 'HND', '羽田（東京）', 'KIX', '関西（大阪）', '09:10', '10:25', 'domestic', 11000)",
            "('SFJ020', '20', 'KIX', '関西（大阪）', 'HND', '羽田（東京）', '07:05', '08:15', 'domestic', 11000)",

            // Domestic HND <=> UBJ
            "('SFJ011', '11', 'HND', '羽田（東京）', 'UBJ', '山口宇部', '11:00', '12:40', 'domestic', 14000)",
            "('SFJ012', '12', 'UBJ', '山口宇部', 'HND', '羽田（東京）', '13:15', '14:50', 'domestic', 14000)",

            // International KKJ <=> TPE
            "('SFJ801', '801', 'KKJ', '北九州', 'TPE', '台北（桃園）', '15:00', '16:30', 'international', 22000)",
            "('SFJ802', '802', 'TPE', '台北（桃園）', 'KKJ', '北九州', '17:30', '21:00', 'international', 24000)",

            // International NGO <=> TPE
            "('SFJ811', '811', 'NGO', '中部（名古屋）', 'TPE', '台北（桃園）', '08:30', '10:45', 'international', 23000)",
            "('SFJ812', '812', 'TPE', '台北（桃園）', 'NGO', '中部（名古屋）', '11:45', '15:20', 'international', 25000)"
          ];

          const insertSql = `
            INSERT INTO flights (flight_id, flight_number, departure_code, departure_name, arrival_code, arrival_name, departure_time, arrival_time, category, base_price)
            VALUES ${values.join(',\n')}
          `;

          db.run(insertSql, (insertErr) => {
            if (insertErr) {
              console.error('[DuckDB Seeding Error]:', insertErr);
            } else {
              console.log('[DuckDB Seeding] Default flights successfully seeded!');
            }
          });
        }
      });
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS bookings (
      reservation_number VARCHAR PRIMARY KEY,
      member_number VARCHAR,
      outbound_flight_id VARCHAR,
      return_flight_id VARCHAR,
      departure_date VARCHAR,
      return_date VARCHAR,
      passengers_count INTEGER,
      price_paid INTEGER,
      miles_earned INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `, (bookingCreateErr) => {
    if (bookingCreateErr) {
      console.error('[DuckDB Initialization Error]: Failed to create bookings table.', bookingCreateErr);
    } else {
      console.log('[DuckDB Table Ready] Ensure table "bookings" exists.');
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

// =========================================
// Flight Booking & Management APIs
// =========================================

// 13. Get All Flights (空港選択肢・便マスタ用)
app.get('/api/flights', async (req, res) => {
  try {
    const flights = await runQuery('SELECT * FROM flights ORDER BY flight_id;');
    res.json({ flights });
  } catch (err) {
    console.error('[Get Flights Error]:', err);
    res.status(500).json({ error: err.message });
  }
});

// 14. Search Flights (空席検索用)
app.get('/api/flights/search', async (req, res) => {
  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(400).json({ error: '出発地（from）と到着地（to）を指定してください。' });
  }

  try {
    const flights = await runQuery(
      'SELECT * FROM flights WHERE departure_code = ? AND arrival_code = ? ORDER BY departure_time;',
      [from, to]
    );
    res.json({ flights });
  } catch (err) {
    console.error('[Search Flights Error]:', err);
    res.status(500).json({ error: err.message });
  }
});

// 15. Confirm Flight Booking & Add Miles
app.post('/api/bookings/confirm', async (req, res) => {
  const {
    member_number,
    session_id,
    outbound_flight_id,
    return_flight_id,
    departure_date,
    return_date,
    passengers,
    total_price,
    event_id,
    user_agent
  } = req.body;

  if (!outbound_flight_id || !total_price) {
    return res.status(400).json({ error: '予約情報が不足しています。' });
  }

  // Generate Booking Reference Number: R + 5 digits (e.g. R48291)
  const rsvNum = 'R' + Math.floor(10000 + Math.random() * 90000).toString();
  const milesEarned = Math.floor(total_price * 0.10); // 10% mileage back

  try {
    // 1. Award miles to the member if logged in
    if (member_number) {
      db.run(
        'UPDATE members SET miles = miles + ? WHERE member_number = ?',
        milesEarned,
        member_number,
        (updateErr) => {
          if (updateErr) console.error('[Booking update miles error]:', updateErr);
          else console.log(`[Booking Miles Awarded] Member ${member_number} earned +${milesEarned} miles.`);
        }
      );
    }

    // 2. Log event: Ingestion gateway style
    const bookingEvent = {
      event_id: event_id || `rsv-evt-${Date.now()}`,
      session_id: session_id || 'anonymous-session',
      member_number: member_number || null,
      event_name: 'book_flight',
      user_agent: user_agent || 'Mozilla/5.0',
      properties: {
        reservation_number: rsvNum,
        outbound_flight_id,
        return_flight_id: return_flight_id || null,
        departure_date,
        return_date: return_date || null,
        passengers_count: Number(passengers || 1),
        price_paid: Number(total_price),
        miles_earned: milesEarned
      },
      timestamp: new Date().toISOString()
    };

    // 3. Publish to Kafka topic 'raw-events'
    const eventJson = JSON.stringify(bookingEvent);
    fs.appendFile(LOG_FILE, eventJson + '\n', 'utf8', () => {});

    try {
      await producer.send({
        topic: 'raw-events',
        messages: [{ value: eventJson }],
      });
      console.log(`[Kafka Ingestion] Published booking event to Kafka`);
    } catch (kErr) {
      console.error('[Kafka Ingestion Error] Failed to publish booking event:', kErr.message);
    }

    // 4. Save directly into DuckDB events table to ensure instant view (or let Beam handle it)
    const propsStr = JSON.stringify(bookingEvent.properties);
    db.run(`
      INSERT OR IGNORE INTO events 
      (event_id, session_id, member_number, event_name, user_agent, device_type, browser, properties, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      bookingEvent.event_id,
      bookingEvent.session_id,
      bookingEvent.member_number,
      bookingEvent.event_name,
      bookingEvent.user_agent,
      'PC', // Default or parsed device
      'Browser', // Default or parsed browser
      propsStr,
      bookingEvent.timestamp,
      (insertErr) => {
        if (insertErr) console.error('[DuckDB Insert Booking Event Error]:', insertErr);
      }
    );

    // 5. Save structured record into bookings table
    db.run(`
      INSERT OR IGNORE INTO bookings 
      (reservation_number, member_number, outbound_flight_id, return_flight_id, departure_date, return_date, passengers_count, price_paid, miles_earned)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      rsvNum,
      member_number || null,
      outbound_flight_id,
      return_flight_id || null,
      departure_date,
      return_date || null,
      Number(passengers || 1),
      Number(total_price),
      milesEarned,
      (insertRsvErr) => {
        if (insertRsvErr) console.error('[DuckDB Insert Bookings Table Error]:', insertRsvErr);
        else console.log(`[DuckDB Bookings Table] Reservation ${rsvNum} registered.`);
      }
    );

    res.json({
      status: 'success',
      reservation_number: rsvNum,
      miles_earned: milesEarned,
      total_price
    });
  } catch (err) {
    console.error('[Booking Confirm Error]:', err);
    res.status(500).json({ error: err.message });
  }
});

// 16. Local Dev Concurrency Query Fallback (Only permits localhost connections)
app.post('/api/dev/query', (req, res) => {
  const remoteIp = req.socket.remoteAddress;
  if (
    remoteIp !== '127.0.0.1' && 
    remoteIp !== '::1' && 
    remoteIp !== '::ffff:127.0.0.1'
  ) {
    return res.status(403).json({ error: 'Access forbidden: Local query API is only accessible from localhost.' });
  }

  const { sql, params } = req.body;
  if (!sql) {
    return res.status(400).json({ error: 'Missing SQL query statement.' });
  }

  db.all(sql, ...(params || []), (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ rows });
    }
  });
});

app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(` Ingestion & Analytics Server is running on port ${PORT}`);
  console.log(` Appending raw events to: ${LOG_FILE}`);
  console.log(` Database: ${DB_FILE} (Persistent Connection)`);
  console.log(`=========================================`);
  initKafka();
});
