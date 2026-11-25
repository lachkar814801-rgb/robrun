import Fuse from 'fuse.js';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ImageWithFallback from '@/components/ImageWithFallback';
import PageIntro from '@/components/PageIntro';
import PriceTag from '@/components/PriceTag';
import RarityBadge from '@/components/RarityBadge';
import { useData } from '@/hooks/useData';
import { localizedLabel, toLang } from '@/lib/data';
import type { Item, MapPoint, Weapon } from '@/lib/data';

type Kind = 'weapon' | 'item' | 'mapPoint';

interface Entry {
  key: string;
  kind: Kind;
  name: string;
  search: string;
  weapon?: Weapon;
  item?: Item;
  point?: MapPoint;
}

const PAGE_SIZE = 50;

const KIND_LABEL: Record<Kind, string> = {
  weapon: 'ui.type.weapon',
  item: 'ui.type.item',
  mapPoint: 'ui.type.mapPoint',
};

const KIND_STYLE: Record<Kind, string> = {
  weapon: 'border-tunisian-red/40 bg-tunisian-red/10 text-rose-100',
  item: 'border-tunisian-sand/40 bg-tunisian-sand/10 text-amber-100',
  mapPoint: 'border-sky-400/40 bg-sky-400/10 text-sky-100',
};

export default function DatabasePage() {
  const { t, i18n } = useTranslation();
  const lang = toLang(i18n.language);

  const weaponsState = useData<Record<string, Weapon>>('weapons');
  const itemsState = useData<Record<string, Item>>('items');
  const pointsState = useData<Record<string, MapPoint>>('mapPoints');

  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<'all' | Kind>('all');
  const [sortKey, setSortKey] = useState<'name' | 'kind'>('name');
  const [visible, setVisible] = useState(PAGE_SIZE);

  const entries = useMemo(() => {
    const result: Entry[] = [];

    for (const weapon of Object.values(weaponsState.data ?? {})) {
      result.push({
        key: `weapon:${weapon.id}`,
        kind: 'weapon',
        name: weapon.name,
        search: `${weapon.name} ${weapon.id} ${weapon.family ?? ''} ${weapon.type ?? ''}`,
        weapon,
      });
    }

    for (const item of Object.values(itemsState.data ?? {})) {
      result.push({
        key: `item:${item.id}`,
        kind: 'item',
        name: item.name,
        search: `${item.name} ${item.id} ${item.category ?? ''} ${item.rarity ?? ''}`,
        item,
      });
    }

    for (const point of Object.values(pointsState.data ?? {})) {
      result.push({
        key: `point:${point.id}`,
        kind: 'mapPoint',
        name: point.id,
        search: `${point.id} ${point.type ?? ''} ${point.district ?? ''} ${point.building ?? ''}`,
        point,
      });
    }

    return result;
  }, [weaponsState.data, itemsState.data, pointsState.data]);

  const fuse = useMemo(
    () =>
      new Fuse(entries, {
        keys: ['name', 'search'],
        threshold: 0.35,
        ignoreLocation: true,
        minMatchCharLength: 2,
      }),
    [entries]
  );

  const counts = useMemo(() => {
    const base: Record<'all' | Kind, number> = { all: entries.length, weapon: 0, item: 0, mapPoint: 0 };
    for (const entry of entries) base[entry.kind] += 1;
    return base;
  }, [entries]);

  const filtered = useMemo(() => {
    const needle = query.trim();
    const matched = needle ? fuse.search(needle).map((result) => result.item) : entries;
    const list = kind === 'all' ? matched : matched.filter((entry) => entry.kind === kind);
    if (needle) return list;

    return [...list].sort((a, b) => {
      if (sortKey === 'kind' && a.kind !== b.kind) return a.kind.localeCompare(b.kind);
      return a.name.localeCompare(b.name);
    });
  }, [entries, fuse, query, kind, sortKey]);

  const shown = filtered.slice(0, visible);
  const loading = weaponsState.loading || itemsState.loading || pointsState.loading;
  const error = weaponsState.error ?? itemsState.error ?? pointsState.error;

  return (
    <div>
      <PageIntro
        title={t('page.database')}
        intro={t('ui.intro.database')}
        meta={t('ui.results', { count: filtered.length })}
      />

      <section className="mb-5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <label className="block lg:col-span-2">
            <span className="mb-1 block text-[11px] uppercase tracking-wide text-white/45">
              {t('btn.search')}
            </span>
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setVisible(PAGE_SIZE);
              }}
              placeholder={t('ui.search.placeholder')}
              className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-tunisian-red focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-wide text-white/45">
              {t('ui.filter.type')}
            </span>
            <select
              value={kind}
              onChange={(event) => {
                setKind(event.target.value as 'all' | Kind);
                setVisible(PAGE_SIZE);
              }}
              className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white focus:border-tunisian-red focus:outline-none"
            >
              <option value="all">{t('ui.filter.allTypes')}</option>
              <option value="weapon">{t('ui.type.weapon')}</option>
              <option value="item">{t('ui.type.item')}</option>
              <option value="mapPoint">{t('ui.type.mapPoint')}</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-wide text-white/45">
              {t('ui.sort.label')}
            </span>
            <select
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as 'name' | 'kind')}
              className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white focus:border-tunisian-red focus:outline-none"
            >
              <option value="name">{t('ui.sort.name')}</option>
              <option value="kind">{t('ui.filter.type')}</option>
            </select>
          </label>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {(['all', 'weapon', 'item', 'mapPoint'] as const).map((value) => {
            const active = kind === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setKind(value);
                  setVisible(PAGE_SIZE);
                }}
                aria-pressed={active}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  active
                    ? 'border-tunisian-red/60 bg-tunisian-red/15 text-white'
                    : 'border-white/10 text-white/55 hover:border-white/25 hover:text-white'
                }`}
              >
                {value === 'all' ? t('ui.filter.allTypes') : t(KIND_LABEL[value])}
                <span className="ms-2 text-white/40">{counts[value]}</span>
              </button>
            );
          })}
        </div>
      </section>

      {loading && <p className="py-12 text-center text-sm text-white/50">{t('loading.loading')}</p>}
      {error && <p className="py-12 text-center text-sm text-tunisian-red">{t('error.loadFailed')}</p>}

      {!loading && !error && filtered.length === 0 && (
        <p className="py-12 text-center text-sm text-white/50">{t('empty.noResults')}</p>
      )}

      {!loading && !error && filtered.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[820px] text-start text-sm">
              <thead className="bg-white/[0.05] text-[11px] uppercase tracking-wide text-white/45">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">{t('ui.table.type')}</th>
                  <th scope="col" className="px-3 py-2 font-medium">{t('ui.table.name')}</th>
                  <th scope="col" className="px-3 py-2 font-medium">{t('ui.table.place')}</th>
                  <th scope="col" className="px-3 py-2 font-medium">{t('ui.table.detail')}</th>
                  <th scope="col" className="px-3 py-2 text-end font-medium">{t('ui.table.value')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {shown.map((entry) => (
                  <tr key={entry.key} className="hover:bg-white/[0.03]">
                    <td className="px-3 py-2 align-middle">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${KIND_STYLE[entry.kind]}`}
                      >
                        {t(KIND_LABEL[entry.kind])}
                      </span>
                    </td>

                    <td className="px-3 py-2 align-middle">
                      <div className="flex items-center gap-2">
                        {(entry.weapon?.image || entry.item?.image) ? (
                          <ImageWithFallback
                            src={entry.weapon?.image ?? entry.item?.image ?? null}
                            alt={entry.name}
                            wrapperClassName="h-9 w-9 shrink-0 overflow-hidden rounded bg-black/40"
                            imgClassName="h-full w-full object-contain p-1"
                          />
                        ) : entry.weapon || entry.item ? (
                          <span
                            role="img"
                            aria-label={t('ui.image.pending')}
                            className="inline-block h-9 w-9 shrink-0 rounded border border-dashed border-white/15 bg-white/[0.02]"
                          />
                        ) : null}
                        <div className="min-w-0">
                          <p className="truncate font-medium text-white">{entry.name}</p>
                          <p className="truncate text-[10px] text-white/35">{entry.key.replace(':', ' · ')}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-2 align-middle text-white/65">
                      {entry.weapon
                        ? entry.weapon.family ?? '—'
                        : entry.item
                          ? localizedLabel(t, 'category', entry.item.category)
                          : localizedLabel(t, 'district', entry.point?.district ?? null)}
                    </td>

                    <td className="px-3 py-2 align-middle">
                      {entry.item ? (
                        <RarityBadge rarity={entry.item.rarity} />
                      ) : entry.point ? (
                        <span className="text-white/65">
                          {entry.point.building
                            ? localizedLabel(t, 'building', entry.point.building)
                            : t('ui.notAvailable')}
                        </span>
                      ) : (
                        <span className="text-white/35">—</span>
                      )}
                    </td>

                    <td className="px-3 py-2 text-end align-middle">
                      {entry.weapon ? (
                        <span className="text-white/80">
                          {entry.weapon.dps === null ? '—' : `${entry.weapon.dps} ${t('ui.stat.dps')}`}
                        </span>
                      ) : entry.item ? (
                        <PriceTag
                          min={entry.item.priceMin}
                          max={entry.item.priceMax}
                          lang={lang}
                          className="font-semibold text-tunisian-sand"
                        />
                      ) : (
                        <span className="text-white/65">
                          {localizedLabel(t, 'map_type', entry.point?.type ?? null)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-white/45">
            <span>{t('ui.results', { count: filtered.length })}</span>
            {visible < filtered.length && (
              <button
                type="button"
                onClick={() => setVisible((value) => value + PAGE_SIZE)}
                className="rounded-lg border border-white/15 bg-white/[0.04] px-4 py-1.5 text-white/80 transition-colors hover:border-tunisian-sand/50 hover:text-white"
              >
                {t('ui.loadMore')} ({shown.length}/{filtered.length})
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
