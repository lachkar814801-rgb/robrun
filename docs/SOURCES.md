# 📚 ROB RUN Companion — Sources (docs/SOURCES.md)

Ce document recense toutes les sources de données utilisées dans le projet ROB RUN Companion. Il est mis à jour à chaque phase.

---

## 1. Sources de données de jeu

| Source | Type | Ce qui est utilisé | Utilisé dans |
|--------|------|-------------------|--------------|
| `data/raw/weapons.csv` | CSV local (robrunwiki.com) | 46 armes : id, name_en, dégâts, headshot, RPM, chargeur, portée, DPS | P3 (import-csv.ts) |
| `data/raw/items.csv` | CSV local (robrunwiki.com) | 563 items : id, name_en, catégorie_ru, rareté, prix fence min/max | P3 (import-csv.ts) |
| `data/raw/map-points.csv` | CSV local (robrunwiki.com) | 927 points : id, type, name_en, district_ru, building_ru, loot_entries | P3, P6 |
| everygamestat.com `items.json` | JSON API | Faits uniquement : id, catégorie anglaise, type d'arme, prix, stats chiffrées | P3, P5 (facts uniquement) |
| everygamestat.com `robrun.json` | JSON API | Codex, carte : 40 pins coordonnés [type, x, y], image de fond 2048×1678, districts, notoriété, rôles | P6 (carte, coordonnées) |
| robrun.space | HTML + images | Images `.webp` nommées par id (`/items/{id}.webp`), pages locations avec loot détaillé | P4 (images), P6 (loot par lieu) |
| robrunwiki.com | HTML (RU/EN) | Source originelle des CSV, catalogue 563 items, 955 points carte mondiale | Référence |

### 1b. Sources d'images (P4)

| Source | Pattern réel | Ce qui est utilisé | Nature |
|--------|--------------|-------------------|--------|
| robrun.space | `https://www.robrun.space/items/{id}.webp` | Images d'armes et d'items, nommées par l'id du CSV | Assets du jeu, republiés par un site fan |
| everygamestat.com (Supabase) | `https://wcsgosrevyyafnerrhge.supabase.co/storage/v1/object/public/art/robrun/items/{img}.webp` | Source de secours pour les images d'items. `{img}` = champ `img` de `items.json` (URL réelle trouvée avec Playwright le 2026-11-24) | Assets du jeu, republiés par un site fan |
| everygamestat.com | `https://everygamestat.com/art/robrun/map-looty-bay-hq.webp` | Fond de carte principal 2048×1678 (zoom, `L.CRS.Simple` en P6) | Asset du jeu |
| robrun.space | `https://www.robrun.space/map/looty-bay.webp` | Fond de carte de secours | Asset du jeu |
| robrun.space | `https://www.robrun.space/map/icons/{type}.webp` | 25 icônes de marqueurs de carte | **Icônes dessinées par le site fan**, pas des assets officiels du jeu (noté `assetType: fan-site-icon` dans `images-manifest.json`) |

Toutes les images sont téléchargées en local (`public/images/`), converties en WebP (≤ 512 px ; fond de carte ≤ 2048 px ; icônes ≤ 128 px), dédoublonnées par SHA-256 et référencées dans `data/images-manifest.json`. Aucune image n'est générée ni hotlinkée. Si une source ne fournit pas l'image, le champ `image` reste `null` et l'UI affichera un cadre neutre « image à venir ».

### Devise

Les prix du jeu sont exprimés en **USD**. Le site affiche tous les montants en USD, formatés avec `Intl.NumberFormat` selon la langue active (chiffres occidentaux 0-9 même en arabe). **Aucune conversion de devise, aucun taux de change, aucun sélecteur USD/TND.** La touche tunisienne du site reste dans les couleurs, les textes et la signature, pas dans les montants.

---

## 2. Sources de guides

| Source | Type | Ce qui est utilisé | Utilisé dans |
|--------|------|-------------------|--------------|
| robrun-wiki.wiki | HTML (EN) | Guides détaillés (braquages, base, argent, équipements) | P7 (réécriture) |
| robrun.space `/guides/` | HTML | Guides officiels fans | P7 (réécriture) |
| rob-run.app | HTML | Guide armes, wipe timer, serveurs | P7 (réécriture) |

---

## 3. Crédits (à remplir à la phase P8)

Les crédits doivent citer uniquement les sources réellement utilisées dans le build final. Chaque source doit apparaître avec son nom, son URL et la nature de ce qui en est tiré.

- **robrun.space** — images d'items et d'armes (`/items/{id}.webp`), fond de carte Looty Bay (secours), icônes de marqueurs dessinées par le site fan (pas des assets officiels), pages de locations
- **robrunwiki.com** — CSV originaux (armes, items, points carte), source des données de départ
- **everygamestat.com** — items.json (faits : id, catégorie, type, prix, stats), robrun.json (codex, 40 pins carte), images d'items de secours (hébergées sur son stockage Supabase), fond de carte 2048×1678
- **robrun-wiki.wiki** — guides détaillés (source pour réécriture)
- **robrunpro.com / robrun.pro** — catalogue complémentaire (si utilisé)
- **robrunguide.app** — guides et carte 3D (si utilisé)
- **rob-run.app** — guide armes et wipe timer (si utilisé)

> Crédits d'images : les images de jeu proviennent des sources ci-dessus et restent la propriété de leurs ayants droit. Les icônes de marqueurs `robrun.space` sont des créations du site fan et sont créditées comme telles. Aucune image n'est générée par ce projet.

> Avertissement : ce projet est un site de fans non officiel, non affilié aux développeurs de ROB RUN (KEFIR). Tous les noms, images et données du jeu appartiennent à leurs ayants droit. Pour demander le retrait d'un contenu, contactez-nous via la page Crédits.
