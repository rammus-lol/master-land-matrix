# Backend - Django API

## Architecture du Backend

Le backend est une API Django (Django Rest Framework) qui sert d'intermédiaire entre l'interface web et les sources de données. Elle gère les requêtes spatiales, les exportations de rapports et la manipulation des données géospatiales.

## Structure des répertoires

```
django_proxy/
├── api/                         # Application Django principale
│   ├── models.py               # Modèles de données
│   ├── views.py                # Vues et endpoints
│   ├── serializers.py          # Sérialisation DRF
│   ├── urls.py                 # Routage des URLs
│   ├── custom_service/         # Services personnalisés
│   │   ├── pdf_report.py       # Génération de PDF
│   │   ├── spatial_function.py # Fonctions spatiales
│   │   └── table_function.py   # Fonctions tabulaires
│   ├── spatial_service/        # Services géospatiaux avancés
│   └── migrations/             # Migrations de base de données
├── data/                        # Données et ressources
│   ├── *.gpkg                  # Fichiers GeoPackage
│   └── reports/                # Rapports générés
├── management/commands/         # Commandes Django personnalisées
│   ├── crawler_main.py         # Crawler principal
│   ├── crawler_area.py         # Crawler de zones
│   ├── crawler_points.py       # Crawler de points
│   └── generic_function.py     # Fonctions utilitaires
├── proxy_project/              # Configuration Django
│   ├── settings.py             # Paramètres Django
│   ├── urls.py                 # URLs racines
│   ├── wsgi.py                 # Configuration WSGI
│   └── asgi.py                 # Configuration ASGI
├── manage.py                   # Interface de gestion Django
├── requirements.txt            # Dépendances Python
└── pyproject.toml             # Configuration du projet
```

## Composants principaux

### API Views
Les endpoints REST gèrent:
- Récupération des données d'investissement
- Requêtes spatiales (filtrage géographique)
- Export de données (Excel, CSV, PDF)
- Statistiques et agrégations

### Services personnalisés

**pdf_report.py**: Génère des rapports PDF avec:
- Synthèse des investissements
- Cartes intégrées
- Tableaux statistiques

**spatial_function.py**: Effectue:
- Requêtes géospatiales avancées
- Intersections géométriques
- Buffer et analyses de proximité
- Filtrage par région/zone

**table_function.py**: Traite:
- Agrégation de données
- Génération de rapports tabulaires
- Statistiques descriptives

### Commandes de gestion

**crawler_main.py**: Crawler principal qui coordonne le scraping des données

**crawler_area.py**: Scrape les données de zones/régions

**crawler_points.py**: Scrape les points d'intérêt et localisations

## Dépendances principales

- **Django**: Framework web
- **Django Rest Framework**: API REST
- **GeoPy** ou **Shapely**: Opérations géospatiales
- **GDAL/OGR**: Manipulation de fichiers géographiques
- **ReportLab** ou **WeasyPrint**: Génération de PDF
- **Pandas**: Manipulation de données tabulaires

## Base de données

- **sqlite3** (développement): `db.sqlite3`
- Supporte la configuration pour PostgreSQL avec PostGIS en production

## Configuration

Voir `proxy_project/settings.py` pour:
- Configuration des bases de données
- Paramètres CORS
- Clés secrètes et variables d'environnement
- Applications installées
- Middleware
