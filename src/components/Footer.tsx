// src/components/Footer.tsx
import React from 'react';
import './Footer.css';

export const Footer: React.FC = () => {
  return (
    <footer className="sfj-footer">
      <div className="footer-links container">
        
        <div className="footer-column">
          <h4>航空券予約</h4>
          <ul>
            <li><a href="#rsv-flow">ご予約・購入の流れ</a></li>
            <li><a href="#fares">運賃の種類</a></li>
            <li><a href="#eticket">eチケットのご案内</a></li>
            <li><a href="#payments">お支払い方法</a></li>
            <li><a href="#refunds">変更・払い戻し</a></li>
          </ul>
        </div>

        <div className="footer-column">
          <h4>空港・チェックイン</h4>
          <ul>
            <li><a href="#online-checkin">オンラインチェックイン</a></li>
            <li><a href="#boarding-guide">搭乗手続きの流れ</a></li>
            <li><a href="#luggage">手荷物について</a></li>
            <li><a href="#airports">就航地・空港案内</a></li>
            <li><a href="#support">お手伝いが必要な方</a></li>
          </ul>
        </div>

        <div className="footer-column">
          <h4>サービス＆ブランド</h4>
          <ul>
            <li><a href="#seats">くつろぎの空間設計</a></li>
            <li><a href="#drinks">機内のお飲み物</a></li>
            <li><a href="#entertainment">エンターテインメント</a></li>
            <li><a href="#safety">セイフティビデオ</a></li>
            <li><a href="#brand-concept">ブランドコンセプト</a></li>
          </ul>
        </div>

        <div className="footer-column">
          <h4>AERO MILES (マイレージ)</h4>
          <ul>
            <li><a href="#merit">会員ログインのメリット</a></li>
            <li><a href="#get-mile">マイルを貯める</a></li>
            <li><a href="#use-mile">マイルを使う</a></li>
            <li><a href="#creditcard">提携クレジットカード</a></li>
            <li><a href="#app">公式アプリのご案内</a></li>
          </ul>
        </div>

      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-container container">
          <div className="footer-logo">AERO CONNECT</div>
          
          <ul className="footer-legal-links">
            <li><a href="#company">会社情報</a></li>
            <li><a href="#privacy">プライバシーポリシー</a></li>
            <li><a href="#terms">約款・規約</a></li>
            <li><a href="#site-map">サイトマップ</a></li>
          </ul>
          
          <p className="copyright">
            &copy; 2026 Aero Connect Airline EC Simulation. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
