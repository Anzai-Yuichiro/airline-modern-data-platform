// dashboard/src/components/Layout.tsx
import React from 'react';
import { Sidebar } from './Sidebar';
import './Layout.css';

interface LayoutProps {
  activeFeature: string;
  onSelectFeature: (feature: string) => void;
  children: React.ReactNode;
}

export const Layout = ({ activeFeature, onSelectFeature, children }: LayoutProps) => {
  return (
    <div className="db-layout">
      {/* Left Sidebar */}
      <Sidebar activeFeature={activeFeature} onSelectFeature={onSelectFeature} />

      {/* Main Panel */}
      <div className="db-main-container">
        {/* Top Header */}
        <header className="db-top-header">
          <div className="header-breadcrumbs">
            <span>コンソール</span>
            <span className="separator">/</span>
            {activeFeature === 'analysis_web' && <span className="active-path">データ分析 - Webアナリティクス</span>}
          </div>
          
          <div className="header-profile">
            <span className="profile-role">Administrator</span>
            <span className="profile-avatar">👤</span>
          </div>
        </header>

        {/* Content Area */}
        <main className="db-content-view">
          {children}
        </main>
      </div>
    </div>
  );
};
