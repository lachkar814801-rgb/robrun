# 🇹🇳 ROB RUN Companion — Guide complet

Ordre du document :
1. Analyse de tes 3 CSV
2. Plugins / MCP pour OpenCode (et comment les faire installer par OpenCode)
3. Architecture React + Vercel
4. Sources de données et importateur d'images
5. Touche tunisienne
6. Étapes de développement
7. **PROMPT 1 — Reconnaissance (OpenCode explore avant de créer)**
8. **PROMPT 2 — Prompt maître (création du projet)**

---

## 1. Analyse des CSV

Les 3 fichiers viennent tous de **robrunwiki.com** (colonne `source`), un site qui n'est pas dans ta liste : ajoute-le comme source n°9.

### weapons.csv — 46 lignes, 11 colonnes
- Colonnes : `id, name_ru, name_en, damage, headshot_damage, rounds_per_minute, magazine, full_damage_range_m, damage_per_second, url, source`
- 17 familles d'armes (AP Scalar, CB45, DP-9, DRM-14, Harris 500, JP-7, KL-545, LBR-44, LM 249, MC-10, ORDR-12, PDW90, RC 5.56, SR Reaper, STAR-H, TAG-12K, Vulture 50), chacune en Mk1 / Mk2 / Mk3.
- Aucune valeur manquante, aucun id en double.
- Dégâts de 9 à 36, cadence de 120 à 1000 coups/min, chargeur de 5 à 200, portée pleins dégâts de 7 à 100 m, DPS de 18 à 233.
- Le headshot est toujours **×1,5** les dégâts de base (14→21, 34→51, 18→27).
- `damage_per_second` = dégâts × cadence ÷ 60, arrondi (écart max de 1 sur toutes les lignes) : on peut le recalculer au lieu de le stocker.
- Les Mk1/Mk2/Mk3 d'une même famille ont souvent les **mêmes stats** : seuls le chargeur et la portée changent (ex. AP Scalar : 25 → 25 → 45 balles).
- Arme la plus forte en DPS : AP Scalar (233), puis SR Reaper (213).
- Il manque : type d'arme (SMG, fusil, sniper…), munitions utilisées, prix, rareté, images.

### items.csv — 563 lignes, 9 colonnes
- Colonnes : `id, name_ru, name_en, category_ru, rarity, fence_price_min_usd, fence_price_max_usd, url, source`
- 23 catégories. Les plus grosses : Valuables (stolen) 199, Cargo 64, Weapons 54, Misc 38, Laboratory 26.
- Raretés : Common 22, Uncommon 129, Epic 127, Legendary 83, Exotic 18.
- **184 lignes sans rareté ni prix** : surtout cargos, meubles, établis, NPC, laboratoire. Ce sont des objets non vendables, pas des erreurs : l'UI doit afficher « non vendable » plutôt que 0 $.
- Prix revendeur (fence) : 10 $ à 6 000 000 $ (Romanov R8, Buletti Soltempra). Le prix max vaut toujours environ **1,5 × le prix min**.
- **45 noms anglais en double** avec des ids différents (ex. `cupboard` et `cupboard_kitchen`, les alarmes) : l'id est la seule clé fiable, jamais le nom.
- Les catégories Vehicles (11), Vehicle upgrades (17) et Workbenches & upgrades (17) te donnent déjà une base pour les pages **véhicules** et **upgrades**.

### map-points.csv — 927 lignes, 9 colonnes
- Colonnes : `id, type, name_ru, name_en, district_ru, building_ru, loot_entries, url, source`
- 4 quartiers : Sunny Beach 341, Downtown 297, Parkside 154, Loren Hills 135. 28 bâtiments distincts. 113 points sans bâtiment.
- 9 types, ce sont des noms de classes du jeu (RandomLootView 330, LootNodeView 293, ContainerEntityView 208, LootObjectView 27, AccessEntityView 20, CumulativeChargerView 17, LocationEventCargoContainerView 14, CashWithdrawalEntityView 14, CashLootNodeView 4) : à traduire en libellés lisibles (Coffre, Coffre-fort, Distributeur…).
- **Aucune coordonnée (x, y)** : tu ne peux pas encore afficher de vrais points sur une carte. Il faut les récupérer sur les sites (c'est le travail de l'importateur).
- `loot_entries` ne vaut que 0 ou 1 : c'est un indicateur, pas une liste. **Rien ne relie un point de la carte aux objets qu'on y trouve.** Le détail du loot par point doit venir du scraping.
- Beaucoup de points identiques répétés (ex. 102 « Cabinet / container », 54 « Safe »), donc regrouper par bâtiment et par type.

### Ce qui manque dans les 3 fichiers
Images, coordonnées de carte, liens loot ↔ lieu, traductions FR/AR, véhicules détaillés, upgrades détaillés, guides. L'importateur et le prompt ci-dessous couvrent tout ça.

### Traductions de base (EN → FR / AR)

La langue de référence est l'**anglais** : les trois langues du site sont EN, FR et AR (aucun russe dans l'interface).

| EN | FR | AR |
|---|---|---|
| Valuables (stolen) | Objets de valeur (volés) | مسروقات ثمينة |
| Cargo | Cargos | شحنات |
| Weapons | Armes | أسلحة |
| Misc | Divers | متنوع |
| Laboratory | Laboratoire | مختبر |
| Furniture & objects | Meubles et objets | أثاث وأغراض |
| House & plot | Maison et terrain | منزل وأرض |
| Workbenches & upgrades | Établis et upgrades | طاولات عمل وتحسينات |
| Vehicle upgrades | Upgrades véhicule | تحسينات المركبات |
| Buildings | Constructions | مبانٍ |
| Medical | Médical | طبّ |
| Vehicles | Véhicules | مركبات |
| NPC | PNJ | شخصيات غير لاعبة |
| Weapon maintenance | Entretien d'armes | صيانة الأسلحة |
| Lockpicking tools | Outils de crochetage | أدوات الاقتحام |
| Cumulative items | Objets cumulatifs | عناصر تراكمية |
| Armor | Armure | دروع |
| Keys | Clés | مفاتيح |
| Protection | Protection | حماية |
| Documents | Documents | وثائق |
| Ammo | Munitions | ذخيرة |
| Grenades | Grenades | قنابل يدوية |
| Tools | Outils | أدوات |
| Common | Commun | عادي |
| Uncommon | Peu commun | غير شائع |
| Epic | Épique | ملحمي |
| Legendary | Légendaire | أسطوري |
| Exotic | Exotique | غريب |
| Sunny Beach | Sunny Beach | سني بيتش |
| Downtown | Downtown | داونتاون |
| Parkside | Parkside | بارك سايد |
| Loren Hills | Loren Hills | لورين هيلز |

**Note technique (import uniquement)** : les CSV n'ont pas de colonne anglaise pour les catégories, raretés et quartiers (seulement `category_ru`, `rarity`, `district_ru`, `building_ru`). L'importateur doit donc convertir une seule fois ces valeurs en clés anglaises (`valuables_stolen`, `uncommon`, `sunny_beach`…) via un fichier `data/key-map.json`, puis tout le site n'utilise que ces clés EN. Les noms d'objets, d'armes et de lieux utilisent `name_en`.

Règle : les noms propres du jeu (armes, marques, bouteilles…) restent en anglais dans les 3 langues. On ne traduit que les catégories, raretés, quartiers, types de points et textes d'interface.

---

## 2. Plugins et MCP pour OpenCode

**Important** : dans OpenCode, ce que tu cherches s'appelle surtout des **serveurs MCP** (outils externes : navigateur, docs, fetch) et des **plugins npm** (listés dans `opencode.json`). Je ne peux pas garantir les noms exacts de tous les plugins communautaires ni leurs versions actuelles : c'est pourquoi la méthode ci-dessous demande à OpenCode de **vérifier lui-même avec `npm view` avant d'installer**.

### Les 4 MCP vraiment utiles pour ce projet
| Outil | Pourquoi | Config |
|---|---|---|
| **Playwright MCP** | Ouvrir les sites comme un vrai navigateur, repérer les appels JSON/API, télécharger les images, tester ton site | `npx @playwright/mcp@latest` |
| **Context7** | Docs à jour de React, Vite, Tailwind, i18next, Leaflet | `https://mcp.context7.com/mcp` (distant) |
| **Fetch** | Lire robots.txt, sitemaps, pages simples | `uvx mcp-server-fetch` (nécessite Python + uv) |
| **Sequential Thinking** | Planifier les grosses étapes (importateur, i18n) | `npx -y @modelcontextprotocol/server-sequential-thinking` |

Optionnels : GitHub MCP (si tu pousses sur GitHub avant Vercel), Firecrawl (scraping avancé, demande une clé API), serveur d'icônes/images si tu en as déjà un branché (tu l'utilises déjà sur d'autres projets).

### Méthode A (la meilleure) : OpenCode installe tout lui-même
Dans le dossier du projet (ex. `D:\robrun-companion`), lance `opencode` et colle ceci :

```
Tâche : préparer l'environnement OpenCode pour ce projet. Ne crée pas encore de code.

1. Crée/complète opencode.json à la racine avec le schéma https://opencode.ai/config.json et ces serveurs MCP :
   - playwright : type local, command ["npx","@playwright/mcp@latest"]
   - context7 : type remote, url https://mcp.context7.com/mcp
   - fetch : type local, command ["uvx","mcp-server-fetch"] (si uv n'est pas installé, installe-le ou dis-moi comment)
   - sequential-thinking : type local, command ["npx","-y","@modelcontextprotocol/server-sequential-thinking"]
2. Installe les navigateurs Playwright (npx playwright install chromium).
3. Cherche avec "npm view" (et la doc officielle opencode.ai/docs/plugins) s'il existe des plugins OpenCode maintenus et utiles pour : élagage du contexte sur longues sessions, notifications de fin de tâche, protection des fichiers .env. Pour chacun : donne le nom exact, la date de dernière publication, le nombre de téléchargements, et dis-moi s'il est fiable. N'installe aucun plugin dont tu n'as pas vérifié l'existence et la maintenance.
4. Pour les plugins vérifiés, ajoute-les au tableau "plugin" de opencode.json après m'avoir montré la liste et attendu mon accord.
5. Lance /mcp (ou la commande équivalente) pour confirmer que les 4 MCP sont connectés, puis affiche un rapport : ce qui marche, ce qui a échoué, ce qu'il me reste à faire à la main.
```

### Méthode B (manuelle) : fichier `opencode.json`
```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "playwright": { "type": "local", "command": ["npx", "@playwright/mcp@latest"], "enabled": true },
    "context7": { "type": "remote", "url": "https://mcp.context7.com/mcp", "enabled": true },
    "fetch": { "type": "local", "command": ["uvx", "mcp-server-fetch"], "enabled": true },
    "sequential-thinking": { "type": "local", "command": ["npx", "-y", "@modelcontextprotocol/server-sequential-thinking"], "enabled": true }
  }
}
```
Puis `npx playwright install chromium` dans un terminal. Le schéma de config peut évoluer : en cas d'erreur au démarrage, regarde opencode.ai/docs/mcp-servers.

### Fichiers de projet qu'OpenCode lit automatiquement
- `AGENTS.md` à la racine : règles permanentes (le prompt maître demande à OpenCode de le créer).
- `.opencode/` : agents et commandes personnalisés (optionnel).

---

## 3. Architecture React + Vercel

**Stack** : Vite + React 18 + TypeScript + Tailwind CSS + React Router + react-i18next (avec RTL pour l'arabe) + Fuse.js (recherche) + Leaflet (carte avec image du jeu) + Zustand (favoris, langue).
**Pas de backend** : tout est en JSON statique généré par les scripts, donc Vercel (gratuit) suffit.

```
robrun-companion/
├─ AGENTS.md
├─ opencode.json
├─ package.json
├─ vercel.json              # rewrites SPA
├─ data/
│  ├─ raw/                  # les 3 CSV d'origine, jamais modifiés
│  ├─ recon/                # rapports de reconnaissance
│  └─ glossary.json         # termes fixes FR/AR/EN
├─ scripts/
│  ├─ import-csv.ts         # CSV → JSON normalisé
│  ├─ recon-sites.ts        # découverte API/sitemaps/images
│  ├─ import-images.ts      # téléchargement + optimisation
│  ├─ import-map.ts         # coordonnées + loot par point
│  ├─ build-i18n.ts         # fr/ar/en
│  └─ validate-data.ts      # contrôles qualité
├─ public/
│  ├─ images/{weapons,items,vehicles,upgrades,map,ui}/
│  └─ data/*.json
├─ src/
│  ├─ app/ (router, layout, providers)
│  ├─ features/{weapons,items,map,vehicles,upgrades,guides,database,loot}/
│  ├─ components/ (Card, RarityBadge, PriceTag, SearchBar, LangSwitch, TunisianFooter…)
│  ├─ i18n/{fr,ar,en}.json
│  ├─ lib/ (search, format, rtl)
│  └─ styles/
└─ docs/ (SOURCES.md, DATA_MODEL.md, CREDITS.md)
```

### Modèle de données (JSON normalisé)
- `weapon` : id, family, mk, name, damage, headshot, rpm, magazine, rangeM, dps, image
- `item` : id, name, category, rarity (nullable), priceMin/priceMax (nullable), tradable (bool), image
- `mapPoint` : id, type, label, district, building, x/y (nullable tant que non importés), lootRefs[] (ids d'items, nullable)
- `vehicle`, `upgrade` : issus d'`items` (catégories Vehicles, Vehicle upgrades, Workbenches & upgrades) puis enrichis par scraping
- `guide` : id, slug, title (fr/ar/en), body, tags, sources[]

### Pages
Accueil · Armes (tri DPS, comparateur) · Objets (filtres rareté/catégorie/prix) · Loot (par objet : où le trouver) · Carte (quartiers, bâtiments, filtres) · Véhicules · Upgrades · Guides et astuces · Base de données (recherche globale) · À propos / crédits.

---

## 4. Sources de données et importateur d'images

### Ordre de priorité des sources
1. Tes 3 CSV (robrunwiki.com) = squelette des données.
2. Pour chaque site de ta liste, l'importateur teste **dans cet ordre** : endpoint JSON/API trouvé via Playwright (onglet réseau) → sitemap.xml → balises `og:image` et `<img>` des pages détail.
3. **Je ne peux pas te garantir que ces sites ont une API publique.** C'est pour ça que le Prompt 1 fait d'abord une reconnaissance : OpenCode te dira ce qui existe vraiment, et on choisit ensuite.

### Règles de l'importateur
- Tout est téléchargé **en local** dans `public/images/...`, jamais de lien externe dans `public/data` (les URLs de provenance restent hors du dossier public, dans `data/source-urls.json`), jamais d'image générée.
- Nom de fichier = `id` de l'objet (ex. `m249_m2.webp`), conversion en WebP (sharp), taille max 512 px.
- `images-manifest.json` : id → fichier, source, URL d'origine, date, hash SHA-256.
- Respect de robots.txt, 1 requête/seconde max, User-Agent clair, reprise après interruption (ne retélécharge pas ce qui existe).
- Rapport final : % d'objets avec image, liste des manquants (pas de placeholder inventé : un cadre neutre « image à venir »).
- Dédoublonnage par hash (plusieurs sites peuvent servir la même image).

### Point juridique à connaître
Les images et textes du jeu appartiennent à ses créateurs, et les sites sources ont leurs propres conditions. Pour un projet de fans non commercial :
- affiche clairement « Projet de fans non officiel, non affilié aux développeurs de ROB RUN » ;
- crédite chaque source dans `docs/CREDITS.md` et sur la page À propos ;
- **ne copie pas les guides mot pour mot** : fais-les **réécrire avec tes propres mots** (ou résume et renvoie vers la source) ;
- ne monétise pas (pubs, vente) sans vérifier les conditions des sources et du studio ;
- si un site interdit le scraping dans son robots.txt ou ses CGU, l'importateur l'ignore et te le signale.

---

## 5. Touche tunisienne 🇹🇳

- **Couleurs** : rouge drapeau `#E70013` et blanc, fond sombre pour le gaming, accent « sable/or de Carthage ».
- **Motifs** : discret motif géométrique de zellige ou de mosaïque en arrière-plan, croissant et étoile en filigrane, jasmin (symbole national) dans l'en-tête.
- **Signature visible** : en-tête « ROB RUN Companion — صنع في تونس 🇹🇳 », pied de page « Créé avec ❤️ en Tunisie par Rami » et page À propos « Le créateur » avec drapeau.
- **Langue** : en arabe, interface en arabe standard simple + micro-textes en **derja** (messages de chargement, 404, favoris) ; en français et en anglais, touches d'humour tunisien légères (ex. « Yezzi, cherche encore un peu… » pendant le chargement).
- **Devise** : prix toujours en **USD** (monnaie du jeu), aucune conversion, aucun sélecteur de devise. La touche tunisienne reste ailleurs (couleurs, textes, signature).
- **Easter egg** : code Konami ou 5 clics sur le logo qui affiche un message de derja et un drapeau animé.
- **Signature technique** : `<meta name="author">`, commentaire dans le HTML et `humans.txt` avec ton nom.

Garde un dosage subtil : le site doit rester lisible et professionnel pour tous les joueurs.

---

## 6. Étapes de développement

| Phase | Contenu | Livrable |
|---|---|---|
| 0 | Installer MCP/plugins (Méthode A) | opencode.json, MCP connectés |
| 1 | **Reconnaissance** (Prompt 1) | `data/recon/REPORT.md` validé par toi |
| 2 | Squelette Vite + React + TS + Tailwind + i18n + router + AGENTS.md | site vide qui build |
| 3 | Import CSV → JSON, validation, glossaire FR/AR/EN | `public/data/*.json` |
| 4 | Importateur d'images, optimisation, manifest | `public/images/**` + rapport |
| 5 | Pages Armes, Objets, Véhicules, Upgrades, Base de données | pages avec filtres/tri |
| 6 | Carte : image du jeu + coordonnées + loot par point | page Carte |
| 7 | Guides et astuces (réécrits, sources créditées) | page Guides |
| 8 | Thème tunisien, RTL arabe, derja, À propos/crédits | UI finale |
| 9 | Tests, Lighthouse, accessibilité, `vercel.json`, déploiement | URL Vercel |

À la fin de **chaque** phase : OpenCode lance `npm run build` et `npm run validate-data`, résume, et attend ton « go ».

Déploiement Vercel : pousse le dossier sur GitHub, importe le dépôt dans Vercel (preset Vite, build `npm run build`, sortie `dist`). Les images étant déjà dans `public/`, rien d'autre à configurer. Attention à la taille du dépôt : si les images dépassent quelques centaines de Mo, garde WebP ≤ 512 px.

---

## 7. PROMPT 1 — Reconnaissance (à coller en premier)

```
Tu es un ingénieur senior chargé de la reconnaissance AVANT toute création de projet.

RÈGLE ABSOLUE : tu ne crées AUCUN projet React, aucun composant, aucune image. Tu ne génères JAMAIS d'images. Tu travailles en local et en lecture seule sur le web ; tu n'écris que dans data/recon/.

CONTEXTE
Je prépare « ROB RUN Companion », un site de fans (React + Vercel) pour le jeu ROB RUN. J'ai 3 CSV dans data/raw/ (weapons.csv, items.csv, map-points.csv, issus de robrunwiki.com).

SITES À EXPLORER (utilise le MCP playwright, et fetch pour robots.txt/sitemaps) :
1. https://robrunfrance.fr/guides/
2. https://robrunguide.app/fr
3. https://rob-run.com/fr/
4. https://www.robrun.space/
5. https://robrun.pro/fr/guides/ref-tips
6. https://everygamestat.com/rob-run/tips
7. https://rob-run.app/
8. https://robrun-wiki.wiki/
9. https://robrunwiki.com/ (source des CSV)

POUR CHAQUE SITE, DOCUMENTE :
a) robots.txt, sitemap.xml, conditions d'utilisation si trouvées (peut-on scraper ? quelles restrictions ?).
b) Sections présentes : jeu/présentation, armes, items, loot, map, véhicules, upgrades, guides, trucs et astuces.
c) Via Playwright : les requêtes réseau (XHR/fetch) qui renvoient du JSON → liste des endpoints, avec un exemple de réponse (tronqué). Dis clairement s'il n'existe PAS d'API publique.
d) Structure des URLs d'images (CDN, chemins, formats, tailles) pour 3 exemples d'armes et 3 d'items.
e) Pour la carte : comment les marqueurs sont chargés (coordonnées, calques, tuiles ou image unique), et si la liste du loot par lieu est disponible.
f) Langues disponibles (en/fr/ar).
g) Qualité et fraîcheur du contenu (dates, version du jeu).

ENSUITE, FAIS LES CROISEMENTS
- Compare avec mes CSV : combien d'armes/items/points de carte sont trouvés sur chaque site ? Quels ids ou noms correspondent ? Quels trous ?
- Liste ce qui manque pour : véhicules, upgrades, loot par point, coordonnées.
- Pour chaque donnée (images, coordonnées, loot, guides), recommande LA meilleure source et une source de secours.

LIVRABLES (dans data/recon/) :
- REPORT.md : un chapitre par site + tableau comparatif + section « Ce que j'ai compris du jeu » (boucle de jeu, quartiers, types de loot, économie, véhicules, upgrades), en français, 1 à 2 pages max pour le résumé du jeu.
- endpoints.json : endpoints API découverts.
- image-patterns.json : patterns d'URL d'images par site.
- coverage.csv : id CSV → trouvé sur quels sites.
- RISKS.md : restrictions juridiques/techniques, ce qui est risqué ou impossible.

CONTRAINTES : 1 requête/seconde max par site, User-Agent explicite, respect de robots.txt (si un site l'interdit, ne le scrape pas et signale-le). N'invente aucune donnée : si tu ne trouves pas, écris « non trouvé ».

À LA FIN : affiche un résumé de 15 lignes maximum et ATTENDS MA VALIDATION. Ne passe pas à la création du projet.
```

---

## 8. PROMPT 2 — Prompt maître (après validation du rapport)

```
Tu es un lead developer senior (React/TypeScript, data engineering, i18n, UX gaming). Tu construis « ROB RUN Companion » : site web de fans pour le jeu ROB RUN, en React, déployable sur Vercel.

════════ RÈGLES NON NÉGOCIABLES ════════
1. Tu ne GÉNÈRES JAMAIS d'images (ni IA, ni SVG décoratifs de remplacement pour les objets du jeu). Toutes les images du jeu viennent des sources, sont TÉLÉCHARGÉES EN LOCAL dans public/images/, et le site n'utilise jamais de lien externe en production. Si une image est introuvable : cadre neutre « image à venir » + entrée dans le rapport.
2. Tu respectes data/recon/REPORT.md et RISKS.md (déjà validés). Si un site interdit le scraping, tu ne le scrapes pas.
3. Tu n'inventes aucune donnée de jeu. Une donnée absente = null et marquée « non disponible » dans l'UI.
4. Les guides ne sont PAS copiés mot pour mot : tu les réécris avec tes propres mots (ou tu résumes + lien source). Chaque guide cite ses sources.
5. Tu travailles par phases. À la fin de chaque phase : npm run build + npm run validate-data, résumé court, et tu ATTENDS mon « go ».
6. Avant d'utiliser une librairie, consulte la doc à jour via Context7.
7. Tu n'écris jamais de secrets ni de clés dans le code. Pas d'installation globale sans me le dire.
8. TRADUCTION OBLIGATOIRE : le site existe en 3 langues seulement, EN (référence), FR et AR. AUCUN russe n'apparaît dans l'interface ni dans les JSON publics. Aucune chaîne visible ne peut exister dans une seule langue : tu ajoutes toi-même toutes les traductions (voir section TRADUCTION).

════════ PRODUIT ════════
Type : web (SPA statique). Langues : EN (référence), FR (défaut), AR (RTL complet). Fonctionnalités : armes, items, loot, map, véhicules, upgrades, guides et astuces, database (recherche globale).

════════ STACK ════════
Vite + React 18 + TypeScript strict + Tailwind CSS + React Router + react-i18next (détection langue + persistance + dir="rtl" pour l'arabe) + Fuse.js + Leaflet (carte sur image du jeu avec L.CRS.Simple) + Zustand (favoris, langue) + sharp et tsx pour les scripts. Pas de backend : données en JSON statique dans public/data/. Config vercel.json avec rewrites SPA.

════════ DONNÉES DE DÉPART (data/raw/, ne jamais modifier) ════════
- weapons.csv : 46 armes, 17 familles × Mk1–Mk3. Colonnes utiles : id, name_en, damage, headshot_damage (= ×1,5), rounds_per_minute, magazine, full_damage_range_m, damage_per_second (recalculable : dégâts × cadence / 60), url, source. La colonne name_ru est ignorée.
- items.csv : 563 items, 23 catégories, 5 raretés. 184 items sans rareté ni prix (non vendables) : afficher « non vendable ». 45 noms anglais en double : la clé est TOUJOURS l'id. Prix fence min/max en USD. Les catégories/raretés sont en russe dans le CSV (category_ru, rarity) : voir TRADUCTION.
- map-points.csv : 927 points, 4 quartiers, 28 bâtiments, 9 types techniques. AUCUNE coordonnée, et loot_entries est un simple 0/1 : coordonnées et loot par point doivent venir de l'importation. district_ru et building_ru sont en russe : voir TRADUCTION.
- Véhicules et upgrades : amorce dans items.csv (catégories Vehicles, Vehicle upgrades, Workbenches & upgrades), à enrichir par import.

════════ TRADUCTION (EN / FR / AR) — TU L'AJOUTES TOI-MÊME ════════
A. Clés normalisées. Les CSV contiennent du russe uniquement pour catégories, raretés, quartiers et bâtiments. Tu lis ces valeurs UNE fois pour créer data/key-map.json (valeur CSV → clé anglaise). Le russe ne doit apparaître nulle part ailleurs que dans ce fichier d'import. Tout le reste du projet n'utilise que les clés anglaises ci-dessous. Compte de lignes pour t'aider à vérifier ta correspondance :
 - Catégories (items.csv) : valuables_stolen 199, cargo 64, weapons 54, misc 38, laboratory 26, furniture_objects 20, house_plot 19, workbenches_upgrades 17, vehicle_upgrades 17, buildings 16, medical 12, vehicles 11, npc 10, weapon_maintenance 10, lockpicking_tools 8, cumulative_items 7, armor 6, keys 6, protection 6, documents 5, ammo 5, grenades 4, tools 3. Quand deux catégories ont le même compte (17/17, 10/10, 6/6/6, 5/5), tranche avec le sens du texte russe et liste ces cas dans data/i18n-review.md pour ma vérification.
 - Raretés : common 22, uncommon 129, epic 127, legendary 83, exotic 18.
 - Quartiers : sunny_beach 341, downtown 297, parkside 154, loren_hills 135.
 - Bâtiments (28) : crée une clé par bâtiment (slug anglais), traduis le nom EN/FR/AR, et signale dans i18n-review.md les noms dont tu n'es pas sûr.
B. Glossaire data/glossary.json : un objet par terme {key, en, fr, ar, note}. Tu le remplis pour TOUT ce qui suit, sans me demander de le faire :
 - Catégories : Valuables (stolen)/Objets de valeur (volés)/مسروقات ثمينة · Cargo/Cargos/شحنات · Weapons/Armes/أسلحة · Misc/Divers/متنوع · Laboratory/Laboratoire/مختبر · Furniture & objects/Meubles et objets/أثاث وأغراض · House & plot/Maison et terrain/منزل وأرض · Workbenches & upgrades/Établis et upgrades/طاولات عمل وتحسينات · Vehicle upgrades/Upgrades véhicule/تحسينات المركبات · Buildings/Constructions/مبانٍ · Medical/Médical/طبّ · Vehicles/Véhicules/مركبات · NPC/PNJ/شخصيات غير لاعبة · Weapon maintenance/Entretien d'armes/صيانة الأسلحة · Lockpicking tools/Outils de crochetage/أدوات الاقتحام · Cumulative items/Objets cumulatifs/عناصر تراكمية · Armor/Armure/دروع · Keys/Clés/مفاتيح · Protection/Protection/حماية · Documents/Documents/وثائق · Ammo/Munitions/ذخيرة · Grenades/Grenades/قنابل يدوية · Tools/Outils/أدوات.
 - Raretés : Common/Commun/عادي · Uncommon/Peu commun/غير شائع · Epic/Épique/ملحمي · Legendary/Légendaire/أسطوري · Exotic/Exotique/غريب.
 - Quartiers : Sunny Beach/Sunny Beach/سني بيتش · Downtown/Downtown/داونتاون · Parkside/Parkside/بارك سايد · Loren Hills/Loren Hills/لورين هيلز.
 - Types de points de carte (remplacent les noms techniques) : RandomLootView = Random loot/Loot aléatoire/غنائم عشوائية · LootNodeView = Search node/Point de fouille/نقطة بحث · ContainerEntityView = Container/Conteneur/حاوية · LootObjectView = Loot object/Objet de loot/غرض غنائم · AccessEntityView = Access point/Point d'accès/نقطة دخول · CumulativeChargerView = Cumulative charger/Chargeur cumulatif/شاحن تراكمي · LocationEventCargoContainerView = Event cargo container/Conteneur cargo d'événement/حاوية شحن الحدث · CashWithdrawalEntityView = ATM/Distributeur/صراف آلي · CashLootNodeView = Cash node/Point d'argent/نقطة نقود.
 - Noms de points de carte (name_en) : ils suivent des motifs (« X · search node », « Cabinet / container », « Safe », « Paintings », « Alcohol », « Jewelry », « Cash », « Cheap antiques »…). Traduis les mots génériques (search node, cabinet, safe = coffre-fort/خزنة, paintings = tableaux/لوحات, jewelry = bijoux/مجوهرات, cash = argent/نقود, antiques = antiquités/تحف…) par des gabarits réutilisables ; ne traduis jamais un nom propre.
 - Libellés d'interface : navigation, filtres, tris, boutons, états vides, erreurs, 404, chargement, favoris, comparateur, À propos, crédits, avertissement « projet de fans non officiel ».
C. Règles de traduction.
 - Noms propres du jeu (armes, marques, bouteilles, bâtiments dont le nom est une marque, véhicules) : restent en alphabet latin dans les 3 langues. En AR on garde le nom latin tel quel, on ne le translittère pas.
 - FR : français standard, vocabulaire gaming courant (« loot », « upgrade » restent). AR : arabe standard moderne simple pour l'interface ; la derja tunisienne est réservée aux micro-textes (chargement, 404, favoris vides, succès). Chiffres occidentaux (0-9) en AR. Prix toujours en USD, aucune conversion de devise (Intl.NumberFormat, currency USD, ar-u-nu-latn en arabe).
 - Pluriels : utilise les règles de pluriel d'i18next (l'arabe a 6 formes : zero, one, two, few, many, other) pour tous les compteurs (« 12 armes », « 1 arme », etc.).
 - Cohérence : un même terme = une même traduction partout (le glossaire fait foi). Pas de traduction automatique mot à mot qui casse le sens.
D. Fichiers et structure : src/i18n/en.json, fr.json, ar.json avec EXACTEMENT les mêmes clés ; les données de jeu (items, armes, lieux) stockent des clés, pas du texte traduit ; l'UI résout via le glossaire. URLs préfixées par langue (/en, /fr, /ar), balises hreflang, <html lang> et dir mis à jour au changement de langue, choix mémorisé.
E. Guides : chaque guide existe en EN, FR et AR (src/content/guides/{en,fr,ar}/), rédigés par toi avec tes propres mots à partir des sources, pas copiés. Si tu manques d'informations fiables pour un guide, tu ne l'inventes pas : tu le notes dans i18n-review.md.
F. Contrôle automatique : validate-data.ts échoue le build si (1) une clé manque dans une des 3 langues, (2) un terme du glossaire a une traduction vide, (3) une catégorie/rareté/quartier/type/bâtiment du JSON n'existe pas dans le glossaire, (4) du texte cyrillique est trouvé dans public/ ou src/, (5) une chaîne AR contient uniquement du latin alors qu'elle n'est pas un nom propre, (6) un guide manque dans une langue.
G. Revue humaine : à la fin de la phase P3 et de la phase P8, tu produis data/i18n-review.md avec : les correspondances ambiguës, les traductions dont tu n'es pas sûr (surtout arabe et derja), et les termes de jeu sans équivalent évident. Je valide avant de continuer.

════════ PIPELINE DE DONNÉES (scripts/) ════════
1. import-csv.ts : CSV → JSON normalisé (weapon, item, mapPoint, vehicle, upgrade), clés = id, champs optionnels = null, rareté/catégorie/quartier/bâtiment/type en clés anglaises via data/key-map.json.
2. build-i18n.ts : lit glossary.json, génère les fichiers de langue et vérifie la parité EN/FR/AR (voir TRADUCTION).
3. import-images.ts : selon la stratégie validée dans le rapport (API/JSON → sitemap → og:image/img). Téléchargement local, WebP ≤ 512 px via sharp, nom = id, 1 req/s, User-Agent explicite, reprise sans retélécharger, dédoublonnage SHA-256, images-manifest.json (id, fichier, source, URL d'origine, date, hash), rapport de couverture (% par catégorie + manquants).
4. import-map.ts : image de la carte du jeu (en local) + coordonnées des points + liens loot ↔ lieu quand disponibles ; sinon null.
5. validate-data.ts : ids uniques, champs requis, cohérence dps/dégâts/cadence (tolérance 1), headshot, min ≤ max, images existantes, + tous les contrôles de la section TRADUCTION F.
Scripts npm : import:csv, import:images, import:map, i18n:build, validate-data, build.

════════ PAGES ET FONCTIONS ════════
- Accueil : recherche globale, stats du jeu, derniers guides.
- Armes : cartes + tableau, tri DPS/dégâts/cadence/portée, filtre par famille, comparateur de 2–3 armes (barres de stats), badge Mk.
- Items : filtres rareté/catégorie/prix, tri, badge de rareté coloré, prix toujours en USD (aucune conversion de devise, aucun sélecteur), « non vendable » si null.
- Loot : fiche item → où le trouver (si données) ; fiche lieu → ce qu'on peut y trouver.
- Map : carte interactive sur l'image du jeu, filtres quartier/bâtiment/type, regroupement de marqueurs, recherche d'un lieu, fiche au clic. Si les coordonnées sont absentes pour certains points : vue liste groupée par quartier → bâtiment.
- Véhicules et Upgrades : fiches, catégories, images locales.
- Guides et astuces : markdown en EN/FR/AR, réécrits, avec sources et date de mise à jour.
- Database : recherche Fuse.js multi-collections (armes, items, lieux, guides) dans la langue active, résultats groupés.
- À propos / Crédits : avertissement « projet de fans non officiel », liste des sources avec liens, histoire du créateur, contact.
- 404 et chargement avec micro-textes tunisiens.

════════ DESIGN ET TOUCHE TUNISIENNE 🇹🇳 ════════
- Thème sombre gaming. Rouge drapeau #E70013, blanc, accent or sable. Motif géométrique de zellige discret en arrière-plan, croissant + étoile en filigrane, jasmin dans l'en-tête.
- En-tête : « ROB RUN Companion — صنع في تونس 🇹🇳 ». Pied de page : « Créé avec ❤️ en Tunisie par Rami » traduit dans les 3 langues.
- Micro-textes en derja pour l'arabe (chargement, 404, favoris vides, succès), humour tunisien léger en FR/EN. Dosage subtil, le site reste professionnel et lisible.
- Easter egg (code Konami ou 5 clics sur le logo) : message en derja + drapeau animé.
- humans.txt avec le nom du créateur, <meta name="author">, favicon aux couleurs tunisiennes.
- Responsive mobile first. Accessibilité : contrastes AA, navigation clavier, alt sur chaque image, aria-label traduits.
- RTL : classes logiques Tailwind (ms-/me-/ps-/pe-, text-start) ; teste chaque page en AR.

════════ QUALITÉ ════════
TypeScript strict sans any, ESLint + Prettier, composants petits, aucune donnée ni texte en dur dans les composants, tests Vitest sur lib/ (recherche, formatage prix, calcul DPS, parité i18n) et sur validate-data, Lighthouse ≥ 90 perf/accessibilité sur la page d'accueil, lazy-loading des images, code splitting par route.

════════ PHASES (STOP + validation après chacune) ════════
P2 Squelette (Vite/React/TS/Tailwind/i18n EN-FR-AR + RTL/router/AGENTS.md/vercel.json) →
P3 Import CSV + key-map + glossaire complet EN/FR/AR + validation + i18n-review.md →
P4 Importateur d'images + rapport de couverture →
P5 Pages Armes, Items, Véhicules, Upgrades, Database →
P6 Carte (image, coordonnées, loot par point) →
P7 Guides et astuces en EN/FR/AR (réécrits, sources créditées) →
P8 Thème tunisien + derja + À propos/crédits + revue i18n finale →
P9 Tests, Lighthouse, accessibilité, README de déploiement Vercel.

════════ DÉMARRAGE ════════
1. Lis data/recon/REPORT.md, RISKS.md, endpoints.json, image-patterns.json et les 3 CSV.
2. Crée AGENTS.md (règles ci-dessus condensées, dont la règle 8 sur la traduction) et docs/SOURCES.md.
3. Annonce en 10 lignes ton plan pour la phase P2 et attends mon « go ».
```

---

*Projet de fans non officiel. Les noms, images et données du jeu appartiennent à leurs ayants droit.*
