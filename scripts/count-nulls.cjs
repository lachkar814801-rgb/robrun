const fs = require('fs');
const weapons = JSON.parse(fs.readFileSync('public/data/weapons.json','utf8'));
const items = JSON.parse(fs.readFileSync('public/data/items.json','utf8'));
const mapPoints = JSON.parse(fs.readFileSync('public/data/mapPoints.json','utf8'));

function nullCounts(obj) {
  const counts = {};
  for (const id of Object.keys(obj)) {
    const v = obj[id];
    for (const k of Object.keys(v)) {
      if (v[k] === null || v[k] === undefined) {
        counts[k] = (counts[k] || 0) + 1;
      }
    }
  }
  return counts;
}

console.log('=== RAPPORT DE COMPTAGE PAR COLLECTION ===');
console.log('');
console.log('weapons — total:', Object.keys(weapons).length);
console.log('  null par champ:', JSON.stringify(nullCounts(weapons)));
console.log('');
console.log('items — total:', Object.keys(items).length);
console.log('  null par champ:', JSON.stringify(nullCounts(items)));
console.log('');
console.log('mapPoints — total:', Object.keys(mapPoints).length);
console.log('  null par champ:', JSON.stringify(nullCounts(mapPoints)));
