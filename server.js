// server.js
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const LOG_FILE = path.join(__dirname, 'raw_events.jsonl');

app.use(cors());
app.use(express.json());

// Ingestion Endpoint (Extract)
app.post('/api/logs', (req, res) => {
  const eventData = req.body;

  // Add server-side timestamp and IP if not present
  const enrichedRawEvent = {
    ...eventData,
    ip_address: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
    server_timestamp: new Date().toISOString()
  };

  // Convert to single-line JSON string and append to raw_events.jsonl
  const logLine = JSON.stringify(enrichedRawEvent) + '\n';

  fs.appendFile(LOG_FILE, logLine, 'utf8', (err) => {
    if (err) {
      console.error('[Ingest Error] Failed to write log:', err);
      return res.status(500).json({ status: 'error', message: 'Failed to write log' });
    }

    // Console logging for real-time visual monitoring
    console.log(
      `[Ingestion Gateway] Event: "${enrichedRawEvent.event_name}" | Session: ${enrichedRawEvent.session_id.substring(0, 8)}...`
    );
    res.status(200).json({ status: 'success' });
  });
});

app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(` ETL Ingestion Server is running on port ${PORT}`);
  console.log(` Appending raw events to: ${LOG_FILE}`);
  console.log(`=========================================`);
});
