import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './i18n/en.json';
import fr from './i18n/fr.json';
import ar from './i18n/ar.json';

const SUPPORTED = ['en', 'fr', 'ar'] as const;
type SupportedLang = (typeof SUPPORTED)[number];

function isSupported(value: string | null | undefined): value is SupportedLang {
  return value === 'en' || value === 'fr' || value === 'ar';
}

/**
 * Langue initiale : préfixe d'URL, puis choix mémorisé, puis français.
 * Déterminée avant le premier rendu pour éviter un flash de langue
 * (et pour que la navigation soit déjà traduite au chargement direct d'une URL).
 */
function detectInitialLang(): SupportedLang {
  if (typeof window === 'undefined') return 'fr';

  const urlLang = window.location.pathname.split('/')[1];
  if (isSupported(urlLang)) return urlLang;

  try {
    const stored = window.localStorage.getItem('robrun-lang');
    if (isSupported(stored)) return stored;
  } catch {
    // localStorage indisponible (navigation privée stricte) : on garde le français.
  }

  return 'fr';
}

const initialLang = detectInitialLang();

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
    ar: { translation: ar },
  },
  lng: initialLang,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export { i18n };
