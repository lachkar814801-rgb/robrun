import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf-8'));
}

function writeJson(relativePath: string, data: unknown): void {
  fs.writeFileSync(path.join(ROOT, relativePath), JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

function main() {
  const glossary = readJson<Record<string, { en: string; fr: string; ar: string; note?: string }>>(
    'data/glossary.json'
  );

  // Charger les fichiers i18n existants (textes d'interface)
  const existing: Record<string, Record<string, string>> = {};
  for (const lang of ['en', 'fr', 'ar']) {
    try {
      existing[lang] = readJson(`src/i18n/${lang}.json`);
    } catch {
      existing[lang] = {};
    }
  }

  const result: Record<string, Record<string, string>> = { en: {}, fr: {}, ar: {} };

  for (const [key, entry] of Object.entries(glossary)) {
    result.en[key] = entry.en;
    result.fr[key] = entry.fr;
    result.ar[key] = entry.ar;
  }

  // Fusionner avec les textes d'interface existants (ne pas écraser les clés du glossaire)
  for (const lang of ['en', 'fr', 'ar']) {
    for (const [k, v] of Object.entries(existing[lang])) {
      if (!(k in result[lang])) {
        result[lang][k] = v;
      }
    }
  }

  // Trier les clés pour un fichier lisible
  for (const lang of ['en', 'fr', 'ar']) {
    const sorted: Record<string, string> = {};
    Object.keys(result[lang])
      .sort()
      .forEach((k) => {
        sorted[k] = result[lang][k];
      });
    writeJson(`src/i18n/${lang}.json`, sorted);
  }

  console.log(
    `build-i18n: glossary ${Object.keys(glossary).length} entrées → src/i18n/{en,fr,ar}.json`
  );
  console.log(`  EN: ${Object.keys(result.en).length} clés`);
  console.log(`  FR: ${Object.keys(result.fr).length} clés`);
  console.log(`  AR: ${Object.keys(result.ar).length} clés`);
}

main();
