-- models/marts/mart_member_segments.sql
WITH members AS (
    SELECT * FROM {{ ref('stg_members') }}
),
bookings AS (
    SELECT * FROM {{ ref('stg_bookings') }}
)

SELECT
    m.member_number,
    m.full_name_kanji,
    m.email,
    m.card_type,
    m.member_tier,
    m.current_miles,
    COUNT(b.reservation_number) AS lifetime_bookings_count,
    COALESCE(SUM(b.passengers_count), 0) AS lifetime_passengers_count,
    COALESCE(SUM(b.price_paid), 0) AS lifetime_value_ltv,
    COALESCE(SUM(b.miles_earned), 0) AS lifetime_miles_earned,
    MAX(b.booked_at) AS last_booked_at,
    CASE 
        WHEN COALESCE(SUM(b.price_paid), 0) >= 100000 THEN 'VIP (Platinum LTV)'
        WHEN COALESCE(SUM(b.price_paid), 0) >= 50000 THEN 'High Value (Gold LTV)'
        WHEN COUNT(b.reservation_number) > 0 THEN 'Active Booked'
        ELSE 'Registered Only (Prospect)'
    END AS ltv_segment
FROM members m
LEFT JOIN bookings b ON m.member_number = b.member_number
GROUP BY 
    m.member_number, m.full_name_kanji, m.email, m.card_type, m.member_tier, m.current_miles
ORDER BY lifetime_value_ltv DESC, m.current_miles DESC
