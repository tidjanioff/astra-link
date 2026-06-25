[Read in English](README.md)

# AstraLink

**Suivez chaque lancement. Comprenez chaque mission.**

[Démo en ligne](https://astralink-pi.vercel.app)

AstraLink est un tracker de lancements spatiaux qui va au-delà des simples calendriers. Il calcule des scores de fiabilité historiques pour les agences de lancement et les familles de fusées, suit les changements de statut à chaque synchronisation, et génère des briefings de mission alimentés par l'IA pour chaque lancement à venir grâce à l'API Anthropic.

## Ce que ça fait

AstraLink ingère les données de lancements à venir et historiques depuis Launch Library 2, les stocke dans PostgreSQL, et en tire une intelligence analytique : taux de succès par agence, historiques de fiabilité par famille de fusée, et fréquences moyennes d'annulation. Chaque page de détail de lancement expose ce contexte aux côtés d'un briefing de mission généré à la demande par Claude Haiku et mis en cache après la première génération.

Les utilisateurs peuvent s'inscrire, suivre des lancements, et consulter leur tableau de bord personnel. Le frontend est une interface React inspirée de SpaceX avec filtres complets, pagination, et pages de profil par agence et famille de fusée.

## Architecture

```text
React + TypeScript             API Django REST                  PostgreSQL
Vercel                         Railway                          Railway
┌──────────────┐   HTTPS       ┌──────────────────┐   SQL       ┌─────────────────┐
│ AstraLink UI │ ────────────> │ API AstraLink    │ ──────────> │ launches        │
│              │               │                  │             │ agency_stats    │
└──────────────┘               └────────┬─────────┘             │ rocket_stats    │
                                        │                       │ mission_briefings│
                                        │                       └─────────────────┘
                               ┌────────┴─────────┐
                               │ Launch Library 2 │
                               │ API Anthropic    │
                               └──────────────────┘
```

L'API expose des endpoints de lancement paginés et filtrables, alimentés par une base PostgreSQL remplie via des commandes de gestion. Les statistiques sont calculées à partir des données historiques et stockées séparément. Les briefings de mission sont générés paresseusement à la première visite et servis depuis le cache lors des visites suivantes.

## Décisions d'architecture notables

### Dériver l'intelligence à partir des données brutes

Récupérer et afficher des données d'API est insuffisant. AstraLink va plus loin en calculant des statistiques agrégées à partir de plus de 700 lancements historiques : taux de succès par agence et famille de fusée, nombre moyen de changements de statut avant le décollage, et orbite et type de mission les plus fréquents par fournisseur. Cette couche dérivée est ce qui rend le backend intéressant — ce n'est pas un simple relais.

### Génération paresseuse de briefing avec mise en cache persistante

Les briefings de mission sont générés lors de la première visite d'une page de détail de lancement et mis en cache en base de données. Les visites suivantes lisent depuis le cache sans appel API. Cela maintient les coûts négligeables, évite la génération inutile pour les lancements que personne ne consulte, et démontre une compréhension de l'intégration IA économique.

### Suivi des changements de statut à chaque synchronisation

À chaque exécution de `fetch_launches`, les statuts entrants sont comparés aux valeurs stockées et tout changement est enregistré dans une table `LaunchStatusHistory`. Cela rend les patterns d'annulation et de report interrogeables et alimente la métrique de changements de statut moyens affichée dans les panneaux de fiabilité.

### Remplissage local plutôt que re-récupération

Lorsque la logique de dérivation de `launch_success` a été corrigée après ingestion, une commande `backfill_launch_success` a re-dérivé la vérité depuis les champs `status` déjà stockés plutôt que de re-récupérer 700 lancements depuis une API soumise à des limites de débit. Garder la correction hors ligne a réduit les risques et respecté la limite de l'API tierce.

### Stratégie de base de données unique

Le système d'auth intégré de Django (utilisateurs, sessions) tourne sur PostgreSQL aux côtés des données applicatives. MongoEngine a été évalué et prototypé comme store documentaire pour la couche de lancements, mais la complexité opérationnelle de la configuration hybride et le comportement de timeout d'Atlas M0 l'ont emporté sur les avantages de flexibilité à cette échelle. PostgreSQL gère toutes les données proprement avec l'ORM Django existant.

## Stack technique

### Frontend

- React 19 et TypeScript
- Vite
- React Router
- Styles inline avec variables CSS (aucune bibliothèque de composants)
- Vercel

### Backend

- Python 3.12 et Django 5.2
- Django REST Framework
- PostgreSQL avec Django ORM
- Anthropic Claude Haiku (génération de briefings de mission)
- Launch Library 2 (données de lancement)
- Gunicorn et WhiteNoise
- Railway

## Fonctionnalités

- **Liste des lancements** — lancements à venir paginés avec recherche et filtres (fournisseur, famille de fusée, orbite, type de mission)
- **Détail d'un lancement** — données complètes de mission, fenêtre de lancement, panneau de fiabilité, et briefing de mission IA
- **Profils d'agence** — statistiques par agence (total de lancements, taux de succès, changements de statut moyens, orbite commune) et historique des lancements
- **Profils de famille de fusée** — mêmes statistiques groupées par famille de fusée
- **Scores de fiabilité** — affichés sur chaque carte et page de détail depuis les données historiques précalculées
- **Briefing de mission** — briefing généré par Claude Haiku à la demande, mis en cache après la première génération
- **Auth** — inscription, connexion, déconnexion avec authentification par session Django
- **Système de suivi** — suivre et ne plus suivre des lancements, tableau de bord personnel

## Limitations connues

- L'authentification ne fonctionne pas sur Safari ou Chrome mobile en raison des restrictions de cookies cross-domain (Safari ITP). Les navigateurs desktop fonctionnent correctement. Résoudre cela nécessite un déploiement sur le même domaine ou un flux d'authentification basé sur JWT.
- Le tier gratuit de Launch Library 2 applique des limites de débit strictes. La commande `fetch_historical_launches` peut être interrompue et reprendre après une période de refroidissement.
- La base de données de production est remplie manuellement via des commandes de gestion. Il n'y a pas de synchronisation planifiée automatique — c'est intentionnel pour éviter du compute Railway inutile.

## Installation locale

### Prérequis

- Python 3.12+
- Node.js 20+ et npm
- PostgreSQL 16 ou SQLite pour le développement local

### Backend

```bash
cd astra_link

python -m venv astralink
source astralink/bin/activate
pip install -r requirements.txt
```

Créer un fichier `.env` à la racine du projet :

```env
SECRET_KEY=votre-clé-secrète-django
DEBUG=True
ANTHROPIC_API_KEY=votre-clé-api-anthropic
```

Appliquer les migrations et remplir les données :

```bash
python manage.py migrate
python manage.py fetch_launches
python manage.py fetch_historical_launches
python manage.py backfill_launch_success
python manage.py compute_stats
```

L'API écoute sur `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Vite sert le frontend sur `http://localhost:5173` et proxifie les requêtes `/api` vers Django sur le port 8000.

Pour un build de production :

```bash
cd frontend
npm run build
```

## Commandes de population des données

| Commande | Description |
|---|---|
| `fetch_launches` | Récupère les lancements à venir depuis Launch Library 2 |
| `fetch_historical_launches` | Récupère les lancements historiques depuis Launch Library 2 |
| `backfill_launch_success` | Dérive `launch_success` depuis les champs de statut stockés |
| `compute_stats` | Calcule les statistiques de fiabilité par agence et famille de fusée |

Exécuter ces commandes dans l'ordre après une installation fraîche de la base de données.
