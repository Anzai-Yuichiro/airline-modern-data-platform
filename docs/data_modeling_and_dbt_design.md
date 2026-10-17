# スターフライヤー模擬システム データモデリング＆dbt設計書 (Data Modeling & dbt Design)

- **システム名称**: StarFlyer Real-Time Simulation & Modern Data Platform (SFJ-MDP)
- **対象レイヤー**: DWH / データレイク / dbtデータ変換レイヤー
- **モデリング思想**: Medallion Architecture (Bronze / Silver / Gold) & Kimball Dimensional Modeling
- **作成者**: 安西 雄一郎 (Cloud & Data Engineer)
- **バージョン**: 1.0.0
- **最終更新日**: 2026-10-03

---

## 1. モデリング方針とレイヤー構造

本システムでは、未加工のストリーミングイベントからビジネス指標の集計までを、以下の3階層（Medallion Architecture）で整理・分離します。

```
Raw Sources (Kafka / Pub/Sub)
    │
    ▼
【Bronze Layer (Raw / Ingestion)】
    └── `raw_events` (不変の追記型イベントログ)
    │
    ▼ (dbt / Dataflow Staging)
【Silver Layer (Conformed / Cleaned / Dimensions & Facts)】
    ├── `stg_events` (型安全・JSONパース済イベント)
    ├── `dim_members` (会員ディメンション・ランク・累積マイル)
    ├── `dim_flights` (運航便・路線・機材ディメンション)
    ├── `fct_web_events` (トラッキングイベントファクト)
    └── `fct_reservations` (予約・売上ファクト)
    │
    ▼ (dbt Marts Aggregation)
【Gold Layer (Business Marts / BI / MA Serving)】
    ├── `mart_funnel_conversion` (予約ステップ別離脱率・ファネルマート)
    ├── `mart_cart_abandonment` (カゴ落ち検知・MA連携用マート)
    ├── `mart_route_performance` (路線別搭乗率・収益分析マート)
    └── `mart_member_segments` (会員LTV・リピート搭乗分析マート)
```

---

## 2. dbt プロジェクト構成案

```
dbt_starflyer/
├── dbt_project.yml
├── profiles.yml
├── models/
│   ├── staging/                       # [Silver] ソースデータのクレンジング・リネーム
│   │   ├── schema.yml
│   │   ├── stg_events.sql
│   │   ├── stg_members.sql
│   │   ├── stg_flights.sql
│   │   └── stg_reservations.sql
│   ├── intermediate/                  # [Silver] 複数テーブルの結合・セッション化ロジック
│   │   ├── schema.yml
│   │   ├── int_sessions.sql          # イベントを行動セッションに束ねる
│   │   └── int_user_touchpoints.sql   # 予約直前の行動ログ結合
│   └── marts/                         # [Gold] ビジネス指標・可視化用集計テーブル
│       ├── schema.yml
│       ├── mart_funnel_conversion.sql # 予約ファネル分析
│       ├── mart_cart_abandonment.sql  # カゴ落ち検知マート
│       ├── mart_route_performance.sql # 路線別収益分析
│       └── mart_member_segments.sql   # 会員セグメンテーション
└── tests/                             # カスタムテスト・ビジネスロジック検証
```

---

## 3. テーブル定義詳細 (Schema Specifications)

### 3.1 Silver レイヤー (Dimensions & Facts)

#### ① 会員ディメンション (`dim_members`)
| カラム名 | データ型 | 説明・制約 |
| :--- | :--- | :--- |
| `member_number` | VARCHAR (PK) | 会員番号 (SFJ+数字) |
| `member_name_kanji` | VARCHAR | 氏名 (漢字) |
| `email` | VARCHAR | メールアドレス (マスキング・ハッシュ対応可) |
| `member_tier` | VARCHAR | 会員ランク (REGULAR / VEGA / ALTAIR) |
| `current_miles` | INTEGER | 現在の保有マイル残高 |
| `total_flights_count` | INTEGER | 累計搭乗回数 (予約実績から集計) |
| `total_spend_amount` | INTEGER | 累計支払金額 (LTV) |
| `is_active` | BOOLEAN | 直近1年以内の利用有無 |
| `registered_at` | TIMESTAMP | 会員登録日時 |

#### ② 運航便ディメンション (`dim_flights`)
| カラム名 | データ型 | 説明・制約 |
| :--- | :--- | :--- |
| `flight_id` | VARCHAR (PK) | 便ID (例: SFJ077) |
| `flight_number` | VARCHAR | 便名 |
| `departure_code` | VARCHAR | 出発空港コード (HND, KKJ, FUK等) |
| `arrival_code` | VARCHAR | 到着空港コード |
| `departure_time` | TIMESTAMP | 出発日時 |
| `arrival_time` | TIMESTAMP | 到着日時 |
| `route_id` | VARCHAR | 路線識別子 (HND-KKJ) |
| `base_price` | INTEGER | 基本運賃 |
| `total_seats` | INTEGER | 総座席数 (標準: 150席) |

#### ③ イベントファクト (`fct_web_events`)
| カラム名 | データ型 | 説明・制約 |
| :--- | :--- | :--- |
| `event_id` | VARCHAR (PK) | イベント一意ID (UUID) |
| `session_id` | VARCHAR | ブラウザセッション識別子 |
| `member_number` | VARCHAR (FK) | ログイン中の会員番号 (未ログインはNULL) |
| `event_name` | VARCHAR | イベント種別 (page_view, flight_search等) |
| `event_timestamp` | TIMESTAMP | イベント発生日時 (UTC / JST) |
| `device_type` | VARCHAR | PC / Mobile / Tablet |
| `browser` | VARCHAR | Chrome / Safari / Edge / Firefox / Other |
| `page_url` | VARCHAR | 閲覧URL |
| `search_departure` | VARCHAR | 検索条件: 出発地 (JSONから抽出) |
| `search_arrival` | VARCHAR | 検索条件: 到着地 (JSONから抽出) |
| `selected_flight_id`| VARCHAR | 選択された便ID (JSONから抽出) |
| `selected_seat` | VARCHAR | 選択された座席番号 (JSONから抽出) |

#### ④ 予約ファクト (`fct_reservations`)
| カラム名 | データ型 | 説明・制約 |
| :--- | :--- | :--- |
| `reservation_num` | VARCHAR (PK) | 予約確認番号 (英数6桁) |
| `session_id` | VARCHAR | 予約に至ったWebセッションID |
| `member_number` | VARCHAR (FK) | 予約代表者の会員番号 |
| `flight_id` | VARCHAR (FK) | 予約便ID |
| `passenger_count` | INTEGER | 予約人数 |
| `total_amount` | INTEGER | 決済金額 |
| `payment_method` | VARCHAR | クレジットカード / マイル / コンビニ |
| `reservation_status`| VARCHAR | 予約済 / 決済完了 / キャンセル |
| `reserved_at` | TIMESTAMP | 予約確定日時 |

---

## 4. Gold レイヤー (dbt Marts SQL設計例)

### 4.1 予約ファネル分析マート (`mart_funnel_conversion.sql`)
予約プロセスの各遷移率（CVR）を算出し、どこで最もユーザーが離脱しているかを把握します。

```sql
-- models/marts/mart_funnel_conversion.sql
WITH session_steps AS (
    SELECT
        session_id,
        device_type,
        DATE(event_timestamp) AS event_date,
        MAX(CASE WHEN event_name = 'page_view' THEN 1 ELSE 0 END) AS has_visited,
        MAX(CASE WHEN event_name = 'flight_search' THEN 1 ELSE 0 END) AS has_searched,
        MAX(CASE WHEN event_name = 'flight_select' THEN 1 ELSE 0 END) AS has_selected_flight,
        MAX(CASE WHEN event_name = 'seat_select' THEN 1 ELSE 0 END) AS has_selected_seat,
        MAX(CASE WHEN event_name = 'reservation_complete' THEN 1 ELSE 0 END) AS has_converted
    FROM {{ ref('fct_web_events') }}
    GROUP BY session_id, device_type, DATE(event_timestamp)
)

SELECT
    event_date,
    device_type,
    COUNT(DISTINCT session_id) AS total_sessions,
    SUM(has_searched) AS step1_search_count,
    ROUND(SUM(has_searched) * 100.0 / COUNT(DISTINCT session_id), 2) AS search_cvr_pct,
    SUM(has_selected_flight) AS step2_flight_select_count,
    ROUND(SUM(has_selected_flight) * 100.0 / NULLIF(SUM(has_searched), 0), 2) AS flight_select_cvr_pct,
    SUM(has_selected_seat) AS step3_seat_select_count,
    ROUND(SUM(has_selected_seat) * 100.0 / NULLIF(SUM(has_selected_flight), 0), 2) AS seat_select_cvr_pct,
    SUM(has_converted) AS step4_booking_complete_count,
    ROUND(SUM(has_converted) * 100.0 / NULLIF(SUM(has_selected_seat), 0), 2) AS final_booking_cvr_pct,
    ROUND(SUM(has_converted) * 100.0 / COUNT(DISTINCT session_id), 2) AS overall_cvr_pct
FROM session_steps
GROUP BY event_date, device_type
ORDER BY event_date DESC, total_sessions DESC;
```

### 4.2 カゴ落ち検知マート (`mart_cart_abandonment.sql`)
「座席選択または便選択まで進んだが、予約完了せずに15分以上離脱している」セッションを抽出します。

```sql
-- models/marts/mart_cart_abandonment.sql
WITH session_activity AS (
    SELECT
        session_id,
        member_number,
        MAX(event_timestamp) AS last_active_at,
        MAX(CASE WHEN event_name IN ('flight_select', 'seat_select') THEN 1 ELSE 0 END) AS reached_cart,
        MAX(CASE WHEN event_name = 'reservation_complete' THEN 1 ELSE 0 END) AS is_converted,
        MAX(search_departure) AS last_departure,
        MAX(search_arrival) AS last_arrival,
        MAX(selected_flight_id) AS cart_flight_id
    FROM {{ ref('fct_web_events') }}
    GROUP BY session_id, member_number
)

SELECT
    session_id,
    member_number,
    last_active_at,
    last_departure,
    last_arrival,
    cart_flight_id,
    -- 最終活動から15分以上経過し、かつ未コンバージョンのセッションをカゴ落ちと判定
    CURRENT_TIMESTAMP - last_active_at AS inactive_duration
FROM session_activity
WHERE reached_cart = 1
  AND is_converted = 0
  AND last_active_at <= CURRENT_TIMESTAMP - INTERVAL 15 MINUTE
ORDER BY last_active_at DESC;
```

---

## 5. データ品質テスト設計 (dbt tests)

データパイプラインの信頼性を担保するため、以下のテストを自動化します。

```yaml
# models/staging/schema.yml
version: 2

models:
  - name: stg_events
    description: "クレンジング済みのトラッキング生ログ"
    columns:
      - name: event_id
        tests:
          - unique
          - not_null
      - name: event_timestamp
        tests:
          - not_null
      - name: event_name
        tests:
          - not_null
          - accepted_values:
              values: ['page_view', 'flight_search', 'flight_select', 'seat_select', 'reservation_complete', 'cart_abandonment']

  - name: fct_reservations
    description: "予約トランザクションファクト"
    columns:
      - name: reservation_num
        tests:
          - unique
          - not_null
      - name: flight_id
        tests:
          - not_null
          - relationships:
              to: ref('dim_flights')
              field: flight_id
      - name: total_amount
        tests:
          - not_null
```
