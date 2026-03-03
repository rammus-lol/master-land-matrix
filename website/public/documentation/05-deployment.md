# Déploiement et Configuration

## Environnements

### Développement

**Backend**:
```bash
cd django_proxy
python manage.py runserver
```

**Frontend**:
```bash
cd website
npm run dev
```

### Production

**Backend avec Docker**:
```bash
cd django_proxy
docker build -t land-matrix-api .
docker run -p 8000:8000 land-matrix-api
```

**Frontend**:
```bash
cd website
npm run build  # Crée une build optimisée
# Servir les fichiers statiques avec un serveur HTTP
```

## Dockerfile (Django)

Un Dockerfile est fourni dans `django_proxy/Dockerfile` pour containeriser l'API Django.

## Configuration Django

Voir `proxy_project/settings.py` pour configurer:

- **DATABASES**: Connexion à la base de données
- **CORS_ALLOWED_ORIGINS**: Domaines autorisés
- **STATIC_URL** et **STATIC_ROOT**: Fichiers statiques
- **MEDIA_URL** et **MEDIA_ROOT**: Fichiers utilisateur
- **SECRET_KEY**: Clé secrète (utiliser les variables d'environnement)
- **DEBUG**: Désactiver en production

## Variables d'environnement

À définiravant le déploiement:
- `SECRET_KEY`: Clé secrète unique
- `DEBUG`: False en production
- `ALLOWED_HOSTS`: Domaines de l'application
- `DATABASE_URL`: Chaîne de connexion BD (si PostgreSQL)
- `CORS_ORIGINS`: Origines autorisées pour les requêtes

## Dépendances

### Backend
Voir `requirements.txt`:
- Django
- Django Rest Framework
- GeoPandas
- GDAL
- ReportLab
- Pandas
- Et autres packages spatiales

### Frontend
Voir `package.json`:
- Vite
- marked (Markdown parser)
- Scripts de build personnalisés

## Performance

### Optimisations recommandées

- **Frontend**: 
  - Minification CSS/JS
  - Lazy loading des ressources
  - Cache des fichiers statiques
  
- **Backend**:
  - Index base de données sur les champs fréquents
  - Cache des requêtes spatiales
  - Compression des réponses gzip

## Monitoring

### Fichiers de log

- **Django**: Configuré dans `settings.py`
- **Crawler**: Logs dans `crawler/logs/` avec horodatage
- **Frontend**: Erreurs console du navigateur

### Points à surveiller

- Espace disque (données GeoPackage peuvent être volumineuses)
- Mémoire (opérations spatiales sont gourmandes)
- Temps de réponse API
- Erreurs de scraping du crawler

## Base de données

### SQLite (Développement)
- Fichier: `db.sqlite3`
- Migrations: `python manage.py migrate`

### PostgreSQL + PostGIS (Production)
- Installation: `apt install postgresql postgresql-contrib postgis`
- Extension: `CREATE EXTENSION postgis;`
- Configuration dans `settings.py`

## Sauvegardes

Sauvegarder régulièrement:
- Base de données Django
- Fichiers GeoPackage dans `data/`
- Rapports générés dans `data/reports/`
- Fichiers de configuration
