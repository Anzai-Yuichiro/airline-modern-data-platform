-- models/marts/mart_funnel_conversion.sql
WITH sessions AS (
    SELECT * FROM {{ ref('int_sessions') }}
)

SELECT
    DATE(session_start_at) AS session_date,
    device_type,
    browser,
    COUNT(DISTINCT session_id) AS total_sessions,
    
    -- Funnel Step Counts
    SUM(CASE WHEN pv_count > 0 THEN 1 ELSE 0 END) AS step1_visited_count,
    SUM(has_searched) AS step2_searched_count,
    SUM(has_selected_flight) AS step3_selected_flight_count,
    SUM(has_selected_seat) AS step4_selected_seat_count,
    SUM(has_booked) AS step5_booked_count,
    
    -- Funnel Conversion Rates (%)
    ROUND(SUM(has_searched) * 100.0 / NULLIF(COUNT(DISTINCT session_id), 0), 2) AS search_rate_pct,
    ROUND(SUM(has_selected_flight) * 100.0 / NULLIF(SUM(has_searched), 0), 2) AS flight_select_rate_pct,
    ROUND(SUM(has_selected_seat) * 100.0 / NULLIF(SUM(has_selected_flight), 0), 2) AS seat_select_rate_pct,
    ROUND(SUM(has_booked) * 100.0 / NULLIF(SUM(has_selected_seat), 0), 2) AS final_booking_rate_pct,
    ROUND(SUM(has_booked) * 100.0 / NULLIF(COUNT(DISTINCT session_id), 0), 2) AS overall_cvr_pct
FROM sessions
GROUP BY DATE(session_start_at), device_type, browser
ORDER BY session_date DESC, total_sessions DESC
