# ⚠️ ROB RUN Companion — Risques juridiques et techniques (data/recon/RISKS.md)

**Date** : 23 novembre 2026

---

## 1. Restrictions juridiques

Tous les 9 sites explorés sont accessibles (aucun 404 sur les pages elles-mêmes). Tous sont des sites de fans non officiels.

### Sites accessibles et avertissements

| Site | Statut | Avertissement trouvé |
|------|--------|---------------------|
| robrun.space | 200 | "Unofficial fan site. Not affiliated with KEFIR or the ROB RUN team. ROB RUN and all related names, images and game content are the property of their respective owners." |
| rob-run.app | 200 | "ROB RUN, its name, screenshots and trailers belong to Kefir. This is an independent fan site and is not affiliated with or endorsed by Kefir." |
| robrun-wiki.wiki | 200 | "Independent fan site, not affiliated with Kefir. Game trademarks belong to their respective owners." |
| robrunwiki.com | 200 | "Неофициальная база знаний ROB RUN... unabhängiges Community-Projekt" (projet communautaire indépendant, russe) |
| robrunfrance.fr | 200 | Site de guides en français (pas d'avertissement spécifique lu sur la page) |
| robrunguide.app | 200 | "Un guide communautaire" (pas d'avertissement spécifique lu) |
| rob-run.com | 200 | (pas d'avertissement spécifique lu) |
| robrun.pro | 200 | "Site de fans, sans lien avec Kefir ni ROB RUN." |
| everygamestat.com | 200 | "EveryGameStat is an independent project... not affiliated with Valve, Microsoft, Sony, Riot Games, Supercell, Krafton, Epic Games or any other game company." |

### Pages terms/conditions lues

| Site | Page lue | Scraping / téléchargement d'images ou de données | Citation |
|------|----------|---------------------------------------------------|----------|
| robrun.space | /privacy/ et /terms/ (redirige vers privacy) | **Non précisé** — la politique traite des données personnelles (cookies, analytics), pas du scraping de contenu de jeu. Aucune mention d'interdiction de téléchargement d'images. | "robrun.space is an unofficial fan-made site. It is not affiliated with, endorsed by or sponsored by KEFIR or the ROB RUN team." |
| everygamestat.com | /privacy | **Non précisé** — politique sur les données utilisateur des joueurs, pas sur le contenu de jeu. | "EveryGameStat reads your public gaming stats and puts them on one page. We never write anything back to your game accounts and we do not sell your data." |
| robrunguide.app | /fr/privacy | **Non précisé** — politique LGPD/RGPD sur les données utilisateur, pas sur le scraping de contenu de jeu. | "Un guide communautaire. Vous choisissez de partager ou non vos statistiques d'utilisation pour contribuer à son amélioration." |
| robrun.pro | /fr/legal | **Non précisé** — "Site de fans, sans lien avec Kefir ni ROB RUN." Aucune clause anti-scraping lue. | "Site de fans, sans lien avec Kefir ni ROB RUN." |
| rob-run.app | /terms | Pas de page distincte trouvée (redirection). | — |
| robrun-wiki.wiki | /terms-of-service | **Non précisé explicitement** — mention "Do not misuse this site, attempt unauthorized access" (accès non autorisé interdit), mais pas de clause anti-scraping de contenu. | "Do not misuse this site, attempt unauthorized access or present it as an official game property." |
| robrunwiki.com | Page d'accueil (pas de page terms distincte trouvée) | **Non précisé** — "Неофициальный проект сообщества" (projet communautaire indépendant). | "Это независимый проект сообщества." |

### Règles robots.txt pour User-Agent `*`

| Site | robots.txt | Règle `*` | Images `.webp` |
|------|-----------|-----------|----------------|
| robrun.space | 200 | `Allow: /` | **Autorisé explicitement**: `Allow: /items/*.webp$` et `Allow: /locations/*.webp$` |
| robrun-wiki.wiki | 200 | `Allow: /` | Non précisé (permissif) |
| robrunwiki.com | 200 | `Allow: /` | Non précisé (permissif) |
| robrunfrance.fr | 404 | Aucune règle publiée | Non précisé |
| robrunguide.app | 404 | Aucune règle publiée | Non précisé |
| rob-run.com | 404 | Aucune règle publiée | Non précisé |
| robrun.pro | 404 | Aucune règle publiée | Non précisé |
| everygamestat.com | 404 | Aucune règle publiée | Non précisé |

**Verdict téléchargement automatique des images** :
- robrun.space : **non interdit** (autorisé explicitement par robots.txt pour `*`).
- Autres sites : **non précisé** (pas de robots.txt ou règles permissives).

### Règles à appliquer (selon le guide, section 4)

- Affiche clairement : « Projet de fans non officiel, non affilié aux développeurs de ROB RUN ».
- Crédite chaque source dans `docs/CREDITS.md` et sur la page À propos.
- Ne copie pas les guides mot pour mot : réécris avec tes propres mots (ou résume + lien source).
- Ne monétise pas (pubs, vente) sans vérifier les conditions des sources et du studio.
- Si un site interdit le scraping dans son `robots.txt` ou ses CGU, l'importateur l'ignore et le signale.

---

## 2. Restrictions techniques

| Risque | Détail | Niveau | Mitigation |
|--------|--------|--------|------------|
| Aucun endpoint API de données de jeu sur 8/9 sites | Seul everygamestat.com expose des endpoints JSON (items.json, robrun.json). Les autres utilisent du rendu côté serveur (RSC sur robrun.space) ou du HTML statique. | Élevé | Utiliser everygamestat.com items.json comme source principale. Pour robrun.space, extraire depuis le HTML rendu. |
| Images non listées dans les sitemaps | Les URLs d'images sont découvertes via le trafic navigateur, pas listées dans les sitemaps XML. | Moyen | Crawler les pages item par item avec Playwright pour découvrir les URLs .webp réelles. |
| Pas de coordonnées (x, y) pour les 927 points | everygamestat robrun.json n'a que 40 pins coordonnés. Aucun site ne fournit de coordonnées pour tous les points. | Élevé | Les coordonnées des 887 points restants doivent être récupérées manuellement. |
| Pas de lien loot ↔ lieu pour tous les points | robrun.space a 28 locations avec loot détaillé (ex: looty-bay-bank). Le reste des 927 points n'a pas de loot détaillé. | Élevé | Le loot par lieu reste null pour la majorité des points. |
| Sites en russe | robrunwiki.com est en RU/EN. Les noms de catégories/raretés/quartiers/bâtiments sont en russe dans le CSV. | Moyen | Créer `data/key-map.json` pour convertir une seule fois en clés anglaises. |
| robrun-wiki.wiki derrière intermédiaire pub | Le site charge via nn125.com / hola.org (publicité, redirection). | Moyen | Accès direct possible (200 sur robrun-wiki.wiki/) mais trafic publicitaire important. |
| 404 sur /locations/looty-bay/bank/ | L'URL correcte est /locations/looty-bay/looty-bay-bank/ (le sitemap contient des URLs avec "looty-bay" répété). | Faible | Utiliser les URLs exactes du sitemap. |

---

## 3. Ce qui reste à faire à la main

| Tâche | Statut |
|-------|--------|
| Installer `uv` (requis pour le MCP `fetch` : `uvx mcp-server-fetch`) | En attente |
| Recharger OpenCode (`/reload` ou `opencode service restart`) | En attente |
| Confirmer les 4 MCP connectés (`opencode mcp list`) | En attente |
| Lire les pages terms/conditions de chaque site accessible | ✅ Fait (7 sites lus) |
| Valider REPORT.md + RISKS.md + DATA-STRATEGY.md avant phase P2 | En attente |
| coverage.csv : script en cours d'exécution (~11 min pour 609 HEAD requests) | En cours |
