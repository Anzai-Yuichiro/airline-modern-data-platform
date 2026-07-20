// src/components/SideDrawer.tsx
import { useState, useEffect } from 'react';
import './SideDrawer.css';
import { trackEvent } from '../utils/tracker';

type DrawerTab = 'booking' | 'tour' | 'manage' | 'status' | 'checkin';
type FlightCategory = 'domestic' | 'international';

export const SideDrawer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DrawerTab>('booking');
  
  // Dynamic Flights master data
  const [flights, setFlights] = useState<any[]>([]);

  // Booking Pane States
  const [bookingCategory, setBookingCategory] = useState<FlightCategory>('domestic');
  const [tripType, setTripType] = useState<'round' | 'one-way'>('round');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [depDate, setDepDate] = useState('');
  const [retDate, setRetDate] = useState('');
  const [passengers, setPassengers] = useState(1);
  
  // Inline Reservation Search state (inside booking pane)
  const [showRsvSearch, setShowRsvSearch] = useState(false);
  const [rsvNum, setRsvNum] = useState('');
  const [rsvDate, setRsvDate] = useState('');
  const [rsvName, setRsvName] = useState('');

  // Fetch flights on mount for dynamic option building
  useEffect(() => {
    fetch('/api/flights')
      .then(res => res.json())
      .then(data => {
        if (data && data.flights) {
          setFlights(data.flights);
        }
      })
      .catch(err => console.error('[SideDrawer] Failed to fetch flights:', err));
  }, []);

  // Extract unique departure airports for selected category
  const departureAirports = Array.from(
    new Map(
      flights
        .filter(f => f.category === bookingCategory)
        .map(f => [f.departure_code, { code: f.departure_code, name: f.departure_name }])
    ).values()
  );

  // Extract unique arrival airports based on the selected departure airport
  const arrivalAirports = Array.from(
    new Map(
      flights
        .filter(f => f.category === bookingCategory && (!from || f.departure_code === from))
        .map(f => [f.arrival_code, { code: f.arrival_code, name: f.arrival_name }])
    ).values()
  );

  const handleTabClick = (tab: DrawerTab) => {
    if (isOpen && activeTab === tab) {
      setIsOpen(false);
      trackEvent('close_drawer', { tab });
    } else {
      setActiveTab(tab);
      setIsOpen(true);
      trackEvent('open_drawer', { tab });
    }
  };

  const closeDrawer = () => {
    setIsOpen(false);
    trackEvent('close_drawer', { tab: activeTab, trigger: 'backdrop_or_close_btn' });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Track Flight Search (Booking behavior)
    trackEvent('search_flights', {
      category: bookingCategory,
      trip_type: tripType,
      from_airport: from,
      to_airport: to,
      departure_date: depDate,
      return_date: tripType === 'round' ? retDate : null,
      passengers_count: passengers
    });

    setIsOpen(false);

    // Navigate to the dynamic flight search results page hash route with query string
    const queryParams = new URLSearchParams({
      from,
      to,
      date: depDate,
      trip: tripType,
      retDate: tripType === 'round' ? retDate : '',
      passengers: passengers.toString(),
      category: bookingCategory
    });

    window.location.hash = `#flight-search?${queryParams.toString()}`;
  };

  const handleRsvSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Track Reservation Search
    trackEvent('search_reservation', {
      search_date: rsvDate,
      has_reservation_number: !!rsvNum,
      has_passenger_name: !!rsvName
    });

    alert(`予約を検索します：\n予約番号: ${rsvNum}\n搭乗日: ${rsvDate}\n搭乗者氏名: ${rsvName}`);
  };

  const handleCategorySwitch = (category: FlightCategory) => {
    setBookingCategory(category);
    setFrom('');
    setTo('');
    trackEvent('switch_booking_category', { category });
  };

  const handleModeToggle = (isRsvSearch: boolean) => {
    setShowRsvSearch(isRsvSearch);
    trackEvent('toggle_booking_search_mode', { show_reservation_search: isRsvSearch });
  };

  const handleQuickLinkClick = (label: string, url: string) => {
    trackEvent('click_quick_link', { label, destination: url });
  };

  return (
    <>
      {/* Floating Side Bar */}
      <div className="sfj-side-bar">
        <button 
          className={`side-bar-btn ${isOpen && activeTab === 'booking' ? 'active' : ''}`}
          onClick={() => handleTabClick('booking')}
        >
          <span className="btn-icon">✈️</span>
          <span className="btn-text-vertical">航空券予約</span>
        </button>
        <button 
          className={`side-bar-btn ${isOpen && activeTab === 'tour' ? 'active' : ''}`}
          onClick={() => handleTabClick('tour')}
        >
          <span className="btn-icon">🏨</span>
          <span className="btn-text-vertical">航空券＋宿泊</span>
        </button>
        <button 
          className={`side-bar-btn ${isOpen && activeTab === 'manage' ? 'active' : ''}`}
          onClick={() => handleTabClick('manage')}
        >
          <span className="btn-icon">✏️</span>
          <span className="btn-text-vertical">予約確認・変更</span>
        </button>
        <button 
          className={`side-bar-btn ${isOpen && activeTab === 'status' ? 'active' : ''}`}
          onClick={() => handleTabClick('status')}
        >
          <span className="btn-icon">🕒</span>
          <span className="btn-text-vertical">運航状況</span>
        </button>
        <button 
          className={`side-bar-btn ${isOpen && activeTab === 'checkin' ? 'active' : ''}`}
          onClick={() => handleTabClick('checkin')}
        >
          <span className="btn-icon">📱</span>
          <span className="btn-text-vertical">チェックイン</span>
        </button>
      </div>

      {/* Slide Out Drawer Panel */}
      <div className={`sfj-side-drawer ${isOpen ? 'open' : ''}`}>
        <button className="drawer-close-btn" onClick={closeDrawer} aria-label="閉じる">
          &times;
        </button>

        <div className="drawer-content">
          {activeTab === 'booking' && (
            <div className="drawer-panel">
              <h3 className="drawer-panel-title">航空券のご予約</h3>
              <p className="drawer-panel-desc">空席照会および新規ご予約を行います。</p>

              {/* Domestic/International Switcher */}
              <div className="drawer-category-tabs">
                <button 
                  className={`category-tab-btn ${bookingCategory === 'domestic' ? 'active' : ''}`}
                  onClick={() => handleCategorySwitch('domestic')}
                >
                  国内線予約
                </button>
                <button 
                  className={`category-tab-btn ${bookingCategory === 'international' ? 'active' : ''}`}
                  onClick={() => handleCategorySwitch('international')}
                >
                  国際線予約
                </button>
              </div>

              {/* Toggle Inline Reservation Search */}
              <div className="drawer-booking-toggle">
                <button 
                  className={`toggle-sub-tab ${!showRsvSearch ? 'active' : ''}`}
                  onClick={() => handleModeToggle(false)}
                >
                  空席照会・予約
                </button>
                <button 
                  className={`toggle-sub-tab ${showRsvSearch ? 'active' : ''}`}
                  onClick={() => handleModeToggle(true)}
                >
                  予約検索・一覧
                </button>
              </div>

              {!showRsvSearch ? (
                /* 1. Seat Search Form */
                <form className="drawer-form" onSubmit={handleSearchSubmit}>
                  {/* Trip Type */}
                  <div className="drawer-trip-type">
                    <label className="radio-label">
                      <input 
                        type="radio" 
                        name="drawer-trip" 
                        checked={tripType === 'round'}
                        onChange={() => setTripType('round')}
                      />
                      <span>往復</span>
                    </label>
                    <label className="radio-label">
                      <input 
                        type="radio" 
                        name="drawer-trip" 
                        checked={tripType === 'one-way'}
                        onChange={() => setTripType('one-way')}
                      />
                      <span>片道</span>
                    </label>
                  </div>

                   {/* From & To */}
                   <div className="drawer-field">
                     <label>出発地</label>
                     <select value={from} onChange={(e) => setFrom(e.target.value)} required>
                       <option value="" disabled>出発地を選択してください</option>
                       {departureAirports.map(ap => (
                         <option key={ap.code} value={ap.code} disabled={to === ap.code}>
                           {ap.name} ({ap.code})
                         </option>
                       ))}
                     </select>
                   </div>
 
                   <div className="drawer-field">
                     <label>到着地</label>
                     <select value={to} onChange={(e) => setTo(e.target.value)} required>
                       <option value="" disabled>到着地を選択してください</option>
                       {arrivalAirports.map(ap => (
                         <option key={ap.code} value={ap.code} disabled={from === ap.code}>
                           {ap.name} ({ap.code})
                         </option>
                       ))}
                     </select>
                   </div>

                  {/* Date Pickers */}
                  <div className="drawer-field">
                    <label>往路出発日</label>
                    <input 
                      type="date" 
                      value={depDate} 
                      onChange={(e) => setDepDate(e.target.value)} 
                      required 
                    />
                  </div>

                  {tripType === 'round' && (
                    <div className="drawer-field">
                      <label>復路出発日</label>
                      <input 
                        type="date" 
                        value={retDate} 
                        onChange={(e) => setRetDate(e.target.value)} 
                        min={depDate} 
                        required 
                      />
                    </div>
                  )}

                  {/* Passenger Count */}
                  <div className="drawer-field">
                    <label>搭乗人数</label>
                    <select value={passengers} onChange={(e) => setPassengers(Number(e.target.value))}>
                      {[1, 2, 3, 4, 5, 6].map(n => (
                        <option key={n} value={n}>{n}名</option>
                      ))}
                    </select>
                  </div>

                  <button type="submit" className="drawer-btn-submit">空席照会・予約する</button>

                  {/* Quick links & Transition shortcut */}
                  <div className="drawer-quick-links">
                    <a href="#calendar" className="quick-link-item" onClick={() => handleQuickLinkClick('カレンダー選択', '#calendar')}>📅 カレンダーから選択する</a>
                    <button 
                      type="button" 
                      className="quick-link-btn"
                      onClick={() => handleCategorySwitch(bookingCategory === 'domestic' ? 'international' : 'domestic')}
                    >
                      ✈️ {bookingCategory === 'domestic' ? '国際線予約はこちら' : '国内線予約はこちら'}
                    </button>
                  </div>
                </form>
              ) : (
                /* 2. Reservation Search Form */
                <form className="drawer-form" onSubmit={handleRsvSearchSubmit}>
                  <div className="drawer-field">
                    <label>予約番号（英数字6桁）</label>
                    <input 
                      type="text" 
                      placeholder="例: AB12CD" 
                      maxLength={6} 
                      value={rsvNum} 
                      onChange={(e) => setRsvNum(e.target.value)}
                      required 
                    />
                  </div>

                  <div className="drawer-field">
                    <label>搭乗日</label>
                    <input 
                      type="date" 
                      value={rsvDate}
                      onChange={(e) => setRsvDate(e.target.value)}
                      required 
                    />
                  </div>

                  <div className="drawer-field">
                    <label>搭乗者氏名（半角ローマ字 姓・名）</label>
                    <input 
                      type="text" 
                      placeholder="例: HOSHINO TARO" 
                      value={rsvName}
                      onChange={(e) => setRsvName(e.target.value)}
                      required 
                    />
                  </div>

                  <button type="submit" className="drawer-btn-submit">予約を検索する</button>

                  <div className="drawer-quick-links">
                    <a href="#rsv-list" className="quick-link-item" onClick={() => handleQuickLinkClick('予約一覧', '#rsv-list')}>📋 予約一覧を表示</a>
                    <a href="#receipt" className="quick-link-item" onClick={() => handleQuickLinkClick('領収書検索', '#receipt')}>🎫 領収書検索</a>
                    <a href="#boarding-proof" className="quick-link-item" onClick={() => handleQuickLinkClick('搭乗証明書検索', '#boarding-proof')}>📄 搭乗証明書の検索</a>
                  </div>
                </form>
              )}
            </div>
          )}

          {activeTab === 'tour' && (
            <div className="drawer-panel">
              <h3 className="drawer-panel-title">航空券＋宿泊のご予約</h3>
              <p className="drawer-panel-desc">ダイナミックパッケージ（ツアー商品）の予約・検索です。</p>
              <form className="drawer-form" onSubmit={(e) => e.preventDefault()}>
                <div className="drawer-field">
                  <label>出発地</label>
                  <select defaultValue="HND">
                    <option value="HND">羽田（東京）(HND)</option>
                    <option value="KKJ">北九州 (KKJ)</option>
                  </select>
                </div>
                <div className="drawer-field">
                  <label>目的地（ホテルエリア）</label>
                  <select defaultValue="">
                    <option value="" disabled>目的地を選択してください</option>
                    <option value="tokyo">東京エリア</option>
                    <option value="kyushu">九州・北九州エリア</option>
                    <option value="fukuoka">福岡エリア</option>
                    <option value="kansai">関西エリア</option>
                  </select>
                </div>
                <button type="submit" className="drawer-btn-submit">ツアーを検索する</button>
              </form>
            </div>
          )}

          {activeTab === 'manage' && (
            <div className="drawer-panel">
              <h3 className="drawer-panel-title">予約確認・変更・取消</h3>
              <p className="drawer-panel-desc">航空券のご予約確認や変更手続き、払い戻し申請などを行います。</p>
              <form className="drawer-form" onSubmit={handleRsvSearchSubmit}>
                <div className="drawer-field">
                  <label>予約番号（英数字6桁）</label>
                  <input type="text" placeholder="例: AB12CD" required />
                </div>
                <div className="drawer-field">
                  <label>搭乗者氏名（半角ローマ字 姓・名）</label>
                  <input type="text" placeholder="例: HOSHINO TARO" required />
                </div>
                <button type="submit" className="drawer-btn-submit">予約を検索する</button>
                <div className="drawer-quick-links">
                  <a href="#rsv-list" className="quick-link-item" onClick={() => handleQuickLinkClick('予約一覧_タブ', '#rsv-list')}>📋 予約一覧</a>
                  <a href="#rsv-forget" className="quick-link-item" onClick={() => handleQuickLinkClick('予約番号忘れ', '#rsv-forget')}>❓ 予約番号をお忘れの方</a>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'status' && (
            <div className="drawer-panel">
              <h3 className="drawer-panel-title">運航状況の確認</h3>
              <p className="drawer-panel-desc">本日および明日のフライトスケジュールと遅延情報を確認します。</p>
              <form className="drawer-form" onSubmit={(e) => e.preventDefault()}>
                <div className="drawer-field">
                  <label>搭乗日</label>
                  <input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
                <div className="drawer-field">
                  <label>便名（数字3桁）</label>
                  <input type="text" placeholder="例: 077" maxLength={3} />
                </div>
                <button type="submit" className="drawer-btn-submit">運航状況を検索する</button>
                <div className="drawer-quick-links">
                  <a href="#status-outlook" className="quick-link-item" onClick={() => handleQuickLinkClick('運航見通し', '#status-outlook')}>📡 運航の見通し・お知らせ</a>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'checkin' && (
            <div className="drawer-panel">
              <h3 className="drawer-panel-title">オンラインチェックイン</h3>
              <p className="drawer-panel-desc">出発24時間前から20分前までスマホやPCから手続き可能です。</p>
              <div className="drawer-notice">
                <strong>オンラインチェックイン対応便：</strong><br />
                スターフライヤー運航便すべてでご利用いただけます。座席変更や搭乗券のWeb取得が可能です。
              </div>
              <button className="drawer-btn-submit" style={{ marginTop: '20px' }} onClick={() => trackEvent('click_online_checkin_submit')}>チェックイン手続きに進む</button>
            </div>
          )}
        </div>
      </div>

      {/* Background Overlay when drawer is open */}
      {isOpen && <div className="sfj-drawer-backdrop" onClick={closeDrawer}></div>}
    </>
  );
};
