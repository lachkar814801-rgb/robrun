/**
 * Importateur d'images ROB RUN Companion (P4).
 *
 * Modes :
 *   npm run import:images -- --dry-run   HEAD uniquement, aucun téléchargement.
 *                                        Produit data/recon/coverage.csv
 *   npm run import:images -- --download  Télécharge les images disponibles en local,
 *                                        les convertit en WebP (≤ 512 px, carte ≤ 2048 px),
 *                                        met à jour public/data/*.json et data/images-manifest.json.
 *
 * Règles :
 *  - 1 requête/seconde, User-Agent explicite.
 *  - Arrêt immédiat + rapport si 403 ou 429.
 *  - Reprise sans retélécharger (manifest + fichiers existants).
 *  - SHA-256 + dédoublonnage.
 *  - Aucune image inventée : si aucune source ne fournit l'image, image = null.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

const ROOT = process.cwd();
const UA = 'ROBRUN-Companion/0.1 (projet de fans non officiel; import de donnees; +https://robrun.space)';
const RATE_LIMIT_MS = 1050;
const MAX_SIZE_ITEM = 512;
const MAX_SIZE_MAP = 2048;
const MAX_SIZE_ICON = 128;

const ROBRUN_BASE = 'https://www.robrun.space';
const EG_BASE = 'https://everygamestat.com';
const EG_IMAGE_BASE =
  'https://wcsgosrevyyafnerrhge.supabase.co/storage/v1/object/public/art/robrun/items';

const COVERAGE_FILE = 'data/recon/coverage.csv';
const MANIFEST_FILE = 'data/images-manifest.json';
const REPORT_FILE = 'data/recon/download-report.json';
const IMAGES_DIR = 'public/images';
const ITEMS_DIR = 'public/images/items';
const MAP_DIR = 'public/images/map';
const ICONS_DIR = 'public/images/map/icons';

type Kind = 'weapon' | 'item' | 'map_background' | 'map_icon';
type Source = 'robrun.space' | 'everygamestat.com';

interface ManifestEntry {
  id: string;
  kind: Kind;
  file: string;
  source: Source;
  originUrl: string;
  date: string;
  hash: string;
  width: number | null;
  height: number | null;
  bytes: number;
  duplicateOf?: string;
  assetType?: 'game-asset' | 'fan-site-icon';
  note?: string;
}

interface Manifest {
  generatedAt: string | null;
  userAgent: string;
  entries: ManifestEntry[];
}

interface EgItem {
  id: string;
  s?: string;
  n?: string;
  img?: string;
  g?: string;
}

interface CoverageRow {
  id: string;
  kind: 'weapon' | 'item';
  robrun_space_image: string;
  everygamestat_image: string;
  http_status: string;
  size: string;
}

let lastRequestAt = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function abs(relativePath: string): string {
  return path.join(ROOT, relativePath);
}

function ensureDir(relativeDir: string): void {
  const dir = abs(relativeDir);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(abs(relativePath), 'utf-8')) as T;
}

function writeJson(relativePath: string, data: unknown): void {
  ensureDir(path.dirname(relativePath));
  fs.writeFileSync(abs(relativePath), JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

function sha256(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function humanBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${bytes} o`;
}

/** Respecte 1 requête/seconde, en série. */
async function throttle(): Promise<void> {
  const elapsed = Date.now() - lastRequestAt;
  if (elapsed < RATE_LIMIT_MS) await sleep(RATE_LIMIT_MS - elapsed);
  lastRequestAt = Date.now();
}

interface FetchResult {
  status: number;
  ok: boolean;
  headers: Headers;
  buffer: Buffer | null;
}

async function request(url: string, method: 'HEAD' | 'GET'): Promise<FetchResult> {
  await throttle();
  const response = await fetch(url, {
    method,
    headers: {
      'User-Agent': UA,
      Accept: method === 'HEAD' ? '*/*' : 'image/webp,image/*,*/*;q=0.8',
    },
    redirect: 'follow',
  });

  if (response.status === 403 || response.status === 429) {
    const error = new Error(`HTTP ${response.status} sur ${url} — arrêt immédiat demandé.`);
    (error as Error & { httpStatus?: number; url?: string }).httpStatus = response.status;
    (error as Error & { httpStatus?: number; url?: string }).url = url;
    throw error;
  }

  const buffer = method === 'GET' && response.ok ? Buffer.from(await response.arrayBuffer()) : null;
  return { status: response.status, ok: response.ok, headers: response.headers, buffer };
}

function readCsvIds(file: string, idIndex = 0, nameIndex = 2): Array<{ id: string; name: string }> {
  const content = fs.readFileSync(abs(file), 'utf-8').trim();
  const lines = content.split(/\r?\n/);
  const rows: Array<{ id: string; name: string }> = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (!values[idIndex]) continue;
    rows.push({ id: values[idIndex], name: values[nameIndex] ?? '' });
  }
  return rows;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** Index everygamestat : id exact prioritaire, puis img/slug/nom normalisés. */
function buildEgIndex(): {
  exact: Map<string, EgItem>;
  normalized: Map<string, EgItem>;
} {
  const exact = new Map<string, EgItem>();
  const normalized = new Map<string, EgItem>();
  const eg = readJson<{ items: EgItem[] }>('data/recon/_items.json');

  for (const item of eg.items) {
    exact.set(item.id, item);
    for (const key of [item.id, item.s, item.img, item.n]) {
      if (!key) continue;
      const normalizedKey = normalize(key);
      if (!normalized.has(normalizedKey)) normalized.set(normalizedKey, item);
    }
  }
  return { exact, normalized };
}

function findEgItem(index: ReturnType<typeof buildEgIndex>, id: string, name: string): EgItem | null {
  return (
    index.exact.get(id) ??
    index.normalized.get(normalize(id)) ??
    index.normalized.get(normalize(name)) ??
    null
  );
}

function egImageUrl(egItem: EgItem): string | null {
  if (!egItem.img) return null;
  return `${EG_IMAGE_BASE}/${encodeURIComponent(egItem.img)}.webp`;
}

interface ProbeResult {
  status: number;
  size: number | null;
}

async function probe(url: string): Promise<ProbeResult> {
  const result = await request(url, 'HEAD');
  const length = result.headers.get('content-length');
  return { status: result.status, size: length ? parseInt(length, 10) : null };
}

// ---------------------------------------------------------------------------
// Mode --dry-run
// ---------------------------------------------------------------------------
async function dryRun(): Promise<void> {
  const weapons = readCsvIds('data/raw/weapons.csv');
  const items = readCsvIds('data/raw/items.csv');
  const egIndex = buildEgIndex();

  const entries: Array<{ id: string; kind: 'weapon' | 'item'; name: string }> = [
    ...weapons.map((w) => ({ id: w.id, kind: 'weapon' as const, name: w.name })),
    ...items.map((it) => ({ id: it.id, kind: 'item' as const, name: it.name })),
  ];

  const rows: CoverageRow[] = [];
  const seen = new Set<string>();

  console.log(`=== import-images --dry-run : ${entries.length} entrées (HEAD uniquement) ===`);
  console.log('Sources : robrun.space puis everygamestat. 1 requête/seconde.\n');

  let index = 0;
  for (const entry of entries) {
    index++;
    const uniqueKey = `${entry.kind}:${entry.id}`;
    if (seen.has(uniqueKey)) continue;
    seen.add(uniqueKey);

    const robrunUrl = `${ROBRUN_BASE}/items/${entry.id}.webp`;
    let robrunStatus = 0;
    let robrunSize: number | null = null;
    try {
      const robrun = await probe(robrunUrl);
      robrunStatus = robrun.status;
      robrunSize = robrun.size;
    } catch (error) {
      throw error;
    }

    let egsUrl: string | null = null;
    let egsStatus = 0;
    let egsSize: number | null = null;

    // On ne contacte everygamestat que si robrun.space n'a pas l'image.
    if (robrunStatus !== 200) {
      const egItem = findEgItem(egIndex, entry.id, entry.name);
      egsUrl = egItem ? egImageUrl(egItem) : null;
      if (egsUrl) {
        const egs = await probe(egsUrl);
        egsStatus = egs.status;
        egsSize = egs.size;
      }
    }

    const chosenSize = robrunStatus === 200 ? robrunSize : egsStatus === 200 ? egsSize : null;

    rows.push({
      id: entry.id,
      kind: entry.kind,
      robrun_space_image: robrunStatus === 200 ? robrunUrl : String(robrunStatus || 'ERR'),
      everygamestat_image: egsUrl ? (egsStatus === 200 ? egsUrl : String(egsStatus)) : 'none',
      http_status: `robrun:${robrunStatus || 'ERR'}|egs:${egsUrl ? egsStatus || 'ERR' : 'none'}`,
      size: chosenSize === null ? '' : String(chosenSize),
    });

    if (index % 25 === 0 || index === entries.length) {
      process.stdout.write(`  … ${index}/${entries.length}\n`);
    }
  }

  const header = 'id,kind,robrun_space_image,everygamestat_image,http_status,size\n';
  const csv = rows
    .map((row) =>
      [row.id, row.kind, row.robrun_space_image, row.everygamestat_image, row.http_status, row.size]
        .map((value) => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value))
        .join(',')
    )
    .join('\n');
  ensureDir('data/recon');
  fs.writeFileSync(abs(COVERAGE_FILE), header + csv + '\n', 'utf-8');

  printCoverage(rows, 'Dry-run');
}

function printCoverage(rows: CoverageRow[], label: string): void {
  const percentage = (value: number, total: number): string =>
    total === 0 ? '0.0 %' : `${((value / total) * 100).toFixed(1)} %`;
  const robrunOk = (row: CoverageRow): boolean => row.robrun_space_image.startsWith('http');
  const egsOk = (row: CoverageRow): boolean => row.everygamestat_image.startsWith('http');
  const anyOk = (row: CoverageRow): boolean => robrunOk(row) || egsOk(row);

  console.log(`\n=== ${label} — couverture ===`);
  for (const kind of ['weapon', 'item'] as const) {
    const subset = rows.filter((row) => row.kind === kind);
    const total = subset.length;
    const viaRobrun = subset.filter(robrunOk).length;
    const viaEgs = subset.filter((row) => !robrunOk(row) && egsOk(row)).length;
    const none = subset.filter((row) => !anyOk(row)).length;
    console.log(
      `${kind === 'weapon' ? 'Armes' : 'Items'} (${total}) : ` +
        `robrun ${viaRobrun} (${percentage(viaRobrun, total)}), ` +
        `everygamestat ${viaEgs} (${percentage(viaEgs, total)}), ` +
        `disponibles ${viaRobrun + viaEgs} (${percentage(viaRobrun + viaEgs, total)}), ` +
        `sans image ${none} (${percentage(none, total)})`
    );
  }

  const total = rows.length;
  const robrun = rows.filter(robrunOk).length;
  const egs = rows.filter((row) => !robrunOk(row) && egsOk(row)).length;
  const none = rows.filter((row) => !anyOk(row)).length;
  console.log(
    `Total (${total}) : robrun ${robrun} (${percentage(robrun, total)}), ` +
      `everygamestat ${egs} (${percentage(egs, total)}), ` +
      `disponibles ${robrun + egs} (${percentage(robrun + egs, total)}), ` +
      `sans image ${none} (${percentage(none, total)})`
  );
  console.log(`\nCSV écrit : ${COVERAGE_FILE}`);
}

// ---------------------------------------------------------------------------
// Mode --download
// ---------------------------------------------------------------------------
function parseCoverageCsv(): CoverageRow[] {
  if (!fs.existsSync(abs(COVERAGE_FILE))) {
    throw new Error(
      `Fichier ${COVERAGE_FILE} introuvable. Lance d'abord « npm run import:images -- --dry-run ».`
    );
  }
  const lines = fs.readFileSync(abs(COVERAGE_FILE), 'utf-8').trim().split(/\r?\n/);
  const header = lines[0].split(',');
  const index = (name: string): number => header.indexOf(name);
  const rows: CoverageRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    // CSV simple : nos valeurs ne contiennent pas de virgule (URLs sans query string).
    const values = lines[i].split(',');
    const row: CoverageRow = {
      id: values[index('id')] ?? '',
      kind: (values[index('kind')] as 'weapon' | 'item') ?? 'item',
      robrun_space_image: values[index('robrun_space_image')] ?? '',
      everygamestat_image: values[index('everygamestat_image')] ?? '',
      http_status: values[index('http_status')] ?? '',
      size: values[index('size')] ?? '',
    };
    if (row.id) rows.push(row);
  }
  return rows;
}

function loadManifest(): Manifest {
  if (!fs.existsSync(abs(MANIFEST_FILE))) {
    return { generatedAt: null, userAgent: UA, entries: [] };
  }
  const manifest = readJson<Manifest>(MANIFEST_FILE);
  if (!Array.isArray(manifest.entries)) manifest.entries = [];
  manifest.userAgent = UA;
  return manifest;
}

function localImageExists(entry: ManifestEntry): boolean {
  return fs.existsSync(abs(`public${entry.file}`));
}

async function processImage(
  buffer: Buffer,
  maxSize: number
): Promise<{ buffer: Buffer; width: number | null; height: number | null }> {
  const processed = await sharp(buffer, { failOn: 'none' })
    .rotate()
    .resize({ width: maxSize, height: maxSize, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 })
    .toBuffer();
  const metadata = await sharp(processed).metadata();
  return { buffer: processed, width: metadata.width ?? null, height: metadata.height ?? null };
}

function writeImage(relativePath: string, buffer: Buffer): void {
  ensureDir(path.dirname(relativePath));
  fs.writeFileSync(abs(relativePath), buffer);
}

async function downloadOne(
  id: string,
  kind: Kind,
  originUrl: string,
  source: Source,
  maxSize: number,
  extra: Partial<ManifestEntry> = {}
): Promise<ManifestEntry> {
  const response = await request(originUrl, 'GET');
  if (!response.ok || !response.buffer) {
    throw new Error(`HTTP ${response.status} pour ${originUrl}`);
  }
  const processed = await processImage(response.buffer, maxSize);
  const hash = sha256(processed.buffer);
  return {
    id,
    kind,
    file: '',
    source,
    originUrl,
    date: new Date().toISOString(),
    hash,
    width: processed.width,
    height: processed.height,
    bytes: processed.buffer.length,
    ...extra,
    // On garde le buffer en mémoire via un champ temporaire non sérialisé.
    ...({ __buffer: processed.buffer } as object),
  } as ManifestEntry & { __buffer: Buffer };
}

async function download(): Promise<void> {
  const coverage = parseCoverageCsv();
  const manifest = loadManifest();
  const byId = new Map<string, ManifestEntry>(
    manifest.entries.filter((entry) => entry.kind === 'weapon' || entry.kind === 'item').map((entry) => [entry.id, entry])
  );
  const hashToEntry = new Map<string, ManifestEntry>(
    manifest.entries.filter((entry) => entry.hash).map((entry) => [entry.hash, entry])
  );

  ensureDir(ITEMS_DIR);
  ensureDir(MAP_DIR);
  ensureDir(ICONS_DIR);

  console.log(`=== import-images --download : ${coverage.length} entrées ===`);
  console.log('1 requête/seconde. Reprise sans retélécharger.\n');

  let downloaded = 0;
  let skipped = 0;
  let duplicates = 0;
  let unavailable = 0;
  const failures: Array<{ id: string; reason: string }> = [];

  try {
    for (const row of coverage) {
      const robrunUrl = row.robrun_space_image.startsWith('http') ? row.robrun_space_image : null;
      const egsUrl = row.everygamestat_image.startsWith('http') ? row.everygamestat_image : null;
      const originUrl = robrunUrl ?? egsUrl;

      if (!originUrl) {
        unavailable++;
        continue;
      }

      const source: Source = robrunUrl ? 'robrun.space' : 'everygamestat.com';
      const existing = byId.get(row.id);
      if (existing && existing.originUrl === originUrl && localImageExists(existing)) {
        skipped++;
        continue;
      }

      try {
        const entry = (await downloadOne(
          row.id,
          row.kind,
          originUrl,
          source,
          MAX_SIZE_ITEM
        )) as ManifestEntry & { __buffer: Buffer };

        const duplicate = hashToEntry.get(entry.hash);
        if (duplicate && localImageExists(duplicate)) {
          // Dédoublonnage : on ne stocke pas deux fois le même contenu.
          entry.file = duplicate.file;
          entry.duplicateOf = duplicate.id;
          duplicates++;
        } else {
          entry.file = `/images/items/${row.id}.webp`;
          writeImage(`public${entry.file}`, entry.__buffer);
        }

        delete (entry as ManifestEntry & { __buffer?: Buffer }).__buffer;
        hashToEntry.set(entry.hash, entry);
        byId.set(row.id, entry);
        manifest.entries = [...manifest.entries.filter((item) => item.id !== row.id), entry];
        downloaded++;

        if (downloaded % 20 === 0) {
          process.stdout.write(`  … ${downloaded} téléchargées\n`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        failures.push({ id: row.id, reason: message });
        if ((error as Error & { httpStatus?: number }).httpStatus === 403 || (error as Error & { httpStatus?: number }).httpStatus === 429) {
          throw error;
        }
      }
    }

    // ---------- Fond de carte ----------
    await downloadMap(manifest, hashToEntry);

    // ---------- Icônes de marqueurs ----------
    await downloadIcons(manifest);

    manifest.generatedAt = new Date().toISOString();
    manifest.entries.sort((a, b) => `${a.kind}:${a.id}`.localeCompare(`${b.kind}:${b.id}`));
    writeJson(MANIFEST_FILE, manifest);
    updatePublicImageFields(manifest);

    const report = {
      generatedAt: manifest.generatedAt,
      downloaded,
      skipped,
      duplicates,
      unavailable,
      failures,
      entries: manifest.entries.filter((entry) => entry.kind === 'weapon' || entry.kind === 'item').length,
      map: manifest.entries.filter((entry) => entry.kind === 'map_background').length,
      icons: manifest.entries.filter((entry) => entry.kind === 'map_icon').length,
    };
    writeJson(REPORT_FILE, report);
    printDownloadReport(manifest, report);
  } catch (error) {
    manifest.generatedAt = new Date().toISOString();
    writeJson(MANIFEST_FILE, manifest);
    updatePublicImageFields(manifest);
    const message = error instanceof Error ? error.message : String(error);
    const report = { aborted: true, reason: message, downloaded, skipped, duplicates, unavailable, failures };
    writeJson(REPORT_FILE, report);
    console.error(`\n⛔ ARRÊT IMMÉDIAT : ${message}`);
    console.error(`Rapport partiel écrit : ${REPORT_FILE}`);
    process.exitCode = 2;
  }
}

async function downloadMap(
  manifest: Manifest,
  hashToEntry: Map<string, ManifestEntry>
): Promise<void> {
  const existing = manifest.entries.find((entry) => entry.kind === 'map_background');
  if (existing && localImageExists(existing)) {
    console.log(`  fond de carte : déjà présent (${existing.file}), non retéléchargé`);
    return;
  }

  const candidates: Array<{ url: string; source: Source }> = [
    { url: `${EG_BASE}/art/robrun/map-looty-bay-hq.webp`, source: 'everygamestat.com' },
    { url: `${ROBRUN_BASE}/map/looty-bay.webp`, source: 'robrun.space' },
  ];

  for (const candidate of candidates) {
    try {
      const entry = (await downloadOne(
        'map_looty_bay_hq',
        'map_background',
        candidate.url,
        candidate.source,
        MAX_SIZE_MAP,
        {
          assetType: 'game-asset',
          note: 'Fond de carte Looty Bay (utilisé avec L.CRS.Simple en P6).',
        }
      )) as ManifestEntry & { __buffer: Buffer };

      const duplicate = hashToEntry.get(entry.hash);
      entry.file = duplicate ? duplicate.file : '/images/map/looty-bay-hq.webp';
      if (!duplicate) writeImage(`public${entry.file}`, entry.__buffer);
      delete (entry as ManifestEntry & { __buffer?: Buffer }).__buffer;
      manifest.entries = [...manifest.entries.filter((item) => item.kind !== 'map_background'), entry];
      console.log(`  fond de carte : ${candidate.source} (${humanBytes(entry.bytes)})`);
      return;
    } catch (error) {
      const status = (error as Error & { httpStatus?: number }).httpStatus;
      if (status === 403 || status === 429) throw error;
      console.warn(`  fond de carte indisponible sur ${candidate.source} : ${(error as Error).message}`);
    }
  }
  console.warn('  ⚠️ aucun fond de carte téléchargé (les deux sources ont échoué)');
}

async function downloadIcons(manifest: Manifest): Promise<void> {
  const existingIcons = manifest.entries.filter((entry) => entry.kind === 'map_icon');
  if (existingIcons.length > 0 && existingIcons.every(localImageExists)) {
    console.log(`  icônes de carte : ${existingIcons.length} déjà présentes, non retéléchargées`);
    return;
  }

  const page = await request(`${ROBRUN_BASE}/map`, 'GET');
  if (!page.ok || !page.buffer) {
    console.warn(`  ⚠️ page carte robrun.space inaccessible (HTTP ${page.status}), icônes non importées`);
    return;
  }
  const html = page.buffer.toString('utf-8');
  const paths = [...new Set([...html.matchAll(/\/map\/icons\/[A-Za-z0-9_-]+\.webp/g)].map((m) => m[0]))].sort();

  console.log(`  icônes de carte : ${paths.length} trouvées sur robrun.space`);
  for (const iconPath of paths) {
    const id = `map_icon_${path.basename(iconPath, '.webp')}`;
    const existing = manifest.entries.find((entry) => entry.id === id);
    if (existing && localImageExists(existing)) continue;

    try {
      const entry = (await downloadOne(
        id,
        'map_icon',
        `${ROBRUN_BASE}${iconPath}`,
        'robrun.space',
        MAX_SIZE_ICON,
        {
          assetType: 'fan-site-icon',
          note: "Icône de marqueur dessinée par le site fan robrun.space — pas un asset officiel du jeu.",
        }
      )) as ManifestEntry & { __buffer: Buffer };
      entry.file = `/images/map/icons/${path.basename(iconPath)}`;
      writeImage(`public${entry.file}`, entry.__buffer);
      delete (entry as ManifestEntry & { __buffer?: Buffer }).__buffer;
      manifest.entries = [...manifest.entries.filter((item) => item.id !== id), entry];
    } catch (error) {
      const status = (error as Error & { httpStatus?: number }).httpStatus;
      if (status === 403 || status === 429) throw error;
      console.warn(`  icône ${iconPath} indisponible : ${(error as Error).message}`);
    }
  }
}

function updatePublicImageFields(manifest: Manifest): void {
  const imageById = new Map<string, string>();
  for (const entry of manifest.entries) {
    if (entry.kind === 'weapon' || entry.kind === 'item') imageById.set(entry.id, entry.file);
  }

  for (const file of ['weapons.json', 'items.json'] as const) {
    const data = readJson<Record<string, { id: string; image: string | null }>>(`public/data/${file}`);
    let updated = 0;
    for (const id of Object.keys(data)) {
      const image = imageById.get(id) ?? null;
      if (data[id]?.image !== image) {
        data[id]!.image = image;
        updated++;
      }
    }
    if (updated > 0) {
      writeJson(`public/data/${file}`, data);
      console.log(`  ${file} : ${updated} champ(s) image mis à jour`);
    }
  }
}

interface DownloadReport {
  downloaded: number;
  skipped: number;
  duplicates: number;
  unavailable: number;
  failures: Array<{ id: string; reason: string }>;
}

function printDownloadReport(manifest: Manifest, report: DownloadReport): void {
  const weapons = readJson<Record<string, { category?: string | null; image: string | null }>>(
    'public/data/weapons.json'
  );
  const items = readJson<Record<string, { category?: string | null; image: string | null }>>(
    'public/data/items.json'
  );

  const totalBytes = manifest.entries.reduce((sum, entry) => sum + entry.bytes, 0);

  console.log('\n=== Rapport de téléchargement ===');
  console.log(
    `téléchargées ${report.downloaded}, reprises ${report.skipped}, doublons ${report.duplicates}, ` +
      `sans source ${report.unavailable}, échecs ${report.failures.length}`
  );

  const weaponIds = Object.keys(weapons);
  const weaponWithImage = weaponIds.filter((id) => weapons[id]?.image).length;
  const itemIds = Object.keys(items);
  const itemWithImage = itemIds.filter((id) => items[id]?.image).length;
  console.log(
    `Armes : ${weaponWithImage}/${weaponIds.length} avec image (${((weaponWithImage / weaponIds.length) * 100).toFixed(1)} %)`
  );
  console.log(
    `Items : ${itemWithImage}/${itemIds.length} avec image (${((itemWithImage / itemIds.length) * 100).toFixed(1)} %)`
  );

  const byCategory = new Map<string, { total: number; withImage: number }>();
  for (const id of itemIds) {
    const category = items[id]?.category ?? 'sans_categorie';
    const current = byCategory.get(category) ?? { total: 0, withImage: 0 };
    current.total++;
    if (items[id]?.image) current.withImage++;
    byCategory.set(category, current);
  }
  console.log('\nCouverture par catégorie d\'items :');
  for (const [category, values] of [...byCategory.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    console.log(
      `  ${category.padEnd(28)} ${values.withImage}/${values.total} (${((values.withImage / values.total) * 100).toFixed(1)} %)`
    );
  }

  const withoutImage = [
    ...weaponIds.filter((id) => !weapons[id]?.image).map((id) => `weapon:${id}`),
    ...itemIds.filter((id) => !items[id]?.image).map((id) => `item:${id}`),
  ];
  console.log(`\nSans image (${withoutImage.length}) :`);
  console.log(withoutImage.join(', '));

  if (report.failures.length > 0) {
    console.log('\nÉchecs (hors 403/429) :');
    for (const failure of report.failures) console.log(`  - ${failure.id} : ${failure.reason}`);
  }

  const publicImagesDir = abs(IMAGES_DIR);
  const totalFolderBytes = folderSize(publicImagesDir);
  const imageEntries = manifest.entries.filter((entry) => entry.kind === 'weapon' || entry.kind === 'item');
  const examples = imageEntries.filter((entry) => !entry.duplicateOf).slice(0, 5);

  console.log(`\nPoids des fichiers du manifest : ${humanBytes(totalBytes)}`);
  console.log(`Poids total de public/images : ${humanBytes(totalFolderBytes)}`);
  console.log('\nExemples de fichiers :');
  for (const example of examples) {
    console.log(
      `  ${example.id} → ${example.file} (${humanBytes(example.bytes)}, ${example.width}×${example.height}, ${example.source})`
    );
  }
  console.log(`\nManifest : ${MANIFEST_FILE}`);
  console.log(`Rapport JSON : ${REPORT_FILE}`);
}

function folderSize(relativeOrAbsolute: string): number {
  const directory = path.isAbsolute(relativeOrAbsolute) ? relativeOrAbsolute : abs(relativeOrAbsolute);
  if (!fs.existsSync(directory)) return 0;
  let total = 0;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) total += folderSize(full);
    else total += fs.statSync(full).size;
  }
  return total;
}

// ---------------------------------------------------------------------------
// Entrée
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  const mode = process.argv[2];
  if (mode === '--dry-run') {
    await dryRun();
  } else if (mode === '--download') {
    await download();
  } else {
    console.error('Usage : npm run import:images -- --dry-run | --download');
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('ERREUR :', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
