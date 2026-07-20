import React, { useState } from 'react';
import './RegisterPage.css';
import { trackEvent } from '../../utils/tracker';

type StepType = 'input' | 'confirm' | 'complete';

export const RegisterPage = () => {
  const [step, setStep] = useState<StepType>('input');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [issuedMemberNumber, setIssuedMemberNumber] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    last_name_kanji: '',
    first_name_kanji: '',
    last_name_kana: '',
    first_name_kana: '',
    last_name_romaji: '',
    first_name_romaji: '',
    birth_year: '1990',
    birth_month: '1',
    birth_day: '1',
    gender: '男性',
    phone_number: '',
    postal_code: '',
    address: '',
    card_type: 'STAR LINK カード (デジタル会員証)',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validations
    if (
      !formData.email ||
      !formData.password ||
      !formData.passwordConfirm ||
      !formData.last_name_kanji ||
      !formData.first_name_kanji ||
      !formData.last_name_kana ||
      !formData.first_name_kana ||
      !formData.last_name_romaji ||
      !formData.first_name_romaji ||
      !formData.phone_number ||
      !formData.postal_code ||
      !formData.address
    ) {
      setError('必須項目がすべて入力されていません。');
      return;
    }

    if (formData.password !== formData.passwordConfirm) {
      setError('パスワードとパスワード（確認）が一致していません。');
      return;
    }

    if (formData.password.length < 8) {
      setError('パスワードは8文字以上で入力してください。');
      return;
    }

    trackEvent('register_step_confirm', { card_type: formData.card_type });
    setStep('confirm');
    window.scrollTo(0, 0);
  };

  const handleRegisterConfirm = async () => {
    setError('');
    setLoading(true);
    trackEvent('submit_registration');

    const birthdate = `${formData.birth_year}-${formData.birth_month.padStart(2, '0')}-${formData.birth_day.padStart(2, '0')}`;

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          last_name_kanji: formData.last_name_kanji,
          first_name_kanji: formData.first_name_kanji,
          last_name_kana: formData.last_name_kana,
          first_name_kana: formData.first_name_kana,
          last_name_romaji: formData.last_name_romaji.toUpperCase(),
          first_name_romaji: formData.first_name_romaji.toUpperCase(),
          birthdate,
          gender: formData.gender,
          phone_number: formData.phone_number,
          postal_code: formData.postal_code,
          address: formData.address,
          card_type: formData.card_type,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '登録中にエラーが発生しました。');
      }

      setIssuedMemberNumber(data.member.member_number);
      trackEvent('register_success', { member_number: data.member.member_number });
      setStep('complete');
      window.scrollTo(0, 0);
    } catch (err: any) {
      setError(err.message);
      setStep('input');
      trackEvent('register_failed', { error_message: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Generate selector ranges
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => (currentYear - i).toString());
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

  return (
    <div className="register-page">
      <div className="register-container">
        {/* Step Indicator */}
        <div className="step-indicator">
          <div className={`step-node ${step === 'input' ? 'active' : ''} ${step !== 'input' ? 'completed' : ''}`}>
            <span className="step-num">1</span>
            <span className="step-text">会員情報入力</span>
          </div>
          <div className="step-line"></div>
          <div className={`step-node ${step === 'confirm' ? 'active' : ''} ${step === 'complete' ? 'completed' : ''}`}>
            <span className="step-num">2</span>
            <span className="step-text">入力内容確認</span>
          </div>
          <div className="step-line"></div>
          <div className={`step-node ${step === 'complete' ? 'active' : ''}`}>
            <span className="step-num">3</span>
            <span className="step-text">登録完了</span>
          </div>
        </div>

        {error && <div className="error-alert">{error}</div>}

        {/* Step 1: Input Form */}
        {step === 'input' && (
          <form className="register-form" onSubmit={handleInputSubmit}>
            <div className="section-title">アカウント情報</div>
            
            <div className="form-group">
              <label>メールアドレス <span className="required">必須</span></label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@starflyer.jp"
                className="form-control"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group col">
                <label>パスワード (8〜16桁英数字) <span className="required">必須</span></label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="パスワードを入力"
                  className="form-control"
                  required
                />
              </div>
              <div className="form-group col">
                <label>パスワード確認 <span className="required">必須</span></label>
                <input
                  type="password"
                  name="passwordConfirm"
                  value={formData.passwordConfirm}
                  onChange={handleChange}
                  placeholder="もう一度入力"
                  className="form-control"
                  required
                />
              </div>
            </div>

            <div className="section-title" style={{ marginTop: '30px' }}>お客様基本情報</div>

            <div className="form-row">
              <div className="form-group col">
                <label>お名前 (漢字 姓) <span className="required">必須</span></label>
                <input
                  type="text"
                  name="last_name_kanji"
                  value={formData.last_name_kanji}
                  onChange={handleChange}
                  placeholder="例：山田"
                  className="form-control"
                  required
                />
              </div>
              <div className="form-group col">
                <label>お名前 (漢字 名) <span className="required">必須</span></label>
                <input
                  type="text"
                  name="first_name_kanji"
                  value={formData.first_name_kanji}
                  onChange={handleChange}
                  placeholder="例：太郎"
                  className="form-control"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group col">
                <label>フリガナ (全角カナ 姓) <span className="required">必須</span></label>
                <input
                  type="text"
                  name="last_name_kana"
                  value={formData.last_name_kana}
                  onChange={handleChange}
                  placeholder="例：ヤマダ"
                  className="form-control"
                  required
                />
              </div>
              <div className="form-group col">
                <label>フリガナ (全角カナ 名) <span className="required">必須</span></label>
                <input
                  type="text"
                  name="first_name_kana"
                  value={formData.first_name_kana}
                  onChange={handleChange}
                  placeholder="例：タロウ"
                  className="form-control"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group col">
                <label>ローマ字 (半角 姓) <span className="required">必須</span></label>
                <input
                  type="text"
                  name="last_name_romaji"
                  value={formData.last_name_romaji}
                  onChange={handleChange}
                  placeholder="例：YAMADA"
                  className="form-control"
                  required
                />
              </div>
              <div className="form-group col">
                <label>ローマ字 (半角 名) <span className="required">必須</span></label>
                <input
                  type="text"
                  name="first_name_romaji"
                  value={formData.first_name_romaji}
                  onChange={handleChange}
                  placeholder="例：TARO"
                  className="form-control"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group col-3">
                <label>生年月日 (年) <span className="required">必須</span></label>
                <select name="birth_year" value={formData.birth_year} onChange={handleChange} className="form-control">
                  {years.map(y => <option key={y} value={y}>{y}年</option>)}
                </select>
              </div>
              <div className="form-group col-3">
                <label>生年月日 (月) <span className="required">必須</span></label>
                <select name="birth_month" value={formData.birth_month} onChange={handleChange} className="form-control">
                  {months.map(m => <option key={m} value={m}>{m}月</option>)}
                </select>
              </div>
              <div className="form-group col-3">
                <label>生年月日 (日) <span className="required">必須</span></label>
                <select name="birth_day" value={formData.birth_day} onChange={handleChange} className="form-control">
                  {days.map(d => <option key={d} value={d}>{d}日</option>)}
                </select>
              </div>
              <div className="form-group col-3">
                <label>性別 <span className="required">必須</span></label>
                <select name="gender" value={formData.gender} onChange={handleChange} className="form-control">
                  <option value="男性">男性</option>
                  <option value="女性">女性</option>
                  <option value="回答しない">回答しない</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group col-4">
                <label>郵便番号 (7桁) <span className="required">必須</span></label>
                <input
                  type="text"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleChange}
                  placeholder="例：1000001"
                  className="form-control"
                  required
                />
              </div>
              <div className="form-group col-8">
                <label>電話番号 (ハイフンなし) <span className="required">必須</span></label>
                <input
                  type="text"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  placeholder="例：09012345678"
                  className="form-control"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>ご住所 <span className="required">必須</span></label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="都道府県、市区町村、番地、マンション名など"
                className="form-control"
                required
              />
            </div>

            <div className="form-group">
              <label>入会カードの種類 <span className="required">必須</span></label>
              <select name="card_type" value={formData.card_type} onChange={handleChange} className="form-control">
                <option value="STAR LINK カード (デジタル会員証)">STAR LINK カード (デジタル会員証 - 即時発行)</option>
                <option value="STAR LINK VISAカード (クレジット機能付き)">STAR LINK VISAカード (クレジット機能付き - 郵送)</option>
                <option value="STAR LINK JCBカード (クレジット機能付き)">STAR LINK JCBカード (クレジット機能付き - 郵送)</option>
              </select>
            </div>

            <div className="register-actions">
              <button type="submit" className="register-btn-primary">入力内容の確認へ</button>
              <a href="#" className="register-btn-secondary" onClick={() => trackEvent('click_cancel_register')}>キャンセル</a>
            </div>
          </form>
        )}

        {/* Step 2: Confirm Information */}
        {step === 'confirm' && (
          <div className="register-confirm-view">
            <h3 className="section-title">ご入力内容の確認</h3>
            <p className="confirm-desc">以下の内容で STAR LINK 会員登録を行います。よろしければ「登録する」ボタンをクリックしてください。</p>

            <table className="confirm-table">
              <tbody>
                <tr><th>メールアドレス</th><td>{formData.email}</td></tr>
                <tr><th>お名前（漢字）</th><td>{formData.last_name_kanji} {formData.first_name_kanji}</td></tr>
                <tr><th>お名前（フリガナ）</th><td>{formData.last_name_kana} {formData.first_name_kana}</td></tr>
                <tr><th>お名前（ローマ字）</th><td>{formData.last_name_romaji.toUpperCase()} {formData.first_name_romaji.toUpperCase()}</td></tr>
                <tr><th>生年月日</th><td>{formData.birth_year}年 {formData.birth_month}月 {formData.birth_day}日</td></tr>
                <tr><th>性別</th><td>{formData.gender}</td></tr>
                <tr><th>郵便番号</th><td>〒{formData.postal_code}</td></tr>
                <tr><th>ご住所</th><td>{formData.address}</td></tr>
                <tr><th>電話番号</th><td>{formData.phone_number}</td></tr>
                <tr><th>カードの種類</th><td>{formData.card_type}</td></tr>
              </tbody>
            </table>

            <div className="register-actions">
              <button onClick={handleRegisterConfirm} className="register-btn-primary" disabled={loading}>
                {loading ? '登録処理中...' : 'この内容で登録する'}
              </button>
              <button onClick={() => setStep('input')} className="register-btn-secondary" disabled={loading}>
                戻って修正する
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Registration Complete */}
        {step === 'complete' && (
          <div className="register-complete-view">
            <div className="success-icon">✓</div>
            <h2>ご入会ありがとうございます</h2>
            <p className="congrats-text">STAR LINK 会員への新規ご入会が完了いたしました。</p>

            <div className="member-card-box">
              <div className="member-card-title">STAR LINK 会員証</div>
              <div className="member-number-title">あなたの会員番号 (10桁)</div>
              <div className="member-number-val">{issuedMemberNumber}</div>
              <div className="welcome-miles">✨ 新規入会特典として <strong>1,000 マイル</strong> をプレゼントしました！</div>
            </div>

            <p className="complete-notice">
              ご登録いただいたメールアドレスに入会完了メールをお送りしました。<br />
              ログインやご予約の際、上記の10桁の会員番号が必要になりますので、大切に保管してください。
            </p>

            <div className="register-actions single-action">
              <a href="#login" className="register-btn-primary complete-action-btn" onClick={() => trackEvent('click_login_from_complete')}>
                さっそくログインする
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
