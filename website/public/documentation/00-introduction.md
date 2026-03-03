# Master Land Matrix - Documentation

## 📋 Vue d'ensemble du projet

Master Land Matrix est une application web complète pour visualiser, analyser et explorer des données géospatiales sur les investissements fonciers à travers le monde. Le projet combine une API Django avec une interface web Vite/Vue.js pour fournir une expérience utilisateur riche et interactive.

## 🎯 Objectifs principaux

- **Visualisation cartographique**: Afficher les localisations des investissements fonciers sur une carte interactive
- **Analyse spatiale**: Effectuer des analyses géospatiales avancées
- **Export de données**: Générer des rapports PDF et des fichiers Excel/CSV
- **Scraping de données**: Crawler et mettre à jour automatiquement les données via le module crawler

## 📁 Structure du projet

Le projet est organisé en plusieurs composants majeurs:

1. **Django Proxy API** - Backend principal (`/django_proxy`)
2. **Website** - Frontend Vite.js (`/website`)
3. **Crawler** - Module de scraping (`/crawler`)
4. **Scripts R** - Analyses statistiques (`/R_script`)

## 🔑 Concepts clés

### Data Integrity (Intégrité des données)

L'application dépend entièrement de la structure JSON fournie par l'API Land Matrix. Les champs manquants ou restructurés peuvent causer des défaillances critiques:

- **Champs racine obligatoires**: `id`, `country_id`
- **Champs de version**: `deal_size`, `current_intention_of_investment`, `current_implementation_status`, `current_negotiation_status`, `initiation_year`
- **Données géographiques**: les `locations` doivent rester une liste itérable avec `level_of_accuracy`
