export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'exotic';

export type Lang = 'en' | 'fr' | 'ar';

export interface Weapon {
  id: string;
  family: string | null;
  mk: number | null;
  name: string;
  damage: number | null;
  headshot: number | null;
  rpm: number | null;
  magazine: number | null;
  rangeM: number | null;
  dps: number | null;
  type: string | null;
  image: string | null;
}

export interface Item {
  id: string;
  name: string;
  category: string | null;
  rarity: Rarity | null;
  priceMin: number | null;
  priceMax: number | null;
  tradable: boolean;
  image: string | null;
}

export interface MapPoint {
  id: string;
  type: string | null;
  label: string;
  district: string | null;
  building: string | null;
  x: number | null;
  y: number | null;
  lootRefs: string[] | null;
  image: string | null;
}

export type DataFile = 'weapons' | 'items' | 'mapPoints';

const cache = new Map<string, Promise<unknown>>();

/** Charge un JSON public une seule fois et le met en cache pour la session. */
export function loadData<T>(file: DataFile): Promise<T> {
  const url = `/data/${file}.json`;
  if (!cache.has(url)) {
    cache.set(
      url,
      fetch(url).then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status} — ${url}`);
        return response.json() as Promise<T>;
      })
    );
  }
  return cache.get(url) as Promise<T>;
}

export function toLang(language: string): Lang {
  return language === 'en' || language === 'ar' ? language : 'fr';
}

export function localizedLabel(t: (key: string) => string, prefix: string, value: string | null): string {
  if (!value) return '—';
  const key = `${prefix}.${value}`;
  const translated = t(key);
  return translated === key ? value : translated;
}

/** Transforme un type d'arme (« Submachine Gun ») en clé de glossaire. */
export function weaponTypeKey(type: string | null): string | null {
  if (!type) return null;
  const slug = type
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return slug ? `weapon_type.${slug}` : null;
}

export function rarityRank(rarity: Rarity | null): number {
  const order: Record<Rarity, number> = {
    common: 0,
    uncommon: 1,
    rare: 2,
    epic: 3,
    legendary: 4,
    exotic: 5,
  };
  return rarity ? order[rarity] : -1;
}
