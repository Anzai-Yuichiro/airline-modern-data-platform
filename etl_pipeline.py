# etl_pipeline.py
import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions
import json
import re
import os
import time
import requests
from datetime import datetime

# Custom DoFn to consume messages from Kafka topic (Streaming source)
class KafkaSourceDoFn(beam.DoFn):
    def __init__(self, bootstrap_servers='localhost:9092', topic='raw-events'):
        self.bootstrap_servers = bootstrap_servers
        self.topic = topic

    def process(self, element):
        from kafka import KafkaConsumer
        
        print(f"[Streaming ETL] Initializing Kafka consumer. Broker: {self.bootstrap_servers}")
        
        # Retry loop to connect to Kafka in case the container is still starting
        consumer = None
        for i in range(30):
            try:
                consumer = KafkaConsumer(
                    self.topic,
                    bootstrap_servers=self.bootstrap_servers,
                    auto_offset_reset='latest',
                    value_deserializer=lambda x: x.decode('utf-8'),
                    request_timeout_ms=5000,
                    api_version=(2, 5, 0)
                )
                break
            except Exception as e:
                print(f"[Streaming ETL] Waiting for Kafka broker... (Attempt {i+1}/30) | Error: {e}")
                time.sleep(2)
        
        if not consumer:
            raise Exception("Failed to connect to Kafka broker.")

        print(f"[Streaming ETL] Subscribed to topic '{self.topic}'. Waiting for incoming events...")
        for message in consumer:
            yield message.value

# Define the custom DoFn for loading data into DuckDB via Express API Gateway
class WriteToExpress(beam.DoFn):
    def __init__(self, api_url='http://localhost:3001/api/analytics/events'):
        self.api_url = api_url

    def process(self, element):
        try:
            # Format timestamp back to string for JSON serialization
            payload = {
                **element,
                'timestamp': element['timestamp'].isoformat()
            }
            
            # Send enriched event to Express server
            res = requests.post(self.api_url, json=payload, timeout=5)
            if res.status_code == 200:
                print(f"[Express Load Success] Loaded event '{element['event_name']}' via Express API Gateway.")
            else:
                print(f"[Express Load Error] HTTP status: {res.status_code} | Msg: {res.text}")
            yield element
        except Exception as e:
            print(f"[Express Load Error] Request failed: {e}")

# Custom DoFn to parse and enrich User-Agent (Transform phase)
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
                parsed_ts = datetime.fromisoformat(raw_ts.replace('Z', '+00:00'))
            except Exception:
                parsed_ts = datetime.utcnow()

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

def run_pipeline(bootstrap_servers='localhost:9092', topic='raw-events', api_url='http://localhost:3001/api/analytics/events'):
    # Pipeline options for DirectRunner (local execution)
    options = PipelineOptions([
        '--runner=DirectRunner'
    ])

    print(f"=========================================")
    print(f" Starting Real-Time Kafka Streaming Apache Beam ETL")
    print(f" Kafka Broker: {bootstrap_servers}")
    print(f" Topic: {topic}")
    print(f" Forwarding to: {api_url}")
    print(f"=========================================")

    # Define and run the streaming Beam DAG
    with beam.Pipeline(options=options) as p:
        (
            p
            | "Initialize Generator" >> beam.Create([None])
            | "Subscribe Kafka" >> beam.ParDo(KafkaSourceDoFn(bootstrap_servers, topic))
            | "Parse & Enrich Events" >> beam.ParDo(ParseAndEnrichEvent())
            | "Load into DuckDB via Express" >> beam.ParDo(WriteToExpress(api_url))
        )

if __name__ == '__main__':
    run_pipeline()
