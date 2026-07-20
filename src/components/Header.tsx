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

  // Render content of mega drawer based on active tab
  const renderMegaDrawerContent = () => {
    if (!activeDrawerTab) return null;

    const cleanTab = activeDrawerTab.replace('int-', '');

    switch (cleanTab) {
      case '#fare':
        return (
          <div className="mega-drawer-panel">
            <div className="mega-drawer-columns">
              <div className="mega-drawer-col">
                <h4>🎟️ 運賃タイプ案内</h4>
                <ul>
                  <li><a href="#fares-promo" onClick={closeMegaDrawer}>早期割引「そら旅21/28/45/55/75」</a></li>
                  <li><a href="#fares-lastminute" onClick={closeMegaDrawer}>直前割引「そら旅1/7」</a></li>
                  <li><a href="#fares-standard" onClick={closeMegaDrawer}>大人普通運賃 / 往復割引</a></li>
                  <li><a href="#fares-special" onClick={closeMegaDrawer}>小児運賃 / シニア割引 / 障がい者割引</a></li>
                </ul>
              </div>
              <div className="mega-drawer-col">
                <h4>📖 ご利用ガイド</h4>
                <ul>
                  <li><a href="#fares-conditions" onClick={closeMegaDrawer}>運賃適用条件の一覧</a></li>
                  <li><a href="#fares-refund" onClick={closeMegaDrawer}>各種手数料・キャンセル料</a></li>
                  <li><a href="#fares-payment" onClick={closeMegaDrawer}>お支払い・発券期限</a></li>
                </ul>
              </div>
              <div className="mega-drawer-col highlight-col">
                <h4>💡 お得な耳より情報</h4>
                <p>スターフライヤーの「そら旅」は早期の予約ほどお得！搭乗予定日の75日前までの予約で最安値にてお求めいただけます。</p>
                <div className="drawer-action-box">
                  <span className="price-tag">羽田 - 北九州 ¥9,600〜</span>
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
                <h4>📅 時刻表・スケジュール</h4>
                <ul>
                  <li><a href="#schedule-search" onClick={closeMegaDrawer}>本日の運航状況・発着検索</a></li>
                  <li><a href="#schedule-pdf" onClick={closeMegaDrawer}>PDF時刻表ダウンロード</a></li>
                  <li><a href="#schedule-routes" onClick={closeMegaDrawer}>就航路線マップ</a></li>
                </ul>
              </div>
              <div className="mega-drawer-col">
                <h4>✈️ 主要路線のスケジュール</h4>
                <ul>
                  <li><a href="#route-hnd-kkj" onClick={closeMegaDrawer}>東京（羽田） ⇆ 北九州（1日11往復）</a></li>
                  <li><a href="#route-hnd-fuk" onClick={closeMegaDrawer}>東京（羽田） ⇆ 福岡（1日8往復）</a></li>
                  <li><a href="#route-hnd-kix" onClick={closeMegaDrawer}>東京（羽田） ⇆ 関西（1日4往復）</a></li>
                  <li><a href="#route-kkj-tpe" onClick={closeMegaDrawer}>北九州 ⇆ 台北桃園（毎日運航）</a></li>
                </ul>
              </div>
              <div className="mega-drawer-col info-col">
                <h4>⚠️ 運航についてのお知らせ</h4>
                <p>天候不良による遅延・欠航等の情報は、運航状況検索ページよりリアルタイムでご確認いただけます。</p>
              </div>
            </div>
          </div>
        );
      case '#inboard':
        return (
          <div className="mega-drawer-panel">
            <div className="mega-drawer-columns">
              <div className="mega-drawer-col">
                <h4>💺 シート・機内設備</h4>
                <ul>
                  <li><a href="#services-seat" onClick={closeMegaDrawer}>全席黒のレザーシート（シートピッチ最大91cm）</a></li>
                  <li><a href="#services-power" onClick={closeMegaDrawer}>全席ACコンセント ＆ USBポート完備</a></li>
                  <li><a href="#services-lcd" onClick={closeMegaDrawer}>タッチパネル式パーソナルモニター</a></li>
                  <li><a href="#services-comfort" onClick={closeMegaDrawer}>フットレスト＆ヘッドレストの調整方法</a></li>
                </ul>
              </div>
              <div className="mega-drawer-col">
                <h4>☕ 機内サービス・お飲み物</h4>
                <ul>
                  <li><a href="#services-drinks" onClick={closeMegaDrawer}>タリーズコーヒー（オリジナルチョコ付き）</a></li>
                  <li><a href="#services-soup" onClick={closeMegaDrawer}>オリジナルオニオンスープ / 日本茶 / アップルジュース</a></li>
                  <li><a href="#services-goods" onClick={closeMegaDrawer}>機内販売（スターフライヤー限定グッズ）</a></li>
                </ul>
              </div>
              <div className="mega-drawer-col image-col">
                <h4>✨ ゆとりのくつろぎ空間</h4>
                <p>他社よりも座席数を抑工程、シート間のスペースを広く確保した贅沢な空間で、快適な空の旅をお楽しみください。</p>
              </div>
            </div>
          </div>
        );
      case '#reservation':
        return (
          <div className="mega-drawer-panel">
            <div className="mega-drawer-columns">
              <div className="mega-drawer-col">
                <h4>💻 インターネット予約</h4>
                <ul>
                  <li><a href="#booking-step" onClick={closeMegaDrawer}>オンラインでの予約・購入手順</a></li>
                  <li><a href="#booking-seat" onClick={closeMegaDrawer}>座席の事前指定・変更方法</a></li>
                  <li><a href="#booking-receipt" onClick={closeMegaDrawer}>領収書・搭乗証明書のWeb発行</a></li>
                </ul>
              </div>
              <div className="mega-drawer-col">
                <h4>💳 お支払い方法</h4>
                <ul>
                  <li><a href="#pay-credit" onClick={closeMegaDrawer}>クレジットカード決済</a></li>
                  <li><a href="#pay-convenience" onClick={closeMegaDrawer}>コンビニエンスストア決済</a></li>
                  <li><a href="#pay-other" onClick={closeMegaDrawer}>各種モバイル決済 / eチケット控え発行</a></li>
                </ul>
              </div>
              <div className="mega-drawer-col info-col">
                <h4>💡 便利なオンライン搭乗</h4>
                <p>事前にWEBチェックイン・QRコード付eチケット控えを発行いただくと、空港でスムーズにご搭乗いただけます。</p>
              </div>
            </div>
          </div>
        );
      case '#tour':
        return (
          <div className="mega-drawer-panel">
            <div className="mega-drawer-columns">
              <div className="mega-drawer-col">
                <h4>🏨 航空券＋宿泊（ダイナミックパッケージ）</h4>
                <ul>
                  <li><a href="#tour-about" onClick={closeMegaDrawer}>フライトとホテルを自由に組み合わせるオリジナルツアー</a></li>
                  <li><a href="#tour-search" onClick={closeMegaDrawer}>おトクなパックプランの検索・予約</a></li>
                  <li><a href="#tour-coupon" onClick={closeMegaDrawer}>割引クーポン・キャンペーン情報</a></li>
                </ul>
              </div>
              <div className="mega-drawer-col">
                <h4>🚗 レンタカー・体験プラン</h4>
                <ul>
                  <li><a href="#tour-car" onClick={closeMegaDrawer}>レンタカー追加割引オプション</a></li>
                  <li><a href="#tour-hotel" onClick={closeMegaDrawer}>スターフライヤー提携ホテル一覧</a></li>
                </ul>
              </div>
              <div className="mega-drawer-col highlight-col">
                <h4>🎁 特典満載のパックツアー</h4>
                <p>フライトとホテルを別々に予約するより断然おトク！さらにSTAR LINKマイルもフライト分しっかり貯まります。</p>
              </div>
            </div>
          </div>
        );
      case '#checkin':
        return (
          <div className="mega-drawer-panel">
            <div className="mega-drawer-columns">
              <div className="mega-drawer-col">
                <h4>🛄 空港でのお手続き</h4>
                <ul>
                  <li><a href="#airport-counter" onClick={closeMegaDrawer}>チェックインカウンターの場所（羽田・北九州等）</a></li>
                  <li><a href="#airport-machine" onClick={closeMegaDrawer}>自動チェックイン機での手続き方法</a></li>
                  <li><a href="#airport-step" onClick={closeMegaDrawer}>搭乗手続きの流れと締め切り時間</a></li>
                </ul>
              </div>
              <div className="mega-drawer-col">
                <h4>📦 手荷物のルール</h4>
                <ul>
                  <li><a href="#baggage-limit" onClick={closeMegaDrawer}>無料受託手荷物（お預け制限・サイズ）</a></li>
                  <li><a href="#baggage-cabin" onClick={closeMegaDrawer}>機内持ち込み手荷物の重量・個数制限</a></li>
                  <li><a href="#baggage-pets" onClick={closeMegaDrawer}>ペットのお預かりサービスについて</a></li>
                </ul>
              </div>
              <div className="mega-drawer-col info-col">
                <h4>⚠️ お手続き時間に関するご注意</h4>
                <p>国内線は出発時刻の20分前までに、国際線は出発時刻の60分前までに保安検査場を通過してください。</p>
              </div>
            </div>
          </div>
        );
      case '#mileage':
        return (
          <div className="mega-drawer-panel">
            <div className="mega-drawer-columns">
              <div className="mega-drawer-col">
                <h4>⭐ マイレージプログラム STAR LINK</h4>
                <ul>
                  <li><a href="#mileage-about" onClick={closeMegaDrawer}>STAR LINKマイルプログラムの魅力と仕組み</a></li>
                  <li><a href="#mileage-join" onClick={closeMegaDrawer}>新規会員登録（初期 1,000 マイル進呈中！）</a></li>
                  <li><a href="#mileage-earn" onClick={closeMegaDrawer}>マイルを貯める（フライト購入額の10%マイル付与）</a></li>
                  <li><a href="#mileage-use" onClick={closeMegaDrawer}>マイルを使う（特典航空券交換・アップグレード）</a></li>
                </ul>
              </div>
              <div className="mega-drawer-col">
                <h4>💳 クレジットカード・ステータス</h4>
                <ul>
                  <li><a href="#card-sfj" onClick={closeMegaDrawer}>スターフライヤーカードのご紹介</a></li>
                  <li><a href="#card-benefits" onClick={closeMegaDrawer}>プレミアム会員ステータスとラウンジ利用特典</a></li>
                </ul>
              </div>
              <div className="mega-drawer-col highlight-col">
                <h4>🎁 会員登録ですぐにおトク！</h4>
                <p>マイル会員にご入会いただくと、本シミュレーターでのご予約ごとにフライト金額の10%がマイルとして還元されます。</p>
                <div className="drawer-action-box">
                  <a href="#register" className="btn btn-solid btn-sm" onClick={closeMegaDrawer}>新規入会はこちら</a>
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
              <span className="logo-text">STARFLYER</span>
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
                  STAR LINK会員: <strong className="member-name">{loggedInMember.last_name_kanji} {loggedInMember.first_name_kanji} 様</strong>
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
                  <div className="label">STAR LINK会員</div>
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
