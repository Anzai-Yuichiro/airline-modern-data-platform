# etl_pipeline.py
import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions
import json
import re
import os
import duckdb
from datetime import datetime

# Define the custom DoFn for loading data into DuckDB
class WriteToDuckDB(beam.DoFn):
    def __init__(self, db_path='analytics.db'):
        self.db_path = db_path

    def setup(self):
        # Create connection and table if not exists during worker setup
        self.conn = duckdb.connect(self.db_path)
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS events (
                event_id VARCHAR PRIMARY KEY,
                session_id VARCHAR,
                event_name VARCHAR,
                user_agent VARCHAR,
                device_type VARCHAR,
                browser VARCHAR,
                properties VARCHAR, -- Stored as JSON string for high extensibility
                timestamp TIMESTAMP
            )
        """)

    def process(self, element):
        try:
            # Insert element dictionary into DuckDB
            self.conn.execute("""
                INSERT OR IGNORE INTO events 
                (event_id, session_id, event_name, user_agent, device_type, browser, properties, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                element['event_id'],
                element['session_id'],
                element['event_name'],
                element['user_agent'],
                element['device_type'],
                element['browser'],
                json.dumps(element['properties']), # Serialize dict to JSON string
                element['timestamp']
            ))
            yield element
        except Exception as e:
            print(f"[DuckDB Load Error] Failed to write event: {e}")

    def teardown(self):
        # Close connection when worker shuts down
        if self.conn:
            self.conn.close()

# Custom PTransform to parse and enrich User-Agent (Transform phase)
class ParseAndEnrichEvent(beam.DoFn):
    def process(self, element):
        try:
            event = json.loads(element)
            
            user_agent = event.get('user_agent', '')
            
            # Simple Regex-based User-Agent parser for device classification
            device_type = 'PC'
            if re.search(r'Mobi|Android|iPhone|iPad', user_agent, re.IGNORECASE):
                if re.search(r'iPad|Tablet', user_agent, re.IGNORECASE):
                    device_type = 'Tablet'
                else:
                    device_type = 'Mobile'
            
            # Simple Browser detection
            browser = 'Other'
            if 'Chrome' in user_agent and 'Safari' in user_agent:
                browser = 'Chrome'
            elif 'Safari' in user_agent and 'Chrome' not in user_agent:
                browser = 'Safari'
            elif 'Firefox' in user_agent:
                browser = 'Firefox'
            elif 'Edge' in user_agent:
                browser = 'Edge'

            # Parse and format timestamp to ISO standard datetime
            raw_ts = event.get('timestamp')
            try:
                # Convert ISO 8601 string to Python datetime
                parsed_ts = datetime.fromisoformat(raw_ts.replace('Z', '+00:00'))
            except Exception:
                parsed_ts = datetime.utcnow()

            # Enriched data structure matching table schema
            enriched = {
                'event_id': event.get('event_id'),
                'session_id': event.get('session_id'),
                'event_name': event.get('event_name'),
                'user_agent': user_agent,
                'device_type': device_type,
                'browser': browser,
                'properties': event.get('properties', {}),
                'timestamp': parsed_ts
            }
            
            print(f"[ETL Processed] Event: {enriched['event_name']} | Device: {enriched['device_type']} | Browser: {enriched['browser']}")
            yield enriched
        except Exception as e:
            print(f"[ETL Parse Error] Failed to process line: {e}")

def run_pipeline(input_file='raw_events.jsonl', db_path='analytics.db'):
    # Pipeline options for DirectRunner (local execution)
    options = PipelineOptions([
        '--runner=DirectRunner'
    ])

    print(f"=========================================")
    print(f" Starting Apache Beam ETL Pipeline")
    print(f" Source: {input_file}")
    print(f" Destination DuckDB: {db_path}")
    print(f"=========================================")

    # Define and run the Beam DAG
    with beam.Pipeline(options=options) as p:
        (
            p
            | "Read Raw Events" >> beam.io.ReadFromText(input_file)
            | "Parse & Enrich Events" >> beam.ParDo(ParseAndEnrichEvent())
            | "Load into DuckDB" >> beam.ParDo(WriteToDuckDB(db_path))
        )

if __name__ == '__main__':
    # Execute the pipeline
    # Create the raw file if not exists to prevent beam read errors
    if not os.path.exists('raw_events.jsonl'):
        with open('raw_events.jsonl', 'w') as f:
            pass
    run_pipeline()
