import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.cwd();

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf-8'));
}

function exists(relativePath: string): boolean {
  return fs.existsSync(path.join(ROOT, relativePath));
}

const cyrillicRegex = /[\u0400-\u04FF]/;
const errors: string[] = [];

function err(msg: string) {
  errors.push(msg);
  console.error(`  ❌ ${msg}`);
}

function ok(msg: string) {
  console.log(`  ✅ ${msg}`);
}

// ---------- (a) Parité des clés EN/FR/AR ----------
function checkI18nParity() {
  const langs = ['en', 'fr', 'ar'] as const;
  const translations: Record<string, Record<string, unknown>> = {};

  for (const lang of langs) {
    const filePath = `src/i18n/${lang}.json`;
    if (!exists(filePath)) {
      err(`[i18n] Fichier manquant : ${filePath}`);
      continue;
    }
    try {
      translations[lang] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (err2) {
      err(`[i18n] JSON invalide dans ${filePath} : ${err2}`);
      continue;
    }
  }

  if (translations.en && translations.fr && translations.ar) {
    const enKeys = Object.keys(translations.en);
    const frKeys = Object.keys(translations.fr);
    const arKeys = Object.keys(translations.ar);

    const missingInFr = enKeys.filter((k) => !(k in translations.fr));
    const missingInAr = enKeys.filter((k) => !(k in translations.ar));
    const extraInFr = frKeys.filter((k) => !(k in translations.en));
    const extraInAr = arKeys.filter((k) => !(k in translations.en));

    if (missingInFr.length > 0) err(`[i18n] Clés manquantes en FR : ${missingInFr.join(', ')}`);
    if (missingInAr.length > 0) err(`[i18n] Clés manquantes en AR : ${missingInAr.join(', ')}`);
    if (extraInFr.length > 0) err(`[i18n] Clés supplémentaires en FR : ${extraInFr.join(', ')}`);
    if (extraInAr.length > 0) err(`[i18n] Clés supplémentaires en AR : ${extraInAr.join(', ')}`);

    if (missingInFr.length === 0 && missingInAr.length === 0 && extraInFr.length === 0 && extraInAr.length === 0) {
      ok('i18n : parité EN/FR/AR OK');
    }
  }
}

// ---------- (b) Absence de cyrillique ----------
function checkNoCyrillic() {
  const dirs = ['src', 'public'];
  let cyrillicFound = false;
  for (const dir of dirs) {
    if (!exists(dir)) continue;
    for (const file of walk(dir)) {
      if (!file.endsWith('.ts') && !file.endsWith('.tsx') && !file.endsWith('.json') && !file.endsWith('.html') && !file.endsWith('.css')) continue;
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (cyrillicRegex.test(lines[i])) {
          err(`[cyrillic] Texte cyrillique trouvé dans ${file}:${i + 1}`);
          cyrillicFound = true;
        }
      }
    }
  }
  if (!cyrillicFound) ok('Aucun texte cyrillique dans src/ et public/');
}

// ---------- (c) Les 3 CSV existent ----------
function checkCsvExist() {
  const csvFiles = ['weapons.csv', 'items.csv', 'map-points.csv'];
  let allExist = true;
  for (const csv of csvFiles) {
    if (!exists(`data/raw/${csv}`)) {
      err(`[data] Fichier CSV manquant : data/raw/${csv}`);
      allExist = false;
    }
  }
  if (allExist) ok('Les 3 CSV de data/raw sont présents');
}

// ---------- (d) Données générées (weapons, items, mapPoints) ----------
function checkGeneratedData() {
  // weapons
  const weapons = readJson<Record<string, unknown>>('public/data/weapons.json');
  const weaponIds = Object.keys(weapons);
  const weaponFamilies = new Set(
    weaponIds.map((id) => (weapons[id] as { family?: string }).family).filter(Boolean)
  );
  if (weaponIds.length !== 46) err(`[weapons] Attendu 46 armes, trouvé ${weaponIds.length}`);
  else ok(`weapons : ${weaponIds.length} armes`);
  if (weaponFamilies.size !== 17) err(`[weapons] Attendu 17 familles, trouvé ${weaponFamilies.size}`);
  else ok(`weapons : ${weaponFamilies.size} familles`);

  // Vérifier headshot = dégâts × 1,5 et DPS = dégâts × cadence / 60 (tolérance 1)
  let headshotErrors = 0;
  let dpsErrors = 0;
  for (const id of weaponIds) {
    const w = weapons[id] as {
      damage?: number;
      headshot?: number;
      rpm?: number;
      dps?: number;
    };
    if (w.damage != null && w.headshot != null) {
      const expectedHeadshot = Math.round(w.damage * 1.5);
      if (Math.abs(w.headshot - expectedHeadshot) > 0) {
        headshotErrors++;
        if (headshotErrors <= 3) err(`[weapons] ${id} : headshot ${w.headshot} ≠ dégâts×1,5=${expectedHeadshot}`);
      }
    }
    if (w.damage != null && w.rpm != null && w.dps != null) {
      const expectedDps = Math.round((w.damage * w.rpm) / 60);
      if (Math.abs(w.dps - expectedDps) > 1) {
        dpsErrors++;
        if (dpsErrors <= 3) err(`[weapons] ${id} : dps ${w.dps} ≠ dégâts×cadence/60=${expectedDps} (tolérance 1)`);
      }
    }
  }
  if (headshotErrors === 0) ok('weapons : headshot = dégâts × 1,5 pour toutes les armes');
  if (dpsErrors === 0) ok('weapons : dps = dégâts × cadence / 60 (tolérance 1)');

  // ids uniques
  if (new Set(weaponIds).size !== weaponIds.length) err('[weapons] IDs en double détectés');
  else ok('weapons : IDs uniques');

  // items
  const items = readJson<Record<string, unknown>>('public/data/items.json');
  const itemIds = Object.keys(items);
  if (itemIds.length !== 563) err(`[items] Attendu 563 items, trouvé ${itemIds.length}`);
  else ok(`items : ${itemIds.length} items`);

  // Catégories uniques
  const itemCategories = new Set(
    itemIds.map((id) => (items[id] as { category?: string }).category).filter(Boolean)
  );
  if (itemCategories.size !== 23) err(`[items] Attendu 23 catégories, trouvé ${itemCategories.size}`);
  else ok(`items : ${itemCategories.size} catégories`);

  // Raretés uniques
  const itemRarities = new Set(
    itemIds.map((id) => (items[id] as { rarity?: string }).rarity).filter(Boolean)
  );
  if (itemRarities.size !== 5) err(`[items] Attendu 5 raretés, trouvé ${itemRarities.size}`);
  else ok(`items : ${itemRarities.size} raretés`);

  // Items sans rareté ni prix
  let noRarityNoPrice = 0;
  for (const id of itemIds) {
    const it = items[id] as { rarity?: string | null; priceMin?: number | null; priceMax?: number | null };
    if (!it.rarity && !it.priceMin && !it.priceMax) noRarityNoPrice++;
  }
  if (noRarityNoPrice !== 184) err(`[items] Attendu 184 items sans rareté ni prix, trouvé ${noRarityNoPrice}`);
  else ok(`items : ${noRarityNoPrice} items sans rareté ni prix`);

  // Prix min ≤ max
  let priceErrors = 0;
  for (const id of itemIds) {
    const it = items[id] as { priceMin?: number | null; priceMax?: number | null };
    if (it.priceMin != null && it.priceMax != null && it.priceMin > it.priceMax) {
      priceErrors++;
      if (priceErrors <= 3) err(`[items] ${id} : prix min ${it.priceMin} > prix max ${it.priceMax}`);
    }
  }
  if (priceErrors === 0) ok('items : prix min ≤ prix max');

  // IDs uniques
  if (new Set(itemIds).size !== itemIds.length) err('[items] IDs en double détectés');
  else ok('items : IDs uniques');

  // mapPoints
  const mapPoints = readJson<Record<string, unknown>>('public/data/mapPoints.json');
  const mapIds = Object.keys(mapPoints);
  if (mapIds.length !== 927) err(`[mapPoints] Attendu 927 points, trouvé ${mapIds.length}`);
  else ok(`mapPoints : ${mapIds.length} points`);

  // Districts uniques
  const mapDistricts = new Set(
    mapIds.map((id) => (mapPoints[id] as { district?: string }).district).filter(Boolean)
  );
  if (mapDistricts.size !== 4) err(`[mapPoints] Attendu 4 districts, trouvé ${mapDistricts.size}`);
  else ok(`mapPoints : ${mapDistricts.size} districts`);

  // Bâtiments uniques
  const mapBuildings = new Set(
    mapIds.map((id) => (mapPoints[id] as { building?: string }).building).filter(Boolean)
  );
  if (mapBuildings.size !== 28) err(`[mapPoints] Attendu 28 bâtiments, trouvé ${mapBuildings.size}`);
  else ok(`mapPoints : ${mapBuildings.size} bâtiments`);

  // Types uniques
  const mapTypes = new Set(
    mapIds.map((id) => (mapPoints[id] as { type?: string }).type).filter(Boolean)
  );
  if (mapTypes.size !== 9) err(`[mapPoints] Attendu 9 types, trouvé ${mapTypes.size}`);
  else ok(`mapPoints : ${mapTypes.size} types`);

  // IDs uniques
  if (new Set(mapIds).size !== mapIds.length) err('[mapPoints] IDs en double détectés');
  else ok('mapPoints : IDs uniques');

  // ---------- (e) Toutes les valeurs présentes dans le glossaire ----------
  const glossary = readJson<Record<string, { en: string; fr: string; ar: string }>>(
    'data/glossary.json'
  );
  const glossaryKeys = new Set(Object.keys(glossary));

  // Vérifier catégories, raretés, districts, bâtiments, types des JSON générés
  let missingGlossary = 0;

  for (const id of weaponIds) {
    // armes n'ont pas de catégorie/rareté dans le JSON actuel
  }

  for (const id of itemIds) {
    const it = items[id] as { category?: string | null; rarity?: string | null };
    if (it.category && !glossaryKeys.has(`category.${it.category}`)) {
      missingGlossary++;
      if (missingGlossary <= 5) err(`[glossary] Catégorie '${it.category}' absente du glossaire`);
    }
    if (it.rarity && !glossaryKeys.has(`rarity.${it.rarity}`)) {
      missingGlossary++;
      if (missingGlossary <= 5) err(`[glossary] Rareté '${it.rarity}' absente du glossaire`);
    }
  }

  for (const id of mapIds) {
    const mp = mapPoints[id] as { district?: string | null; building?: string | null; type?: string | null };
    if (mp.district && !glossaryKeys.has(`district.${mp.district}`)) {
      missingGlossary++;
      if (missingGlossary <= 5) err(`[glossary] District '${mp.district}' absent du glossaire`);
    }
    if (mp.building && !glossaryKeys.has(`building.${mp.building}`)) {
      missingGlossary++;
      if (missingGlossary <= 5) err(`[glossary] Bâtiment '${mp.building}' absent du glossaire`);
    }
    if (mp.type && !glossaryKeys.has(`map_type.${mp.type}`)) {
      missingGlossary++;
      if (missingGlossary <= 5) err(`[glossary] Type '${mp.type}' absent du glossaire`);
    }
  }

  if (missingGlossary === 0) ok('Glossaire : toutes les valeurs des JSON générés sont présentes');
}

function walk(dir: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

// ---------- (f) Aucune URL externe dans public/data ----------
function checkNoExternalUrls() {
  const dir = 'public/data';
  if (!exists(dir)) return;

  let found = 0;
  const urlRegex = /https?:\/\/[^"'\s]+/;
  for (const file of walk(dir)) {
    if (!file.endsWith('.json')) continue;
    const content = fs.readFileSync(file, 'utf-8');
    const match = content.match(urlRegex);
    if (match) {
      found++;
      err(`[url] URL externe dans ${file} : ${match[0]}`);
    }
  }
  if (found === 0) ok('Aucune URL externe dans public/data');
}

function folderBytes(dir: string): number {
  if (!fs.existsSync(dir)) return 0;
  let total = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) total += folderBytes(full);
    else total += fs.statSync(full).size;
  }
  return total;
}

// ---------- (g) Carte : fond local, marqueurs, loot par point ----------
let glossaryKeyCache: Set<string> | null = null;

function glossaryHas(key: string): boolean {
  if (!glossaryKeyCache) {
    glossaryKeyCache = new Set(Object.keys(readJson<Record<string, unknown>>('data/glossary.json')));
  }
  return glossaryKeyCache.has(key);
}

function checkMap() {
  const mapPath = 'public/data/map.json';
  if (!exists(mapPath)) {
    err('[map] public/data/map.json absent (lancer « npm run import:map »)');
    return;
  }

  const map = readJson<{
    image?: string;
    width?: number;
    height?: number;
    districts?: string[];
    pins?: Array<{ id: string; type: string; x: number; y: number }>;
    stats?: { placed?: number; total?: number; withLoot?: number };
  }>(mapPath);

  if (!map.image || !map.image.startsWith('/images/')) {
    err(`[map] chemin d'image non local : ${map.image ?? 'null'}`);
  } else if (!fs.existsSync(path.join(ROOT, `public${map.image}`))) {
    err(`[map] fond de carte absent : ${map.image}`);
  }

  if (!map.width || !map.height || map.width <= 0 || map.height <= 0) {
    err(`[map] dimensions invalides : ${map.width}×${map.height}`);
  }

  const pins = Array.isArray(map.pins) ? map.pins : [];
  if (pins.length !== 40) err(`[map] Attendu 40 marqueurs, trouvé ${pins.length}`);
  else ok(`map : ${pins.length} marqueurs coordonnés`);

  const pinIds = new Set<string>();
  let pinErrors = 0;
  for (const pin of pins) {
    if (!pin.id || pinIds.has(pin.id)) {
      pinErrors++;
      if (pinErrors <= 3) err(`[map] marqueur sans id ou id en double : ${pin.id}`);
    }
    pinIds.add(pin.id);
    if (!pin.type || !glossaryHas(`pin.${pin.type}`)) {
      pinErrors++;
      if (pinErrors <= 3) err(`[map] type de marqueur '${pin.type}' absent du glossaire (pin.*)`);
    }
    if (
      typeof pin.x !== 'number' ||
      typeof pin.y !== 'number' ||
      pin.x < 0 ||
      pin.x > 100 ||
      pin.y < 0 ||
      pin.y > 100
    ) {
      pinErrors++;
      if (pinErrors <= 3) err(`[map] coordonnées hors 0–100 pour ${pin.id} (${pin.x}, ${pin.y})`);
    }
  }
  if (pinErrors === 0) ok('map : ids uniques, types et coordonnées valides');

  let districtErrors = 0;
  for (const district of map.districts ?? []) {
    if (!glossaryHas(`district.${district}`)) {
      districtErrors++;
      if (districtErrors <= 3) err(`[map] district '${district}' absent du glossaire`);
    }
  }
  if (districtErrors === 0) ok(`map : ${(map.districts ?? []).length} quartiers traduits`);

  // Cohérence des statistiques et du loot signalé par point.
  const mapPoints = readJson<Record<string, { x?: number | null; y?: number | null; hasLoot?: boolean }>>(
    'public/data/mapPoints.json'
  );
  const pointIds = Object.keys(mapPoints);
  const placedPoints = pointIds.filter((id) => mapPoints[id]?.x != null && mapPoints[id]?.y != null).length;
  const withLoot = pointIds.filter((id) => mapPoints[id]?.hasLoot === true).length;

  if (map.stats?.placed !== pins.length) {
    err(`[map] stats.placed=${map.stats?.placed} ≠ ${pins.length} marqueurs`);
  }
  if (map.stats?.total !== pointIds.length) {
    err(`[map] stats.total=${map.stats?.total} ≠ ${pointIds.length} points`);
  }
  if (map.stats?.withLoot !== withLoot) {
    err(`[map] stats.withLoot=${map.stats?.withLoot} ≠ ${withLoot} points avec loot`);
  }
  if (withLoot !== 267) {
    err(`[map] Attendu 267 points avec loot signalé, trouvé ${withLoot}`);
  }
  if (placedPoints !== 0) {
    err(
      `[map] ${placedPoints} points de carte ont des coordonnées : la règle est 0 (les 40 marqueurs ` +
        `sont stockés séparément dans map.json, aucune coordonnée n'est inventée)`
    );
  }
  if (placedPoints === 0 && withLoot === 267) {
    ok('map : couverture 40/927 points (aucune coordonnée inventée), 267 points avec loot signalé');
  }
}

// ---------- (h) Images locales + manifest ----------
function checkImages() {
  const manifestPath = 'data/images-manifest.json';
  if (!exists(manifestPath)) {
    console.warn('  ⚠️ [images] data/images-manifest.json absent (import-images pas encore exécuté)');
    return;
  }

  const manifest = readJson<{
    entries: Array<{
      id: string;
      kind: string;
      file: string;
      hash: string;
      originUrl: string;
      source: string;
    }>;
  }>(manifestPath);
  const entries = Array.isArray(manifest.entries) ? manifest.entries : [];

  let imageErrors = 0;
  const manifestFiles = new Set<string>();
  for (const entry of entries) {
    if (!entry.file || !entry.file.startsWith('/images/')) {
      imageErrors++;
      if (imageErrors <= 5) err(`[images] ${entry.id} : chemin local invalide (${entry.file})`);
      continue;
    }
    manifestFiles.add(entry.file);
    const filePath = path.join(ROOT, `public${entry.file}`);
    if (!fs.existsSync(filePath)) {
      imageErrors++;
      if (imageErrors <= 5) err(`[images] ${entry.id} : fichier manquant ${entry.file}`);
      continue;
    }
    const actualHash = crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
    if (actualHash !== entry.hash) {
      imageErrors++;
      if (imageErrors <= 5) err(`[images] ${entry.id} : hash incohérent pour ${entry.file}`);
    }
  }
  if (imageErrors === 0) {
    ok(`images : ${entries.length} entrées du manifest valides (fichiers présents, SHA-256 cohérent)`);
  }

  // Chaque chemin image des JSON publics doit exister et figurer dans le manifest.
  let referenceErrors = 0;
  for (const file of ['public/data/weapons.json', 'public/data/items.json']) {
    const data = readJson<Record<string, { image?: string | null }>>(file);
    for (const id of Object.keys(data)) {
      const image = data[id]?.image;
      if (!image) continue;
      if (!image.startsWith('/images/')) {
        referenceErrors++;
        if (referenceErrors <= 5) err(`[images] ${file} ${id} : chemin non local (${image})`);
        continue;
      }
      if (!fs.existsSync(path.join(ROOT, `public${image}`))) {
        referenceErrors++;
        if (referenceErrors <= 5) err(`[images] ${file} ${id} : fichier absent (${image})`);
      } else if (!manifestFiles.has(image)) {
        referenceErrors++;
        if (referenceErrors <= 5) err(`[images] ${file} ${id} : ${image} absent du manifest`);
      }
    }
  }
  if (referenceErrors === 0) ok('images : tous les champs image des JSON publics sont locaux et valides');

  const bytes = folderBytes(path.join(ROOT, 'public/images'));
  const megabytes = bytes / (1024 * 1024);
  console.log(`  ℹ️ Poids total de public/images : ${megabytes.toFixed(1)} Mo`);
  if (megabytes > 100) {
    console.warn(`  ⚠️ public/images dépasse 100 Mo (${megabytes.toFixed(1)} Mo)`);
  }
}

function main() {
  console.log('=== validate-data (P3–P6) ===\n');

  checkI18nParity();
  checkNoCyrillic();
  checkCsvExist();
  checkGeneratedData();
  checkMap();
  checkNoExternalUrls();
  checkImages();

  console.log(`\n=== Résultat : ${errors.length === 0 ? 'SUCCÈS' : errors.length + ' ERREUR(S)'} ===`);
  if (errors.length > 0) {
    process.exit(1);
  }
}

main();
