import React, { useState } from 'react';
import Notice from '../components/Notice.jsx';
import { useI18n } from '../i18n/I18nProvider.jsx';

const LoginPage = ({ onLogin, error, loading }) => {
  const [form, setForm] = useState({ email: '', password: '' });
  const { t, lang, setLang } = useI18n();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onLogin(form.email, form.password);
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-info">
          <div className="login-actions">
            <div className="lang-toggle">
              <button
                className={lang === 'en' ? 'lang-button active' : 'lang-button'}
                type="button"
                onClick={() => setLang('en')}
              >
                EN
              </button>
              <button
                className={lang === 'ar' ? 'lang-button active' : 'lang-button'}
                type="button"
                onClick={() => setLang('ar')}
              >
                عربي
              </button>
            </div>
          </div>
          <p className="eyebrow">{t('auth.brand')}</p>
          <h2>{t('auth.title')}</h2>
          <p className="muted">{t('auth.subtitle')}</p>
        </div>
        <form className="login-form" onSubmit={handleSubmit}>
          <label>{t('auth.email')}</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="admin@souqli.com"
            required
          />
          <label>{t('auth.password')}</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="********"
            required
          />
          <Notice type="error" message={error} />
          <button className="primary-button full" type="submit" disabled={loading}>
            {loading ? t('common.signing_in') : t('common.sign_in')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
