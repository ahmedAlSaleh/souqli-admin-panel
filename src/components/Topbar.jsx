import React from 'react';
import { useI18n } from '../i18n/I18nProvider.jsx';

const Topbar = ({ title, icon, user, onLogout }) => {
  const { lang, setLang, t } = useI18n();

  return (
    <header className="topbar">
      <div className="topbar-title-wrap">
        <p className="eyebrow">{t('common.control_panel')}</p>
        <div className="title-row">
          {icon && <span className="title-icon">{icon}</span>}
          <h1>{title}</h1>
        </div>
      </div>

      <div className="topbar-actions">
        <div className="search">
          <input type="text" placeholder={t('common.search_anything')} />
        </div>

        <button className="ghost-button" type="button">
          {t('common.export')}
        </button>

        <div className="lang-toggle" role="group" aria-label="Language switcher">
          <button
            className={lang === 'en' ? 'lang-button active' : 'lang-button'}
            type="button"
            onClick={() => setLang('en')}
          >
            {t('common.lang_en')}
          </button>
          <button
            className={lang === 'ar' ? 'lang-button active' : 'lang-button'}
            type="button"
            onClick={() => setLang('ar')}
          >
            {t('common.lang_ar')}
          </button>
        </div>

        <div className="user-chip">
          <span className="status status-live" />
          {user ? user.full_name : t('common.admin_user')}
        </div>

        <button className="ghost-button" type="button" onClick={onLogout}>
          {t('common.logout')}
        </button>
      </div>
    </header>
  );
};

export default Topbar;
