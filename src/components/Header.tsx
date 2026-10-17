// src/components/Header.tsx
import { useState, useEffect } from 'react';
import './Header.css';
import { trackEvent } from '../utils/tracker';

type CategoryType = 'domestic' | 'international';

export const Header = ({ loggedInMember, onLogout }: { loggedInMember: any | null; onLogout: () => void; }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryType>('domestic');
  const [activeLink, setActiveLink] = useState('#fare');

  // Desktop mega drawer state
  const [activeDrawerTab, setActiveDrawerTab] = useState<string | null>(null);

  const toggleMenu = () => {
    const nextState = !isMenuOpen;
    setIsMenuOpen(nextState);
    trackEvent('toggle_mobile_menu', { isOpen: nextState });
  };

  const handleCategoryChange = (category: CategoryType) => {
    setActiveCategory(category);
    setActiveLink(category === 'domestic' ? '#fare' : '#int-fare');
    setActiveDrawerTab(null); // Close mega drawer on category change
    trackEvent('switch_category', { category });
  };

  // Close mega drawer when clicking outside (on escape or backdrop)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveDrawerTab(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavClick = (href: string, label: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (activeDrawerTab === href) {
      setActiveDrawerTab(null);
      trackEvent('close_mega_drawer', { tab: label });
    } else {
      setActiveDrawerTab(href);
      setActiveLink(href);
      trackEvent('open_mega_drawer', { tab: label });
    }
  };

  const closeMegaDrawer = () => {
    setActiveDrawerTab(null);
  };

  // Menu items based on Category
  const domesticMenu = [
    { href: '#fare', label: '運賃' },
    { href: '#timetable', label: '時刻表' },
    { href: '#inboard', label: '機内サービス' },
    { href: '#reservation', label: '予約・購入方法' },
    { href: '#tour', label: '航空券＋ホテル' },
    { href: '#checkin', label: '空港・チェックイン' },
    { href: '#mileage', label: 'マイレージ会員' },
  ];

  const internationalMenu = [
    { href: '#int-fare', label: '運賃' },
    { href: '#int-timetable', label: '時刻表' },
    { href: '#int-inboard', label: '機内サービス' },
    { href: '#int-reservation', label: '予約・購入方法' },
    { href: '#int-checkin', label: '空港・チェックイン' },
    { href: '#int-mileage', label: 'マイレージ会員' },
  ];

  const currentMenu = activeCategory === 'domestic' ? domesticMenu : internationalMenu;

  // Render content of mega drawer based on active tab (matching standard airline sitemap)
  const renderMegaDrawerContent = () => {
    if (!activeDrawerTab) return null;

    const cleanTab = activeDrawerTab.replace('int-', '');

    switch (cleanTab) {
      case '#fare':
        return (
          <div className="mega-drawer-panel">
            <div className="mega-drawer-columns">
              <div className="mega-drawer-col">
                <h4>✈️ 路線別運賃</h4>
                <ul>
                  <li><a href="#fares-hnd-kkj" onClick={closeMegaDrawer}>羽田（東京）⇔ 北九州の運賃</a></li>
                  <li><a href="#fares-hnd-fuk" onClick={closeMegaDrawer}>羽田（東京）⇔ 福岡の運賃</a></li>
                  <li><a href="#fares-hnd-kix" onClick={closeMegaDrawer}>羽田（東京）⇔ 関西（大阪）の運賃</a></li>
                  <li><a href="#fares-ngo-fuk" onClick={closeMegaDrawer}>中部（名古屋）⇔ 福岡の運賃</a></li>
                  <li><a href="#fares-hnd-ubj" onClick={closeMegaDrawer}>羽田（東京）⇔ 山口宇部の運賃</a></li>
                  <li><a href="#fares-fuk-sdj" onClick={closeMegaDrawer}>福岡 ⇔ 仙台の運賃</a></li>
                </ul>
              </div>
              <div className="mega-drawer-col">
                <h4>🎟️ 各種運賃案内</h4>
                <ul>
                  <li><a href="#fares-special" onClick={closeMegaDrawer}>臨時便情報</a></li>
                  <li><a href="#fares-early" onClick={closeMegaDrawer}>おトクな事前購入型割引運賃</a></li>
                  <li><a href="#fares-types" onClick={closeMegaDrawer}>運賃の種類</a></li>
                </ul>
              </div>
              <div className="mega-drawer-col highlight-col">
                <h4>🌍 国際線運賃</h4>
                <ul>
                  <li><a href="#int-fare" onClick={() => handleCategoryChange('international')}>国際線の運賃はこちら</a></li>
                </ul>
                <div className="drawer-promo-box" style={{ marginTop: '16px' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    早期購入割引「エアロ得」は、早めのご予約でおトクになります。
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      case '#timetable':
        return (
          <div className="mega-drawer-panel">
            <div className="mega-drawer-columns">
              <div className="mega-drawer-col">
                <h4>📅 国内線時刻表</h4>
                <ul>
                  <li><a href="#time-hnd-kkj" onClick={closeMegaDrawer}>羽田（東京）⇔ 北九州の時刻表</a></li>
                  <li><a href="#time-hnd-fuk" onClick={closeMegaDrawer}>羽田（東京）⇔ 福岡の時刻表</a></li>
                  <li><a href="#time-hnd-kix" onClick={closeMegaDrawer}>羽田（東京）⇔ 関西（大阪）の時刻表</a></li>
                  <li><a href="#time-ngo-fuk" onClick={closeMegaDrawer}>中部（名古屋）⇔ 福岡の時刻表</a></li>
                  <li><a href="#time-hnd-ubj" onClick={closeMegaDrawer}>羽田（東京）⇔ 山口宇部の時刻表</a></li>
                  <li><a href="#time-fuk-sdj" onClick={closeMegaDrawer}>福岡 ⇔ 仙台の時刻表</a></li>
                </ul>
              </div>
              <div className="mega-drawer-col">
                <h4>🗺️ 路線・運航案内</h4>
                <ul>
                  <li><a href="#flight-info" onClick={closeMegaDrawer}>本日の運航状況</a></li>
                  <li><a href="#routes-map" onClick={closeMegaDrawer}>就航路線マップ</a></li>
                </ul>
              </div>
              <div className="mega-drawer-col highlight-col">
                <h4>🌍 国際線時刻表</h4>
                <ul>
                  <li><a href="#int-timetable" onClick={() => handleCategoryChange('international')}>国際線の時刻表はこちら</a></li>
                </ul>
              </div>
            </div>
          </div>
        );
      case '#inboard':
        return (
          <div className="mega-drawer-panel">
            <div className="mega-drawer-columns">
              <div className="mega-drawer-col">
                <h4>💺 機内サービスと設備</h4>
                <ul>
                  <li><a href="#inboard-space" onClick={closeMegaDrawer}>くつろぎの空間設計</a></li>
                  <li><a href="#inboard-amenity" onClick={closeMegaDrawer}>飛行機内のお飲み物／アメニティ</a></li>
                  <li><a href="#inboard-program" onClick={closeMegaDrawer}>機内エンターテインメント</a></li>
                </ul>
              </div>
              <div className="mega-drawer-col">
                <h4>✨ アメニティ・機材</h4>
                <ul>
                  <li><a href="#inboard-aroma" onClick={closeMegaDrawer}>香りのおもてなし</a></li>
                  <li><a href="#inboard-magazine" onClick={closeMegaDrawer}>機内誌</a></li>
                  <li><a href="#inboard-shopping" onClick={closeMegaDrawer}>機内販売</a></li>
                  <li><a href="#inboard-media" onClick={closeMegaDrawer}>機内広告</a></li>
                  <li><a href="#inboard-airbus" onClick={closeMegaDrawer}>機材・座席表・シートマップ</a></li>
                  <li><a href="#inboard-safety" onClick={closeMegaDrawer}>オリジナルセイフティビデオ</a></li>
                </ul>
              </div>
              <div className="mega-drawer-col highlight-col">
                <h4>🌍 国際線機内サービス</h4>
                <ul>
                  <li><a href="#int-inboard" onClick={() => handleCategoryChange('international')}>国際線の機内サービスはこちら</a></li>
                </ul>
              </div>
            </div>
          </div>
        );
      case '#reservation':
        return (
          <div className="mega-drawer-panel">
            <div className="mega-drawer-columns">
              <div className="mega-drawer-col">
                <h4>💻 予約から購入までの流れ</h4>
                <ul>
                  <li><a href="#res-beginner" onClick={closeMegaDrawer}>初めての方でも安心 飛行機の乗り方</a></li>
                  <li><a href="#res-flow" onClick={closeMegaDrawer}>ご予約からご搭乗までの流れ</a></li>
                  <li><a href="#res-limit" onClick={closeMegaDrawer}>予約開始日およびご購入期限</a></li>
                  <li><a href="#res-change-fare" onClick={closeMegaDrawer}>予約・購入後の運賃変更について</a></li>
                  <li><a href="#res-valid" onClick={closeMegaDrawer}>航空券の有効期間</a></li>
                  <li><a href="#res-eticket" onClick={closeMegaDrawer}>eチケットのご案内</a></li>
                  <li><a href="#res-seat" onClick={closeMegaDrawer}>事前座席指定サービス</a></li>
                  <li><a href="#res-mail" onClick={closeMegaDrawer}>搭乗案内メール</a></li>
                  <li><a href="#res-stockholder" onClick={closeMegaDrawer}>株主優待割引のご利用方法について</a></li>
                  <li><a href="#res-name" onClick={closeMegaDrawer}>予約時の氏名入力について</a></li>
                </ul>
              </div>
              <div className="mega-drawer-col">
                <h4>💳 お支払い・領収書</h4>
                <ul>
                  <li><a href="#pay-method" onClick={closeMegaDrawer}>お支払い方法</a></li>
                  <li><a href="#pay-receipt" onClick={closeMegaDrawer}>領収書・搭乗証明書について</a></li>
                  <li><a href="#pay-web-receipt" onClick={closeMegaDrawer}>領収書Webサービス</a></li>
                  <li><a href="#pay-web-proof" onClick={closeMegaDrawer}>搭乗証明書Webサービス</a></li>
                </ul>
              </div>
              <div className="mega-drawer-col">
                <h4>✏️ 変更・払い戻し</h4>
                <ul>
                  <li><a href="#change-customer" onClick={closeMegaDrawer}>お客様都合による変更・払い戻し</a></li>
                  <li><a href="#change-delay" onClick={closeMegaDrawer}>遅延・欠航時に伴う変更・払い戻し</a></li>
                  <li><a href="#change-loss" onClick={closeMegaDrawer}>航空券の置き忘れ・紛失の場合</a></li>
                  <li><a href="#change-fee" onClick={closeMegaDrawer}>取消手数料について</a></li>
                </ul>
                <div className="drawer-category-link" style={{ marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
                  <a href="#int-reservation" style={{ color: '#c5a880', fontWeight: 'bold' }} onClick={() => handleCategoryChange('international')}>国際線の予約・購入方法はこちら</a>
                </div>
              </div>
            </div>
          </div>
        );
      case '#tour':
        return (
          <div className="mega-drawer-panel">
            <div className="mega-drawer-columns">
              <div className="mega-drawer-col">
                <h4>🏨 ダイナミックパッケージ（航空券+ホテル）</h4>
                <ul>
                  <li><a href="#tour-point" onClick={closeMegaDrawer}>ダイナミックパッケージとは</a></li>
                  <li><a href="#tour-guide" onClick={closeMegaDrawer}>操作ガイド</a></li>
                  <li><a href="#tour-flow" onClick={closeMegaDrawer}>ツアーご出発までの流れ</a></li>
                  <li><a href="#tour-faq" onClick={closeMegaDrawer}>よくあるご質問</a></li>
                </ul>
              </div>
              <div className="mega-drawer-col">
                <h4>✏️ 予約・手続き</h4>
                <ul>
                  <li><a href="#tour-mng" onClick={closeMegaDrawer}>予約確認・座席指定取り消し・領収書発行</a></li>
                  <li><a href="#tour-pay" onClick={closeMegaDrawer}>お支払い方法について</a></li>
                </ul>
              </div>
              <div className="mega-drawer-col highlight-col">
                <h4>🗾 観光特集</h4>
                <ul>
                  <li><a href="#tourism-dest" onClick={closeMegaDrawer}>国内のおすすめ観光地特集</a></li>
                </ul>
              </div>
            </div>
          </div>
        );
      case '#checkin':
        return (
          <div className="mega-drawer-panel">
            <div className="mega-drawer-columns">
              <div className="mega-drawer-col">
                <h4>📍 空港のご案内</h4>
                <ul className="compact-links">
                  <li><a href="#checkin-hnd" onClick={closeMegaDrawer}>羽田空港</a></li>
                  <li><a href="#checkin-kkj" onClick={closeMegaDrawer}>北九州空港</a></li>
                  <li><a href="#checkin-fuk" onClick={closeMegaDrawer}>福岡空港</a></li>
                  <li><a href="#checkin-kix" onClick={closeMegaDrawer}>関西空港</a></li>
                  <li><a href="#checkin-ngo" onClick={closeMegaDrawer}>中部国際空港セントレア</a></li>
                  <li><a href="#checkin-ubj" onClick={closeMegaDrawer}>山口宇部空港</a></li>
                  <li><a href="#checkin-sdj" onClick={closeMegaDrawer}>仙台空港</a></li>
                </ul>
                <h4 style={{ marginTop: '20px' }}>📱 ご搭乗手続きのご案内</h4>
                <ul>
                  <li><a href="#checkin-online" onClick={closeMegaDrawer}>オンラインチェックイン</a></li>
                  <li><a href="#checkin-counter" onClick={closeMegaDrawer}>空港でのご搭乗手続き</a></li>
                  <li><a href="#checkin-transit" onClick={closeMegaDrawer}>乗り継ぎのご案内</a></li>
                  <li><a href="#checkin-vacant" onClick={closeMegaDrawer}>空港での空席・キャンセル待ちについて</a></li>
                  <li><a href="#checkin-boarding" onClick={closeMegaDrawer}>搭乗案内方法について</a></li>
                  <li><a href="#checkin-attention" onClick={closeMegaDrawer}>機内でのお願いとご注意</a></li>
                </ul>
              </div>
              <div className="mega-drawer-col">
                <h4>🛄 手荷物のご案内</h4>
                <ul>
                  <li><a href="#luggage-carryon" onClick={closeMegaDrawer}>機内持ち込み手荷物</a></li>
                  <li><a href="#luggage-checkin" onClick={closeMegaDrawer}>手荷物のお預け</a></li>
                  <li><a href="#luggage-restricted" onClick={closeMegaDrawer}>制限のある手荷物</a></li>
                  <li><a href="#luggage-liquid" onClick={closeMegaDrawer}>液体物の持ち込み</a></li>
                  <li><a href="#luggage-pet" onClick={closeMegaDrawer}>ペットのお預かり</a></li>
                  <li><a href="#luggage-baby" onClick={closeMegaDrawer}>ベビーカー・車いすのお預かり</a></li>
                  <li><a href="#luggage-instrument" onClick={closeMegaDrawer}>楽器の持ち込み・お預け</a></li>
                  <li><a href="#luggage-sports" onClick={closeMegaDrawer}>スポーツ用品のお預かり</a></li>
                  <li><a href="#luggage-damage" onClick={closeMegaDrawer}>手荷物の破損・紛失について</a></li>
                </ul>
              </div>
              <div className="mega-drawer-col">
                <h4>♿ お手伝いが必要なお客様</h4>
                <ul className="compact-links" style={{ fontSize: '0.8rem' }}>
                  <li><a href="#assist-walking" onClick={closeMegaDrawer}>歩行の不自由なお客様</a></li>
                  <li><a href="#assist-medical" onClick={closeMegaDrawer}>病気やけがのあるお客様</a></li>
                  <li><a href="#assist-visual" onClick={closeMegaDrawer}>目の不自由なお客様</a></li>
                  <li><a href="#assist-hearing" onClick={closeMegaDrawer}>耳や言葉の不自由なお客様</a></li>
                  <li><a href="#assist-dogs" onClick={closeMegaDrawer}>身体障がい者補助犬をお連れのお客様</a></li>
                  <li><a href="#assist-intellectual" onClick={closeMegaDrawer}>知的障がい・発達障がいのあるお客様</a></li>
                  <li><a href="#assist-kids" onClick={closeMegaDrawer}>お子様一人旅（リトル☆コメット）</a></li>
                  <li><a href="#assist-baby" onClick={closeMegaDrawer}>赤ちゃんや小さなお子様をお連れのお客様へ</a></li>
                  <li><a href="#assist-pregnant" onClick={closeMegaDrawer}>妊娠中のお客様へ</a></li>
                  <li><a href="#assist-senior" onClick={closeMegaDrawer}>ご高齢のお客様へ</a></li>
                </ul>
                <div className="drawer-category-link" style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
                  <a href="#int-checkin" style={{ color: '#c5a880', fontWeight: 'bold' }} onClick={() => handleCategoryChange('international')}>国際線の空港・チェックインはこちら</a>
                </div>
              </div>
            </div>
          </div>
        );
      case '#mileage':
        return (
          <div className="mega-drawer-panel">
            <div className="mega-drawer-columns">
              <div className="mega-drawer-col">
                <h4>⭐ AERO MILESについて</h4>
                <ul>
                  <li><a href="#mile-benefit" onClick={closeMegaDrawer}>会員ログインのメリット</a></li>
                  <li><a href="#mile-status" onClick={closeMegaDrawer}>ステータス特典</a></li>
                  <li><a href="#mile-alliance" onClick={closeMegaDrawer}>提携サービスを利用する</a></li>
                  <li><a href="#mile-register" onClick={closeMegaDrawer}>AERO MILES会員新規入会</a></li>
                  <li><a href="#mile-terms" onClick={closeMegaDrawer}>AERO MILES会員規約</a></li>
                  <li><a href="#mile-app" onClick={closeMegaDrawer}>公式アプリのご案内</a></li>
                  <li><a href="#mile-coupon" onClick={closeMegaDrawer}>クーポンのご利用方法</a></li>
                </ul>
              </div>
              <div className="mega-drawer-col">
                <h4>貯める</h4>
                <ul>
                  <li><a href="#earn-flight" onClick={closeMegaDrawer}>フライトで貯める</a></li>
                  <li><a href="#earn-regist" onClick={closeMegaDrawer}>フライトマイルを登録する</a></li>
                  <li><a href="#earn-life" onClick={closeMegaDrawer}>暮らしで貯める</a></li>
                  <li><a href="#earn-limit" onClick={closeMegaDrawer}>マイルの有効期限</a></li>
                  <li><a href="#earn-card" onClick={closeMegaDrawer}>提携クレジットカードについて</a></li>
                </ul>
              </div>
              <div className="mega-drawer-col">
                <h4>使う</h4>
                <ul>
                  <li><a href="#use-ticket" onClick={closeMegaDrawer}>特典航空券と交換する</a></li>
                  <li><a href="#use-item" onClick={closeMegaDrawer}>アイテム等と交換する</a></li>
                  <li><a href="#use-point" onClick={closeMegaDrawer}>ポイントと交換する</a></li>
                  <li><a href="#use-shop" onClick={closeMegaDrawer}>店舗でマイルを使う</a></li>
                </ul>
                <div className="drawer-category-link" style={{ marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
                  <a href="#int-mileage" style={{ color: '#c5a880', fontWeight: 'bold' }} onClick={() => handleCategoryChange('international')}>国際線のマイレージ会員はこちら</a>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <header className="sfj-header">
      {/* Row 1: Logo, Category Tab Switcher, utilities */}
      <div className="sfj-header-top-row">
        <div className="sfj-header-top-container">
          {/* Logo */}
          <div className="sfj-logo">
            <a href="/" onClick={() => { setActiveDrawerTab(null); trackEvent('click_logo'); }}>
              <span className="logo-text">AERO CONNECT</span>
            </a>
          </div>

          {/* Top Category tabs */}
          <div className="sfj-category-tabs">
            <button 
              className={`category-tab ${activeCategory === 'domestic' ? 'active' : ''}`}
              onClick={() => handleCategoryChange('domestic')}
            >
              国内線
            </button>
            <button 
              className={`category-tab ${activeCategory === 'international' ? 'active' : ''}`}
              onClick={() => handleCategoryChange('international')}
            >
              国際線
            </button>
          </div>

          {/* Right side utilities */}
          <div className="sfj-header-utilities">
            <a href="#lang" className="lang-switch" onClick={() => trackEvent('click_lang_switch', { lang: 'EN' })}>EN</a>
            {loggedInMember ? (
              <div className="sfj-member-status">
                <span className="member-info">
                  AERO MILES会員: <strong className="member-name">{loggedInMember.last_name_kanji} {loggedInMember.first_name_kanji} 様</strong>
                  <span className="member-num">({loggedInMember.member_number})</span>
                </span>
                <span className="member-miles">
                  <strong>{loggedInMember.miles.toLocaleString()}</strong> <span className="unit">マイル</span>
                </span>
                <button className="btn btn-outline btn-sm logout-btn" onClick={onLogout}>ログアウト</button>
              </div>
            ) : (
              <>
                <a href="#login" className="btn btn-outline" onClick={() => trackEvent('click_login_btn', { position: 'header' })}>ログイン</a>
                <a href="#register" className="btn btn-solid" onClick={() => trackEvent('click_register_btn', { position: 'header' })}>新規入会</a>
              </>
            )}
          </div>

          {/* Hamburger Menu (Mobile Only) */}
          <button 
            className={`sfj-hamburger ${isMenuOpen ? 'open' : ''}`} 
            onClick={toggleMenu}
            aria-label="メニューを開閉"
            aria-expanded={isMenuOpen}
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
        </div>
      </div>

      {/* Row 2: Desktop Navigation Bar */}
      <div className="sfj-header-bottom-row">
        <div className="sfj-header-bottom-container">
          <nav className="sfj-desktop-nav">
            <ul className="nav-list">
              {currentMenu.map((item) => (
                <li key={item.href}>
                  <a 
                    href={item.href} 
                    className={`nav-link ${activeLink === item.href ? 'active' : ''}`}
                    onClick={(e) => handleNavClick(item.href, item.label, e)}
                  >
                    {item.label}
                    <span className="arrow-down-indicator">▼</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {/* Slide-down Mega Drawer Panel */}
      <div className={`sfj-mega-drawer ${activeDrawerTab ? 'open' : ''}`}>
        <div className="mega-drawer-wrapper">
          <button className="mega-drawer-close" onClick={closeMegaDrawer} aria-label="閉じる">
            &times;
          </button>
          <div className="mega-drawer-inner">
            {renderMegaDrawerContent()}
          </div>
        </div>
      </div>

      {/* Mega Drawer Backdrop (closes drawer when clicked) */}
      {activeDrawerTab && <div className="mega-drawer-backdrop" onClick={closeMegaDrawer}></div>}

      {/* Mobile Menu Drawer */}
      <div className={`sfj-mobile-menu ${isMenuOpen ? 'open' : ''}`}>
        <nav className="sfj-mobile-nav">
          <div className="mobile-category-tabs">
            <button 
              className={`mobile-category-tab ${activeCategory === 'domestic' ? 'active' : ''}`}
              onClick={() => { handleCategoryChange('domestic'); }}
            >
              国内線
            </button>
            <button 
              className={`mobile-category-tab ${activeCategory === 'international' ? 'active' : ''}`}
              onClick={() => { handleCategoryChange('international'); }}
            >
              国際線
            </button>
          </div>

          <ul className="mobile-nav-list">
            {currentMenu.map((item) => (
              <li key={item.href}>
                <a 
                  href={item.href} 
                  onClick={() => {
                    toggleMenu();
                    trackEvent('click_nav_mobile', { label: item.label, href: item.href, category: activeCategory });
                  }}
                >
                  {item.label}
                </a>
              </li>
            ))}
            <li className="divider"></li>
            {loggedInMember ? (
              <>
                <li className="mobile-member-info">
                  <div className="label">AERO MILES会員</div>
                  <div className="name">{loggedInMember.last_name_kanji} {loggedInMember.first_name_kanji} 様</div>
                  <div className="num">({loggedInMember.member_number})</div>
                  <div className="miles">保有マイル: <strong>{loggedInMember.miles.toLocaleString()}</strong> マイル</div>
                </li>
                <li>
                  <button 
                    className="mobile-btn mobile-btn-outline" 
                    onClick={() => {
                      toggleMenu();
                      onLogout();
                    }}
                  >
                    ログアウト
                  </button>
                </li>
              </>
            ) : (
              <>
                <li><a href="#login" className="mobile-btn mobile-btn-outline" onClick={() => { toggleMenu(); trackEvent('click_login_btn', { position: 'mobile_menu' }); }}>ログイン</a></li>
                <li><a href="#register" className="mobile-btn mobile-btn-solid" onClick={() => { toggleMenu(); trackEvent('click_register_btn', { position: 'mobile_menu' }); }}>新規入会</a></li>
              </>
            )}
            <li><a href="#lang" className="mobile-lang" onClick={() => { toggleMenu(); trackEvent('click_lang_switch', { lang: 'EN', position: 'mobile_menu' }); }}>Language: English</a></li>
          </ul>
        </nav>
      </div>
    </header>
  );
};
