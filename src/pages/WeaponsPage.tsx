import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageIntro from '@/components/PageIntro';
import StatBar from '@/components/StatBar';
import WeaponCard from '@/components/WeaponCard';
import { useData } from '@/hooks/useData';
import type { Weapon } from '@/lib/data';

type SortKey = 'dps' | 'damage' | 'rpm' | 'rangeM' | 'name';
type ViewMode = 'cards' | 'table';

const COMPARE_COLORS = ['bg-tunisian-red', 'bg-tunisian-sand', 'bg-sky-400'];
const COMPARE_LIMIT = 3;

const COMPARE_STATS: Array<{ key: keyof Pick<Weapon, 'damage' | 'dps' | 'rpm' | 'rangeM' | 'magazine'>; label: string; suffix?: string }> = [
  { key: 'damage', label: 'ui.stat.damage' },
  { key: 'dps', label: 'ui.stat.dps' },
  { key: 'rpm', label: 'ui.stat.rpm' },
  { key: 'rangeM', label: 'ui.stat.range', suffix: ' m' },
  { key: 'magazine', label: 'ui.stat.magazine' },
];

export default function WeaponsPage() {
  const { t } = useTranslation();
  const { data, loading, error } = useData<Record<string, Weapon>>('weapons');
  const [searchParams] = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [family, setFamily] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('dps');
  const [sortDesc, setSortDesc] = useState(true);
  const [view, setView] = useState<ViewMode>('cards');
  const [compare, setCompare] = useState<string[]>([]);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) setQuery(q);
  }, [searchParams]);

  const weapons = useMemo(() => (data ? Object.values(data) : []), [data]);

  const families = useMemo(
    () => [...new Set(weapons.map((weapon) => weapon.family).filter((value): value is string => Boolean(value)))].sort(),
    [weapons]
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = weapons.filter((weapon) => {
      if (family !== 'all' && weapon.family !== family) return false;
      if (!needle) return true;
      return (
        weapon.name.toLowerCase().includes(needle) ||
        weapon.id.toLowerCase().includes(needle) ||
        (weapon.family ?? '').toLowerCase().includes(needle)
      );
    });

    return list.sort((a, b) => {
      if (sortKey === 'name') {
        const result = a.name.localeCompare(b.name);
        return sortDesc ? -result : result;
      }
      const left = a[sortKey] ?? -1;
      const right = b[sortKey] ?? -1;
      return sortDesc ? right - left : left - right;
    });
  }, [weapons, family, query, sortKey, sortDesc]);

  const maxByStat = useMemo(() => {
    const result: Record<string, number> = {};
    for (const stat of COMPARE_STATS) {
      result[stat.key] = Math.max(1, ...weapons.map((weapon) => weapon[stat.key] ?? 0));
    }
    return result;
  }, [weapons]);

  const selected = compare
    .map((id) => weapons.find((weapon) => weapon.id === id))
    .filter((weapon): weapon is Weapon => Boolean(weapon));

  const toggleCompare = (id: string) => {
    setCompare((current) => {
      if (current.includes(id)) return current.filter((value) => value !== id);
      if (current.length >= COMPARE_LIMIT) return current;
      return [...current, id];
    });
  };

  return (
    <div>
      <PageIntro
        title={t('page.weapons')}
        intro={t('ui.intro.weapons')}
        meta={t('ui.results', { count: filtered.length })}
      />

      <section className="mb-5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-wide text-white/45">
              {t('btn.search')}
            </span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('ui.search.placeholder')}
              className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-tunisian-red focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-wide text-white/45">
              {t('ui.filter.family')}
            </span>
            <select
              value={family}
              onChange={(event) => setFamily(event.target.value)}
              className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white focus:border-tunisian-red focus:outline-none"
            >
              <option value="all">{t('ui.filter.allFamilies')}</option>
              {families.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-wide text-white/45">
              {t('ui.sort.label')}
            </span>
            <select
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as SortKey)}
              className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white focus:border-tunisian-red focus:outline-none"
            >
              <option value="dps">{t('ui.sort.dps')}</option>
              <option value="damage">{t('ui.sort.damage')}</option>
              <option value="rpm">{t('ui.sort.rpm')}</option>
              <option value="rangeM">{t('ui.sort.range')}</option>
              <option value="name">{t('ui.sort.name')}</option>
            </select>
          </label>

          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => setSortDesc((value) => !value)}
              className="h-[38px] flex-1 rounded-lg border border-white/15 bg-black/40 px-3 text-sm text-white/75 transition-colors hover:border-white/30 hover:text-white"
              aria-label={t('ui.sort.direction')}
            >
              {sortDesc ? `↓ ${t('ui.sort.descending')}` : `↑ ${t('ui.sort.ascending')}`}
            </button>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setFamily('all');
                setSortKey('dps');
                setSortDesc(true);
              }}
              className="h-[38px] rounded-lg border border-white/10 px-3 text-sm text-white/50 transition-colors hover:border-white/25 hover:text-white"
            >
              {t('ui.filter.reset')}
            </button>
          </div>
        </div>
      </section>

      {compare.length > 0 && (
        <section className="mb-5 rounded-xl border border-tunisian-red/25 bg-tunisian-red/[0.04] p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-white">{t('ui.compare.title')}</h2>
              <p className="text-xs text-white/45">{t('ui.compare.hint')}</p>
            </div>
            <button
              type="button"
              onClick={() => setCompare([])}
              className="rounded border border-white/15 px-2 py-1 text-xs text-white/60 hover:border-white/30 hover:text-white"
            >
              {t('ui.compare.clear')}
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {selected.map((weapon, index) => (
              <div key={weapon.id} className="rounded-lg border border-white/10 bg-black/25 p-3">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-white">{weapon.name}</h3>
                    <p className="text-[11px] text-white/40">{weapon.family ?? '—'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleCompare(weapon.id)}
                    className="text-xs text-white/40 hover:text-tunisian-red"
                    aria-label={`${t('ui.compare.remove')} — ${weapon.name}`}
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-2">
                  {COMPARE_STATS.map((stat) => (
                    <StatBar
                      key={stat.key}
                      label={t(stat.label)}
                      value={weapon[stat.key]}
                      max={maxByStat[stat.key] ?? 1}
                      colorClass={COMPARE_COLORS[index % COMPARE_COLORS.length]}
                      suffix={stat.suffix}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          {compare.length >= COMPARE_LIMIT && <p className="mt-2 text-[11px] text-white/35">{t('ui.compare.limit')}</p>}
        </section>
      )}

      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-xs text-white/45">{t('ui.results', { count: filtered.length })}</p>
        <div className="flex rounded-lg border border-white/10 p-0.5" role="group" aria-label={t('ui.view.label')}>
          {(['cards', 'table'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setView(mode)}
              aria-pressed={view === mode}
              className={`rounded px-3 py-1 text-xs transition-colors ${
                view === mode ? 'bg-white/10 text-white' : 'text-white/45 hover:text-white'
              }`}
            >
              {mode === 'cards' ? t('ui.view.cards') : t('ui.view.table')}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="py-12 text-center text-sm text-white/50">{t('loading.loading')}</p>}
      {error && <p className="py-12 text-center text-sm text-tunisian-red">{t('error.loadFailed')}</p>}

      {!loading && !error && filtered.length === 0 && (
        <p className="py-12 text-center text-sm text-white/50">{t('empty.noResults')}</p>
      )}

      {!loading && !error && filtered.length > 0 && view === 'cards' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((weapon) => (
            <WeaponCard
              key={weapon.id}
              weapon={weapon}
              selected={compare.includes(weapon.id)}
              disabled={compare.length >= COMPARE_LIMIT}
              onToggleCompare={toggleCompare}
            />
          ))}
        </div>
      )}

      {!loading && !error && filtered.length > 0 && view === 'table' && (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[760px] text-start text-sm">
            <thead className="bg-white/[0.05] text-[11px] uppercase tracking-wide text-white/45">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">{t('ui.table.weapon')}</th>
                <th scope="col" className="px-3 py-2 font-medium">{t('ui.stat.family')}</th>
                <th scope="col" className="px-3 py-2 text-end font-medium">{t('ui.stat.damage')}</th>
                <th scope="col" className="px-3 py-2 text-end font-medium">{t('ui.stat.headshot')}</th>
                <th scope="col" className="px-3 py-2 text-end font-medium">{t('ui.stat.rpm')}</th>
                <th scope="col" className="px-3 py-2 text-end font-medium">{t('ui.stat.magazine')}</th>
                <th scope="col" className="px-3 py-2 text-end font-medium">{t('ui.stat.range')}</th>
                <th scope="col" className="px-3 py-2 text-end font-medium">{t('ui.stat.dps')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((weapon) => (
                <tr key={weapon.id} className="hover:bg-white/[0.03]">
                  <th scope="row" className="px-3 py-2 text-start font-medium text-white">
                    {weapon.name}
                    {weapon.mk !== null && <span className="ms-2 text-[10px] text-white/35">Mk {weapon.mk}</span>}
                  </th>
                  <td className="px-3 py-2 text-white/60">{weapon.family ?? '—'}</td>
                  <td className="px-3 py-2 text-end text-white/80">{weapon.damage ?? '—'}</td>
                  <td className="px-3 py-2 text-end text-white/80">{weapon.headshot ?? '—'}</td>
                  <td className="px-3 py-2 text-end text-white/80">{weapon.rpm ?? '—'}</td>
                  <td className="px-3 py-2 text-end text-white/80">{weapon.magazine ?? '—'}</td>
                  <td className="px-3 py-2 text-end text-white/80">
                    {weapon.rangeM === null ? '—' : `${weapon.rangeM} m`}
                  </td>
                  <td className="px-3 py-2 text-end font-semibold text-tunisian-sand">{weapon.dps ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
