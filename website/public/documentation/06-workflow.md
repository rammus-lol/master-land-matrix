# Workflow et Flux de travail

## Cycle de vie des données

```
┌─────────────────────────────────────────────────────────┐
│ 1. SOURCE EXTERNE (Land Matrix Global)                  │
│    • API publique avec données d'investissement foncier │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 2. CRAWLER (django_proxy/management/commands)           │
│    • Scrape les données via l'API externe              │
│    • Format et valide les données                       │
│    • Génère des logs détaillés                         │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 3. STOCKAGE (django_proxy/data/)                        │
│    • Sauvegarde dans les GeoPackage                     │
│    • Rapports JSON générés                             │
│    • Historique des données                            │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 4. API DJANGO (api/views.py & spatial_service/)         │
│    • Expose les endpoints REST                         │
│    • Effectue les requêtes spatiales                   │
│    • Cache les résultats                              │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 5. FRONTEND WEB (website/)                              │
│    • Charge les données via l'API                      │
│    • Affiche les cartes interactives                   │
│    • Permet les exports (PDF, CSV, Excel)              │
└─────────────────────────────────────────────────────────┘
```

## Scénarios d'utilisation

### Scénario 1: Mise à jour des données

1. **Lancer le crawler**:
   ```bash
   cd django_proxy
   python manage.py crawler_main
   ```

2. **Le crawler**:
   - Connecte à l'API externe
   - Récupère les nouveaux investissements
   - Valide la structure des données
   - Sauvegarde dans `areas.gpkg` et `deals.gpkg`
   - Génère un rapport JSON
   - Enregistre les logs

3. **Redémarrage optionnel** de l'API Django pour charger les nouvelles données

### Scénario 2: Consultation des données

1. **Utilisateur accède au site web**
   - Frontend charge `document.html` et `maps.html`

2. **Visualisation de la documentation**
   - Le script `document.js` charge les fichiers markdown
   - Affichage formaté de la documentation

3. **Consultation de la carte**
   - L'API Django fournit les données GeoJSON
   - La carte interactive affiche les localisations
   - Les utilisateurs peuvent filtrer par région

### Scénario 3: Génération de rapport

1. **Utilisateur sélectionne les paramètres** (région, année, type)

2. **L'API traite la requête**:
   - Filtre les données du GeoPackage
   - Agrège les statistiques
   - Génère le rapport (PDF/CSV)

3. **L'API retourne le fichier**
   - Download dans le navigateur

## Points d'intégration clés

### Backend ↔ Frontend
- Requêtes AJAX/Fetch vers les endpoints API
- Format JSON pour échange de données
- CORS géré dans `settings.py`

### Base de données ↔ Services
- ORM Django pour les requêtes
- GeoPandas pour les opérations spatiales
- Transactions pour la cohérence

### Crawler ↔ Stockage
- Sauvegarde directe dans les fichiers GeoPackage
- Création de rapports JSON
- Enregistrement des logs

## Timing et fréquence

- **Crawler**: Peut être lancé manuellement ou par cron
- **API**: Toujours disponible (pas de cache long terme)
- **Frontend**: Chargement à la demande

## Gestion des erreurs

- **Erreurs crawler**: Enregistrées dans les logs
- **Erreurs API**: Retours HTTP appropriés (4xx, 5xx)
- **Erreurs frontend**: Affichage de messages d'erreur utilisateur
- **Données manquantes**: Graceful degradation de l'interface

