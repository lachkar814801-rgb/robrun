import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ItemCard from '@/components/ItemCard';
import PageIntro from '@/components/PageIntro';
import { useData } from '@/hooks/useData';
import { localizedLabel, rarityRank, toLang } from '@/lib/data';
import type { Item, Rarity } from '@/lib/data';

type SortKey = 'name' | 'priceAsc' | 'priceDesc' | 'rarity';

const PAGE_SIZE = 48;
const RARITIES: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'exotic'];

export default function ItemsPage() {
  const { t, i18n } = useTranslation();
  const lang = toLang(i18n.language);
  const { data, loading, error } = useData<Record<string, Item>>('items');
  const [searchParams] = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [category, setCategory] = useState('all');
  const [rarity, setRarity] = useState('all');
  const [tradableOnly, setTradableOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) setQuery(q);
  }, [searchParams]);

  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [query, category, rarity, tradableOnly, sortKey]);

  const items = useMemo(() => (data ? Object.values(data) : []), [data]);

  const categories = useMemo(
    () =>
      [...new Set(items.map((item) => item.category).filter((value): value is string => Boolean(value)))]
        .map((value) => ({ value, label: localizedLabel(t, 'category', value) }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [items, t]
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = items.filter((item) => {
      if (category !== 'all' && item.category !== category) return false;
      if (rarity !== 'all' && item.rarity !== rarity) return false;
      if (tradableOnly && !item.tradable) return false;
      if (!needle) return true;
      return (
        item.name.toLowerCase().includes(needle) ||
        item.id.toLowerCase().includes(needle) ||
        (item.category ?? '').toLowerCase().includes(needle)
      );
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
  }, [items, query, category, rarity, tradableOnly, sortKey]);

  const shown = filtered.slice(0, visible);

  return (
    <div>
      <PageIntro
        title={t('page.items')}
        intro={t('ui.intro.items')}
        meta={t('ui.results', { count: filtered.length })}
      />

      <section className="mb-5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
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
              {t('ui.filter.category')}
            </span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white focus:border-tunisian-red focus:outline-none"
            >
              <option value="all">{t('ui.filter.allCategories')}</option>
              {categories.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </select>
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
              {t('ui.filter.tradable')}
            </label>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setCategory('all');
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
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {shown.map((item) => (
              <ItemCard key={item.id} item={item} lang={lang} />
            ))}
          </div>

          {visible < filtered.length && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setVisible((value) => value + PAGE_SIZE)}
                className="rounded-lg border border-white/15 bg-white/[0.04] px-5 py-2 text-sm text-white/80 transition-colors hover:border-tunisian-sand/50 hover:text-white"
              >
                {t('ui.loadMore')} ({shown.length}/{filtered.length})
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
