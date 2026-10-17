-- models/staging/stg_events.sql
WITH source AS (
    SELECT * FROM {{ source('raw_data', 'events') }}
)

SELECT
    event_id,
    session_id,
    member_number,
    event_name,
    user_agent,
    device_type,
    browser,
    properties,
    -- JSON properties extraction
    json_extract_string(properties, '$.from_airport') AS from_airport,
    json_extract_string(properties, '$.to_airport') AS to_airport,
    json_extract_string(properties, '$.departure_date') AS departure_date,
    json_extract_string(properties, '$.flight_id') AS flight_id,
    json_extract_string(properties, '$.seat_number') AS seat_number,
    json_extract_string(properties, '$.reservation_number') AS reservation_number,
    CAST(json_extract(properties, '$.passengers_count') AS INTEGER) AS passengers_count,
    CAST(json_extract(properties, '$.price_paid') AS INTEGER) AS price_paid,
    timestamp AS event_timestamp,
    DATE(timestamp) AS event_date
FROM source
WHERE event_id IS NOT NULL
