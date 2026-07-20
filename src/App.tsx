// src/App.tsx
import { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { NewsCampaigns } from './components/NewsCampaigns';
import { Fares } from './components/Fares';
import { InflightServices } from './components/InflightServices';
import { Notices } from './components/Notices';
import { Footer } from './components/Footer';
import { SideDrawer } from './components/SideDrawer';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { trackEvent } from './utils/tracker';

function App() {
  const [hash, setHash] = useState(window.location.hash);
  const [loggedInMember, setLoggedInMember] = useState<any | null>(null);

  // Synchronize hash routing
  useEffect(() => {
    const handleHashChange = () => {
      setHash(window.location.hash);
      const currentPath = window.location.hash || '#home';
      trackEvent('page_view', { path: currentPath });
      window.scrollTo(0, 0);
    };

    window.addEventListener('hashchange', handleHashChange);
    
    // Initial page load tracking
    const initialPath = window.location.hash || '#home';
    trackEvent('page_view', { path: initialPath, load_type: 'initial' });

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Retrieve logged-in session on mount
  useEffect(() => {
    const savedMember = localStorage.getItem('sfj_logged_in_member');
    if (savedMember) {
      try {
        setLoggedInMember(JSON.parse(savedMember));
      } catch (e) {
        console.error('[App] Failed to load saved member session:', e);
        localStorage.removeItem('sfj_logged_in_member');
      }
    }
  }, []);

  const handleLoginSuccess = (member: any) => {
    setLoggedInMember(member);
  };

  const handleLogout = () => {
    if (loggedInMember) {
      trackEvent('logout', { member_number: loggedInMember.member_number });
    }
    localStorage.removeItem('sfj_logged_in_member');
    setLoggedInMember(null);
    window.location.hash = ''; // Redirect to home
  };

  return (
    <div className="sfj-app">
      {/* Header Navigation (Displays member status if logged in) */}
      <Header loggedInMember={loggedInMember} onLogout={handleLogout} />
      
      {/* Left-side Floating Drawer */}
      <SideDrawer />
      
      {/* Dynamic View Routing */}
      <main>
        {hash === '#login' ? (
          <LoginPage onLoginSuccess={handleLoginSuccess} />
        ) : hash === '#register' ? (
          <RegisterPage />
        ) : (
          <>
            {/* Hero Visual Banner */}
            <Hero />
            
            {/* News, Promotions and Features (sfj-info-section) */}
            <NewsCampaigns />

            {/* Fares (そら旅価格) */}
            <Fares />

            {/* Inflight Services (機内サービス) */}
            <InflightServices />

            {/* What's New & Updates (新着情報/運賃のお知らせ) */}
            <Notices />
          </>
        )}
      </main>

      {/* Footer Links and Corporate Info */}
      <Footer />
    </div>
  );
}

export default App;
