// dashboard/src/App.tsx
import { useState } from 'react';
import { Layout } from './components/Layout';
import { WebAnalyticsPage } from './features/analytics/web_analytics/WebAnalyticsPage';

function App() {
  const [activeFeature, setActiveFeature] = useState('analysis_web');

  return (
    <Layout activeFeature={activeFeature} onSelectFeature={setActiveFeature}>
      {activeFeature === 'analysis_web' && <WebAnalyticsPage />}
      
      {/* Fallback for preparation pages */}
      {activeFeature !== 'analysis_web' && (
        <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
          <h2>準備中</h2>
          <p>選択された機能モジュールは現在開発中です。</p>
        </div>
      )}
    </Layout>
  );
}

export default App;
