import fs from 'node:fs';
import path from 'node:path';

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

function main() {
  console.log('=== validate-data (P3) ===\n');

  checkI18nParity();
  checkNoCyrillic();
  checkCsvExist();
  checkGeneratedData();

  console.log(`\n=== Résultat : ${errors.length === 0 ? 'SUCCÈS' : errors.length + ' ERREUR(S)'} ===`);
  if (errors.length > 0) {
    process.exit(1);
  }
}

main();
