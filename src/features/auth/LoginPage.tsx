import { useState } from 'react';
import './LoginPage.css';
import { trackEvent } from '../../utils/tracker';

interface LoginPageProps {
  onLoginSuccess: (member: any) => void;
}

export const LoginPage = ({ onLoginSuccess }: LoginPageProps) => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!loginId || !password) {
      setError('会員番号（またはメールアドレス）とパスワードを入力してください。');
      return;
    }

    setLoading(true);
    trackEvent('submit_login', { login_id_type: loginId.includes('@') ? 'email' : 'member_number' });

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ loginId, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'ログインに失敗しました。');
      }

      // Track successful login
      trackEvent('login_success', { member_number: data.member.member_number });
      
      // Save member info to localStorage
      localStorage.setItem('airline_logged_in_member', JSON.stringify(data.member));
      
      // Trigger success callback (updates App state)
      onLoginSuccess(data.member);
      
      // Redirect to home hash
      window.location.hash = '';
    } catch (err: any) {
      setError(err.message);
      trackEvent('login_failed', { error_message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <span className="brand-logo">AERO MILES</span>
          <h2>会員ログイン</h2>
          <p className="subtitle">AERO MILES会員番号、または登録メールアドレスでログインできます。</p>
        </div>

        {error && <div className="error-alert">{error}</div>}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="loginId">会員番号 (10桁) または メールアドレス</label>
            <input
              type="text"
              id="loginId"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="例：1000123456 または mail@example.com"
              disabled={loading}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">パスワード</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワードを入力"
              disabled={loading}
              className="form-control"
            />
          </div>

          <button type="submit" className="login-btn-submit" disabled={loading}>
            {loading ? '認証中...' : 'ログイン'}
          </button>
        </form>

        <div className="login-footer">
          <p>まだ会員登録がお済みでないですか？</p>
          <a href="#register" className="register-link" onClick={() => trackEvent('click_register_from_login')}>
            新規入会登録 (無料) はこちら
          </a>
          <div className="back-home-wrap">
            <a href="#" className="back-home-link" onClick={() => trackEvent('click_back_home_from_login')}>
              トップページに戻る
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
