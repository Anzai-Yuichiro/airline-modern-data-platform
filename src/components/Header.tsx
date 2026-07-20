// src/components/Header.tsx
import { useState } from 'react';
import './Header.css';
import { trackEvent } from '../utils/tracker';

type CategoryType = 'domestic' | 'international';

export const Header = ({ loggedInMember, onLogout }: { loggedInMember: any | null; onLogout: () => void; }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryType>('domestic');
  const [activeLink, setActiveLink] = useState('#fare');

  const toggleMenu = () => {
    const nextState = !isMenuOpen;
    setIsMenuOpen(nextState);
    trackEvent('toggle_mobile_menu', { isOpen: nextState });
  };

  const handleCategoryChange = (category: CategoryType) => {
    setActiveCategory(category);
    setActiveLink('#fare');
    trackEvent('switch_category', { category });
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

  return (
    <header className="sfj-header">
      <div className="sfj-header-container">
        
        {/* Left Side: Logo & Category Tabs */}
        <div className="sfj-header-left">
          <div className="sfj-logo">
            <a href="/" onClick={() => trackEvent('click_logo')}>
              <span className="logo-text">STARFLYER</span>
            </a>
          </div>
          
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
        </div>

        {/* Desktop Navigation */}
        <nav className="sfj-desktop-nav">
          <ul className="nav-list">
            {currentMenu.map((item) => (
              <li key={item.href}>
                <a 
                  href={item.href} 
                  className={`nav-link ${activeLink === item.href ? 'active' : ''}`}
                  onClick={() => {
                    setActiveLink(item.href);
                    trackEvent('click_nav', { label: item.label, href: item.href, category: activeCategory });
                  }}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

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

      {/* Mobile Menu Drawer */}
      <div className={`sfj-mobile-menu ${isMenuOpen ? 'open' : ''}`}>
        <nav className="sfj-mobile-nav">
          {/* Mobile Category Toggle */}
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
