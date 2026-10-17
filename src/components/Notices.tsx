// src/components/Notices.tsx
import { useState } from 'react';
import './Notices.css';

type NoticeTab = 'news' | 'fares';

export const Notices = () => {
  const [activeTab, setActiveTab] = useState<NoticeTab>('news');

  const newsItems = [
    {
      date: '2026.04.24',
      title: '航空機内におけるモバイルバッテリーの取り扱い変更について（2026年4月24日〜）',
      link: '#news-battery'
    },
    {
      date: '2026.04.08',
      title: '新予約・搭乗システム提供における機能制限について',
      link: '#news-system'
    },
    {
      date: '2026.03.20',
      title: 'AERO MILES マイレージプログラム規約変更のお知らせ',
      link: '#news-terms'
    }
  ];

  const fareItems = [
    {
      date: '2026.04.10',
      title: '2026年サマーダイヤ事前購入型割引運賃の発売開始について',
      link: '#fare-summer'
    },
    {
      date: '2026.03.01',
      title: '国内線旅客施設使用料（PFC）適用運賃変更について',
      link: '#fare-pfc'
    },
    {
      date: '2026.02.15',
      title: '国際線「燃油特別付加運賃（燃油サーチャージ）」設定のお知らせ',
      link: '#fare-fuel'
    }
  ];

  const currentItems = activeTab === 'news' ? newsItems : fareItems;

  return (
    <section className="sfj-notices-section" id="notices-section">
      <div className="container">
        
        {/* Title */}
        <div className="section-header">
          <h2 className="section-title">お知らせ</h2>
          <a href="#all-news" className="btn-text">お知らせ一覧へ</a>
        </div>

        {/* Tab switchers */}
        <div className="notices-tabs">
          <button 
            className={`notices-tab-btn ${activeTab === 'news' ? 'active' : ''}`}
            onClick={() => setActiveTab('news')}
          >
            新着情報
          </button>
          <button 
            className={`notices-tab-btn ${activeTab === 'fares' ? 'active' : ''}`}
            onClick={() => setActiveTab('fares')}
          >
            運賃のお知らせ
          </button>
        </div>

        {/* List of items */}
        <div className="notices-list">
          {currentItems.map((item, index) => (
            <div key={index} className="notices-item">
              <span className="notices-date">{item.date}</span>
              <a href={item.link} className="notices-title-link">
                {item.title}
              </a>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
