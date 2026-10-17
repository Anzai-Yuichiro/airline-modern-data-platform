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
import { FlightSearchPage } from './features/booking/FlightSearchPage';
import { trackEvent } from './utils/tracker';

function App() {
  const [hash, setHash] = useState(window.location.hash);
  const [loggedInMember, setLoggedInMember] = useState<any | null>(null);

  // Synchronize hash routing
  useEffect(() => {
    const handleHashChange = () => {
      setHash(window.location.hash);
      const currentPath = window.location.hash || '#home';
      // Strip query parameters from track path
      const pathOnly = currentPath.split('?')[0];
      trackEvent('page_view', { path: pathOnly });
      window.scrollTo(0, 0);
    };

    window.addEventListener('hashchange', handleHashChange);
    
    // Initial page load tracking
    const initialPath = window.location.hash || '#home';
    const pathOnly = initialPath.split('?')[0];
    trackEvent('page_view', { path: pathOnly, load_type: 'initial' });

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Retrieve logged-in session on mount
  useEffect(() => {
    const savedMember = localStorage.getItem('airline_logged_in_member');
    if (savedMember) {
      try {
        setLoggedInMember(JSON.parse(savedMember));
      } catch (e) {
        console.error('[App] Failed to load saved member session:', e);
        localStorage.removeItem('airline_logged_in_member');
      }
    }
  }, []);

  // Function to refresh member miles after booking completion
  const handleMilesUpdate = () => {
    if (!loggedInMember) return;
    
    fetch('/api/members')
      .then(res => res.json())
      .then(data => {
        if (data && data.members) {
          const updated = data.members.find((m: any) => m.member_number === loggedInMember.member_number);
          if (updated) {
            setLoggedInMember(updated);
            localStorage.setItem('airline_logged_in_member', JSON.stringify(updated));
            console.log('[App] Miles successfully updated: ', updated.miles);
          }
        }
      })
      .catch(err => console.error('[App] Failed to update miles:', err));
  };

  const handleLoginSuccess = (member: any) => {
    setLoggedInMember(member);
  };

  const handleLogout = () => {
    if (loggedInMember) {
      trackEvent('logout', { member_number: loggedInMember.member_number });
    }
    localStorage.removeItem('airline_logged_in_member');
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
        ) : hash.startsWith('#flight-search') ? (
          <FlightSearchPage loggedInMember={loggedInMember} onMilesUpdate={handleMilesUpdate} />
        ) : (
          <>
            {/* Hero Visual Banner */}
            <Hero />
            
            {/* News, Promotions and Features */}
            <NewsCampaigns />

            {/* Fares (割引価格) */}
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
