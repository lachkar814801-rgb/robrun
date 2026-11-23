import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import LangSwitcher from '@/components/LangSwitcher';

export default function App() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-tunisian-dark text-white">
      <header className="border-b border-white/10 bg-black/80 sticky top-0 z-50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2 font-bold text-tunisian-red">
              <span>ROB RUN</span>
              <span className="text-white">Companion</span>
            </Link>
            <nav className="hidden md:flex gap-4 text-sm">
              {Object.entries({
                [t('nav.home')]: '/',
                [t('nav.weapons')]: '/weapons',
                [t('nav.items')]: '/items',
                [t('nav.map')]: '/map',
                [t('nav.vehicles')]: '/vehicles',
                [t('nav.upgrades')]: '/upgrades',
                [t('nav.database')]: '/database',
                [t('nav.guides')]: '/guides',
                [t('nav.about')]: '/about',
              }).map(([label, href]) => (
                <Link key={href} to={href} className="hover:text-tunisian-sand transition-colors">
                  {label}
                </Link>
              ))}
            </nav>
            <LangSwitcher />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-sm text-white/60 mb-4">{t('fan.warning')}</p>
        <h1 className="text-2xl font-bold text-white mb-6">{t('page.title')}</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[t('page.weapons'), t('page.items'), t('page.map'), t('page.vehicles'), t('page.upgrades'), t('page.database'), t('page.guides'), t('page.about')].map((page, i) => (
            <div key={i} className="p-6 border border-white/10 rounded-lg hover:border-tunisian-red/50 transition-colors cursor-pointer group">
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-tunisian-sand">{page}</h3>
              <p className="text-sm text-white/50">Page {page}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-white/10 bg-black py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/50">
          <p>{t('footer.tagline')}</p>
          <p>{t('footer.unofficial')}</p>
        </div>
      </footer>
    </div>
  );
}
