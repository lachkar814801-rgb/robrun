# 🤖 ROB RUN Companion — Règles pour l'agent (AGENTS.md)

Ce fichier contient les règles permanentes appliquées à tout travail sur ce projet. Elles sont extraites du PROMPT_MAITRE.txt et du ROBRUN_COMPANION_GUIDE.md.

---

## 1. Règles non négociables

1. **Ne jamais générer d'images** (ni IA, ni SVG décoratifs de remplacement pour les objets du jeu). Toutes les images du jeu viennent des sources, sont téléchargées en local dans `public/images/`, et le site n'utilise jamais de lien externe en production. Si une image est introuvable : cadre neutre « image à venir » + entrée dans le rapport.
2. **Respecter `data/recon/REPORT.md`, `RISKS.md`, `DATA-STRATEGY.md`** (déjà validés). Si un site interdit le scraping, on ne le scrappe pas.
3. **Ne jamais inventer de donnée de jeu.** Une donnée absente = `null` et marquée « non disponible » dans l'UI.
4. **Les guides ne sont PAS copiés mot pour mot** : ils sont réécrits avec ses propres mots (ou résumés + lien source). Chaque guide cite ses sources.
5. **Travailler par phases.** À la fin de chaque phase : `npm run build` + `npm run validate-data`, résumé court, et attendre le « go » de l'utilisateur.
6. **Avant d'utiliser une librairie, consulter la doc à jour via Context7.**
7. **Ne jamais écrire de secrets ni de clés dans le code.** Pas d'installation globale sans le dire à l'utilisateur.
8. **Traduction obligatoire** : le site existe en 3 langues seulement, EN (référence), FR (défaut) et AR (RTL complet). Aucun russe n'apparaît dans l'interface ni dans les JSON publics. Aucune chaîne visible ne peut exister dans une seule langue : ajouter toutes les traductions.
9. **Aucun projet React n'est créé tant que l'utilisateur n'en donne pas l'ordre explicite.**

---

## 2. Stack

Vite + React 18 + TypeScript strict + Tailwind CSS + React Router + react-i18next (détection langue + persistance + `dir="rtl"` pour l'arabe) + Fuse.js + Leaflet (carte sur image du jeu avec `L.CRS.Simple`) + Zustand (favoris, langue, devise) + sharp et tsx pour les scripts. Pas de backend : données en JSON statique dans `public/data/`. Config `vercel.json` avec rewrites SPA.

---

## 3. Données de départ (`data/raw/`, ne jamais modifier)

- `weapons.csv` : 46 armes, 17 familles × Mk1–Mk3. Colonnes utiles : id, name_en, damage, headshot_damage (= ×1,5), rounds_per_minute, magazine, full_damage_range_m, damage_per_second (recalculable : dégâts × cadence / 60), url, source. La colonne `name_ru` est ignorée.
- `items.csv` : 563 items, 23 catégories, 5 raretés (6 avec « rare » pour mise à jour future). 184 items sans rareté ni prix (non vendables) : afficher « non vendable ». 45 noms anglais en double : la clé est toujours l'id. Prix fence min/max en USD. Les catégories/raretés sont en russe dans le CSV (`category_ru`, `rarity`) : voir TRADUCTION et `data/key-map.json`.
- `map-points.csv` : 927 points, 4 quartiers, 28 bâtiments, 9 types techniques. Aucune coordonnée, et `loot_entries` est un simple 0/1. `district_ru` et `building_ru` sont en russe : voir TRADUCTION.
- Véhicules et upgrades : amorce dans `items.csv` (catégories Vehicles, Vehicle upgrades, Workbenches & upgrades), à enrichir par import.

---

## 4. Traduction (EN / FR / AR)

### A. Clés normalisées
Les CSV contiennent du russe uniquement pour catégories, raretés, quartiers et bâtiments. Lire ces valeurs une fois pour créer `data/key-map.json` (valeur CSV → clé anglaise). Le russe ne doit apparaître nulle part ailleurs que dans ce fichier d'import. Tout le reste du projet n'utilise que les clés anglaises.

**Quartiers** (source : everygamestat robrun.json `map.districts`) :
- `sunny_beach` : Sunny Beach / Sunny Beach / سني بيتش
- `downtown` : Downtown / Downtown / داونتاون
- `loraine_hills` : Loraine Hills / Loraine Hills / لوراين هيلز (correction : pas « Loren Hills »)
- `palmside` : Palmside / Palmside / بالمسايد (correction : pas « Parkside »)

**Raretés** (6 niveaux, « rare » ajouté pour mise à jour future) :
- `common` : Common / Commun / عادي
- `uncommon` : Uncommon / Peu commun / غير شائع
- `rare` : Rare / Rare / نادر (absent du CSV, présent dans everygamestat)
- `epic` : Epic / Épique / ملحمي
- `legendary` : Legendary / Légendaire / أسطوري
- `exotic` : Exotic / Exotique / غريب

### B. Glossaire `data/glossary.json`
Un objet par terme `{key, en, fr, ar, note}`. Remplir pour toutes les catégories, raretés, quartiers, types de points de carte, bâtiments et libellés d'interface.

### C. Règles de traduction
- Noms propres du jeu (armes, marques, bouteilles, bâtiments dont le nom est une marque, véhicules) : restent en alphabet latin dans les 3 langues. En AR on garde le nom latin tel quel, on ne le translittère pas.
- FR : français standard, vocabulaire gaming courant (« loot », « upgrade » restent). AR : arabe standard moderne simple pour l'interface ; la derja tunisienne est réservée aux micro-textes (chargement, 404, favoris vides, succès). Chiffres occidentaux (0-9) en AR. Montants avec `Intl.NumberFormat` et devise USD ou TND (د.ت).
- Pluriels : utiliser les règles de pluriel d'i18next (l'arabe a 6 formes : zero, one, two, few, many, other) pour tous les compteurs.
- Cohérence : un même terme = une même traduction partout (le glossaire fait foi).

### D. Fichiers et structure
`src/i18n/en.json`, `fr.json`, `ar.json` avec EXACTEMENT les mêmes clés. Les données de jeu (items, armes, lieux) stockent des clés, pas du texte traduit ; l'UI résout via le glossaire. URLs préfixées par langue (`/en`, `/fr`, `/ar`), balises hreflang, `<html lang>` et `dir` mis à jour au changement de langue, choix mémorisé.

### E. Contrôle automatique (`validate-data.ts`)
Échoue le build si :
1. Une clé manque dans une des 3 langues.
2. Un terme du glossaire a une traduction vide.
3. Une catégorie/rareté/quartier/type/bâtiment du JSON n'existe pas dans le glossaire.
4. Du texte cyrillique est trouvé dans `public/` ou `src/`.
5. Une chaîne AR contient uniquement du latin alors qu'elle n'est pas un nom propre.
6. Un guide manque dans une langue.

---

## 5. Pipeline de données (`scripts/`)

1. `import-csv.ts` : CSV → JSON normalisé (weapon, item, mapPoint, vehicle, upgrade), clés = id, champs optionnels = null, rareté/catégorie/quartier/bâtiment/type en clés anglaises via `data/key-map.json`.
2. `build-i18n.ts` : lit `glossary.json`, génère les fichiers de langue et vérifie la parité EN/FR/AR.
3. `import-images.ts` : selon la stratégie validée dans le rapport (API/JSON → sitemap → og:image/img). Téléchargement local, WebP ≤ 512 px via sharp, nom = id, 1 req/s, User-Agent explicite, reprise sans retélécharger, dédoublonnage SHA-256, `images-manifest.json` (id, fichier, source, URL d'origine, date, hash), rapport de couverture (% par catégorie + manquants).
4. `import-map.ts` : image de la carte du jeu (en local) + coordonnées des points + liens loot ↔ lieu quand disponibles ; sinon null.
5. `validate-data.ts` : ids uniques, champs requis, cohérence dps/dégâts/cadence (tolérance 1), headshot, min ≤ max, images existantes, + tous les contrôles de la section TRADUCTION.

Scripts npm : `import:csv`, `import:images`, `import:map`, `i18n:build`, `validate-data`, `build`.

---

## 6. Droits et UI

- Afficher clairement : « Projet de fans non officiel, non affilié aux développeurs de ROB RUN ».
- Page Crédits listant uniquement les sources réellement utilisées.
- Contact pour demander le retrait d'un contenu.
- Ne pas monétiser (pubs, vente) sans vérifier les conditions des sources et du studio.

---

## 7. Phases (STOP + validation après chacune)

- P2 : Squelette (Vite/React/TS/Tailwind/i18n EN-FR-AR + RTL/router/AGENTS.md/vercel.json)
- P3 : Import CSV + key-map + glossaire complet EN/FR/AR + validation + i18n-review.md
- P4 : Importateur d'images + rapport de couverture
- P5 : Pages Armes, Items, Véhicules, Upgrades, Database
- P6 : Carte (image, coordonnées, loot par point)
- P7 : Guides et astuces en EN/FR/AR (réécrits, sources créditées)
- P8 : Thème tunisien + derja + À propos/crédits + revue i18n finale
- P9 : Tests, Lighthouse, accessibilité, README de déploiement Vercel
