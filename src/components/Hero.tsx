// src/components/Hero.tsx
import React from 'react';
import './Hero.css';

export const Hero: React.FC = () => {
  return (
    <section className="sfj-hero">
      <div className="sfj-hero-bg">
        <img 
          src="/hero-bg.jpg" 
          alt="Starflyer aircraft flying through a twilight sky" 
          className="hero-image" 
        />
        <div className="hero-overlay"></div>
      </div>
      <div className="sfj-hero-content container">
        <div className="hero-text-area">
          <p className="hero-sub">THE BLACK LUXURY AIRLINE</p>
          <h1 className="hero-title">快適さと、<br />洗練された感動を。</h1>
          <p className="hero-desc">
            スターフライヤーは、全席レザーシート、広い足元空間、個人モニターを備えた、ハイブリッドでプレミアムな空の旅をお届けします。
          </p>
          <div className="hero-actions">
            <a href="#about" className="btn-hero-solid">ブランドコンセプトを見る</a>
          </div>
        </div>
      </div>
    </section>
  );
};
