import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useData } from '@/hooks/useData';
import { toLang } from '@/lib/data';
import type { Lang, Item, MapPoint, Weapon } from '@/lib/data';
import { formatNumber } from '@/lib/format';

interface StatLink {
  key: string;
  path: string;
  count: number | null;
}

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const lang: Lang = toLang(i18n.language);

  const weapons = useData<Record<string, Weapon>>('weapons');
  const items = useData<Record<string, Item>>('items');
  const points = useData<Record<string, MapPoint>>('mapPoints');

  const stats = useMemo<StatLink[]>(() => {
    const itemList = items.data ? Object.values(items.data) : null;
    const weaponList = weapons.data ? Object.values(weapons.data) : null;

    const countCategory = (category: string): number | null =>
      itemList ? itemList.filter((item) => item.category === category).length : null;

    const total =
      weaponList && itemList && points.data
        ? weaponList.length + itemList.length + Object.keys(points.data).length
        : null;

    return [
      { key: 'nav.weapons', path: 'weapons', count: weaponList ? weaponList.length : null },
      { key: 'nav.items', path: 'items', count: itemList ? itemList.length : null },
      { key: 'nav.vehicles', path: 'vehicles', count: countCategory('vehicles') },
      { key: 'nav.upgrades', path: 'upgrades', count: itemList ? itemList.filter((item) => item.category === 'vehicle_upgrades' || item.category === 'workbenches_upgrades').length : null },
      { key: 'nav.database', path: 'database', count: total },
    ];
  }, [items.data, weapons.data, points.data]);

  return (
    <div>
      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] via-white/[0.03] to-transparent p-6 sm:p-10">
        <div className="mb-4 h-1 w-14 rounded-full bg-tunisian-red" />
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-tunisian-sand">
          ROB RUN
        </p>
        <h1 className="max-w-2xl text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
          {t('page.title')}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/60">{t('ui.intro.home')}</p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to={`/${i18n.language}/weapons`}
            className="rounded-lg bg-tunisian-red px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#c40011]"
          >
            {t('ui.home.cta.weapons')}
          </Link>
          <Link
            to={`/${i18n.language}/database`}
            className="rounded-lg border border-tunisian-sand/50 px-4 py-2 text-sm font-semibold text-tunisian-sand transition-colors hover:bg-tunisian-sand/10"
          >
            {t('ui.home.cta.database')}
          </Link>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white/50">
          {t('ui.home.stats.title')}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {stats.map((stat) => (
            <Link
              key={stat.path + stat.key}
              to={`/${i18n.language}/${stat.path}`}
              className="group rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-tunisian-sand/40"
            >
              <p className="text-2xl font-bold text-white group-hover:text-tunisian-sand">
                {stat.count === null ? '—' : formatNumber(stat.count, lang)}
              </p>
              <p className="mt-1 text-xs text-white/50">{t(stat.key)}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { key: 'ui.home.cta.items', path: 'items' },
          { key: 'ui.home.cta.vehicles', path: 'vehicles' },
          { key: 'ui.home.cta.upgrades', path: 'upgrades' },
          { key: 'ui.home.cta.database', path: 'database' },
        ].map((entry) => (
          <Link
            key={entry.path}
            to={`/${i18n.language}/${entry.path}`}
            className="rounded-xl border border-white/10 px-4 py-3 text-sm text-white/70 transition-colors hover:border-tunisian-red/50 hover:text-white"
          >
            {t(entry.key)}
          </Link>
        ))}
      </section>

      <p className="mt-8 text-xs text-white/35">{t('ui.home.note')}</p>
    </div>
  );
}
