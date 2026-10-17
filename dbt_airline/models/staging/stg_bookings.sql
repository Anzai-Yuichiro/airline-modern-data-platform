-- models/staging/stg_bookings.sql
WITH source AS (
    SELECT * FROM {{ source('raw_data', 'bookings') }}
)

SELECT
    reservation_number,
    member_number,
    outbound_flight_id,
    return_flight_id,
    departure_date,
    return_date,
    CAST(passengers_count AS INTEGER) AS passengers_count,
    CAST(price_paid AS INTEGER) AS price_paid,
    CAST(miles_earned AS INTEGER) AS miles_earned,
    created_at AS booked_at
FROM source
WHERE reservation_number IS NOT NULL
