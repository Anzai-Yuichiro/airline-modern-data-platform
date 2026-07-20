// dashboard/src/App.tsx
import { useState } from 'react';
import { Layout } from './components/Layout';
import { WebAnalyticsPage } from './features/analytics/web_analytics/WebAnalyticsPage';
import { MemberAnalyticsPage } from './features/analytics/member_analytics/MemberAnalyticsPage';

function App() {
  const [activeFeature, setActiveFeature] = useState('analysis_web');

  return (
    <Layout activeFeature={activeFeature} onSelectFeature={setActiveFeature}>
      {activeFeature === 'analysis_web' && <WebAnalyticsPage />}
      {activeFeature === 'analysis_member' && <MemberAnalyticsPage />}
      
      {/* Fallback for preparation pages */}
      {activeFeature !== 'analysis_web' && activeFeature !== 'analysis_member' && (
        <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
          <h2>準備中</h2>
          <p>選択された機能モジュールは現在開発中です。</p>
        </div>
      )}
    </Layout>
  );
}

export default App;
