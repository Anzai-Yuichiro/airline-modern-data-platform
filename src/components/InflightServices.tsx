// src/components/InflightServices.tsx
import './InflightServices.css';

export const InflightServices = () => {
  const services = [
    {
      img: '/seat.jpg',
      title: 'プレミアムな「黒」の優越',
      desc: 'ゆったり過ごせる全席ブラックのレザーシート',
      link: '#seat'
    },
    {
      img: '/coffee.jpg',
      title: '心からのおもてなし',
      desc: '機内提供サービス、キーワードは「厳選」',
      link: '#amenity'
    },
    {
      img: '/entertainment.jpg',
      title: '機内エンターテインメント',
      desc: 'こだわりのビデオプログラムを機内でお楽しみいただけます',
      link: '#program'
    }
  ];

  return (
    <section className="sfj-inflight-section" id="inflight-section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">機内サービス</h2>
          <div className="header-links">
            <a href="#inflight-shop" className="btn-text">機内販売へ</a>
            <span className="link-separator">|</span>
            <a href="#inflight-list" className="btn-text">機内サービス一覧へ</a>
          </div>
        </div>

        <div className="inflight-grid">
          {services.map((srv, index) => (
            <div key={index} className="inflight-card">
              <div className="inflight-img-box">
                <img src={srv.img} alt={srv.title} className="inflight-img" />
              </div>
              <div className="inflight-info">
                <h3 className="inflight-card-title">{srv.title}</h3>
                <p className="inflight-card-desc">{srv.desc}</p>
                <a href={srv.link} className="inflight-action-link">詳細はこちら</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
