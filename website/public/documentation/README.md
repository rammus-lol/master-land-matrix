# 📚 Table des matières - Documentation Master Land Matrix

## Sections disponibles

### 1. [Introduction](00-introduction.md) - Vue d'ensemble du projet
   - Objectifs principaux
   - Structure du projet
   - Concepts clés et intégrité des données

### 2. [Frontend](01-frontend.md) - Interface web Vite.js
   - Architecture et structure des répertoires
   - Fichiers principaux (document.js, vite.config.js)
   - Dépendances et build

### 3. [Backend](02-backend.md) - API Django
   - Architecture et structure
   - Composants principaux (Views, Services)
   - Commandes de gestion et crawler

### 4. [Crawler](03-crawler.md) - Module de scraping
   - Vue d'ensemble
   - Structure et fichiers de log
   - Points d'intégration et sorties

### 5. [Données](04-data.md) - Ressources et formats
   - Ressources de données principales (GeoPackage, GeoJSON)
   - Structure des données Land Matrix
   - Champs critiques et import/export

### 6. [Déploiement](05-deployment.md) - Configuration et mise en production
   - Environnements de développement et production
   - Configuration Django et variables d'environnement
   - Base de données et sauvegardes

### 7. [Workflow](06-workflow.md) - Flux de travail et processus
   - Cycle de vie des données
   - Scénarios d'utilisation
   - Points d'intégration clés

---

## 🚀 Démarrage rapide

### Développement
```bash
# Backend
cd django_proxy
python manage.py runserver

# Frontend (nouveau terminal)
cd website
npm run dev
```

### Mise à jour des données
```bash
cd django_proxy
python manage.py crawler_main
```

## 📋 Points importants à retenir

**⚠️ Intégrité des données**: Les champs suivants ne doivent JAMAIS être modifiés:
- `id`, `country_id`
- `deal_size`, `current_intention_of_investment`
- `current_implementation_status`, `current_negotiation_status`
- `initiation_year`, `locations`, `level_of_accuracy`

**🗂️ Structure des fichiers**: Changer la structure des fichiers GeoPackage ou la organisation des répertoires peut causer des surcharges système.

**📊 Performance**: Les opérations spatiales sur de grands ensembles de données peuvent être gourmandes en ressources.

---

## 🔧 Support et dépannage

- Vérifier les **logs** dans `crawler/logs/` pour les erreurs du crawler
- Consulter `django_proxy/data/reports/` pour les rapports des analyses
- Utiliser la console du navigateur (F12) pour les erreurs frontend

---

**Documentation mise à jour le**: 3 Mars 2026
**Version du projet**: Master Land Matrix
