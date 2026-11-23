# 🗺️ ROB RUN Companion — Stratégie de données (data/recon/DATA-STRATEGY.md)

**Date** : 23 novembre 2026  
**Contrainte** : aucun endpoint Supabase ni d'authentification. Aucun projet React, aucune création d'image.  
**Règle** : DATA-STRATEGY.md prévaut sur PROMPT_MAITRE.txt en cas de conflit sur le choix des sources.

---

## 1. Sources retenues après reconnaissance

| Site | Type | Ce qu'il apporte | Confiance |
|------|------|------------------|-----------|
| **everygamestat.com** | JSON API | `items.json` (547 items avec faits uniquement : id, catégorie anglaise, type d'arme, prix, stats chiffrées), `robrun.json` (codex, **carte avec 40 pins coordonnés x,y %**, image de fond 2048x1678, notoriété, rôles) | Haute (données structurées JSON, faits uniquement) |
| **robrun.space** | HTML + images | 533 items (pages individuelles), 28 locations de Looty Bay avec loot par lieu, images `.webp` nommées par id, sitemap complet, robots.txt permissif pour images | Haute (images), Moyenne (pas d'API JSON) |
| **robrunwiki.com** | HTML (RU/EN) | Source des 3 CSV originaux (46 armes, 563 items, 927 points), 563 items catalogue, 955 points carte mondiale, 38 bâtiments, 10 districts | Haute (source CSV) |
| **robrun-wiki.wiki** | HTML (EN) | Guides détaillés (braquages, base, argent, équipements), carte interactive | Moyenne |
| **robrunguide.app** | HTML (FR/EN/…) | Carte 3D "Rocky Valley" 560 lieux, 550 objets, 7 guides, localisation FR | Moyenne |
| **rob-run.app** | HTML | Guide armes, wipe timer, serveurs, fence, cargo | Basse |
| **robrun.pro** | HTML (FR/RU) | Catalogue 46 armes, 563 items, cartes, calculateurs | Basse |
| **robrunfrance.fr / rob-run.com / everygamestat guides** | HTML | Guides FR/EN complémentaires | Basse |

---

## 2. Stratégie par donnée

### Armes (46 ids du CSV)
| Élément | Source principale | Source de secours | Confiance | Manquant |
|---------|------------------|-------------------|-----------|----------|
| Id, nom EN, dégâts, headshot, RPM, chargeur, portée, DPS | `data/raw/weapons.csv` | everygamestat items.json (faits uniquement) | Haute | Type d'arme (SMG/fusil/sniper) |
| Images | robrun.space `/items/{id}.webp` | everygamestat (`img` champ) | Haute (HEAD vérifié) | Certaines armes sans image (voir coverage) |
| Coordonnées / loot par lieu | robrun.space pages locations | — | Moyenne | Non relié aux armes |

### Items (563 ids du CSV)
| Élément | Source principale | Source de secours | Confiance | Manquant |
|---------|------------------|-------------------|-----------|----------|
| Id, nom EN, catégorie_ru, rarity, prix fence min/max | `data/raw/items.csv` | everygamestat items.json (faits uniquement) | Haute | 184 items sans rareté/prix (non vendables) |
| Images | robrun.space `/items/{id}.webp` | everygamestat (`img` champ) | Haute (HEAD vérifié) | Certains items sans image |
| Prix sell/buy détaillés, stats | everygamestat items.json (faits uniquement) | robrun.space pages items | Haute | — |

**Règle everygamestat** : n'utiliser que des FAITS (id, catégorie anglaise, type d'arme, prix, stats chiffrées). Ne jamais copier les textes de description d'everygamestat : les réécrire soi-même ou laisser vide. Les 10 armes et les 184 items absents de everygamestat items.json sont normaux (non vendables) : les garder depuis les CSV avec les champs manquants à `null`.

### Catégories / raretés (clés anglaises)
| Élément | Source principale | Source de secours | Confiance | Manquant |
|---------|------------------|-------------------|-----------|----------|
| 23 catégories (counts connus) | `data/raw/items.csv` + key-map.json | everygamestat `cats` | Haute | — |
| 6 raretés (common, uncommon, rare, epic, legendary, exotic) | `data/raw/items.csv` + key-map.json | everygamestat `rar` | Haute | « rare » absent du CSV (ajouté au glossaire pour mise à jour future) |
| Traductions FR/AR | guide section 5 (tableau) | key-map.json | Haute | — |

**Quartiers (correction)** : d'après `everygamestat robrun.json` `map.districts`, les 4 districts sont **Loraine Hills**, **Sunny Beach**, **Palmside**, **Downtown**. Clés : `loraine_hills`, `sunny_beach`, `palmside`, `downtown`.  
Glossaire AR : Loraine Hills / لوراين هيلز, Palmside / بالمسايد, Sunny Beach / سني بيتش, Downtown / داونتاون.

**key-map.json encore nécessaire** : Oui, pour les catégories (`category_ru` en russe → clé EN), raretés (en russe dans le CSV), quartiers (`district_ru`), bâtiments (`building_ru`). Les noms d'objets utilisent `name_en` (déjà en anglais).

### Prix
| Élément | Source principale | Source de secours | Confiance | Manquant |
|---------|------------------|-------------------|-----------|----------|
| Fence prix min/max USD | `data/raw/items.csv` | everygamestat (`sell`, `buy`, `fence[]`) | Haute | 184 items sans prix |
| Taux USD→TND | config fichier (à créer) | — | — | Taux à définir (pas en dur dans les composants) |

### Images d'items
| Élément | Source principale | Source de secours | Confiance | Manquant |
|---------|------------------|-------------------|-----------|----------|
| `.webp` nommé par id | robrun.space `/items/{id}.webp` | everygamestat `img` champ | Haute | Certains ids sans image (voir coverage) |
| Fond de carte | robrun.space `/map/looty-bay.webp` (156 Ko) | everygamestat `map-looty-bay-hq.webp` (2048x1678) | Haute | — |
| Icônes de marqueurs | robrun.space `/map/icons/{type}.webp` | — | Moyenne | 22 types d'icônes identifiés |

### Carte et coordonnées
| Élément | Source principale | Source de secours | Confiance | Manquant |
|---------|------------------|-------------------|-----------|----------|
| Image de fond Looty Bay | robrun.space `/map/looty-bay.webp` | everygamestat `map-looty-bay-hq.webp` | Haute | — |
| Coordonnées (x,y %) par marqueur | **everygamestat robrun.json `map.pins`** (40 pins, [type, x, y]) | — | Haute | Seulement 40 pins, pas les 927 points du CSV |
| Loot par lieu | robrun.space pages `/locations/looty-bay/{slug}/` (ex: looty-bay-bank) | — | Moyenne | 28 locations seulement |
| Quartiers / districts | CSV (4 quartiers) + everygamestat map.districts | — | Moyenne | — |

**Règle coordonnées** : n'utiliser que les 40 pins everygamestat pour l'instant. Les 887 autres points restent sans coordonnées (x/y null) et s'affichent en liste groupée. Ne pas tenter de scraping de carte avant la phase P6.

### Véhicules et upgrades
| Élément | Source principale | Source de secours | Confiance | Manquant |
|---------|------------------|-------------------|-----------|----------|
| Catégories Vehicles, Vehicle upgrades, Workbenches & upgrades | `data/raw/items.csv` | robrun.space `/items/vehicles/`, `/items/car-upgrades/`, `/items/base-upgrades/` | Moyenne | Détails véhicules par scraping |
| Véhicules détaillés | — | robrun.pro, robrunguide.app | Basse | Pas de données structurées |

### Guides
| Élément | Source principale | Source de secours | Confiance | Manquant |
|---------|------------------|-------------------|-----------|----------|
| Guides réécrits (EN/FR/AR) | robrun-wiki.wiki, robrun.space `/guides/`, rob-run.app | robrunwiki.com | Moyenne | Traductions FR/AR à produire |
| Sources créditées | Chaque guide cite sa source | — | Haute | — |

---

## 3. key-map.json — ce qui est nécessaire et ce qui ne l'est plus

**Nécessaire (valeurs russes dans le CSV → clés anglaises)** :
- `category_ru` : 23 catégories russes → clés EN (`valuables_stolen`, `cargo`, `weapons`, etc.)
- `rarity` : rareté russe → clé EN (`common`, `uncommon`, `rare`, `epic`, `legendary`, `exotic`)
- `district_ru` : 4 quartiers russes → clés EN (`sunny_beach`, `downtown`, `loraine_hills`, `palmside`)
- `building_ru` : 28 bâtiments russes → clés EN (slug anglais)

**Non nécessaire (déjà en anglais)** :
- `name_en` des objets, armes, lieux — utilisé tel quel
- `id` des objets — utilisé tel quel
- `source` — URL robrunwiki.com

---

## 4. Ce qui reste manquant à la phase P2

1. **coverage.csv** : script en cours d'exécution (~11 min pour 609 HEAD requests). À lire à la fin, puis remplacer l'ancien fichier. N'importer aucune image avant la phase P4.
2. **Coordonnées des 927 points** : seulement 40 pins dans everygamestat. Les 887 restants n'ont pas de coordonnées.
3. **Loot par lieu** : seulement 28 locations sur robrun.space. Le reste des 927 points n'a pas de loot détaillé.
4. **Traductions FR/AR** : à produire (guide section 5 donne les bases).
5. **Taux USD→TND** : à définir dans un fichier de config.

---

## 5. Droits et UI

- Avertissement « projet de fans non officiel » affiché dans l'UI (en-tête/pied de page).
- Page Crédits listant uniquement les sources réellement utilisées (robrun.space, robrunwiki.com, everygamestat.com, robrun-wiki.wiki, robrunguide.app, rob-run.app, robrun.pro — à confirmer selon usage effectif).
- Contact pour demander le retrait d'un contenu (email sur la page Crédits).
- Ne jamais copier les guides mot pour mot : les réécrire avec ses propres mots, citer la source.
