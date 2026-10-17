-- models/intermediate/int_sessions.sql
WITH events AS (
    SELECT * FROM {{ ref('stg_events') }}
)

SELECT
    session_id,
    MAX(member_number) AS member_number,
    MIN(device_type) AS device_type,
    MIN(browser) AS browser,
    MIN(event_timestamp) AS session_start_at,
    MAX(event_timestamp) AS session_end_at,
    ROUND((EPOCH(MAX(event_timestamp)) - EPOCH(MIN(event_timestamp))) / 60.0, 2) AS session_duration_minutes,
    COUNT(*) AS total_event_count,
    SUM(CASE WHEN event_name = 'page_view' THEN 1 ELSE 0 END) AS pv_count,
    MAX(CASE WHEN event_name = 'search_flights' THEN 1 ELSE 0 END) AS has_searched,
    MAX(CASE WHEN event_name IN ('flight_select', 'select_flight') THEN 1 ELSE 0 END) AS has_selected_flight,
    MAX(CASE WHEN event_name IN ('seat_select', 'select_seat') THEN 1 ELSE 0 END) AS has_selected_seat,
    MAX(CASE WHEN event_name = 'book_flight' THEN 1 ELSE 0 END) AS has_booked,
    MAX(from_airport) AS searched_departure,
    MAX(to_airport) AS searched_arrival,
    MAX(flight_id) AS last_flight_id,
    MAX(reservation_number) AS reservation_number
FROM events
GROUP BY session_id
