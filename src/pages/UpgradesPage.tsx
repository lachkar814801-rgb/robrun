import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ItemCard from '@/components/ItemCard';
import PageIntro from '@/components/PageIntro';
import { useData } from '@/hooks/useData';
import { rarityRank, toLang } from '@/lib/data';
import type { Item, Rarity } from '@/lib/data';

type SortKey = 'name' | 'priceAsc' | 'priceDesc' | 'rarity';
type TabKey = 'all' | 'vehicle' | 'workbench';

const RARITIES: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'exotic'];

const TABS: Array<{ key: TabKey; categories: string[] | null }> = [
  { key: 'all', categories: null },
  { key: 'vehicle', categories: ['vehicle_upgrades'] },
  { key: 'workbench', categories: ['workbenches_upgrades'] },
];

const TAB_LABEL: Record<TabKey, string> = {
  all: 'ui.upgrades.tab.all',
  vehicle: 'ui.upgrades.tab.vehicle',
  workbench: 'ui.upgrades.tab.workbench',
};

export default function UpgradesPage() {
  const { t, i18n } = useTranslation();
  const lang = toLang(i18n.language);
  const { data, loading, error } = useData<Record<string, Item>>('items');

  const [tab, setTab] = useState<TabKey>('all');
  const [query, setQuery] = useState('');
  const [rarity, setRarity] = useState('all');
  const [tradableOnly, setTradableOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('name');

  const upgrades = useMemo(() => {
    if (!data) return [];
    const allowed = new Set(['vehicle_upgrades', 'workbenches_upgrades']);
    return Object.values(data).filter((item) => item.category && allowed.has(item.category));
  }, [data]);

  const activeCategories = useMemo(
    () => TABS.find((entry) => entry.key === tab)?.categories ?? null,
    [tab]
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = upgrades.filter((item) => {
      if (activeCategories && (!item.category || !activeCategories.includes(item.category))) return false;
      if (rarity !== 'all' && item.rarity !== rarity) return false;
      if (tradableOnly && !item.tradable) return false;
      if (!needle) return true;
      return item.name.toLowerCase().includes(needle) || item.id.toLowerCase().includes(needle);
    });

    return list.sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name);
      if (sortKey === 'rarity') {
        const diff = rarityRank(b.rarity) - rarityRank(a.rarity);
        return diff !== 0 ? diff : a.name.localeCompare(b.name);
      }
      const left = a.priceMin ?? a.priceMax;
      const right = b.priceMin ?? b.priceMax;
      if (left === null && right === null) return a.name.localeCompare(b.name);
      if (left === null) return 1;
      if (right === null) return -1;
      return sortKey === 'priceAsc' ? left - right : right - left;
    });
  }, [upgrades, activeCategories, query, rarity, tradableOnly, sortKey]);

  const countFor = (categories: string[] | null): number =>
    categories ? upgrades.filter((item) => item.category && categories.includes(item.category)).length : upgrades.length;

  return (
    <div>
      <PageIntro
        title={t('page.upgrades')}
        intro={t('ui.intro.upgrades')}
        meta={t('ui.results', { count: filtered.length })}
      />

      <div className="mb-5 space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs text-white/55">
        <p>{t('ui.price.usdNote')}</p>
        <p className="text-white/40">{t('ui.upgrades.note')}</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label={t('page.upgrades')}>
        {TABS.map((entry) => {
          const active = tab === entry.key;
          return (
            <button
              key={entry.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(entry.key)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? 'border-tunisian-red/60 bg-tunisian-red/15 text-white'
                  : 'border-white/10 text-white/60 hover:border-white/25 hover:text-white'
              }`}
            >
              {t(TAB_LABEL[entry.key])}
              <span className="ms-2 text-white/40">{countFor(entry.categories)}</span>
            </button>
          );
        })}
      </div>

      <section className="mb-5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <label className="block lg:col-span-2">
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
              {t('ui.filter.rarity')}
            </span>
            <select
              value={rarity}
              onChange={(event) => setRarity(event.target.value)}
              className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white focus:border-tunisian-red focus:outline-none"
            >
              <option value="all">{t('ui.filter.allRarities')}</option>
              {RARITIES.map((value) => (
                <option key={value} value={value}>
                  {t(`rarity.${value}`)}
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
              <option value="name">{t('ui.sort.name')}</option>
              <option value="priceAsc">{t('ui.sort.priceAsc')}</option>
              <option value="priceDesc">{t('ui.sort.priceDesc')}</option>
              <option value="rarity">{t('ui.sort.rarity')}</option>
            </select>
          </label>

          <div className="flex items-end gap-2">
            <label className="flex h-[38px] flex-1 cursor-pointer items-center gap-2 rounded-lg border border-white/15 bg-black/40 px-3 text-sm text-white/70">
              <input
                type="checkbox"
                checked={tradableOnly}
                onChange={(event) => setTradableOnly(event.target.checked)}
                className="h-3.5 w-3.5 accent-[#E70013]"
              />
              <span className="truncate text-xs">{t('ui.filter.tradable')}</span>
            </label>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setRarity('all');
                setTradableOnly(false);
                setSortKey('name');
              }}
              className="h-[38px] rounded-lg border border-white/10 px-3 text-sm text-white/50 transition-colors hover:border-white/25 hover:text-white"
            >
              {t('ui.filter.reset')}
            </button>
          </div>
        </div>
      </section>

      {loading && <p className="py-12 text-center text-sm text-white/50">{t('loading.loading')}</p>}
      {error && <p className="py-12 text-center text-sm text-tunisian-red">{t('error.loadFailed')}</p>}

      {!loading && !error && filtered.length === 0 && (
        <p className="py-12 text-center text-sm text-white/50">{t('empty.noResults')}</p>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => (
            <ItemCard key={item.id} item={item} lang={lang} />
          ))}
        </div>
      )}
    </div>
  );
}
