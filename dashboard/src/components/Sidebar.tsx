// dashboard/src/components/Sidebar.tsx
import { useState } from 'react';
import './Sidebar.css';

interface SidebarProps {
  activeFeature: string;
  onSelectFeature: (feature: string) => void;
}

export const Sidebar = ({ activeFeature, onSelectFeature }: SidebarProps) => {
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(true);

  return (
    <aside className="db-sidebar">
      {/* Brand Header */}
      <div className="db-sidebar-brand">
        <span className="brand-logo">STARFLYER</span>
        <span className="brand-subtitle">CONSOLE & ANALYTICS</span>
      </div>

      {/* Navigation List */}
      <nav className="db-sidebar-nav">
        <ul className="menu-list">
          {/* Group 1: Analysis */}
          <li className="menu-group">
            <button 
              className="menu-group-header"
              onClick={() => setIsAnalysisOpen(!isAnalysisOpen)}
            >
              <span className="menu-icon">📊</span>
              <span className="menu-label">データ分析</span>
              <span className={`menu-arrow ${isAnalysisOpen ? 'expanded' : ''}`}>▼</span>
            </button>
            
            {isAnalysisOpen && (
              <ul className="menu-sub-list">
                <li>
                  <button 
                    className={`menu-item ${activeFeature === 'analysis_web' ? 'active' : ''}`}
                    onClick={() => onSelectFeature('analysis_web')}
                  >
                    <span className="bullet">▫️</span> Webアナリティクス
                  </button>
                </li>
                <li>
                  <button 
                    className={`menu-item disabled ${activeFeature === 'analysis_flight' ? 'active' : ''}`}
                    onClick={() => alert('「予約・フライト分析」機能は現在準備中です。')}
                  >
                    <span className="bullet">▫️</span> 予約・フライト分析 <span className="badge">準備中</span>
                  </button>
                </li>
                <li>
                  <button 
                    className={`menu-item disabled ${activeFeature === 'analysis_member' ? 'active' : ''}`}
                    onClick={() => alert('「会員・マイル分析」機能は現在準備中です。')}
                  >
                    <span className="bullet">▫️</span> 会員・マイル分析 <span className="badge">準備中</span>
                  </button>
                </li>
              </ul>
            )}
          </li>

          {/* Group 2: Recommendation */}
          <li className="menu-group-single">
            <button 
              className={`menu-item-single ${activeFeature === 'recommend' ? 'active' : ''}`}
              onClick={() => alert('「レコメンド」機能（ユーザー行動に合わせた路線・ホテルのパーソナライズ推薦設定）は現在開発中です。')}
            >
              <span className="menu-icon">🎯</span>
              <span className="menu-label">レコメンドエンジン</span>
              <span className="badge-outline">近日公開</span>
            </button>
          </li>

          {/* Group 3: Marketing Automation */}
          <li className="menu-group-single">
            <button 
              className={`menu-item-single ${activeFeature === 'ma' ? 'active' : ''}`}
              onClick={() => alert('「MA (マーケティングオートメーション)」機能（フライト検索後の離脱ユーザー向けトリガーキャンペーン設定等）は現在開発中です。')}
            >
              <span className="menu-icon">⚡</span>
              <span className="menu-label">マーケティング自動化</span>
              <span className="badge-outline">近日公開</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Footer Info */}
      <div className="db-sidebar-footer">
        <div className="system-status">
          <span className="status-indicator online"></span>
          <span>ETL Pipeline: Active</span>
        </div>
        <div className="version-info">v1.0.0 (Local Simulation)</div>
      </div>
    </aside>
  );
};
