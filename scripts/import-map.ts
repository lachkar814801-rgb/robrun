import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

/**
 * Import de la carte (P6).
 *
 * Sources locales uniquement (aucune requête réseau à l'exécution) :
 * - data/recon/_robrun.json : instantané everygamestat déjà collecté en P1
 *   (fond de carte 2048×1678 + 40 marqueurs `map.pins` [type, x%, y%]).
 * - data/raw/map-points.csv : colonne `loot_entries` (0/1) pour marquer les
 *   points dont le wiki liste du loot.
 *
 * Règle validée (data/recon/DATA-STRATEGY.md) : seuls ces 40 marqueurs ont des
 * coordonnées. Les 887 autres points restent `x`/`y` à null et s'affichent en
 * liste. Aucune coordonnée n'est inventée ni interpolée.
 */

const ROOT = process.cwd();

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf-8'));
}

function writeJson(relativePath: string, data: unknown): void {
  const fullPath = path.join(ROOT, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

function fail(message: string): never {
  console.error(`import-map: ${message}`);
  process.exit(1);
}

interface ReconMap {
  image: string;
  w: number;
  h: number;
  name: string;
  districts: string[];
  pins: Array<[string, number, number]>;
}

async function main() {
  // ---------- 1. Fond de carte et marqueurs (recon everygamestat) ----------
  const reconPath = 'data/recon/_robrun.json';
  if (!fs.existsSync(path.join(ROOT, reconPath))) {
    fail(
      `instantané ${reconPath} introuvable. Il est nécessaire pour les 40 marqueurs ` +
        `(map.pins). Ne pas re-scraper : relancer la phase de reconnaissance.`
    );
  }

  const recon = readJson<{ map?: ReconMap }>(reconPath);
  const reconMap = recon.map;
  if (!reconMap || !Array.isArray(reconMap.pins)) {
    fail(`clé "map" absente ou invalide dans ${reconPath}`);
  }

  const imageName = reconMap.image;
  // Le nom du fichier peut différer légèrement de celui du recon (préfixe « map- » retiré
  // lors de l'import d'images). On ne cherche que dans le dossier local, jamais en ligne.
  const mapDir = path.join(ROOT, 'public/images/map');
  const candidates = fs.existsSync(mapDir) ? fs.readdirSync(mapDir) : [];
  const localImage =
    candidates.find((name) => name === imageName) ??
    candidates.find((name) => name === imageName.replace(/^map-/, '')) ??
    candidates.find((name) => /looty/i.test(name) && name.endsWith('.webp'));

  if (!localImage) {
    fail(
      `fond de carte introuvable dans public/images/map (attendu : ${imageName}). ` +
        `Lancer d'abord « npm run import:images » (le fichier vient de la source, jamais d'une génération).`
    );
  }

  const imagePath = path.join(mapDir, localImage);

  const metadata = await sharp(imagePath).metadata();
  const width = metadata.width ?? reconMap.w;
  const height = metadata.height ?? reconMap.h;
  if (!width || !height) fail(`dimensions illisibles pour public/images/map/${imageName}`);

  // ---------- 2. Districts : libellés anglais → clés du glossaire ----------
  const glossary = readJson<Record<string, { en: string }>>('data/glossary.json');
  const districtKeys = new Map<string, string>();
  for (const [key, entry] of Object.entries(glossary)) {
    if (!key.startsWith('district.')) continue;
    districtKeys.set(entry.en.trim().toLowerCase(), key.slice('district.'.length));
  }

  const districts: string[] = [];
  for (const name of reconMap.districts ?? []) {
    const key = districtKeys.get(name.trim().toLowerCase());
    if (!key) fail(`district « ${name} » absent du glossaire (clé district.*)`);
    districts.push(key);
  }

  // ---------- 3. Marqueurs : validation stricte des coordonnées ----------
  const pins: Array<{ id: string; type: string; x: number; y: number }> = [];
  const pinTypes = new Set<string>();
  for (let i = 0; i < reconMap.pins.length; i += 1) {
    const [type, x, y] = reconMap.pins[i];
    if (typeof type !== 'string' || !type) fail(`marqueur #${i + 1} : type invalide`);
    if (typeof x !== 'number' || typeof y !== 'number' || !Number.isFinite(x) || !Number.isFinite(y)) {
      fail(`marqueur #${i + 1} (${type}) : coordonnées non numériques`);
    }
    if (x < 0 || x > 100 || y < 0 || y > 100) {
      fail(`marqueur #${i + 1} (${type}) : coordonnées hors 0–100 (${x}, ${y})`);
    }
    pinTypes.add(type);
    pins.push({
      id: `pin_${String(i + 1).padStart(2, '0')}`,
      type,
      x: Math.round(x * 100) / 100,
      y: Math.round(y * 100) / 100,
    });
  }

  for (const type of pinTypes) {
    if (!glossary[`pin.${type}`]) {
      fail(`type de marqueur « ${type} » absent du glossaire (clé pin.*)`);
    }
  }

  // ---------- 4. Loot signalé par point (CSV, colonne loot_entries) ----------
  const mapPointsPath = 'public/data/mapPoints.json';
  const mapPoints = readJson<Record<string, Record<string, unknown>>>(mapPointsPath);
  const csv = fs.readFileSync(path.join(ROOT, 'data/raw/map-points.csv'), 'utf-8');
  const lines = csv.trim().split(/\r?\n/);
  const header = lines[0].split(',');
  const lootIndex = header.indexOf('loot_entries');
  if (lootIndex === -1) fail('colonne loot_entries absente de data/raw/map-points.csv');

  let withLoot = 0;
  let unmatched = 0;
  for (const line of lines.slice(1)) {
    const cells = line.split(',');
    const id = cells[0];
    if (!id) continue;
    const point = mapPoints[id];
    if (!point) {
      unmatched += 1;
      continue;
    }
    const hasLoot = cells[lootIndex] === '1';
    point.hasLoot = hasLoot;
    if (hasLoot) withLoot += 1;
  }

  // ---------- 5. Écriture ----------
  writeJson('public/data/map.json', {
    name: reconMap.name || 'Looty Bay',
    image: `/images/map/${localImage}`,
    width,
    height,
    districts,
    pins,
    stats: {
      placed: pins.length,
      total: Object.keys(mapPoints).length,
      withLoot,
    },
  });

  writeJson(mapPointsPath, mapPoints);

  // Provenance hors de public/data (aucune URL externe dans les JSON publics).
  const sourceUrlsPath = 'data/source-urls.json';
  const sourceUrls = readJson<Record<string, unknown>>(sourceUrlsPath);
  sourceUrls.map = {
    image: 'https://everygamestat.com/art/robrun/map-looty-bay-hq.webp',
    pins: 'https://everygamestat.com/art/robrun/robrun.json',
    note: 'Fond de carte et 40 marqueurs (safe/atm/cargo) — instantané P1 data/recon/_robrun.json',
  };
  writeJson(sourceUrlsPath, sourceUrls);

  // ---------- 6. Rapport de couverture ----------
  const total = Object.keys(mapPoints).length;
  const pct = ((pins.length / total) * 100).toFixed(1);
  console.log('import-map: terminé');
  console.log(`  fond      : ${localImage} (${width}×${height})`);
  console.log(`  quartiers : ${districts.join(', ')}`);
  console.log(`  marqueurs : ${pins.length} (${[...pinTypes].join(', ')})`);
  console.log(`  couverture: ${pins.length}/${total} points placés (${pct} %)`);
  console.log(`  loot      : ${withLoot} points avec loot signalé (colonne loot_entries)`);
  if (unmatched > 0) console.warn(`  ⚠️ ${unmatched} lignes CSV sans point correspondant`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
