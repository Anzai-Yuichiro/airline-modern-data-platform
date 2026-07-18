// src/components/NewsCampaigns.tsx
import './NewsCampaigns.css';

export const NewsCampaigns = () => {
  const campaigns = [
    {
      id: 1,
      category: 'インフォメーション',
      title: 'スターフライヤー安心ご予約保険',
      desc: '予約時より加入可能！急な予定変更でもキャンセル料を補償する安心の保険プラン。',
      badge: 'NEW',
      link: '#camp1'
    },
    {
      id: 2,
      category: 'キャンペーン',
      title: 'ご搭乗者様限定レンタカー特別価格',
      desc: '大手レンタカー会社を含む特別価格プランをご用意。カーナビ・免責補償込みでお得。',
      badge: 'お得',
      link: '#camp2'
    },
    {
      id: 3,
      category: 'サービス',
      title: '予約時より無料で座席指定可能',
      desc: 'スターフライヤーなら事前座席指定が無料。全席レザーシート、コンセント完備。',
      badge: '快適',
      link: '#camp3'
    },
    {
      id: 4,
      category: 'マイレージ',
      title: 'STAR LINK 新規入会キャンペーン',
      desc: 'ご搭乗ごとにマイルが貯まる無料プログラム。新規ご入会で1,000マイルプレゼント。',
      badge: 'マイル',
      link: '#camp4'
    }
  ];

  return (
    <section className="sfj-info-section" id="campaigns-section">
      <div className="container">
        {/* Campaigns Grid */}
        <div className="sfj-campaign-box">
          <div className="section-header">
            <h2 className="section-title">キャンペーン・特集</h2>
            <a href="#campaign-archive" className="btn-text">一覧を見る</a>
          </div>
          <div className="campaign-grid">
            {campaigns.map((camp) => (
              <div key={camp.id} className="campaign-card">
                <div className="card-content">
                  <div className="card-meta">
                    <span className="card-category">{camp.category}</span>
                    <span className="card-badge">{camp.badge}</span>
                  </div>
                  <h3 className="card-title">{camp.title}</h3>
                  <p className="card-desc">{camp.desc}</p>
                  <a href={camp.link} className="card-action-link">詳細を見る</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
