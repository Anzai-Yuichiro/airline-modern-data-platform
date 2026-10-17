// dashboard/src/features/analytics/web_analytics/WebAnalyticsPage.tsx
import { useState, useEffect } from 'react';
import './WebAnalyticsPage.css';

interface KPIState {
  total_events: number;
  unique_sessions: number;
  searches: number;
  cvr: number;
}

interface DeviceItem {
  device_type: string;
  count: number;
}

interface BrowserItem {
  browser: string;
  count: number;
}

interface RouteItem {
  departure: string;
  arrival: string;
  count: number;
}

interface TrendItem {
  date_label: string;
  count: number;
}

export const WebAnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<KPIState>({ total_events: 0, unique_sessions: 0, searches: 0, cvr: 0 });
  const [deviceData, setDeviceData] = useState<DeviceItem[]>([]);
  const [browserData, setBrowserData] = useState<BrowserItem[]>([]);
  const [routeData, setRouteData] = useState<RouteItem[]>([]);
  const [trendData, setTrendData] = useState<TrendItem[]>([]);

  const fetchAnalyticsData = async (isSilent = false) => {
    if (!isSilent) {
      setLoading(true);
      setError(null);
    }
    try {
      // Parallel fetches for efficiency
      const [kpiRes, deviceRes, routeRes, trendRes] = await Promise.all([
        fetch('/api/analytics/kpis'),
        fetch('/api/analytics/devices'),
        fetch('/api/analytics/routes'),
        fetch('/api/analytics/trends')
      ]);

      if (!kpiRes.ok || !deviceRes.ok || !routeRes.ok || !trendRes.ok) {
        throw new Error('APIサーバーからのデータ取得に失敗しました。');
      }

      const kpiJson = await kpiRes.json();
      const deviceJson = await deviceRes.json();
      const routeJson = await routeRes.json();
      const trendJson = await trendRes.json();

      setKpis(kpiJson);
      setDeviceData(deviceJson.devices || []);
      setBrowserData(deviceJson.browsers || []);
      setRouteData(routeJson.routes || []);
      setTrendData(trendJson.trends || []);
      setError(null); // Clear error state on success
    } catch (err: any) {
      console.error(err);
      if (!isSilent) {
        setError(err.message || 'データ接続エラーが発生しました。');
      }
    } finally {
      if (!isSilent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    // First fetch is visible (shows spinner)
    fetchAnalyticsData(false);

    // Set up silent polling every 2 seconds
    const intervalId = setInterval(() => {
      fetchAnalyticsData(true);
    }, 2000);

    return () => clearInterval(intervalId);
  }, []);

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="spinner"></div>
        <p>DuckDB からデータを抽出・集計中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-error">
        <h3>⚠️ 接続エラー</h3>
        <p>{error}</p>
        <button onClick={() => fetchAnalyticsData()} className="retry-btn">再試行</button>
      </div>
    );
  }

  const isDataEmpty = kpis.total_events === 0;

  // SVG Line Chart Helpers (Trends)
  const renderTrendChart = () => {
    if (trendData.length === 0) return <div className="no-chart-data">データがありません</div>;

    const width = 500;
    const height = 180;
    const padding = 30;

    const maxCount = Math.max(...trendData.map(d => d.count), 5);
    const minCount = 0;
    const countRange = maxCount - minCount;

    const points = trendData.map((d, index) => {
      const x = padding + (index / (trendData.length - 1 || 1)) * (width - padding * 2);
      const y = height - padding - ((d.count - minCount) / countRange) * (height - padding * 2);
      return { x, y, label: d.date_label, value: d.count };
    });

    const pathD = points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="svg-trend-chart">
        {/* Grid lines */}
        <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#222" strokeDasharray="4" />
        <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#222" strokeDasharray="4" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#333" />

        {/* Path Line */}
        <path d={pathD} fill="none" stroke="#c5a880" strokeWidth="2.5" />

        {/* Data Circles */}
        {points.map((p, i) => (
          <g key={i} className="chart-marker">
            <circle cx={p.x} cy={p.y} r="4" fill="#000" stroke="#c5a880" strokeWidth="2" />
            {/* Tooltip hover values */}
            <text x={p.x} y={p.y - 10} textAnchor="middle" className="marker-value">{p.value}</text>
            <text x={p.x} y={height - 10} textAnchor="middle" className="marker-label">{p.label}</text>
          </g>
        ))}
      </svg>
    );
  };

  // Donut segment calculation (for Device Type)
  const renderDeviceChart = () => {
    if (deviceData.length === 0) return <div className="no-chart-data">データがありません</div>;

    const total = deviceData.reduce((acc, d) => acc + d.count, 0) || 1;
    let accumulatedAngle = 0;
    
    // Hardcoded colors for device types
    const colors: Record<string, string> = {
      'PC': '#ffffff',
      'Mobile': '#c5a880',
      'Tablet': '#555555'
    };

    return (
      <div className="donut-chart-container">
        <svg viewBox="0 0 100 100" className="svg-donut">
          {deviceData.map((d, index) => {
            const percentage = d.count / total;
            const strokeDash = `${percentage * 282.6} 282.6`;
            const strokeOffset = -accumulatedAngle * 282.6;
            accumulatedAngle += percentage;

            return (
              <circle
                key={index}
                cx="50"
                cy="50"
                r="45"
                fill="transparent"
                stroke={colors[d.device_type] || '#888'}
                strokeWidth="10"
                strokeDasharray={strokeDash}
                strokeDashoffset={strokeOffset}
                transform="rotate(-90 50 50)"
              />
            );
          })}
        </svg>
        <div className="donut-legend">
          {deviceData.map((d, index) => (
            <div key={index} className="legend-item">
              <span className="legend-dot" style={{ backgroundColor: colors[d.device_type] }}></span>
              <span className="legend-name">{d.device_type}</span>
              <span className="legend-val">{((d.count / total) * 100).toFixed(0)}% ({d.count}回)</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="web-analytics-view">
      {/* Title block */}
      <div className="view-title-row">
        <div>
          <h2 className="view-title">Webアナリティクス</h2>
          <p className="view-subtitle">シミュレータサイトでのユーザーアクションとファネルCVR分析</p>
        </div>
        <button className="refresh-btn" onClick={() => fetchAnalyticsData()}>🔄 リフレッシュ</button>
      </div>

      {isDataEmpty && (
        <div className="data-empty-notice">
          <strong>📊 DuckDB データベースが現在空です</strong>
          <p>
            分析用データ（`analytics.db`）が読み込まれていません。シミュレータサイト（http://localhost:5173）でフライト検索やメニュークリックなどの操作を行った後、
            ターミナルで `etl_pipeline.py` を実行してデータを DuckDB にロードしてください。
          </p>
          <div className="setup-commands">
            <code>./venv/bin/python etl_pipeline.py</code>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-icon">🖱️</span>
          <div className="kpi-body">
            <span className="kpi-label">総イベント件数</span>
            <span className="kpi-value">{kpis.total_events} <span className="unit">events</span></span>
          </div>
        </div>

        <div className="kpi-card">
          <span className="kpi-icon">👥</span>
          <div className="kpi-body">
            <span className="kpi-label">ユニークセッション数</span>
            <span className="kpi-value">{kpis.unique_sessions} <span className="unit">sessions</span></span>
          </div>
        </div>

        <div className="kpi-card">
          <span className="kpi-icon">✈️</span>
          <div className="kpi-body">
            <span className="kpi-label">フライト空席照会数</span>
            <span className="kpi-value">{kpis.searches} <span className="unit">searches</span></span>
          </div>
        </div>

        <div className="kpi-card highlighted">
          <span className="kpi-icon">🎯</span>
          <div className="kpi-body">
            <span className="kpi-label">検索移行率 (CVR)</span>
            <span className="kpi-value">{kpis.cvr} <span className="unit">%</span></span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Trend line */}
        <div className="chart-card trend-chart">
          <h3 className="chart-title">アクティビティ推移 (直近)</h3>
          {renderTrendChart()}
        </div>

        {/* Device breakdown */}
        <div className="chart-card device-chart">
          <h3 className="chart-title">デバイス別利用割合</h3>
          {renderDeviceChart()}
        </div>

        {/* Popular Searched Routes */}
        <div className="chart-card routes-chart">
          <h3 className="chart-title">空席照会が多い人気路線（TOP 5）</h3>
          {routeData.length === 0 ? (
            <div className="no-chart-data">フライト検索データがまだありません</div>
          ) : (
            <div className="routes-bar-list">
              {routeData.map((item, idx) => {
                const maxCount = Math.max(...routeData.map(r => r.count), 1);
                const widthPercent = (item.count / maxCount) * 100;
                return (
                  <div key={idx} className="route-bar-row">
                    <div className="route-names">
                      <span className="route-rank">{idx + 1}</span>
                      <span className="route-segment">{item.departure} ➔ {item.arrival}</span>
                    </div>
                    <div className="route-bar-container">
                      <div className="route-bar" style={{ width: `${widthPercent}%` }}></div>
                      <span className="route-bar-value">{item.count}回検索</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Browsers list */}
        <div className="chart-card browsers-card">
          <h3 className="chart-title">利用ブラウザ比率</h3>
          {browserData.length === 0 ? (
            <div className="no-chart-data">データがありません</div>
          ) : (
            <div className="browser-rank-list">
              {browserData.map((b, idx) => (
                <div key={idx} className="browser-rank-row">
                  <span className="browser-name">🌐 {b.browser}</span>
                  <span className="browser-count">{b.count}回アクセス</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
