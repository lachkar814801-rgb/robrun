import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

function readCsv(relativePath: string): string[][] {
  const content = fs.readFileSync(path.join(ROOT, relativePath), 'utf-8');
  const lines = content.trim().split('\n');
  return lines.map((line) => line.split(','));
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf-8'));
}

function writeJson(relativePath: string, data: unknown): void {
  const dir = path.dirname(path.join(ROOT, relativePath));
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(path.join(ROOT, relativePath), JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function parseMk(nameEn: string): number | null {
  const m = nameEn.match(/Mk(\d)/i);
  return m ? parseInt(m[1], 10) : null;
}

function parseFamily(nameEn: string): string | null {
  const m = nameEn.match(/^(.+?)\s+Mk\d/i);
  return m ? m[1].trim() : null;
}

function main() {
  const keyMap = readJson<{
    categories: Record<string, string>;
    rarities: Record<string, string>;
    districts: Record<string, string>;
    buildings: Record<string, string>;
    map_types: Record<string, string>;
  }>('data/key-map.json');

  // Charger everygamestat items.json pour le type d'arme
  let egItems: Record<string, { t?: string }> = {};
  try {
    const eg = readJson<{ items: Array<{ id: string; t?: string }> }>(
      'data/recon/_items.json'
    );
    for (const it of eg.items) {
      egItems[it.id] = it;
    }
  } catch {
    console.warn('every gamestat items.json non trouvé, type d\'arme = null partout');
  }

  // ---------- WEAPONS ----------
  const weaponRows = readCsv('data/raw/weapons.csv');
  const weaponHeader = weaponRows[0];
  const weapons: Record<string, unknown> = {};
  let weaponFamilies = new Set<string>();

  for (let i = 1; i < weaponRows.length; i++) {
    const row = weaponRows[i];
    if (row.length < 11) continue;
    const [
      id,
      nameRu,
      nameEn,
      damage,
      headshotDamage,
      rpm,
      magazine,
      fullDamageRangeM,
      damagePerSecond,
      url,
      source,
    ] = row;

    const mk = parseMk(nameEn);
    const family = parseFamily(nameEn);
    if (family) weaponFamilies.add(family);

    const dps = Math.round((parseFloat(damage) * parseFloat(rpm)) / 60);

    weapons[id] = {
      id,
      family,
      mk,
      name: nameEn,
      damage: parseInt(damage, 10) || null,
      headshot: parseInt(headshotDamage, 10) || null,
      rpm: parseInt(rpm, 10) || null,
      magazine: parseInt(magazine, 10) || null,
      rangeM: parseFloat(fullDamageRangeM) || null,
      dps,
      type: egItems[id]?.t || null,
      image: null,
      sourceUrl: url || null,
    };
  }

  writeJson('public/data/weapons.json', weapons);
  console.log(
    `weapons: ${Object.keys(weapons).length} armes, ${weaponFamilies.size} familles`
  );

  // ---------- ITEMS ----------
  const itemRows = readCsv('data/raw/items.csv');
  const itemHeader = itemRows[0];
  const items: Record<string, unknown> = {};
  let itemsWithRarity = 0;
  let itemsWithPrice = 0;
  let itemsWithoutRarityPrice = 0;

  for (let i = 1; i < itemRows.length; i++) {
    const row = itemRows[i];
    if (row.length < 9) continue;
    const [
      id,
      nameRu,
      nameEn,
      categoryRu,
      rarity,
      priceMin,
      priceMax,
      url,
      source,
    ] = row;

    const hasRarity = rarity && rarity.trim() !== '';
    const hasPrice = priceMin && priceMin.trim() !== '' && priceMax && priceMax.trim() !== '';

    if (hasRarity) itemsWithRarity++;
    if (hasPrice) itemsWithPrice++;
    if (!hasRarity && !hasPrice) itemsWithoutRarityPrice++;

    items[id] = {
      id,
      name: nameEn,
      category: keyMap.categories[categoryRu] || null,
      rarity: hasRarity ? (keyMap.rarities[rarity] || null) : null,
      priceMin: hasPrice ? parseFloat(priceMin) : null,
      priceMax: hasPrice ? parseFloat(priceMax) : null,
      tradable: hasRarity && hasPrice,
      image: null,
      sourceUrl: url || null,
    };
  }

  writeJson('public/data/items.json', items);
  console.log(
    `items: ${Object.keys(items).length} total, ${itemsWithRarity} avec rareté, ${itemsWithPrice} avec prix, ${itemsWithoutRarityPrice} sans rareté ni prix`
  );

  // ---------- MAP POINTS ----------
  const mapRows = readCsv('data/raw/map-points.csv');
  const mapHeader = mapRows[0];
  const mapPoints: Record<string, unknown> = {};

  for (let i = 1; i < mapRows.length; i++) {
    const row = mapRows[i];
    if (row.length < 9) continue;
    const [
      id,
      type,
      nameRu,
      nameEn,
      districtRu,
      buildingRu,
      lootEntries,
      url,
      source,
    ] = row;

    mapPoints[id] = {
      id,
      type: keyMap.map_types[type] || null,
      label: nameEn,
      district: keyMap.districts[districtRu] || null,
      building: keyMap.buildings[buildingRu] || null,
      x: null,
      y: null,
      lootRefs: null,
      image: null,
      sourceUrl: url || null,
    };
  }

  writeJson('public/data/mapPoints.json', mapPoints);
  console.log(
    `mapPoints: ${Object.keys(mapPoints).length} points`
  );
}

main();
