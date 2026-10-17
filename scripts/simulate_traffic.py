#!/usr/bin/env python3
"""
scripts/simulate_traffic.py
航空会社ECシミュレーション＆データ基盤 トラフィックシミュレーションスクリプト

Web予約サイトのユーザー行動シナリオ（閲覧、フライト検索、座席指定、予約完了、カゴ落ち離脱）を
自動生成し、API Gateway (Express :3001) に投入してデータ基盤をアクティベートします。
"""

import time
import uuid
import random
import requests
from datetime import datetime, timedelta

API_BASE = "http://localhost:3001"

ROUTES = [
    {"from": "HND", "to": "KKJ", "flight_id": "SFJ077", "price": 14800},
    {"from": "HND", "to": "FUK", "flight_id": "SFJ041", "price": 13500},
    {"from": "HND", "to": "KIX", "flight_id": "SFJ021", "price": 11000},
    {"from": "KKJ", "to": "HND", "flight_id": "SFJ076", "price": 14800},
    {"from": "KKJ", "to": "TPE", "flight_id": "SFJ801", "price": 22000},
]

USER_AGENTS = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0",
    "Mozilla/5.0 (iPad; CPU OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
]

def send_log(session_id, event_name, properties, member_number=None, user_agent=None):
    payload = {
        "event_id": str(uuid.uuid4()),
        "session_id": session_id,
        "member_number": member_number,
        "event_name": event_name,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "user_agent": user_agent or random.choice(USER_AGENTS),
        "page_url": f"http://localhost:5173/#{event_name}",
        "properties": properties
    }
    try:
        res = requests.post(f"{API_BASE}/api/logs", json=payload, timeout=3)
        return res.status_code == 200
    except Exception as e:
        print(f"Log dispatch error: {e}")
        return False

def simulate_user_journey(scenario_type="booking", member_number=None):
    session_id = str(uuid.uuid4())
    ua = random.choice(USER_AGENTS)
    route = random.choice(ROUTES)
    dep_date = (datetime.now() + timedelta(days=random.randint(3, 30))).strftime("%Y-%m-%d")

    print(f"\n▶ Simulating journey: [{scenario_type.upper()}] (Session: {session_id[:8]}...)")

    # Step 1: Top Page View
    send_log(session_id, "page_view", {"path": "#home", "title": "トップページ"}, member_number, ua)
    time.sleep(0.3)

    # Step 2: Flight Search
    send_log(session_id, "search_flights", {
        "from_airport": route["from"],
        "to_airport": route["to"],
        "departure_date": dep_date,
        "passengers_count": 1
    }, member_number, ua)
    time.sleep(0.4)

    if scenario_type == "search_only":
        print(f"  └── User bounced after searching flights (Bounce / Drop-off).")
        return

    # Step 3: Flight Select
    send_log(session_id, "flight_select", {
        "flight_id": route["flight_id"],
        "from_airport": route["from"],
        "to_airport": route["to"],
        "fare_type": "STAR7",
        "price": route["price"]
    }, member_number, ua)
    time.sleep(0.3)

    if scenario_type == "flight_selected_abandon":
        print(f"  └── User abandoned cart after selecting flight {route['flight_id']}.")
        return

    # Step 4: Seat Select
    seat_no = f"{random.randint(1, 25)}{random.choice(['A', 'B', 'C', 'D', 'E', 'F'])}"
    send_log(session_id, "seat_select", {
        "flight_id": route["flight_id"],
        "seat_number": seat_no
    }, member_number, ua)
    time.sleep(0.3)

    if scenario_type == "seat_selected_abandon":
        print(f"  └── User abandoned cart at seat selection ({seat_no})! [High-intent Cart Abandonment]")
        return

    # Step 5: Booking Complete
    rsv_num = f"SFJ{random.randint(100000, 999999)}"
    send_log(session_id, "book_flight", {
        "reservation_number": rsv_num,
        "outbound_flight_id": route["flight_id"],
        "departure_date": dep_date,
        "passengers_count": 1,
        "price_paid": route["price"],
        "miles_earned": int(route["price"] * 0.1)
    }, member_number, ua)
    print(f"  └── 🎉 Booking confirmed! Reservation #{rsv_num} (¥{route['price']:,})")

def main():
    print("==================================================")
    print(" Airline Modern Data Platform Traffic Simulator ")
    print(" Target API: http://localhost:3001")
    print("==================================================")

    scenarios = [
        ("booking", "1000743426"),
        ("seat_selected_abandon", "1000743426"),
        ("flight_selected_abandon", None),
        ("search_only", None),
        ("booking", None),
        ("seat_selected_abandon", None),
        ("booking", "1000743426")
    ]

    for scenario, member in scenarios:
        simulate_user_journey(scenario, member)
        time.sleep(0.5)

    print("\n✅ Simulation completed successfully! Check the dashboard or DuckDB for updated metrics.")

if __name__ == "__main__":
    main()
