// coverage.csv - génération réelle avec HEAD requests sur les images robrun.space
// 1 requête/seconde, HEAD uniquement, aucun téléchargement en masse
import { readFileSync, writeFileSync } from 'fs';

function parseCsv(text) {
  const lines = text.trim().split('\n');
  const header = lines[0].split(',');
  return lines.slice(1).filter(l => l.trim()).map(l => {
    const vals = l.split(',');
    const obj = {};
    header.forEach((h, i) => obj[h] = vals[i] || '');
    return obj;
  });
}

const weapons = parseCsv(readFileSync('data/raw/weapons.csv', 'utf8'));
const items = parseCsv(readFileSync('data/raw/items.csv', 'utf8'));

const egJson = JSON.parse(readFileSync('data/recon/_items.json', 'utf8'));
const egIds = new Set(egJson.items.map(i => i.id));

const sitemapSlugs = new Set([
  'ap-scalar-mk1','ap-scalar-mk2','ap-scalar-mk3',
  'drm-14-mk1','drm-14-mk2','drm-14-mk3',
  'sr-reaper-mk1','sr-reaper-mk2','sr-reaper-mk3',
  'tag-12k-mk1','tag-12k-mk2','tag-12k-mk3',
  'vulture-50-mk1','vulture-50-mk2',
  'jp-7-mk1','jp-7-mk2','jp-7-mk3',
  'lbr-44-mk1','lbr-44-mk2',
  'ordr-12-mk1','ordr-12-mk2','ordr-12-mk3',
  'pdw90-mk1','pdw90-mk2','pdw90-mk3',
  'rc-5-56-mk1','rc-5-56-mk2','rc-5-56-mk3',
  'star-h-mk1','star-h-mk2','star-h-mk3',
  'cb45-mk1','cb45-mk2','cb45-mk3',
  'dp-9-mk1','dp-9-mk2',
  'harris-500-mk1','harris-500-mk2','harris-500-mk3',
  'kl-545-mk1','kl-545-mk2','kl-545-mk3',
  'mc-10-mk1','mc-10-mk2','mc-10-mk3',
  'lm-249-mk2',
  'action-camera','afak','alcohol_1','alcohol_10','alcohol_11','alcohol_12','alcohol_13','alcohol_14','alcohol_15',
  'alcohol_box_1','antique_1','antique_2','antique_3','antique_4','antique_5','antique_6','antique_set_1',
  'armor_plate_1','bolt-cutter','cargo-sheet','code-tablet','decoder','deposit-box-keys','drill',
  'electronic-fuse','eviction-right','glass-cutter','keycard-grand-hotel','keycard-police-station',
  'keycard-cottage-no-3','keycard-art-gallery','id-card-police-station','id-card-looty-bay-bank',
  'master-key','painkillers','injector','usb-hacking-tool','buletti-soltempra','romanov-r8',
  'longhorn-van','longhorn-titan','longhorn-wild','royal-e','royal-j','fukurou-tensa','big-egg-53',
  'steel-plate','jammer','sports-bag','versatile-pouch','contraband-workbench','cargo-workbench',
  'chemical-reactor','lab-table','grow-table','industrial-freezer','first-aid-cabinet','small-safe',
  'medium-safe','large-safe','small-nightstand','medium-nightstand','large-nightstand',
  'small-security-cabinet','medium-security-cabinet','large-security-cabinet','collection-table',
  'alarm-system','evidence','police-radio','sergeants-badge','lieutenants-badge','captains-badge',
  'car-garage','large-car-garage','car-lift','helipad','trailer','small-house','farm-fence','mesh-fence',
  'metal-fence','concrete-fence','workshop','warehouse','land-plot-title','settlement-title','grow-room',
  'chemical-laboratory','mini-drill','banknote-counter'
]);

function normalizeIdToSlug(id) {
  let s = id.toLowerCase().replace(/^weapon_/, '').replace(/_/g, '-');
  const map = {
    'm249-m2': 'lm-249-mk2', 'dp-9-m1': 'dp-9-mk1', 'tag12-m1': 'tag-12k-mk1',
    'vulture-m1': 'vulture-50-mk1', 'vulture-m2': 'vulture-50-mk2', 'jp7-m1': 'jp-7-mk1',
    'jp7-m2': 'jp-7-mk2', 'jp7-m3': 'jp-7-mk3', 'lbr44-m1': 'lbr-44-mk1', 'ordr12-m1': 'ordr-12-mk1',
    'rc556-m1': 'rc-5-56-mk1', 'starh-m1': 'star-h-mk1', 'cb45-m1': 'cb45-mk1', 'harris500-m1': 'harris-500-mk1',
    'kl545-m1': 'kl-545-mk1', 'mc10-m1': 'mc-10-mk1', 'srreaper-m1': 'sr-reaper-mk1', 'apscalar-m1': 'ap-scalar-mk1',
    'weapon_drm14_mk2': 'drm-14-mk2', 'weapon_drm14_mk3': 'drm-14-mk3', 'weapon_tag12_mk2': 'tag-12k-mk2',
    'weapon_tag12_mk3': 'tag-12k-mk3', 'weapon_lbr44_mk2': 'lbr-44-mk2', 'weapon_dp9_mk2': 'dp-9-mk2'
  };
  return map[s] || s;
}

const allEntries = [];
for (const w of weapons) allEntries.push({ id: w.id, kind: 'weapon' });
for (const it of items) allEntries.push({ id: it.id, kind: 'item' });

const results = [];

async function headImage(id) {
  const candidates = [
    `https://www.robrun.space/items/${id}.webp`,
    `https://www.robrun.space/items/${normalizeIdToSlug(id)}.webp`
  ];
  let lastStatus = 'ERR';
  let lastSize = '?';
  let lastUrl = `https://www.robrun.space/items/${id}.webp`;
  for (const url of candidates) {
    try {
      const r = await fetch(url, { method: 'HEAD' });
      lastStatus = r.status;
      lastSize = r.headers.get('content-length') || '?';
      lastUrl = url;
      if (r.status === 200) {
        return { status: r.status, size: lastSize + ' o', url };
      }
    } catch (e) { /* essayer le suivant */ }
  }
  return { status: lastStatus, size: lastSize, url: lastUrl };
}

async function process() {
  for (const entry of allEntries) {
    const id = entry.id;
    const kind = entry.kind;
    const slug = normalizeIdToSlug(id);

    const img = await headImage(id);
    const robrun_space_image = img.status === 200 ? `OK (${img.size})` : `HTTP ${img.status}`;
    const everygamestat_json = egIds.has(id) ? 'OUI' : 'NON';
    const robrun_space_sitemap = sitemapSlugs.has(slug) ? 'OUI' : 'NON';

    results.push({ id, kind, robrun_space_image, everygamestat_json, robrun_space_sitemap });

    // 1 requête/seconde
    await new Promise(r => setTimeout(r, 1100));
  }

  const header = 'id,kind,robrun_space_image,everygamestat_json,robrun_space_sitemap\n';
  const rows = results.map(r => `${r.id},${r.kind},${r.robrun_space_image},${r.everygamestat_json},${r.robrun_space_sitemap}`).join('\n');
  writeFileSync('data/recon/coverage.csv', header + rows);

  const totalCount = results.length;
  const withImage = results.filter(r => r.robrun_space_image.startsWith('OK')).length;
  const inEg = results.filter(r => r.everygamestat_json === 'OUI').length;
  const inSitemap = results.filter(r => r.robrun_space_sitemap === 'OUI').length;
  const noImage = results.filter(r => !r.robrun_space_image.startsWith('OK')).map(r => r.id);

  console.log(`=== COUVERTURE RÉELLE ===`);
  console.log(`Total: ${totalCount}`);
  console.log(`Avec image robrun.space: ${withImage} (${((withImage/totalCount)*100).toFixed(1)}%)`);
  console.log(`Dans everygamestat items.json: ${inEg} (${((inEg/totalCount)*100).toFixed(1)}%)`);
  console.log(`Dans sitemap robrun.space: ${inSitemap} (${((inSitemap/totalCount)*100).toFixed(1)}%)`);
  console.log(`IDs sans image robrun.space (${noImage.length}):`);
  console.log(noImage.join(', '));
  writeFileSync('data/recon/_no_image_ids.txt', noImage.join('\n'));
}

process().catch(e => { console.error('ERREUR:', e.message); });
