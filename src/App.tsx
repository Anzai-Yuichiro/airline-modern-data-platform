// src/App.tsx
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { NewsCampaigns } from './components/NewsCampaigns';
import { Fares } from './components/Fares';
import { InflightServices } from './components/InflightServices';
import { Notices } from './components/Notices';
import { Footer } from './components/Footer';
import { SideDrawer } from './components/SideDrawer';

function App() {
  return (
    <div className="sfj-app">
      {/* Header Navigation */}
      <Header />
      
      {/* Left-side Floating Drawer */}
      <SideDrawer />
      
      {/* Main Page Layout */}
      <main>
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
      </main>

      {/* Footer Links and Corporate Info */}
      <Footer />
    </div>
  );
}

export default App;
