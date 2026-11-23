import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { SUPPORTED_LANGS } from '@/lib/langs';

export default function LangSwitcher() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const changeLanguage = (newLang: string) => {
    const currentPath = location.pathname;
    const currentLang = currentPath.split('/')[1] || 'fr';
    const restOfPath = currentPath.slice(currentLang.length + 1);
    const newPath = restOfPath ? `/${newLang}/${restOfPath}` : `/${newLang}`;

    i18n.changeLanguage(newLang);
    navigate(newPath, { replace: true });
  };

  return (
    <div className="flex items-center gap-2">
      {SUPPORTED_LANGS.map(({ code, label, dir }: { code: string; label: string; dir: 'ltr' | 'rtl' }) => (
        <button
          key={code}
          onClick={() => changeLanguage(code)}
          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
            i18n.language === code
              ? 'bg-tunisian-red text-white'
              : 'text-white/60 hover:text-tunisian-sand'
          }`}
          aria-label={t('btn.changeLanguage')}
          aria-pressed={i18n.language === code}
          dir={dir}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
