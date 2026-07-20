// scratch/query_db.cjs
const duckdb = require('duckdb');
const path = require('path');

const DB_FILE = path.join(__dirname, '../analytics.db');
const sqlQuery = process.argv[2];

if (!sqlQuery) {
  console.error('Error: No SQL query provided.');
  console.error('Usage: node query_db.cjs "SELECT * FROM members"');
  process.exit(1);
}

// Fallback to Express localhost dev API when DuckDB is locked
function runFallbackQuery() {
  fetch('http://localhost:3001/api/dev/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql: sqlQuery })
  })
    .then(res => {
      if (!res.ok) {
        return res.json().then(errData => { throw new Error(errData.error || 'Server error'); });
      }
      return res.json();
    })
    .then(data => {
      if (!data.rows || data.rows.length === 0) {
        console.log('Query returned 0 rows.');
      } else {
        console.table(data.rows);
      }
      process.exit(0);
    })
    .catch(apiErr => {
      console.error('[Fallback Query Error]: Failed to query via local Express API.', apiErr.message);
      process.exit(1);
    });
}

// Open in read-only mode to prevent lock conflicts with the running Express server
const db = new duckdb.Database(DB_FILE, duckdb.OPEN_READONLY, (err) => {
  if (err) {
    if (err.message.includes('lock') || err.message.includes('IO Error') || err.message.includes('locked')) {
      runFallbackQuery();
      return;
    }
    console.error(`[DuckDB Connection Error]: Failed to open database file in read-only mode.`, err.message);
    process.exit(1);
  }

  // Execute the query
  db.all(sqlQuery, (queryErr, rows) => {
    if (queryErr) {
      console.error(`[SQL Execution Error]:`, queryErr.message);
      process.exit(1);
    }

    if (rows.length === 0) {
      console.log('Query returned 0 rows.');
    } else {
      console.table(rows);
    }
    process.exit(0);
  });
});
