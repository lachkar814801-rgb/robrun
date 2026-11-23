import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

type EmptyPageProps = {
  titleKey: string;
  subtitleKey?: string;
};

export default function EmptyPage({ titleKey, subtitleKey }: EmptyPageProps) {
  const { t } = useTranslation();

  return (
    <div className="py-12 text-center">
      <h1 className="text-3xl font-bold text-white mb-4">{t(titleKey)}</h1>
      {subtitleKey && (
        <p className="text-lg text-white/70 mb-8">{t(subtitleKey)}</p>
      )}
      <div className="bg-white/5 border border-white/10 rounded-lg p-8 max-w-2xl mx-auto">
        <p className="text-white/50">
          Page en cours de construction. Contenu à venir à la phase P5.
        </p>
      </div>
      <Link
        to="/"
        className="mt-6 inline-block text-tunisian-red hover:text-tunisian-sand transition-colors"
      >
        ← {t('nav.home')}
      </Link>
    </div>
  );
}
