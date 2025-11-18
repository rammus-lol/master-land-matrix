# Django Proxy API - LandMatrix Countries

## 📋 Description

Ce projet est un serveur Django minimal qui fait office de proxy pour l'API LandMatrix. Il permet d'interroger l'endpoint `https://landmatrix.org/api/countries` via une API locale.

## 🏗️ Architecture du Projet

```
django_proxy/
├── .venv/                      # Environnement virtuel Python
├── api/                        # Application Django principale
│   ├── __init__.py
│   ├── admin.py
│   ├── apps.py
│   ├── models.py
│   ├── tests.py
│   ├── urls.py                 # Routes de l'API
│   └── views.py                # Vue proxy pour les countries
├── proxy_project/              # Configuration du projet Django
│   ├── __init__.py
│   ├── asgi.py
│   ├── settings.py             # Configuration principale
│   ├── urls.py                 # Routes principales
│   └── wsgi.py
├── manage.py                   # Script de gestion Django
└── README.md                   # Ce fichier
```

## 🚀 Installation et Configuration

### Prérequis

- Python 3.12.3 ou supérieur
- pip (gestionnaire de paquets Python)
- virtualenv (recommandé)

### 1. Cloner ou télécharger le projet

```bash
cd /home/arthur/Documents/nextcloud_sync/Documents/projet\ geonum/django_proxy
```

### 2. Activer l'environnement virtuel

```bash
source .venv/bin/activate
```

### 3. Installer les dépendances

Si les dépendances ne sont pas déjà installées :

```bash
pip install django requests
```

**Dépendances requises :**
- `django==5.2.8` - Framework web
- `requests` - Pour les requêtes HTTP vers l'API externe

### 4. Configuration (Optionnel)

Le fichier `proxy_project/settings.py` contient la configuration du projet :

```python
# Pour le développement
DEBUG = True
ALLOWED_HOSTS = []

# Pour la production, modifier :
DEBUG = False
ALLOWED_HOSTS = ['votre-domaine.com', 'localhost', '127.0.0.1']
```

## 🎯 Utilisation

### Démarrer le serveur de développement

```bash
cd /home/arthur/Documents/nextcloud_sync/Documents/projet\ geonum/django_proxy
"/home/arthur/Documents/nextcloud_sync/Documents/projet geonum/django_proxy/.venv/bin/python" manage.py runserver
```

Ou simplement (si l'environnement virtuel est activé) :

```bash
python manage.py runserver
```

Le serveur démarre sur : **http://127.0.0.1:8000/**

### Démarrer sur un port personnalisé

```bash
python manage.py runserver 8080
```

### Démarrer sur toutes les interfaces réseau

```bash
python manage.py runserver 0.0.0.0:8000
```

## 📡 Endpoints de l'API

### GET `/api/countries`

Retourne la liste des pays depuis l'API LandMatrix.

**URL complète :** `http://127.0.0.1:8000/api/countries`

**Méthode :** GET

**Réponse réussie (200) :**
```json
[
  {
    "id": 1,
    "name": "Country Name",
    ...
  }
]
```

**Réponse en cas d'erreur (500) :**
```json
{
  "error": "Description de l'erreur"
}
```

### Exemples de requêtes

#### Avec curl :
```bash
curl http://127.0.0.1:8000/api/countries
```

#### Avec Python requests :
```python
import requests

response = requests.get('http://127.0.0.1:8000/api/countries')
print(response.json())
```

#### Avec JavaScript fetch :
```javascript
fetch('http://127.0.0.1:8000/api/countries')
  .then(response => response.json())
  .then(data => console.log(data));
```

## 🔧 Mise à jour et Maintenance

### Mettre à jour Django

```bash
source .venv/bin/activate
pip install --upgrade django
```

### Mettre à jour toutes les dépendances

```bash
pip install --upgrade django requests
```

### Créer un fichier requirements.txt

Pour faciliter le déploiement :

```bash
pip freeze > requirements.txt
```

### Installer depuis requirements.txt

```bash
pip install -r requirements.txt
```

## 📝 Modifications et Extensions

### 🎯 Trois méthodes pour ajouter des endpoints

Le projet supporte **3 façons** d'ajouter de nouveaux endpoints après `/api/` :

#### Méthode 1 : Proxy Générique (Déjà configuré ✅)

**Le plus simple** - Aucune modification nécessaire !

Grâce au proxy générique, vous pouvez accéder à **n'importe quel endpoint** de l'API LandMatrix automatiquement :

```bash
# Ces URLs fonctionnent déjà sans modification :
http://127.0.0.1:8000/api/countries     → https://landmatrix.org/api/countries
http://127.0.0.1:8000/api/deals         → https://landmatrix.org/api/deals
http://127.0.0.1:8000/api/investors     → https://landmatrix.org/api/investors
http://127.0.0.1:8000/api/n-importe-quoi → https://landmatrix.org/api/n-importe-quoi
```

**Avec paramètres de requête :**
```bash
http://127.0.0.1:8000/api/deals?limit=10&offset=20
# Transmet automatiquement les paramètres à l'API externe
```

**Comment ça marche ?**

Le fichier `api/urls.py` contient cette route :
```python
path('<path:endpoint>', views.generic_proxy, name='generic_proxy'),
```

Et `api/views.py` contient la fonction `generic_proxy()` qui redirige automatiquement toutes les requêtes vers l'API LandMatrix.

#### Méthode 2 : Endpoint Spécifique (Pour logique personnalisée)

**Quand l'utiliser ?** Lorsque vous avez besoin d'une logique spécifique (traitement, filtrage, cache, etc.)

**Étape 1 - Créer la vue dans `api/views.py` :**

```python
@csrf_exempt
def deals_proxy(request):
    """
    Proxy personnalisé pour les deals avec logique spécifique
    """
    try:
        # Logique personnalisée ici
        params = request.GET.dict()
        
        # Ajouter des paramètres par défaut si nécessaire
        if 'limit' not in params:
            params['limit'] = 50
        
        response = requests.get(
            'https://landmatrix.org/api/deals',
            params=params,
            timeout=10
        )
        
        # Vous pouvez modifier la réponse ici si nécessaire
        data = response.json()
        
        return JsonResponse(
            data,
            status=response.status_code,
            safe=False
        )
    except requests.exceptions.RequestException as e:
        return JsonResponse({'error': str(e)}, status=500)
```

**Étape 2 - Ajouter la route dans `api/urls.py` :**

⚠️ **IMPORTANT** : Ajoutez votre route **AVANT** la route générique (`<path:endpoint>`)

```python
from django.urls import path
from . import views

urlpatterns = [
    # Endpoints spécifiques (TOUJOURS EN PREMIER)
    path('countries', views.countries_proxy, name='countries_proxy'),
    path('deals', views.deals_proxy, name='deals_proxy'),  # Nouveau !
    path('investors', views.investors_proxy, name='investors_proxy'),  # Autre exemple
    
    # Proxy générique (TOUJOURS EN DERNIER)
    path('<path:endpoint>', views.generic_proxy, name='generic_proxy'),
]
```

**Pourquoi cet ordre ?** Django vérifie les routes dans l'ordre. Si le proxy générique est en premier, il interceptera toutes les requêtes avant vos routes spécifiques.

#### Méthode 3 : Endpoint vers une API différente

**Pour proxifier une autre API que LandMatrix :**

**Étape 1 - Créer la vue dans `api/views.py` :**

```python
@csrf_exempt
def external_api_endpoint(request):
    """
    Proxy vers une API externe différente
    """
    try:
        response = requests.get(
            'https://autre-api.com/endpoint',
            timeout=10
        )
        return JsonResponse(
            response.json(),
            status=response.status_code,
            safe=False
        )
    except requests.exceptions.RequestException as e:
        return JsonResponse({'error': str(e)}, status=500)
```

**Étape 2 - Ajouter la route :**

```python
urlpatterns = [
    path('countries', views.countries_proxy, name='countries_proxy'),
    path('external', views.external_api_endpoint, name='external_api'),  # Nouveau !
    path('<path:endpoint>', views.generic_proxy, name='generic_proxy'),
]
```

Accessible via : `http://127.0.0.1:8000/api/external`

### 📋 Exemples complets d'ajout d'endpoints

#### Exemple 1 : Ajouter /api/investors avec cache

```python
# Dans api/views.py
from django.core.cache import cache

@csrf_exempt
def investors_proxy(request):
    """
    Proxy pour les investisseurs avec cache de 1 heure
    """
    cache_key = 'landmatrix_investors'
    cached_data = cache.get(cache_key)
    
    if cached_data:
        return JsonResponse(cached_data, safe=False)
    
    try:
        response = requests.get('https://landmatrix.org/api/investors', timeout=10)
        data = response.json()
        
        # Mettre en cache pour 1 heure (3600 secondes)
        cache.set(cache_key, data, 3600)
        
        return JsonResponse(data, status=response.status_code, safe=False)
    except requests.exceptions.RequestException as e:
        return JsonResponse({'error': str(e)}, status=500)
```

```python
# Dans api/urls.py
urlpatterns = [
    path('countries', views.countries_proxy, name='countries_proxy'),
    path('investors', views.investors_proxy, name='investors_proxy'),  # Avec cache !
    path('<path:endpoint>', views.generic_proxy, name='generic_proxy'),
]
```

#### Exemple 2 : Ajouter /api/deals avec filtrage

```python
# Dans api/views.py
@csrf_exempt
def deals_filtered(request):
    """
    Proxy pour les deals avec filtrage côté serveur
    """
    try:
        response = requests.get('https://landmatrix.org/api/deals', timeout=10)
        data = response.json()
        
        # Filtrer uniquement les deals actifs
        if isinstance(data, list):
            data = [deal for deal in data if deal.get('status') == 'active']
        
        return JsonResponse(data, safe=False)
    except requests.exceptions.RequestException as e:
        return JsonResponse({'error': str(e)}, status=500)
```

#### Exemple 3 : Ajouter /api/stats (endpoint personnalisé)

```python
# Dans api/views.py
@csrf_exempt
def stats_proxy(request):
    """
    Endpoint personnalisé qui combine plusieurs APIs
    """
    try:
        # Récupérer plusieurs endpoints
        countries_response = requests.get('https://landmatrix.org/api/countries', timeout=10)
        deals_response = requests.get('https://landmatrix.org/api/deals', timeout=10)
        
        countries = countries_response.json()
        deals = deals_response.json()
        
        # Créer des statistiques personnalisées
        stats = {
            'total_countries': len(countries) if isinstance(countries, list) else 0,
            'total_deals': len(deals) if isinstance(deals, list) else 0,
            'timestamp': '2025-11-17'
        }
        
        return JsonResponse(stats)
    except requests.exceptions.RequestException as e:
        return JsonResponse({'error': str(e)}, status=500)
```

```python
# Dans api/urls.py
path('stats', views.stats_proxy, name='stats_proxy'),
```

### 🔄 Rechargement automatique

Le serveur Django en mode développement recharge automatiquement les fichiers modifiés. Après avoir ajouté un endpoint :

1. Sauvegardez `api/views.py` et `api/urls.py`
2. Vérifiez le terminal - vous devriez voir :
   ```
   Watching for file changes with StatReloader
   Performing system checks...
   ```
3. Testez immédiatement votre nouvel endpoint !

### ⚠️ Erreurs courantes à éviter

1. **Route générique en premier** ❌
   ```python
   # MAUVAIS ORDRE
   urlpatterns = [
       path('<path:endpoint>', views.generic_proxy, name='generic_proxy'),  # En premier = problème !
       path('countries', views.countries_proxy, name='countries_proxy'),
   ]
   ```

2. **Oublier @csrf_exempt** ❌
   ```python
   # Sans @csrf_exempt, les requêtes POST/PUT/DELETE seront rejetées
   def my_view(request):  # Manque @csrf_exempt
       ...
   ```

3. **Ne pas importer la vue** ❌
   ```python
   # Dans urls.py - oublier d'importer
   from . import views  # ← N'oubliez pas cette ligne !
   ```

### Ajouter des paramètres de requête

Modifier la vue pour accepter des paramètres :

```python
@csrf_exempt
def countries_proxy(request):
    # Récupérer les paramètres de requête
    params = request.GET.dict()
    
    try:
        response = requests.get(
            'https://landmatrix.org/api/countries',
            params=params,  # Transmettre les paramètres
            timeout=10
        )
        return JsonResponse(
            response.json(),
            status=response.status_code,
            safe=False
        )
    except requests.exceptions.RequestException as e:
        return JsonResponse({'error': str(e)}, status=500)
```

### Ajouter la gestion du cache

Installer django-cache-machine :

```bash
pip install django-redis
```

Configurer dans `settings.py` :

```python
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
    }
}
```

Utiliser le cache dans les vues :

```python
from django.core.cache import cache

@csrf_exempt
def countries_proxy(request):
    cache_key = 'landmatrix_countries'
    cached_data = cache.get(cache_key)
    
    if cached_data:
        return JsonResponse(cached_data, safe=False)
    
    try:
        response = requests.get('https://landmatrix.org/api/countries', timeout=10)
        data = response.json()
        cache.set(cache_key, data, 3600)  # Cache pour 1 heure
        return JsonResponse(data, status=response.status_code, safe=False)
    except requests.exceptions.RequestException as e:
        return JsonResponse({'error': str(e)}, status=500)
```

### Ajouter la journalisation (logging)

Dans `settings.py`, ajouter :

```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'DEBUG',
            'class': 'logging.FileHandler',
            'filename': 'debug.log',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}
```

Dans `views.py` :

```python
import logging

logger = logging.getLogger(__name__)

@csrf_exempt
def countries_proxy(request):
    logger.info('Requête reçue pour /api/countries')
    try:
        response = requests.get('https://landmatrix.org/api/countries', timeout=10)
        logger.info(f'Réponse reçue avec le statut {response.status_code}')
        return JsonResponse(response.json(), status=response.status_code, safe=False)
    except requests.exceptions.RequestException as e:
        logger.error(f'Erreur lors de la requête: {str(e)}')
        return JsonResponse({'error': str(e)}, status=500)
```

## 🧪 Tests

### Créer des tests unitaires

Modifier `api/tests.py` :

```python
from django.test import TestCase, Client
from django.urls import reverse

class CountriesProxyTestCase(TestCase):
    def setUp(self):
        self.client = Client()
    
    def test_countries_endpoint_returns_200(self):
        response = self.client.get(reverse('countries_proxy'))
        self.assertEqual(response.status_code, 200)
    
    def test_countries_endpoint_returns_json(self):
        response = self.client.get(reverse('countries_proxy'))
        self.assertEqual(response['Content-Type'], 'application/json')
```

### Exécuter les tests

```bash
python manage.py test
```

### Tests avec coverage

```bash
pip install coverage
coverage run --source='.' manage.py test
coverage report
coverage html  # Génère un rapport HTML
```

## 🚀 Déploiement en Production

### 1. Préparer le projet

```bash
# Collecter les fichiers statiques
python manage.py collectstatic

# Créer les migrations (si nécessaire)
python manage.py makemigrations
python manage.py migrate
```

### 2. Utiliser Gunicorn (serveur WSGI)

```bash
# Installer Gunicorn
pip install gunicorn

# Démarrer avec Gunicorn
gunicorn proxy_project.wsgi:application --bind 0.0.0.0:8000
```

### 3. Configuration avec Nginx (reverse proxy)

Créer `/etc/nginx/sites-available/django_proxy` :

```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Activer le site :

```bash
sudo ln -s /etc/nginx/sites-available/django_proxy /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. Service Systemd

Créer `/etc/systemd/system/django_proxy.service` :

```ini
[Unit]
Description=Django Proxy API
After=network.target

[Service]
User=arthur
Group=arthur
WorkingDirectory=/home/arthur/Documents/nextcloud_sync/Documents/projet geonum/django_proxy
Environment="PATH=/home/arthur/Documents/nextcloud_sync/Documents/projet geonum/django_proxy/.venv/bin"
ExecStart=/home/arthur/Documents/nextcloud_sync/Documents/projet geonum/django_proxy/.venv/bin/gunicorn --workers 3 --bind 127.0.0.1:8000 proxy_project.wsgi:application

[Install]
WantedBy=multi-user.target
```

Activer et démarrer :

```bash
sudo systemctl daemon-reload
sudo systemctl enable django_proxy
sudo systemctl start django_proxy
sudo systemctl status django_proxy
```

## 🔒 Sécurité

### Recommandations pour la production

1. **Changer la clé secrète** dans `settings.py` :
```python
SECRET_KEY = 'votre-cle-secrete-aleatoire-et-longue'
```

2. **Désactiver le mode debug** :
```python
DEBUG = False
```

3. **Configurer ALLOWED_HOSTS** :
```python
ALLOWED_HOSTS = ['votre-domaine.com', 'www.votre-domaine.com']
```

4. **Ajouter CORS si nécessaire** :
```bash
pip install django-cors-headers
```

Dans `settings.py` :
```python
INSTALLED_APPS = [
    # ...
    'corsheaders',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    # ...
]

CORS_ALLOWED_ORIGINS = [
    "https://votre-frontend.com",
]
```

5. **Utiliser HTTPS** :
```python
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
```

## 📊 Monitoring et Logs

### Voir les logs en temps réel

```bash
tail -f debug.log
```

### Monitoring avec Django Debug Toolbar (développement uniquement)

```bash
pip install django-debug-toolbar
```

Configuration dans `settings.py` :

```python
if DEBUG:
    INSTALLED_APPS += ['debug_toolbar']
    MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware']
    INTERNAL_IPS = ['127.0.0.1']
```

## ❓ Dépannage

### Le serveur ne démarre pas

```bash
# Vérifier que le port n'est pas déjà utilisé
lsof -i :8000

# Tuer le processus si nécessaire
kill -9 <PID>
```

### Erreur de module non trouvé

```bash
# Réactiver l'environnement virtuel
source .venv/bin/activate

# Réinstaller les dépendances
pip install -r requirements.txt
```

### Erreur de connexion à l'API externe

- Vérifier votre connexion Internet
- Vérifier que l'URL de l'API est correcte
- Augmenter le timeout dans `views.py`

## 📚 Ressources

- [Documentation Django](https://docs.djangoproject.com/)
- [Documentation Requests](https://requests.readthedocs.io/)
- [LandMatrix API](https://landmatrix.org/api/)

---

**Date de création :** 17 novembre 2025  
**Dernière mise à jour :** 17 novembre 2025
