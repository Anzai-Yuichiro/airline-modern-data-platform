-- models/marts/mart_cart_abandonment.sql
WITH sessions AS (
    SELECT * FROM {{ ref('int_sessions') }}
),
members AS (
    SELECT * FROM {{ ref('stg_members') }}
),
flights AS (
    SELECT * FROM {{ ref('stg_flights') }}
)

SELECT
    s.session_id,
    s.member_number,
    m.full_name_kanji,
    m.email,
    m.member_tier,
    s.device_type,
    s.searched_departure,
    s.searched_arrival,
    s.last_flight_id,
    f.flight_number,
    f.departure_time,
    f.arrival_time,
    f.base_price,
    s.session_start_at,
    s.session_end_at,
    s.session_duration_minutes,
    s.has_searched,
    s.has_selected_flight,
    s.has_selected_seat,
    CASE
        WHEN s.has_selected_seat = 1 THEN 'Seat Selected (High Intent)'
        WHEN s.has_selected_flight = 1 THEN 'Flight Selected (Medium Intent)'
        ELSE 'Search Only (Low Intent)'
    END AS abandonment_stage
FROM sessions s
LEFT JOIN members m ON s.member_number = m.member_number
LEFT JOIN flights f ON s.last_flight_id = f.flight_id
WHERE (s.has_searched = 1 OR s.has_selected_flight = 1 OR s.has_selected_seat = 1)
  AND s.has_booked = 0
ORDER BY s.session_end_at DESC
