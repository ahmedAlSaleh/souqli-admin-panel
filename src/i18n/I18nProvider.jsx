import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import messages, { formatMessage } from './messages.js';

const I18nContext = createContext({
  lang: 'en',
  setLang: () => {},
  t: (key) => key
});

export const I18nProvider = ({ children }) => {
  const [lang, setLangState] = useState(() => {
    const stored = localStorage.getItem('souqli_lang');
    return stored === 'ar' || stored === 'en' ? stored : 'en';
  });

  const setLang = (nextLang) => {
    setLangState(nextLang === 'ar' ? 'ar' : 'en');
  };

  useEffect(() => {
    localStorage.setItem('souqli_lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const t = useMemo(() => {
    return (key) => formatMessage(lang, key);
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => useContext(I18nContext);
