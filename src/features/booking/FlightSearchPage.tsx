import { useState, useEffect } from 'react';
import './FlightSearchPage.css';
import { trackEvent } from '../../utils/tracker';

interface Flight {
  flight_id: string;
  flight_number: string;
  departure_code: string;
  departure_name: string;
  arrival_code: string;
  arrival_name: string;
  departure_time: string;
  arrival_time: string;
  category: string;
  base_price: number;
  seats_total: number;
}

interface SelectedFlightChoice {
  flight: Flight;
  fareLabel: string;
  price: number;
}

interface FlightSearchPageProps {
  loggedInMember: any | null;
  onMilesUpdate: () => void;
}

type StepType = 'outbound' | 'return' | 'summary' | 'complete';

export const FlightSearchPage = ({ loggedInMember, onMilesUpdate }: FlightSearchPageProps) => {
  // Parse query parameters
  const [params, setParams] = useState<Record<string, string>>({});
  const [outboundFlights, setOutboundFlights] = useState<Flight[]>([]);
  const [returnFlights, setReturnFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Step state
  const [step, setStep] = useState<StepType>('outbound');
  const [selectedOutbound, setSelectedOutbound] = useState<SelectedFlightChoice | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<SelectedFlightChoice | null>(null);

  // Reservation Completion details
  const [rsvNumber, setRsvNumber] = useState('');
  const [milesEarned, setMilesEarned] = useState(0);

  // Parse parameters on mount and hash change
  useEffect(() => {
    const parseQueryParams = () => {
      const hashStr = window.location.hash;
      const questionIndex = hashStr.indexOf('?');
      if (questionIndex === -1) return {};

      const searchParams = new URLSearchParams(hashStr.substring(questionIndex + 1));
      const parsed: Record<string, string> = {};
      searchParams.forEach((val, key) => {
        parsed[key] = val;
      });
      return parsed;
    };

    const queryParams = parseQueryParams();
    setParams(queryParams);
    setStep('outbound');
    setSelectedOutbound(null);
    setSelectedReturn(null);
  }, [window.location.hash]);

  // Fetch flight listings
  useEffect(() => {
    if (!params.from || !params.to) return;

    const fetchFlights = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch Outbound Flights
        const outRes = await fetch(`/api/flights/search?from=${params.from}&to=${params.to}`);
        const outData = await outRes.json();
        if (!outRes.ok) throw new Error(outData.error || '往路フライトの取得に失敗しました。');
        setOutboundFlights(outData.flights || []);

        // Fetch Return Flights if round trip
        if (params.trip === 'round') {
          const retRes = await fetch(`/api/flights/search?from=${params.to}&to=${params.from}`);
          const retData = await retRes.json();
          if (!retRes.ok) throw new Error(retData.error || '復路フライトの取得に失敗しました。');
          setReturnFlights(retData.flights || []);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFlights();
  }, [params.from, params.to, params.trip, params.date]);

  const handleSelectOutbound = (flight: Flight, fareLabel: string, price: number) => {
    setSelectedOutbound({ flight, fareLabel, price });
    trackEvent('select_outbound_flight', { flight_id: flight.flight_id, fare: fareLabel, price });

    if (params.trip === 'round') {
      setStep('return');
      window.scrollTo(0, 0);
    } else {
      setStep('summary');
      window.scrollTo(0, 0);
    }
  };

  const handleSelectReturn = (flight: Flight, fareLabel: string, price: number) => {
    setSelectedReturn({ flight, fareLabel, price });
    trackEvent('select_return_flight', { flight_id: flight.flight_id, fare: fareLabel, price });
    setStep('summary');
    window.scrollTo(0, 0);
  };

  const handleConfirmBooking = async () => {
    if (!selectedOutbound) return;

    setLoading(true);
    const passengersCount = Number(params.passengers || 1);
    const totalPrice = (selectedOutbound.price + (selectedReturn?.price || 0)) * passengersCount;

    const bookingPayload = {
      member_number: loggedInMember?.member_number || null,
      session_id: sessionStorage.getItem('airline_session_id') || localStorage.getItem('airline_session_id') || 'session-unknown',
      outbound_flight_id: selectedOutbound.flight.flight_id,
      return_flight_id: selectedReturn?.flight.flight_id || null,
      departure_date: params.date,
      return_date: params.trip === 'round' ? params.retDate : null,
      passengers: passengersCount,
      total_price: totalPrice,
      user_agent: navigator.userAgent
    };

    try {
      const res = await fetch('/api/bookings/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '予約確定に失敗しました。');

      setRsvNumber(data.reservation_number);
      setMilesEarned(data.miles_earned);
      trackEvent('confirm_booking_success', { reservation_number: data.reservation_number, total_price: totalPrice });

      // Trigger miles refresh in Header
      if (loggedInMember) {
        onMilesUpdate();
      }

      setStep('complete');
      window.scrollTo(0, 0);
    } catch (err: any) {
      alert(`予約確定エラー: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Helper: Format price to Japanese Yen
  const formatYen = (num: number) => `¥${num.toLocaleString()}`;

  // Helper: Get weekday in Japanese
  const getWeekdayJP = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    return `(${weekdays[date.getDay()]})`;
  };

  // Date Carousel Generator
  const generateDates = (baseDateStr: string) => {
    if (!baseDateStr) return [];
    const base = new Date(baseDateStr);
    const dates = [];
    for (let i = -3; i <= 3; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  };

  const carouselDates = generateDates(params.date);

  const handleDateChange = (newDate: string) => {
    const searchParams = new URLSearchParams(window.location.hash.split('?')[1]);
    searchParams.set('date', newDate);
    window.location.hash = `#flight-search?${searchParams.toString()}`;
  };

  if (loading && outboundFlights.length === 0) {
    return (
      <div className="flight-search-loading">
        <div className="spinner"></div>
        <p>空席状況を検索しています。少々お待ちください...</p>
      </div>
    );
  }

  // Get Airport Display Name
  const getAirportName = (code: string) => {
    switch (code) {
      case 'HND': return '東京（羽田）';
      case 'KKJ': return '北九州';
      case 'FUK': return '福岡';
      case 'KIX': return '大阪（関西）';
      case 'NGO': return '名古屋（中部）';
      case 'UBJ': return '山口宇部';
      case 'TPE': return '台北（桃園）';
      default: return code;
    }
  };

  const passengersCount = Number(params.passengers || 1);

  return (
    <div className="flight-search-page">
      {/* Route & Search Info Header */}
      <div className="booking-summary-header">
        <div className="route-title">
          <span className="route-type">{params.category === 'domestic' ? '国内線' : '国際線'}</span>
          <h2>
            {getAirportName(params.from)}
            <span className="arrow">⇆</span>
            {getAirportName(params.to)}
          </h2>
        </div>
        <div className="search-meta">
          <span className="meta-item">
            📅 往路: <strong>{params.date} {getWeekdayJP(params.date)}</strong>
          </span>
          {params.trip === 'round' && (
            <span className="meta-item">
              📅 復路: <strong>{params.retDate} {getWeekdayJP(params.retDate)}</strong>
            </span>
          )}
          <span className="meta-item">
            👤 人数: <strong>大人 {passengersCount} 名</strong>
          </span>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="booking-steps-bar">
        <div className={`step ${step === 'outbound' ? 'active' : ''}`}>1. 往路便選択</div>
        {params.trip === 'round' && (
          <div className={`step ${step === 'return' ? 'active' : ''}`}>2. 復路便選択</div>
        )}
        <div className={`step ${step === 'summary' ? 'active' : ''}`}>
          {params.trip === 'round' ? '3' : '2'}. 予約内容確認
        </div>
        <div className={`step ${step === 'complete' ? 'active' : ''}`}>
          {params.trip === 'round' ? '4' : '3'}. 予約完了
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}

      {/* Outbound selection */}
      {step === 'outbound' && (
        <div className="flight-selector-section">
          <div className="leg-indicator">
            <span className="tag">往路</span>
            <h3>出発便を選択してください</h3>
            <span className="route-desc">{getAirportName(params.from)} ➔ {getAirportName(params.to)}</span>
          </div>

          {/* Date Carousel */}
          <div className="date-carousel">
            {carouselDates.map((d) => (
              <button
                key={d}
                className={`date-tab ${params.date === d ? 'active' : ''}`}
                onClick={() => handleDateChange(d)}
              >
                <div className="day-lbl">{d.substring(5).replace('-', '/')}</div>
                <div className="week-lbl">{getWeekdayJP(d)}</div>
                <div className="price-lbl">{d === params.date ? '最安値' : '空席あり'}</div>
              </button>
            ))}
          </div>

          <div className="flights-list">
            {outboundFlights.length === 0 ? (
              <div className="empty-flights">指定された路線のフライトはありません。</div>
            ) : (
              outboundFlights.map((f) => (
                <div className="flight-card" key={f.flight_id}>
                  {/* Left Column: Time & Flight Info */}
                  <div className="flight-info-col">
                    <div className="time-display">
                      <span className="dep-time">{f.departure_time}</span>
                      <span className="arrow-line">➔</span>
                      <span className="arr-time">{f.arrival_time}</span>
                    </div>
                    <div className="flight-number-lbl">
                      <span className="carrier">AL</span>
                      <strong className="num">{f.flight_number}便</strong>
                      <span className="seats-cap">Airbus A320</span>
                    </div>
                  </div>

                  {/* Right Column: Fare Options */}
                  <div className="fare-options-col">
                    {/* Fare Type 1: AERO 7 */}
                    <button 
                      className="fare-selector-btn"
                      onClick={() => handleSelectOutbound(f, 'エアロ得7', f.base_price)}
                    >
                      <span className="fare-name">エアロ得7 (AERO 7)</span>
                      <span className="fare-price">{formatYen(f.base_price)}</span>
                      <span className="seat-status ok">○ 空席あり</span>
                    </button>

                    {/* Fare Type 2: EXPRESS 1 */}
                    <button 
                      className="fare-selector-btn"
                      onClick={() => handleSelectOutbound(f, '直前割1', f.base_price + 2000)}
                    >
                      <span className="fare-name">直前割1 (EXPRESS 1)</span>
                      <span className="fare-price">{formatYen(f.base_price + 2000)}</span>
                      <span className="seat-status warning">△ 残りわずか</span>
                    </button>

                    {/* Fare Type 3: Full Fare */}
                    <button 
                      className="fare-selector-btn"
                      onClick={() => handleSelectOutbound(f, '大人普通運賃', f.base_price + 10000)}
                    >
                      <span className="fare-name">大人普通運賃</span>
                      <span className="fare-price">{formatYen(f.base_price + 10000)}</span>
                      <span className="seat-status ok">○ 空席あり</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Return selection */}
      {step === 'return' && (
        <div className="flight-selector-section">
          <div className="leg-indicator">
            <span className="tag return-tag">復路</span>
            <h3>お帰り（復路）の便を選択してください</h3>
            <span className="route-desc">{getAirportName(params.to)} ➔ {getAirportName(params.from)}</span>
          </div>

          <div className="flights-list">
            {returnFlights.length === 0 ? (
              <div className="empty-flights">該当する復路のフライトがありません。</div>
            ) : (
              returnFlights.map((f) => (
                <div className="flight-card" key={f.flight_id}>
                  {/* Left Column: Time & Flight Info */}
                  <div className="flight-info-col">
                    <div className="time-display">
                      <span className="dep-time">{f.departure_time}</span>
                      <span className="arrow-line">➔</span>
                      <span className="arr-time">{f.arrival_time}</span>
                    </div>
                    <div className="flight-number-lbl">
                      <span className="carrier">AL</span>
                      <strong className="num">{f.flight_number}便</strong>
                      <span className="seats-cap">Airbus A320</span>
                    </div>
                  </div>

                  {/* Right Column: Fare Options */}
                  <div className="fare-options-col">
                    <button 
                      className="fare-selector-btn"
                      onClick={() => handleSelectReturn(f, 'エアロ得7', f.base_price)}
                    >
                      <span className="fare-name">エアロ得7 (AERO 7)</span>
                      <span className="fare-price">{formatYen(f.base_price)}</span>
                      <span className="seat-status ok">○ 空席あり</span>
                    </button>

                    <button 
                      className="fare-selector-btn"
                      onClick={() => handleSelectReturn(f, '直前割1', f.base_price + 2000)}
                    >
                      <span className="fare-name">直前割1 (EXPRESS 1)</span>
                      <span className="fare-price">{formatYen(f.base_price + 2000)}</span>
                      <span className="seat-status warning">△ 残りわずか</span>
                    </button>

                    <button 
                      className="fare-selector-btn"
                      onClick={() => handleSelectReturn(f, '大人普通運賃', f.base_price + 10000)}
                    >
                      <span className="fare-name">大人普通運賃</span>
                      <span className="fare-price">{formatYen(f.base_price + 10000)}</span>
                      <span className="seat-status ok">○ 空席あり</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="btn-actions-wrap" style={{ marginTop: '20px' }}>
            <button className="btn btn-outline" onClick={() => setStep('outbound')}>
              往路便の選択に戻る
            </button>
          </div>
        </div>
      )}

      {/* Summary Confirmation */}
      {step === 'summary' && selectedOutbound && (
        <div className="booking-summary-section">
          <h3>選択内容のご確認</h3>
          <p className="summary-desc">ご予約されるフライトの内容をご確認の上、「購入手続きを確定する」ボタンを押してください。</p>

          <div className="summary-cards">
            {/* Outbound Summary */}
            <div className="summary-card">
              <div className="card-badge outbound-badge">往路便</div>
              <div className="summary-route">
                <strong>{getAirportName(params.from)}</strong> ➔ <strong>{getAirportName(params.to)}</strong>
              </div>
              <div className="summary-flight-meta">
                📅 搭乗日: {params.date} {getWeekdayJP(params.date)} | ✈️ 便名: AL {selectedOutbound.flight.flight_number}便
              </div>
              <div className="summary-time">
                🕐 出発時刻: {selectedOutbound.flight.departure_time} ➔ 到着時刻: {selectedOutbound.flight.arrival_time}
              </div>
              <div className="summary-fare-type">
                🎟️ 選択運賃: {selectedOutbound.fareLabel} ({formatYen(selectedOutbound.price)} / 1名)
              </div>
            </div>

            {/* Return Summary */}
            {params.trip === 'round' && selectedReturn && (
              <div className="summary-card">
                <div className="card-badge return-badge">復路便</div>
                <div className="summary-route">
                  <strong>{getAirportName(params.to)}</strong> ➔ <strong>{getAirportName(params.from)}</strong>
                </div>
                <div className="summary-flight-meta">
                  📅 搭乗日: {params.retDate} {getWeekdayJP(params.retDate)} | ✈️ 便名: AL {selectedReturn.flight.flight_number}便
                </div>
                <div className="summary-time">
                  🕐 出発時刻: {selectedReturn.flight.departure_time} ➔ 到着時刻: {selectedReturn.flight.arrival_time}
                </div>
                <div className="summary-fare-type">
                  🎟️ 選択運賃: {selectedReturn.fareLabel} ({formatYen(selectedReturn.price)} / 1名)
                </div>
              </div>
            )}
          </div>

          {/* Pricing Box */}
          <div className="pricing-info-box">
            <div className="price-row">
              <span className="lbl">お一人様あたり往復合計:</span>
              <span className="val">{formatYen(selectedOutbound.price + (selectedReturn?.price || 0))}</span>
            </div>
            <div className="price-row">
              <span className="lbl">搭乗人数:</span>
              <span className="val">大人 {passengersCount} 名</span>
            </div>
            <div className="price-row total-row">
              <span className="lbl">お支払合計金額:</span>
              <span className="val">{formatYen((selectedOutbound.price + (selectedReturn?.price || 0)) * passengersCount)}</span>
            </div>

            {/* Mileage Earn Info */}
            <div className="mile-earn-hint">
              {loggedInMember ? (
                <>
                  ✨ 会員特典: ご搭乗後、<strong>{Math.floor((selectedOutbound.price + (selectedReturn?.price || 0)) * passengersCount * 0.10).toLocaleString()} マイル</strong> (10%バック) が貯まります！
                </>
              ) : (
                <>
                  💡 <a href="#register">AERO MILESに入会</a>して予約すると、このご予約で <strong>{Math.floor((selectedOutbound.price + (selectedReturn?.price || 0)) * passengersCount * 0.10).toLocaleString()} マイル</strong> 貯まります！
                </>
              )}
            </div>
          </div>

          <div className="btn-actions-wrap">
            <button 
              className="btn btn-solid checkout-btn" 
              onClick={handleConfirmBooking}
              disabled={loading}
            >
              {loading ? '予約処理中...' : '予約を確定する'}
            </button>
            <button 
              className="btn btn-outline" 
              onClick={() => {
                if (params.trip === 'round') {
                  setStep('return');
                } else {
                  setStep('outbound');
                }
              }}
              disabled={loading}
            >
              便の選択に戻る
            </button>
          </div>
        </div>
      )}

      {/* Complete View */}
      {step === 'complete' && selectedOutbound && (
        <div className="booking-complete-section">
          <div className="success-icon">✓</div>
          <h2>航空券の予約が完了しました</h2>
          <p className="congrats-desc">航空券のご予約が確定いたしました。ご利用ありがとうございます。</p>

          <div className="reservation-card-box">
            <div className="card-title">ご予約控え</div>
            
            <div className="rsv-num-box">
              <span className="label">予約番号 (英数字6桁)</span>
              <span className="rsv-num-val">{rsvNumber}</span>
            </div>

            <div className="rsv-details-list">
              <div className="rsv-detail-item">
                <span className="lbl">往路便:</span>
                <span className="val">AL {selectedOutbound.flight.flight_number}便 ({getAirportName(params.from)} ➔ {getAirportName(params.to)}) - {params.date}</span>
              </div>
              {selectedReturn && (
                <div className="rsv-detail-item">
                  <span className="lbl">復路便:</span>
                  <span className="val">AL {selectedReturn.flight.flight_number}便 ({getAirportName(params.to)} ➔ {getAirportName(params.from)}) - {params.retDate}</span>
                </div>
              )}
              <div className="rsv-detail-item">
                <span className="lbl">搭乗人数:</span>
                <span className="val">大人 {passengersCount} 名</span>
              </div>
              <div className="rsv-detail-item">
                <span className="lbl">合計金額:</span>
                <span className="val bold">{formatYen((selectedOutbound.price + (selectedReturn?.price || 0)) * passengersCount)}</span>
              </div>
            </div>

            {loggedInMember && (
              <div className="rsv-miles-complete">
                🎉 会員アカウント ({loggedInMember.member_number}) に <strong>{milesEarned.toLocaleString()} マイル</strong> が付与されました！
              </div>
            )}
          </div>

          <div className="complete-notice">
            ご登録のメールアドレス宛に「ご予約確認メール」をお送りいたしました。<br />
            空港カウンター、または自動チェックイン機では上記の**予約番号**が必要となりますので、お手元にお控えください。
          </div>

          <div className="btn-actions-wrap single-action">
            <a href="#" className="btn btn-solid back-home-btn" onClick={() => trackEvent('click_home_from_booking_complete')}>
              シミュレーター トップへ戻る
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
