// coverage.csv generator — compare CSV ids against sitemap slugs of robrun.space and rob-run.app
// Run: node gen-coverage.mjs (no dependencies)
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

// Slugs découverts dans les sitemaps de robrun.space et rob-run.app
const robrunSpaceSlugs = new Set([
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
  'afak','action-camera','alcohol_1','alcohol_10','alcohol_11','alcohol_12','alcohol_13','alcohol_14','alcohol_15',
  'bolt-cutter','cargo-sheet','code-tablet','decoder','deposit-box-keys','drill','electronic-fuse','eviction-right',
  'glass-cutter','keycard-grand-hotel','keycard-police-station','keycard-cottage-no-3','keycard-art-gallery',
  'id-card-police-station','id-card-looty-bay-bank','master-key','painkillers','injector','usb-hacking-tool',
  'buletti-soltempra','romanov-r8','longhorn-van','longhorn-titan','longhorn-wild','royal-e','royal-j',
  'fukurou-tensa','big-egg-53','steel-plate','jammer','sports-bag','versatile-pouch',
  'contraband-workbench','cargo-workbench','chemical-reactor','lab-table','grow-table','industrial-freezer',
  'first-aid-cabinet','small-safe','medium-safe','large-safe','small-nightstand','medium-nightstand','large-nightstand',
  'small-security-cabinet','medium-security-cabinet','large-security-cabinet','collection-table','alarm-system',
  'evidence','police-radio','sergeants-badge','lieutenants-badge','captains-badge','code-tablet',
  'car-garage','large-car-garage','car-lift','helipad','trailer','small-house','farm-fence','mesh-fence',
  'metal-fence','concrete-fence','workshop','warehouse','land-plot-title','settlement-title','grow-room',
  'chemical-laboratory'
]);

const robRunAppSlugs = new Set([
  'weapons','wiki','cargo','fence','beginner-guide','how-to-make-money','jail-time','roles-and-death',
  'server-status','servers','updates','error-codes','faq','about','contact','privacy','terms','wipe','bank','decoder'
]);

function normalizeIdToSlug(id) {
  let s = id.toLowerCase();
  s = s.replace(/^weapon_/, '');
  s = s.replace(/_/g, '-');
  const map = {
    'm249-m2': 'lm-249-mk2',
    'dp-9-m1': 'dp-9-mk1',
    'tag12-m1': 'tag-12k-mk1',
    'vulture-m1': 'vulture-50-mk1',
    'vulture-m2': 'vulture-50-mk2',
    'jp7-m1': 'jp-7-mk1',
    'jp7-m2': 'jp-7-mk2',
    'jp7-m3': 'jp-7-mk3',
    'lbr44-m1': 'lbr-44-mk1',
    'ordr12-m1': 'ordr-12-mk1',
    'rc556-m1': 'rc-5-56-mk1',
    'starh-m1': 'star-h-mk1',
    'cb45-m1': 'cb45-mk1',
    'harris500-m1': 'harris-500-mk1',
    'kl545-m1': 'kl-545-mk1',
    'mc10-m1': 'mc-10-mk1',
    'srreaper-m1': 'sr-reaper-mk1',
    'apscalar-m1': 'ap-scalar-mk1'
  };
  if (map[s]) return map[s];
  return s;
}

const weapons = parseCsv(readFileSync('data/raw/weapons.csv', 'utf8'));
const items = parseCsv(readFileSync('data/raw/items.csv', 'utf8'));

const rows = [];

function check(id, slug) {
  const found = [];
  let matchedUrl = '';
  let matchMethod = '';
  if (robrunSpaceSlugs.has(slug)) {
    found.push('robrun.space');
    matchedUrl = `https://www.robrun.space/items/${slug}/`;
    matchMethod = 'slug-normalized';
  }
  if (robRunAppSlugs.has(slug)) {
    found.push('rob-run.app');
    if (!matchedUrl) matchedUrl = `https://rob-run.app/weapons`;
    matchMethod = matchMethod ? matchMethod + '+section' : 'section-only';
  }
  return { id, found_on_sites: found.join(','), matched_url: matchedUrl, match_method: matchMethod || 'none' };
}

for (const w of weapons) rows.push(check(w.id, normalizeIdToSlug(w.id)));
for (const it of items) rows.push(check(it.id, normalizeIdToSlug(it.id)));

const total = rows.length;
const covered = rows.filter(r => r.found_on_sites).length;
const pct = ((covered / total) * 100).toFixed(1);

const header = 'id,found_on_sites,matched_url,match_method\n';
const csv = header + rows.map(r => `${r.id},${r.found_on_sites},${r.matched_url},${r.match_method}`).join('\n');
writeFileSync('data/recon/coverage.csv', csv);
console.log(`Coverage: ${covered}/${total} = ${pct}%`);
console.log('Written to data/recon/coverage.csv');
