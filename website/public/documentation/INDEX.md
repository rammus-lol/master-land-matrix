# 🌍 Bienvenue - Master Land Matrix Documentation

## Qu'est-ce que Master Land Matrix?

Master Land Matrix est une **plateforme complète d'analyse géospatiale** dédiée à la visualisation et l'analyse des investissements fonciers globaux. Elle combine une API robuste (Django), une interface web interactive (Vite.js) et des outils de scraping automatisés pour fournir une solution d'analyse complète.

## 🎯 À quoi ça sert?

- **Visualiser** les investissements fonciers sur des cartes interactives
- **Analyser** les données spatiales par région, année et type d'investissement
- **Exporter** les rapports en PDF, CSV ou Excel
- **Mettre à jour** automatiquement les données via le crawler
- **Stocker** et gérer de grandes quantités de données géospatiales

## 🏗️ Architecture générale

```
┌──────────────────────────────────────────────────────────────┐
│                   LAND MATRIX WEB INTERFACE                   │
│                  (Vite.js + Frontend Assets)                  │
└────────────────────────┬─────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
    ┌────────┐    ┌──────────┐    ┌──────────────┐
    │ DJANGO │    │  SPATIAL │    │ EXPORT       │
    │ API    │◄──►│  QUERIES │◄──►│ SERVICES     │
    │        │    │          │    │ (PDF/CSV)    │
    └────────┘    └──────────┘    └──────────────┘
        │                │                │
        └────────────────┼────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   ┌─────────┐    ┌──────────┐    ┌──────────┐
   │ BDD     │    │ GEO DATA │    │ CRAWLER  │
   │ SQLite  │    │ (.gpkg)  │    │ SCRAPER  │
   │         │    │          │    │          │
   └─────────┘    └──────────┘    └──────────┘
```

## 📂 Structure du projet

Le projet est organisé en **4 composants majeurs**:

### 1. **Frontend** (`/website`)
- Interface utilisateur interactive
- Visualisation des données
- Accès à la documentation

### 2. **Backend API** (`/django_proxy`)
- Serveur Django REST
- Gestion des requêtes spatiales
- Export de données
- Intégration base de données

### 3. **Crawler/Scraper** (`/crawler`)
- Récupération des données externes
- Mise à jour automatisée
- Validation et transformation

### 4. **Scripts d'analyse** (`/R_script`)
- Analyses statistiques avancées
- Rapports graphiques
- Visualisations R

---

## 🚀 Commandes essentielles

### Démarrer le développement
```bash
# Terminal 1 - Backend
cd django_proxy
python manage.py runserver

# Terminal 2 - Frontend
cd website
npm run dev
```

### Mettre à jour les données
```bash
cd django_proxy
python manage.py crawler_main
```

### Construire pour la production
```bash
cd website
npm run build
```

---

## 📚 Documentation complète

Cette documentation est divisée en **7 sections principales**:

1. **Introduction** - Vue d'ensemble et concepts clés
2. **Frontend** - Interface web et technos Vite.js
3. **Backend** - API Django et endpoints
4. **Crawler** - Scraping et mise à jour des données
5. **Données** - Formats et structure des données
6. **Déploiement** - Configuration et mise en production
7. **Workflow** - Flux de travail et scénarios

📖 _Consultez les sections détaillées en scrollant vers le bas_

---

## ⚙️ Configuration initiale

### Prérequis
- Python 3.8+
- Node.js 16+
- PostgreSQL (optionnel, SQLite par défaut)
- GDAL (pour les opérations spatiales)

### Installation

```bash
# Clone le repository
git clone <repository>
cd master-land-matrix

# Setup backend
cd django_proxy
pip install -r requirements.txt
python manage.py migrate

# Setup frontend
cd ../website
npm install
```

---

## ⚠️ Points critiques - À NE PAS modifier

### Intégrité des données
Ces champs sont essentiels pour le fonctionnement de l'application:
- **`id`** et **`country_id`** - Identifiants
- **`deal_size`** - Taille de l'investissement
- **`locations`** - Liste des géométries (doit rester itérable)
- **`level_of_accuracy`** - Précision géographique

### Structure des répertoires
- Ne pas renommer les dossiers clés
- Conserver l'organisation des fichiers GeoPackage
- Maintenir la structure de migrations Django

---

## 🆘 Besoin d'aide?

### Vérifier les logs
- **Crawler**: `crawler/logs/log_*.txt`
- **Rapports**: `django_proxy/data/reports/report_*.json`
- **Django**: Console de développement

### Dépannage courant
- Erreur d'import: Vérifier `requirements.txt`
- Erreur CORS: Configurer `CORS_ALLOWED_ORIGINS` dans Django
- Données manquantes: Lancer le crawler
- Port occupé: Changer le port dans la commande

---

**Dernière mise à jour**: 3 Mars 2026  
**Maintenu par**: Master Land Matrix Team
