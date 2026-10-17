# Makefile for querying DuckDB database and running applications

.PHONY: db-cli db-members db-events db-schema help query run-server run-sim run-dash run-etl run-docker run-all dbt-run dbt-test simulate

DB_FILE=analytics.db

help:
	@echo "=================================================================="
	@echo " Starflyer Simulator & Analytics Control Console"
	@echo "=================================================================="
	@echo "Application Run Commands:"
	@echo "  make run-server     - Start Express Backend Server (Port 3001)"
	@echo "  make run-sim        - Start Vite Web Simulator (Port 5173)"
	@echo "  make run-dash       - Start Vite Analytics Dashboard (Port 5174)"
	@echo "  make run-etl        - Start Python ETL Pipeline (Real-time)"
	@echo "  make run-docker     - Start Kafka & Infrastructure (Docker Compose)"
	@echo "  make run-all        - Start Server, Simulator & Dashboard concurrently"
	@echo "  make simulate       - Generate simulated user journeys (Searches, Bookings, Carts)"
	@echo ""
	@echo "Modern Data Stack (dbt) Commands:"
	@echo "  make dbt-run        - Execute dbt staging, intermediate, and marts models"
	@echo "  make dbt-test       - Run dbt data quality and constraint tests"
	@echo ""
	@echo "Database Commands:"
	@echo "  make db-cli         - Open DuckDB CLI console in READ-ONLY mode"
	@echo "  make db-schema      - Show tables and column definitions"
	@echo "  make db-members     - Display all registered STAR LINK members"
	@echo "  make db-events      - Display the latest 20 actions (logs) in DB"
	@echo "  make query Q=\"...\"   - Run a custom SQL query in read-only mode"
	@echo "                        (e.g., make query Q=\"SELECT count(*) FROM events\")"
	@echo "=================================================================="

# Run Targets
run-server:
	@echo "Starting Backend Server..."
	npm run server

run-sim:
	@echo "Starting Web Simulator..."
	npm run dev

run-dash:
	@echo "Starting Analytics Dashboard..."
	npm run --prefix dashboard dev

run-etl:
	@echo "Starting Python ETL Pipeline..."
	./venv/bin/python etl_pipeline.py

run-docker:
	@echo "Starting Zookeeper, Kafka, and infrastructure..."
	docker-compose up

run-all:
	@echo "Starting Server, Simulator, and Dashboard concurrently..."
	@(trap 'kill 0' SIGINT; npm run server & npm run dev & npm run --prefix dashboard dev & wait)

# Database Targets
db-cli:
	@type duckdb >/dev/null 2>&1 || (echo "Error: 'duckdb' CLI is not installed on your system." && echo "You can install it with: brew install duckdb" && exit 1)
	duckdb -readonly $(DB_FILE)

db-schema:
	@node scratch/db_schema.cjs

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

simulate:
	@echo "Running traffic simulation..."
	python3 scripts/simulate_traffic.py

dbt-run:
	@echo "Executing dbt models..."
	cd dbt_starflyer && dbt run --profiles-dir .

dbt-test:
	@echo "Running dbt tests..."
	cd dbt_starflyer && dbt test --profiles-dir .

