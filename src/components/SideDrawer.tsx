// src/components/SideDrawer.tsx
import { useState } from 'react';
import './SideDrawer.css';

type DrawerTab = 'booking' | 'tour' | 'manage' | 'status' | 'checkin';

export const SideDrawer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DrawerTab>('booking');

  const handleTabClick = (tab: DrawerTab) => {
    if (isOpen && activeTab === tab) {
      setIsOpen(false);
    } else {
      setActiveTab(tab);
      setIsOpen(true);
    }
  };

  const closeDrawer = () => {
    setIsOpen(false);
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
              <h3 className="drawer-panel-title">航空券予約</h3>
              <p className="drawer-panel-desc">空席照会およびご予約手続きへ進みます。</p>
              <form className="drawer-form" onSubmit={(e) => { e.preventDefault(); alert('検索を実行します'); }}>
                <div className="drawer-field">
                  <label>出発地</label>
                  <select defaultValue="">
                    <option value="" disabled>出発地を選択</option>
                    <option value="HND">羽田 (HND)</option>
                    <option value="KKJ">北九州 (KKJ)</option>
                    <option value="FUK">福岡 (FUK)</option>
                  </select>
                </div>
                <div className="drawer-field">
                  <label>到着地</label>
                  <select defaultValue="">
                    <option value="" disabled>到着地を選択</option>
                    <option value="HND">羽田 (HND)</option>
                    <option value="KKJ">北九州 (KKJ)</option>
                    <option value="FUK">福岡 (FUK)</option>
                  </select>
                </div>
                <div className="drawer-field">
                  <label>出発日</label>
                  <input type="date" />
                </div>
                <button type="submit" className="drawer-btn-submit">検索する</button>
              </form>
            </div>
          )}

          {activeTab === 'tour' && (
            <div className="drawer-panel">
              <h3 className="drawer-panel-title">航空券＋宿泊</h3>
              <p className="drawer-panel-desc">ダイナミックパッケージ（ツアー商品）の予約検索です。</p>
              <form className="drawer-form" onSubmit={(e) => e.preventDefault()}>
                <div className="drawer-field">
                  <label>出発地</label>
                  <select defaultValue="HND">
                    <option value="HND">羽田 (HND)</option>
                    <option value="KKJ">北九州 (KKJ)</option>
                  </select>
                </div>
                <div className="drawer-field">
                  <label>目的地（ホテルエリア）</label>
                  <select defaultValue="">
                    <option value="" disabled>目的地を選択</option>
                    <option value="tokyo">東京エリア</option>
                    <option value="kyushu">九州エリア</option>
                  </select>
                </div>
                <button type="submit" className="drawer-btn-submit">ツアーを検索する</button>
              </form>
            </div>
          )}

          {activeTab === 'manage' && (
            <div className="drawer-panel">
              <h3 className="drawer-panel-title">予約確認・変更</h3>
              <p className="drawer-panel-desc">ご予約内容の確認、お支払い、予約変更、払い戻し手続きを行います。</p>
              <form className="drawer-form" onSubmit={(e) => e.preventDefault()}>
                <div className="drawer-field">
                  <label>予約番号（英数字6桁）</label>
                  <input type="text" placeholder="例: AB12CD" maxLength={6} />
                </div>
                <div className="drawer-field">
                  <label>搭乗者氏名（半角ローマ字 姓・名）</label>
                  <input type="text" placeholder="例: HOSHINO TARO" />
                </div>
                <button type="submit" className="drawer-btn-submit">予約を検索する</button>
              </form>
            </div>
          )}

          {activeTab === 'status' && (
            <div className="drawer-panel">
              <h3 className="drawer-panel-title">運航状況</h3>
              <p className="drawer-panel-desc">フライトの最新スケジュール・遅延情報を確認します。</p>
              <form className="drawer-form" onSubmit={(e) => e.preventDefault()}>
                <div className="drawer-field">
                  <label>搭乗日</label>
                  <input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
                <div className="drawer-field">
                  <label>便名</label>
                  <input type="text" placeholder="例: 077" />
                </div>
                <button type="submit" className="drawer-btn-submit">運航状況を検索する</button>
              </form>
            </div>
          )}

          {activeTab === 'checkin' && (
            <div className="drawer-panel">
              <h3 className="drawer-panel-title">オンラインチェックイン</h3>
              <p className="drawer-panel-desc">出発24時間前から20分前までご利用可能です。搭乗手続きをお済ませください。</p>
              <div className="drawer-notice">
                オンラインチェックインは、スマートチェックイン機能を通して快適にご搭乗いただけます。
              </div>
              <button className="drawer-btn-submit" style={{ marginTop: '20px' }}>チェックイン画面を開く</button>
            </div>
          )}
        </div>
      </div>

      {/* Background Overlay when drawer is open */}
      {isOpen && <div className="sfj-drawer-backdrop" onClick={closeDrawer}></div>}
    </>
  );
};
