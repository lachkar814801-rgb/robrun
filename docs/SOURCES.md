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

- **robrun.space** — images d'items, pages de locations, fond de carte Looty Bay
- **robrunwiki.com** — CSV originaux (armes, items, points carte), source des données de départ
- **everygamestat.com** — items.json (faits: id, catégorie, type, prix, stats), robrun.json (codex, 40 pins carte, image de fond)
- **robrun-wiki.wiki** — guides détaillés (source pour réécriture)
- **robrunpro.com / robrun.pro** — catalogue complémentaire (si utilisé)
- **robrunguide.app** — guides et carte 3D (si utilisé)
- **rob-run.app** — guide armes et wipe timer (si utilisé)

> Avertissement : ce projet est un site de fans non officiel, non affilié aux développeurs de ROB RUN (KEFIR). Tous les noms, images et données du jeu appartiennent à leurs ayants droit. Pour demander le retrait d'un contenu, contactez-nous via la page Crédits.
