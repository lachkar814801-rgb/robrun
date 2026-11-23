# 🌐 ROB RUN Companion — Revue i18n (data/i18n-review.md)

**Date** : 23 novembre 2026  
**Objet** : correspondances ambiguës et traductions dont la vérification est en attente.  
**Règle** : toute traduction signalée ici doit être validée par l'utilisateur avant passage à la phase suivante.

---

## 1. Cas ambigus (catégories avec mêmes comptes)

Le guide signale que quand deux catégories ont le même nombre d'items (17/17, 10/10, 6/6/6, 5/5), il faut trancher avec le sens du texte russe. Tous les cas ci-dessous ont des sens distincts, ils ne sont donc pas réellement ambigus, mais sont listés pour revue humaine.

| Compte | Catégories (clé EN) | Sens russe | Statut |
|--------|---------------------|------------|--------|
| 17 | `workbenches_upgrades` / `vehicle_upgrades` | Верстаки и апгрейды / Авто-апгрейdes | ✅ Sens distinct, clé assignée |
| 10 | `medical` / `weapon_maintenance` | Медицина / Обслуживание оружия | ✅ Sens distinct, clé assignée |
| 6 | `armor` / `keys` / `protection` | Броня / Ключи / Защита | ✅ Sens distinct, clé assignée |
| 5 | `documents` / `ammo` | Документы / Патроны | ✅ Sens distinct, clé assignée |

---

## 2. Quartiers (correction appliquée depuis everygamestat robrun.json `map.districts`)

| Clé EN | Nom EN | Nom FR | Nom AR | Statut |
|--------|--------|--------|--------|--------|
| `loraine_hills` | Loraine Hills | Loraine Hills | لوراين هيلز | À vérifier — nom AR à confirmer |
| `palmside` | Palmside | Palmside | بالمسايد | À vérifier — nom AR à confirmer |
| `sunny_beach` | Sunny Beach | Sunny Beach | سني بيتش | Déjà dans le guide |
| `downtown` | Downtown | Downtown | داونتاون | Déjà dans le guide |

**Note** : les noms « Loren Hills » et « Parkside » du PROMPT_MAITRE.txt sont remplacés par « Loraine Hills » et « Palmside » (source : everygamestat robrun.json `map.districts`). Si une page de lieu sur robrun.space contredit ces noms, les signaler ici.

---

## 3. Raretés (6 niveaux d'everygamestat, 5 dans le CSV)

| Clé EN | Nom EN | Nom FR | Nom AR | Statut |
|--------|--------|--------|--------|--------|
| `common` | Common | Commun | عادي | Déjà dans le guide |
| `uncommon` | Uncommon | Peu commun | غير شائع | Déjà dans le guide |
| `rare` | Rare | Rare | نادر | **Ajouté** — absent du CSV (184 items sans rareté), présent dans everygamestat |
| `epic` | Epic | Épique | ملحمي | Déjà dans le guide |
| `legendary` | Legendary | Légendaire | أسطوري | Déjà dans le guide |
| `exotic` | Exotic | Exotique | غريب | Déjà dans le guide |

---

## 4. Bâtiments (28 bâtiments du CSV, en russe)

Tous les bâtiments ont été traduits dans glossary.json. Les noms AR sont des traductions littérales et doivent être vérifiés par un locuteur natif.

---

## 5. Types de points de carte (9 types techniques → libellés lisibles)

Tous les types ont été traduits dans glossary.json. Les noms AR sont des traductions littérales et doivent être vérifiés par un locuteur natif.

---

## 6. Guides

Aucun guide encore traduit. Les traductions FR/AR sont à produire lors de la phase P7. Signaler ici tout guide pour lequel une information fiable manque.
