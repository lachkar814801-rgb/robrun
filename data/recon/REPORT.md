# 📊 ROB RUN Companion — Rapport de reconnaissance (data/recon/REPORT.md)

**Date** : 23 novembre 2026  
**Méthode** : Playwright (Chromium installé, fonctionnel), capture réseau XHR/fetch, HEAD sur images, lecture DOM.  
**Contraintes respectées** : 1 requête/seconde max par site, User-Agent explicite (navigateur), écriture uniquement dans `data/recon/`, aucun projet React, aucune création d'image.

---

## 1. Vérification Playwright ✅

- `npx playwright install chromium` : terminé, Chromium 159.0.8154.6 (v1255) installé.
- Test d'ouverture : `https://www.robrun.space` → 200 OK, titre "ROB RUN Database: items, map, guides & FAQ | robrun.space".

---

## 2. Les 9 sites explorés — tous accessibles (aucun 404 sur les pages)

| Site | Code HTTP | Titre | Sections | Langues |
|------|-----------|-------|----------|---------|
| robrun.space | 200 | ROB RUN Database: items, map, guides & FAQ | FAQ 209, items 533 (armes 50, ammo 4, gear 19, keys 54, vehicles 25, base 82, valuables 251, contraband 48), map 28 locations, guides 8, updates 19, collections 34, mechanics 15 | EN |
| rob-run.app | 200 | ROB RUN Guide: Weapons, Wipe Timer, Servers | weapons, cargo, fence, beginner, error-codes, servers, wiki, updates | EN |
| robrun-wiki.wiki | 200 | ROB RUN Guides and Reference | guides, money, housing, items, multiplayer, support, access, community | EN (hreflang en/x-default) |
| robrunwiki.com | 200 | ROB RUN Wiki (Роб Ран вики) | 563 items, 955 points carte, 38 bâtiments, 10 districts, 510 settlements, guides RU/EN | RU / EN |
| robrunfrance.fr | 200 | Guides, tutos et astuces ROB RUN en français | Guides FR | FR |
| robrunguide.app | 200 | Guide de ROB RUN : objets, carte, production et livraisons | items 550, production 40, propriétés 29, livraisons 172, guides 7, carte 560 lieux, véhicules, FAQ 42 | FR (+5 autres via hreflang) |
| rob-run.com | 200 | ROB RUN Wiki : guide complet | (Astro, pages statiques) | FR |
| robrun.pro | 200 | Tous les conseils du jeu — ROB RUN | guides, legal, account, catalogue (armes 46, munitions 5, équipement 27, outils 65, véhicules 26, base 80, objets valeur 160, contrebande 60, cargaison 39, divers 30) | FR / RU |
| everygamestat.com | 200 | ROB RUN tips: all 40 in-game tips explained | tips, codex, items JSON API | EN |

**Aucun des 9 sites n'est "introuvable"**. Les 5 précédemment écartés sur la base d'un robots.txt 404 sont tous accessibles en HTTP 200. Un robots.txt 404 signifie seulement qu'aucune règle n'est publiée, pas que le site n'existe pas.

---

## 3. Capture réseau Playwright — endpoints JSON découverts

### everygamestat.com ✅ (meilleure découverte)
| Endpoint | Code | Détail |
|----------|------|--------|
| `https://everygamestat.com/art/robrun/items.json` | 200 | **Catalogue complet des items (547)**: id, slug, nom, catégorie, rareté, prix sell/buy, fence prices, stats détaillées, obtention, images. 320 KB. |
| `https://everygamestat.com/art/robrun/robrun.json` | 200 | **Codex complet (build 0.7.0.4008)**: rôles, notoriété, roadmap, texte réécrit, ET clé `map` avec image de fond 2048x1678, 4 districts, catégories, **40 pins avec [type, x, y] en %**. 110 KB. |

### Autres sites — aucun endpoint JSON de données de jeu
| Site | Endpoints trouvés | Détail |
|------|------------------|--------|
| robrun.space | `isrobrundown.com/api/widget` | Widget statut serveur uniquement. Pas d'API items/cartes (RSC uniquement). |
| rob-run.app | `api.steampowered.com/.../GetNumberOfCurrentPlayers` | Nombre joueurs Steam uniquement. |
| robrun-wiki.wiki | Aucun | Site derrière intermédiaire publicitaire (nn125.com/hola.org). |
| robrunwiki.com | `robrunwiki.com/api/online` | Nombre joueurs en ligne uniquement. |
| robrun.pro | `api/auth/me`, `api/track` | Auth + tracking uniquement. |
| robrunguide.app | `api/steam-players` | Nombre joueurs Steam uniquement. |

**Aucun endpoint JSON de données d'armes/items/cartes sur robrun.space, rob-run.app, robrun-wiki.wiki, robrunwiki.com, robrunfrance.fr, rob-run.com, robrun.pro, robrunguide.app.**

---

## 4. Images réelles chargées (HEAD vérifiées)

### robrun.space — Armes (3 exemples)
| URL | Code | Format | Taille |
|-----|------|--------|--------|
| /items/apscalar_m1.webp | 200 | webp | 10 716 o |
| /items/jp7_m1.webp | 200 | webp | 7 456 o |
| /items/apscalar_m2.webp | 200 | webp | 11 888 o |

### robrun.space — Items (3 exemples)
| URL | Code | Format | Taille |
|-----|------|--------|--------|
| /items/afak_1.webp | 200 | webp | 5 352 o |
| /items/painkiller_1.webp | 200 | webp | 3 614 o |
| /items/injector_1.webp | 200 | webp | 3 274 o |

### robrun.space — Carte/Bâtiments (3 exemples)
| URL | Code | Format | Taille |
|-----|------|--------|--------|
| /map/looty-bay.webp | 200 | webp | 156 162 o |
| /map/icons/bank.webp | 200 | webp | 2 532 o |
| /map/icons/gun.webp | 200 | webp | 1 340 o |

### everygamestat.com — Images
| URL | Code | Format |
|-----|------|--------|
| /art/robrun/brand.webp | 200 | webp |
| /art/v1/s-252950.webp | 200 | webp |
| /art/robrun/tip-first-aid-cabinet-1.webp | 200 | webp |

**Note** : les noms de fichier images sur robrun.space utilisent l'id du CSV (ex: `apscalar_m1`, pas `ap-scalar-mk1`).

---

## 5. Carte — comment les marqueurs sont chargés

### robrun.space/map
- **Fond** : image unique `/map/looty-bay.webp` (156 Ko, WebP)
- **Marqueurs** : icônes individuelles dans `/map/icons/` (pt-fence, pt-smuggler, pt-hospital, pt-parking, pt-heli, pt-atm, pt-panel, pt-dumpster, pt-tipoff, pt-cargo, convenience, electronics, equipment, gas, gun, jewelry, bank, pharmacy, cafe, mansion, home, gallery, police, hotel, club)
- **Coordonnées** : **aucune coordonnée (x,y) détectée** dans le trafic réseau ni le DOM. Pas d'endpoint JSON de marqueurs.
- **Loot par lieu** : **OUI** — les pages de location (ex: `/locations/looty-bay/looty-bay-bank/`) affichent le loot détaillé (fixed spawns, items, clés, coffres). 28 locations couvertes.

### everygamestat robrun.json (clé `map`)
- **Image de fond** : `map-looty-bay-hq.webp` (2048 x 1678)
- **Districts** : Loraine Hills, Sunny Beach, Palmside, Downtown
- **Pins** : **40 pins avec [type, x, y] en %** (ex: `["safe", 16.67, 70.83]`, `["safe", 26.32, 47.03]`)
- **Types de pins** : safe, atm, cargo, etc.
- **Loot par lieu** : non inclus dans les pins (seulement type + position)

### robrunguide.app/fr/map
- Carte 3D "Rocky Valley", 560 lieux. Pas de coordonnées simples extraites du HTML (carte rendue en 3D via bundle JS).

### robrunwiki.com / robrun-wiki.wiki
- Pages "Карта" / "map" existent. Pas de coordonnées détectées.

**Conclusion : aucune source ne fournit de coordonnées pour les 927 points du CSV (seulement 40 pins dans everygamestat).**

---

## 6. Incohérence des nombres — vérification

| Source | Points carte | Bâtiments | Districts | Settlements |
|--------|-------------|-----------|-----------|-------------|
| robrunwiki.com (page d'accueil) | 955 | 38 | 10 | 510 |
| Mon CSV `map-points.csv` | 927 | 28 | 4 | — |

**Vérification avec ConvertFrom-Csv** : le CSV contient bien 927 lignes, 4 districts uniques (en russe : Loren Hills, Downtown, Parkside, Sunny Beach), 29 bâtiments (dont 1 vide = 28 réels), 9 types techniques.

**Explication de l'écart** : robrunwiki.com annonce les statistiques de la **carte mondiale entière** (10 districts, 510 settlements, 38 bâtiments, 955 points sur "КАРТА ЛУТИ-БЕЙ"). Le CSV couvre **Looty Bay uniquement** (4 quartiers, 28 bâtiments, 927 points). Cependant, même pour Looty Bay, le wiki annonce 955 points contre 927 dans le CSV — écart de 28 points **non expliqué** (hypothèse partielle, non entièrement vérifiée).

---

## 7. Droits — robots.txt et conditions

### robrun.space — robots.txt (User-Agent `*`)
```
User-Agent: *
Allow: /
Allow: /items/*.webp$
Allow: /locations/*.webp$
```
- `/items/*.webp` : **Autorisé explicitement**
- `/locations/*.webp` : **Autorisé explicitement**

### Autres sites
- robrun-wiki.wiki : `Allow: /` (permissif)
- robrunwiki.com : `Allow: /` (permissif)
- robrunfrance.fr, robrunguide.app, rob-run.com, robrun.pro, everygamestat.com : pas de robots.txt (404) → **aucune règle publiée**

**Verdict images** : sur robrun.space, le téléchargement automatique des images est **non interdit** (autorisé explicitement par robots.txt). Sur les autres sites, **non précisé**.

### Terms/conditions lues (7 sites)
Aucune page ne contient de clause interdisant explicitement le scraping de contenu de jeu ou le téléchargement d'images. Tous affichent un avertissement "site de fans non officiel". Détails dans `data/recon/RISKS.md`.

---

## 8. coverage.csv — génération en cours

Généré par script `gen-coverage-real.mjs` (HEAD sur `https://www.robrun.space/items/{id}.webp` pour chaque id, comparaison avec everygamestat items.json et sitemap robrun.space).

**Statut** : script en cours d'exécution (~11 min pour 609 requêtes à 1 req/s). Le fichier `data/recon/coverage.csv` sera écrit à la fin avec les colonnes : `id, kind, robrun_space_image, everygamestat_json, robrun_space_sitemap`.

Le script tourne en arrière-plan. Consultez `data/recon/_coverage_log.txt` pour suivre la progression.

---

## 9. Nouveaux fichiers créés

| Fichier | Contenu |
|---------|---------|
| `data/recon/DATA-STRATEGY.md` | Stratégie de données par catégorie (armes, items, catégories, prix, images, carte, véhicules, guides) |
| `data/recon/_items.json` | everygamestat items.json brut (547 items, 320 KB) |
| `data/recon/_robrun.json` | everygamestat robrun.json brut (codex + carte, 110 KB) |
| `data/recon/_weapon_ids.txt` | 46 ids d'armes du CSV |
| `data/recon/_item_ids.txt` | 563 ids d'items du CSV |
| `data/recon/_everygamestat_ids.txt` | 547 ids d'items dans everygamestat |
| `data/recon/_no_image_ids.txt` | ids sans image robrun.space (généré par le script coverage) |
| `data/recon/_coverage_log.txt` | Log du script coverage en cours |

---

## 10. Ce qui reste à faire à la main

| Tâche | Statut |
|-------|--------|
| Installer `uv` (requis pour le MCP `fetch` : `uvx mcp-server-fetch`) | En attente |
| Recharger OpenCode (`/reload` ou `opencode service restart`) | En attente |
| Confirmer les 4 MCP connectés (`opencode mcp list`) | En attente |
| Attendre la fin du script coverage et lire `data/recon/coverage.csv` | En cours |
| Valider REPORT.md + RISKS.md + DATA-STRATEGY.md avant phase P2 | En attente |

---

**Fin de la reconnaissance Playwright (v2). Aucun projet React créé. En attente de validation.**
