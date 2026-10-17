// src/components/Fares.tsx
import './Fares.css';

export const Fares = () => {
  const fareRoutes = [
    { from: '羽田（東京）', to: '北九州', label: 'エアロ得', price: '11,660' },
    { from: '羽田（東京）', to: '福岡', label: 'エアロ得', price: '9,900' },
    { from: '羽田（東京）', to: '関西（大阪）', label: 'エアロ得', price: '8,580' },
    { from: '中部（名古屋）', to: '福岡', label: 'エアロ得', price: '11,440' },
    { from: '羽田（東京）', to: '山口宇部', label: 'エアロ得', price: '10,670' },
    { from: '福岡', to: '仙台', label: 'エアロ得', price: '14,630' },
  ];

  return (
    <section className="sfj-fares-section" id="fares-section">
      <div className="container">
        <div className="section-header">
          <div>
            <h2 className="section-title">運賃</h2>
            <p className="section-subtitle">※2026年3月29日～2026年5月18日搭乗分</p>
          </div>
          <a href="#fare-list" className="btn-text">運賃一覧へ</a>
        </div>

        {/* Temporary flight info banner */}
        <div className="fares-banner">
          <a href="#special-flight">
            <span className="banner-badge">臨時便</span>
            <span className="banner-text">臨時便運航 羽田(東京) ⇄ 福岡線 の詳細はこちら</span>
          </a>
        </div>

        <div className="fares-grid">
          {fareRoutes.map((route, index) => (
            <div key={index} className="fare-card">
              <div className="route-info">
                <span className="airport-name">{route.from}</span>
                <span className="route-arrow">⇄</span>
                <span className="airport-name">{route.to}</span>
              </div>
              <div className="price-info">
                <span className="fare-label">{route.label}</span>
                <span className="fare-amount">
                  <span className="currency">¥</span>
                  {route.price}
                  <span className="tax-info">〜</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
