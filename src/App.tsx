import { Link, NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LangSwitcher from '@/components/LangSwitcher';

const NAV_ITEMS = [
  { key: 'nav.home', path: '' },
  { key: 'nav.weapons', path: 'weapons' },
  { key: 'nav.items', path: 'items' },
  { key: 'nav.map', path: 'map' },
  { key: 'nav.vehicles', path: 'vehicles' },
  { key: 'nav.upgrades', path: 'upgrades' },
  { key: 'nav.database', path: 'database' },
  { key: 'nav.guides', path: 'guides' },
  { key: 'nav.about', path: 'about' },
];

export default function App() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'fr';

  const linkClass = ({ isActive }: { isActive: boolean }): string =>
    `whitespace-nowrap rounded px-2 py-1 text-sm transition-colors ${
      isActive ? 'text-tunisian-sand' : 'text-white/65 hover:text-white'
    }`;

  return (
    <div className="flex min-h-screen flex-col bg-tunisian-dark text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to={`/${lang}`} dir="ltr" className="flex shrink-0 items-center gap-2 font-bold text-tunisian-red">
            <span>ROB RUN</span>
            <span className="text-white">Companion</span>
          </Link>

          <nav className="hidden items-center gap-1 xl:flex" aria-label={t('ui.nav.main')}>
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path || 'home'}
                to={`/${lang}/${item.path}`}
                end={item.path === ''}
                className={linkClass}
              >
                {t(item.key)}
              </NavLink>
            ))}
          </nav>

          <LangSwitcher />
        </div>

        <nav
          className="flex gap-1 overflow-x-auto border-t border-white/5 px-4 py-2 xl:hidden"
          aria-label={t('ui.nav.main')}
        >
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path || 'home'}
              to={`/${lang}/${item.path}`}
              end={item.path === ''}
              className={linkClass}
            >
              {t(item.key)}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <p className="mb-4 text-xs text-white/45">{t('fan.warning')}</p>
        <Outlet />
      </main>

      <footer className="border-t border-white/10 bg-black py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 text-xs text-white/45 sm:px-6 md:flex-row lg:px-8">
          <p>{t('footer.tagline')}</p>
          <p>{t('footer.unofficial')}</p>
        </div>
      </footer>
    </div>
  );
}
