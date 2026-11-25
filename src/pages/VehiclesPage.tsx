import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ItemCard from '@/components/ItemCard';
import PageIntro from '@/components/PageIntro';
import { useData } from '@/hooks/useData';
import { rarityRank, toLang } from '@/lib/data';
import type { Item, Rarity } from '@/lib/data';

type SortKey = 'name' | 'priceAsc' | 'priceDesc' | 'rarity';

const RARITIES: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'exotic'];

export default function VehiclesPage() {
  const { t, i18n } = useTranslation();
  const lang = toLang(i18n.language);
  const { data, loading, error } = useData<Record<string, Item>>('items');

  const [query, setQuery] = useState('');
  const [rarity, setRarity] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('name');

  const vehicles = useMemo(
    () => (data ? Object.values(data).filter((item) => item.category === 'vehicles') : []),
    [data]
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = vehicles.filter((item) => {
      if (rarity !== 'all' && item.rarity !== rarity) return false;
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
  }, [vehicles, query, rarity, sortKey]);

  return (
    <div>
      <PageIntro
        title={t('page.vehicles')}
        intro={t('ui.intro.vehicles')}
        meta={t('ui.results', { count: filtered.length })}
      />

      <div className="mb-5 space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs text-white/55">
        <p>{t('ui.price.usdNote')}</p>
        <p className="text-white/40">{t('ui.vehicles.note')}</p>
      </div>

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

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setRarity('all');
                setSortKey('name');
              }}
              className="h-[38px] w-full rounded-lg border border-white/10 px-3 text-sm text-white/50 transition-colors hover:border-white/25 hover:text-white"
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
            <ItemCard key={item.id} item={item} lang={lang} showCategory={false} />
          ))}
        </div>
      )}
    </div>
  );
}
