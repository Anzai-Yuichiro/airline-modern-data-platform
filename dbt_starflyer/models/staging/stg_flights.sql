-- models/staging/stg_flights.sql
WITH source AS (
    SELECT * FROM {{ source('raw_data', 'flights') }}
)

SELECT
    flight_id,
    flight_number,
    departure_code,
    departure_name,
    arrival_code,
    arrival_name,
    CONCAT(departure_code, '-', arrival_code) AS route_key,
    departure_time,
    arrival_time,
    category,
    CAST(base_price AS INTEGER) AS base_price,
    CAST(seats_total AS INTEGER) AS seats_total
FROM source
WHERE flight_id IS NOT NULL
