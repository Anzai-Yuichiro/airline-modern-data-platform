# Makefile for querying DuckDB database

.PHONY: db-cli db-members db-events db-schema help query

DB_FILE=analytics.db

help:
	@echo "=================================================================="
	@echo " Starflyer Simulator DuckDB Query Utilities"
	@echo "=================================================================="
	@echo "Available commands:"
	@echo "  make db-cli       - Open DuckDB CLI console in READ-ONLY mode"
	@echo "  make db-schema    - Show tables and column definitions"
	@echo "  make db-members   - Display all registered STAR LINK members"
	@echo "  make db-events    - Display the latest 20 actions (logs) in DB"
	@echo "  make query Q=\"...\" - Run a custom SQL query in read-only mode"
	@echo "                      (e.g., make query Q=\"SELECT count(*) FROM events\")"
	@echo "=================================================================="

db-cli:
	@type duckdb >/dev/null 2>&1 || (echo "Error: 'duckdb' CLI is not installed on your system." && echo "You can install it with: brew install duckdb" && exit 1)
	duckdb -readonly $(DB_FILE)

db-schema:
	@node scratch/query_db.cjs "PRAGMA show_tables;"
	@echo "\n--- Columns in events table ---"
	@node scratch/query_db.cjs "DESCRIBE events;"
	@echo "\n--- Columns in members table ---"
	@node scratch/query_db.cjs "DESCRIBE members;"

db-members:
	@node scratch/query_db.cjs "SELECT member_number, email, last_name_kanji || ' ' || first_name_kanji as name, card_type, miles, created_at FROM members ORDER BY created_at DESC;"

db-events:
	@node scratch/query_db.cjs "SELECT event_id, member_number, event_name, device_type, browser, timestamp FROM events ORDER BY timestamp DESC LIMIT 20;"

query:
	@if [ -z "$(Q)" ]; then \
		echo "Error: Please specify a query, e.g., make query Q=\"SELECT * FROM members\""; \
		exit 1; \
	fi
	@node scratch/query_db.cjs "$(Q)"
