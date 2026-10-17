-- models/marts/mart_route_performance.sql
WITH flights AS (
    SELECT * FROM {{ ref('stg_flights') }}
),
bookings AS (
    SELECT * FROM {{ ref('stg_bookings') }}
)

SELECT
    f.flight_id,
    f.flight_number,
    f.departure_code,
    f.departure_name,
    f.arrival_code,
    f.arrival_name,
    f.route_key,
    f.category,
    f.base_price,
    f.seats_total,
    COUNT(b.reservation_number) AS total_bookings_count,
    COALESCE(SUM(b.passengers_count), 0) AS total_passengers_booked,
    COALESCE(SUM(b.price_paid), 0) AS total_revenue,
    COALESCE(SUM(b.miles_earned), 0) AS total_miles_issued,
    ROUND(COALESCE(SUM(b.price_paid), 0) * 1.0 / NULLIF(SUM(b.passengers_count), 0), 0) AS avg_revenue_per_passenger,
    ROUND(COALESCE(SUM(b.passengers_count), 0) * 100.0 / NULLIF(f.seats_total, 0), 1) AS estimated_load_factor_pct
FROM flights f
LEFT JOIN bookings b ON f.flight_id = b.outbound_flight_id
GROUP BY 
    f.flight_id, f.flight_number, f.departure_code, f.departure_name,
    f.arrival_code, f.arrival_name, f.route_key, f.category, f.base_price, f.seats_total
ORDER BY total_revenue DESC, total_bookings_count DESC
