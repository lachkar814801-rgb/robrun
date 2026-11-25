import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import MapCanvas from '@/components/MapCanvas';
import PageIntro from '@/components/PageIntro';
import { useData } from '@/hooks/useData';
import { localizedLabel } from '@/lib/data';
import type { GameMap, MapPin, MapPoint } from '@/lib/data';

const PAGE_SIZE = 50;

export default function MapPage() {
  const { t } = useTranslation();
  const { data: pointsData, loading, error } = useData<Record<string, MapPoint>>('mapPoints');
  const { data: gameMap, loading: mapLoading, error: mapError } = useData<GameMap>('map');

  const [query, setQuery] = useState('');
  const [district, setDistrict] = useState('all');
  const [type, setType] = useState('all');
  const [lootOnly, setLootOnly] = useState(false);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const [activeTypes, setActiveTypes] = useState<string[]>([]);
  const [focusPinId, setFocusPinId] = useState<string | null>(null);

  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [query, district, type, lootOnly]);

  const points = useMemo(() => (pointsData ? Object.values(pointsData) : []), [pointsData]);

  const districts = useMemo(
    () =>
      [...new Set(points.map((point) => point.district).filter((value): value is string => Boolean(value)))]
        .map((value) => ({ value, label: localizedLabel(t, 'district', value) }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [points, t]
  );

  const pointTypes = useMemo(
    () =>
      [...new Set(points.map((point) => point.type).filter((value): value is string => Boolean(value)))]
        .map((value) => ({ value, label: localizedLabel(t, 'map_type', value) }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [points, t]
  );

  const pinTypes = useMemo(() => {
    if (!gameMap) return [];
    return [...new Set(gameMap.pins.map((pin) => pin.type))];
  }, [gameMap]);

  useEffect(() => {
    setActiveTypes(pinTypes);
  }, [pinTypes]);

  const filteredPoints = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return points
      .filter((point) => {
        if (district !== 'all' && point.district !== district) return false;
        if (type !== 'all' && point.type !== type) return false;
        if (lootOnly && !point.hasLoot) return false;
        if (!needle) return true;
        return (
          point.id.toLowerCase().includes(needle) ||
          (point.building ?? '').toLowerCase().includes(needle) ||
          (point.type ?? '').toLowerCase().includes(needle)
        );
      })
      .sort((a, b) => {
        const byDistrict = (a.district ?? '').localeCompare(b.district ?? '');
        if (byDistrict !== 0) return byDistrict;
        const byBuilding = (a.building ?? '').localeCompare(b.building ?? '');
        if (byBuilding !== 0) return byBuilding;
        return a.id.localeCompare(b.id);
      });
  }, [points, query, district, type, lootOnly]);

  const shownPoints = filteredPoints.slice(0, visible);

  const visiblePins = useMemo(
    () => (gameMap ? gameMap.pins.filter((pin) => activeTypes.includes(pin.type)) : []),
    [gameMap, activeTypes]
  );

  const labelFor = useCallback((pin: MapPin) => localizedLabel(t, 'pin', pin.type), [t]);
  const handleFocusHandled = useCallback(() => setFocusPinId(null), []);

  const toggleType = (value: string) => {
    setActiveTypes((current) =>
      current.includes(value) ? current.filter((entry) => entry !== value) : [...current, value]
    );
  };

  return (
    <div>
      <PageIntro
        title={t('page.map')}
        intro={t('ui.map.intro')}
        meta={
          gameMap ? (
            <span className="flex flex-wrap gap-x-3 gap-y-1">
              <span>{t('ui.map.markerCount', { count: gameMap.pins.length })}</span>
              <span aria-hidden>·</span>
              <span>{t('ui.results', { count: points.length })}</span>
            </span>
          ) : null
        }
      />

      <p className="mb-6 rounded-xl border border-tunisian-sand/25 bg-tunisian-sand/[0.07] px-4 py-3 text-sm leading-relaxed text-tunisian-sand">
        {t('ui.map.note')}
      </p>

      <section className="mb-10" aria-labelledby="map-layer-title">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="map-layer-title" className="text-lg font-semibold text-white">
            {t('ui.map.layer.title')}
          </h2>
          <span className="text-sm text-white/50">
            {t('ui.map.markerCount', { count: visiblePins.length })}
          </span>
        </div>

        {mapError && <p className="py-8 text-center text-sm text-tunisian-red">{t('error.loadFailed')}</p>}
        {mapLoading && !gameMap && (
          <p className="py-8 text-center text-sm text-white/50">{t('loading.loading')}</p>
        )}

        {gameMap && (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
            <MapCanvas
              gameMap={gameMap}
              pins={visiblePins}
              focusPinId={focusPinId}
              onFocusHandled={handleFocusHandled}
              labelFor={labelFor}
              attribution={t('ui.map.attribution')}
              imageAlt={t('ui.map.imageAlt')}
            />

            <aside className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-white/45">
                {t('ui.map.legend')}
              </h3>

              <ul className="space-y-2">
                {pinTypes.map((pinType) => {
                  const count = gameMap.pins.filter((pin) => pin.type === pinType).length;
                  const checked = activeTypes.includes(pinType);
                  return (
                    <li key={pinType}>
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-white/75">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleType(pinType)}
                          className="h-3.5 w-3.5 accent-[#E70013]"
                        />
                        <span className={`robrun-pin robrun-pin--${pinType}`} aria-hidden="true">
                          <span className="robrun-pin__dot" />
                        </span>
                        <span>{t(`pin.${pinType}`)}</span>
                        <span className="ms-auto text-xs text-white/40">{count}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>

              <p className="mt-3 border-t border-white/10 pt-3 text-xs leading-relaxed text-white/45">
                {t('ui.map.pinsNote')}
              </p>

              <div className="mt-3 max-h-40 space-y-1 overflow-y-auto pe-1">
                {visiblePins.map((pin) => (
                  <button
                    key={pin.id}
                    type="button"
                    onClick={() => setFocusPinId(pin.id)}
                    title={t('ui.map.focus')}
                    className="flex w-full items-center gap-2 rounded px-1.5 py-1 text-start text-xs text-white/60 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    <span className={`robrun-pin robrun-pin--${pin.type}`} aria-hidden="true">
                      <span className="robrun-pin__dot" />
                    </span>
                    <span className="truncate">{t(`pin.${pin.type}`)}</span>
                    <span dir="ltr" className="ms-auto shrink-0 font-mono text-[10px] text-white/35">
                      {pin.x.toFixed(1)} · {pin.y.toFixed(1)}
                    </span>
                  </button>
                ))}
              </div>
            </aside>
          </div>
        )}
      </section>

      <section aria-labelledby="map-points-title">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="map-points-title" className="text-lg font-semibold text-white">
            {t('ui.map.list.title')}
          </h2>
          <span className="text-sm text-white/50">{t('ui.results', { count: filteredPoints.length })}</span>
        </div>

        <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
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
                {t('ui.map.filter.district')}
              </span>
              <select
                value={district}
                onChange={(event) => setDistrict(event.target.value)}
                className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white focus:border-tunisian-red focus:outline-none"
              >
                <option value="all">{t('ui.map.filter.allDistricts')}</option>
                {districts.map((entry) => (
                  <option key={entry.value} value={entry.value}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-[11px] uppercase tracking-wide text-white/45">
                {t('ui.filter.type')}
              </span>
              <select
                value={type}
                onChange={(event) => setType(event.target.value)}
                className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white focus:border-tunisian-red focus:outline-none"
              >
                <option value="all">{t('ui.filter.allTypes')}</option>
                {pointTypes.map((entry) => (
                  <option key={entry.value} value={entry.value}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-end gap-2">
              <label className="flex h-[38px] flex-1 cursor-pointer items-center gap-2 rounded-lg border border-white/15 bg-black/40 px-3 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={lootOnly}
                  onChange={(event) => setLootOnly(event.target.checked)}
                  className="h-3.5 w-3.5 accent-[#E70013]"
                />
                {t('ui.map.filter.loot')}
              </label>
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setDistrict('all');
                  setType('all');
                  setLootOnly(false);
                }}
                className="h-[38px] rounded-lg border border-white/10 px-3 text-sm text-white/50 transition-colors hover:border-white/25 hover:text-white"
              >
                {t('ui.filter.reset')}
              </button>
            </div>
          </div>
        </div>

        {loading && <p className="py-12 text-center text-sm text-white/50">{t('loading.loading')}</p>}
        {error && <p className="py-12 text-center text-sm text-tunisian-red">{t('error.loadFailed')}</p>}

        {!loading && !error && filteredPoints.length === 0 && (
          <p className="py-12 text-center text-sm text-white/50">{t('empty.noResults')}</p>
        )}

        {!loading && !error && filteredPoints.length > 0 && (
          <>
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full min-w-[720px] text-start text-sm">
                <thead className="bg-white/[0.05] text-[11px] uppercase tracking-wide text-white/45">
                  <tr>
                    <th className="px-3 py-2 text-start font-medium">{t('ui.map.column.type')}</th>
                    <th className="px-3 py-2 text-start font-medium">{t('ui.map.column.district')}</th>
                    <th className="px-3 py-2 text-start font-medium">{t('ui.map.column.building')}</th>
                    <th className="px-3 py-2 text-start font-medium">{t('ui.map.column.loot')}</th>
                    <th className="px-3 py-2 text-start font-medium">{t('ui.map.column.coords')}</th>
                    <th className="px-3 py-2 text-start font-medium">{t('ui.map.column.id')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {shownPoints.map((point) => (
                    <tr key={point.id} className="transition-colors hover:bg-white/[0.03]">
                      <td className="px-3 py-2 text-white/80">
                        {localizedLabel(t, 'map_type', point.type)}
                      </td>
                      <td className="px-3 py-2 text-white/60">
                        {localizedLabel(t, 'district', point.district)}
                      </td>
                      <td className="px-3 py-2 text-white/60">
                        {localizedLabel(t, 'building', point.building)}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={
                            point.hasLoot
                              ? 'rounded border border-tunisian-sand/30 bg-tunisian-sand/10 px-1.5 py-0.5 text-xs text-tunisian-sand'
                              : 'text-xs text-white/35'
                          }
                        >
                          {point.hasLoot ? t('ui.map.loot.yes') : t('ui.map.loot.no')}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-white/60">
                        {point.x !== null && point.y !== null ? (
                          <span dir="ltr" className="font-mono text-xs">
                            {point.x.toFixed(2)} · {point.y.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-xs text-white/35">{t('ui.map.coords.none')}</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span dir="ltr" className="font-mono text-[11px] text-white/35">
                          {point.id}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {visible < filteredPoints.length && (
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setVisible((value) => value + PAGE_SIZE)}
                  className="rounded-lg border border-white/15 bg-white/[0.04] px-5 py-2 text-sm text-white/80 transition-colors hover:border-tunisian-sand/50 hover:text-white"
                >
                  {t('ui.loadMore')} ({shownPoints.length}/{filteredPoints.length})
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
