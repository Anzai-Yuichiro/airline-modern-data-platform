-- models/staging/stg_members.sql
WITH source AS (
    SELECT * FROM {{ source('raw_data', 'members') }}
)

SELECT
    member_number,
    email,
    last_name_kanji,
    first_name_kanji,
    CONCAT(last_name_kanji, ' ', first_name_kanji) AS full_name_kanji,
    card_type,
    CAST(miles AS INTEGER) AS current_miles,
    CASE 
        WHEN miles >= 30000 THEN 'ALTAIR'
        WHEN miles >= 15000 THEN 'VEGA'
        ELSE 'REGULAR'
    END AS member_tier,
    created_at AS registered_at
FROM source
WHERE member_number IS NOT NULL
