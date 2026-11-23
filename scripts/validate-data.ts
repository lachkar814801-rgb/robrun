import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

function exists(relativePath: string): boolean {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function main() {
  const errors: string[] = [];

  // (a) Parité des clés EN/FR/AR dans src/i18n/
  const langs = ['en', 'fr', 'ar'] as const;
  const translations: Record<string, Record<string, unknown>> = {};

  for (const lang of langs) {
    const filePath = `src/i18n/${lang}.json`;
    if (!exists(filePath)) {
      errors.push(`[i18n] Fichier manquant : ${filePath}`);
      continue;
    }
    try {
      translations[lang] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (err) {
      errors.push(`[i18n] JSON invalide dans ${filePath} : ${err}`);
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

    if (missingInFr.length > 0) {
      errors.push(`[i18n] Clés manquantes en FR : ${missingInFr.join(', ')}`);
    }
    if (missingInAr.length > 0) {
      errors.push(`[i18n] Clés manquantes en AR : ${missingInAr.join(', ')}`);
    }
    if (extraInFr.length > 0) {
      errors.push(`[i18n] Clés supplémentaires en FR : ${extraInFr.join(', ')}`);
    }
    if (extraInAr.length > 0) {
      errors.push(`[i18n] Clés supplémentaires en AR : ${extraInAr.join(', ')}`);
    }
  }

  // (b) Absence de cyrillique dans src/ et public/
  const cyrillicRegex = /[\u0400-\u04FF]/;
  const dirs = ['src', 'public'];
  for (const dir of dirs) {
    if (!exists(dir)) continue;
    for (const file of walk(dir)) {
      if (!file.endsWith('.ts') && !file.endsWith('.tsx') && !file.endsWith('.json') && !file.endsWith('.html') && !file.endsWith('.css')) continue;
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (cyrillicRegex.test(lines[i])) {
          errors.push(`[cyrillic] Texte cyrillique trouvé dans ${file}:${i + 1}`);
        }
      }
    }
  }

  // (c) Les 3 CSV de data/raw existent
  const csvFiles = ['weapons.csv', 'items.csv', 'map-points.csv'];
  for (const csv of csvFiles) {
    if (!exists(`data/raw/${csv}`)) {
      errors.push(`[data] Fichier CSV manquant : data/raw/${csv}`);
    }
  }

  if (errors.length > 0) {
    console.error('❌ validate-data (P2) a échoué :');
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  console.log('✅ validate-data (P2) réussi : parité i18n OK, pas de cyrillique, CSV présents.');
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

main();
