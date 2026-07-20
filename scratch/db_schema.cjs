// scratch/db_schema.cjs
const duckdb = require('duckdb');
const path = require('path');

const DB_FILE = path.join(__dirname, '../analytics.db');

// Fallback schema builder via HTTP API when database is locked
function runFallbackSchema() {
  const getTablesQuery = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'main' AND table_type = 'BASE TABLE' ORDER BY table_name;";
  
  fetch('http://localhost:3001/api/dev/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql: getTablesQuery })
  })
    .then(res => {
      if (!res.ok) throw new Error('Failed to retrieve tables');
      return res.json();
    })
    .then(data => {
      const tables = data.rows || [];
      if (tables.length === 0) {
        console.log('No user-defined tables found in the database.');
        process.exit(0);
      }

      console.log('==================================================================');
      console.log(` Database Schema Overview (Found ${tables.length} table(s))`);
      console.log('==================================================================');

      // Sequentially query DESCRIBE for each table
      const describeNext = (index) => {
        if (index >= tables.length) {
          console.log('==================================================================');
          process.exit(0);
        }

        const tableName = tables[index].table_name;
        fetch('http://localhost:3001/api/dev/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sql: `DESCRIBE ${tableName};` })
        })
          .then(res => res.json())
          .then(descData => {
            const columns = descData.rows || [];
            console.log(`\n🔹 Table: "${tableName}"`);
            console.log('-'.repeat(tableName.length + 11));
            
            const formattedColumns = columns.map(col => ({
              'Column Name': col.column_name,
              'Data Type': col.column_type,
              'Nullable': col.null,
              'Default': col.default || 'NULL',
              'Key': col.key || '-'
            }));
            console.table(formattedColumns);
            describeNext(index + 1);
          })
          .catch(err => {
            console.error(`\nFailed to describe table "${tableName}":`, err.message);
            describeNext(index + 1);
          });
      };

      describeNext(0);
    })
    .catch(apiErr => {
      console.error('[Fallback Schema Error]: Failed to retrieve schema via local Express API.', apiErr.message);
      process.exit(1);
    });
}

// Connect in read-only mode to avoid process locks with running Express app
const db = new duckdb.Database(DB_FILE, duckdb.OPEN_READONLY, (err) => {
  if (err) {
    if (err.message.includes('lock') || err.message.includes('IO Error') || err.message.includes('locked')) {
      runFallbackSchema();
      return;
    }
    console.error(`[DuckDB Connection Error]: Failed to open database file.`, err.message);
    process.exit(1);
  }

  // Retrieve all base tables in the 'main' schema
  const query = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'main' AND table_type = 'BASE TABLE' ORDER BY table_name;";
  
  db.all(query, (tableErr, tables) => {
    if (tableErr) {
      console.error(`[Schema Query Error]: Failed to retrieve tables list.`, tableErr.message);
      process.exit(1);
    }

    if (tables.length === 0) {
      console.log('No user-defined tables found in the database.');
      return;
    }

    console.log('==================================================================');
    console.log(` Database Schema Overview (Found ${tables.length} table(s))`);
    console.log('==================================================================');

    // Sequentially describe each table to prevent concurrent execution conflicts
    const describeTableSequentially = (index) => {
      if (index >= tables.length) {
        console.log('==================================================================');
        return;
      }

      const tableName = tables[index].table_name;
      
      db.all(`DESCRIBE ${tableName};`, (descErr, columns) => {
        if (descErr) {
          console.error(`\nFailed to describe table "${tableName}":`, descErr.message);
        } else {
          console.log(`\n🔹 Table: "${tableName}"`);
          console.log('-'.repeat(tableName.length + 11));
          
          // Format properties for compact display
          const formattedColumns = columns.map(col => ({
            'Column Name': col.column_name,
            'Data Type': col.column_type,
            'Nullable': col.null,
            'Default': col.default || 'NULL',
            'Key': col.key || '-'
          }));
          
          console.table(formattedColumns);
        }

        describeTableSequentially(index + 1);
      });
    };

    describeTableSequentially(0);
  });
});
