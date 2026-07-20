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

// Open in read-only mode to prevent lock conflicts with the running Express server
const db = new duckdb.Database(DB_FILE, duckdb.OPEN_READONLY, (err) => {
  if (err) {
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
      return;
    }

    // Format output in a beautiful table
    console.table(rows);
  });
});
