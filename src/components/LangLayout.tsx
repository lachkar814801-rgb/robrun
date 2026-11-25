import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import App from '@/App';
import { setHtmlLangDir } from '@/lib/rtl';

export default function LangLayout() {
  const { i18n } = useTranslation();
  const location = useLocation();

  // Initialiser la langue depuis l'URL ou le localStorage
  useEffect(() => {
    const langFromStorage = localStorage.getItem('robrun-lang') as string | null;
    const urlLang = location.pathname.split('/')[1];
    const resolvedLang = urlLang || langFromStorage || 'fr';

    if (resolvedLang !== i18n.language) {
      i18n.changeLanguage(resolvedLang);
    }
    setHtmlLangDir(resolvedLang);
  }, [location.pathname, i18n]);

  // Quand i18n change (depuis le sélecteur), mettre à jour le HTML
  useEffect(() => {
    setHtmlLangDir(i18n.language);
    localStorage.setItem('robrun-lang', i18n.language);
  }, [i18n.language]);

  return (
    <div data-lang={i18n.language}>
      <App />
    </div>
  );
}
