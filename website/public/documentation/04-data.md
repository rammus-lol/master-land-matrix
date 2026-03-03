# Données et Ressources

## Ressources de données principales

```
django_proxy/data/
├── areas.gpkg                    # Zones/régions géographiques
├── deals.gpkg                    # Transactions d'investissement
├── polygone_test.geojson         # Données de test
├── world_region_light.gpkg       # Régions mondiales légères
├── reports/                      # Rapports générés
│   ├── report_*.json            # Rapports JSON horodatés
└── management/commands/logs/     # Logs des commandes
```

## Formats de données

### GeoPackage (.gpkg)
Format géospatial vectoriel qui contient:
- Géométries (points, lignes, polygones)
- Attributs tabulaires
- Métadonnées spatiales
- Index spatiaux

**Fichiers principaux**:
- **areas.gpkg**: Contient les zones d'intérêt, les régions administratives
- **deals.gpkg**: Contient les localisations des investissements fonciers
- **world_region_light.gpkg**: Référence mondiale légère pour le contexte

### GeoJSON
Format JSON pour les données géospatiales, lisible et transportable.
- **polygone_test.geojson**: Utilisé pour tester les fonctionnalités spatiales

### JSON Reports
Rapports d'analyse générés avec horodatage:
- Format: `report_YYYY_MM_DD_HH_MM_SS.json`
- Contiennent les statistiques et agrégations
- Utilisés pour l'historique des analyses

## Structure des données

### Land Matrix API Response

Les données d'investissement foncier ont la structure suivante:

```json
{
    "id": "unique_identifier",
    "country_id": "country_code",
    "selected_version": {
        "deal_size": "hectares",
        "current_intention_of_investment": "type",
        "current_implementation_status": "status",
        "current_negotiation_status": "negotiation",
        "initiation_year": "year",
        "locations": [
            {
                "level_of_accuracy": "precision_level",
                "coordinates": [...],
                "geometry": {...}
            }
        ]
    }
}
```

## Champs critiques (Ne pas modifier)

### Identifiants racines
- **id**: Identifiant unique du record
- **country_id**: Code pays pour le filtrage et la liaison BD

### Objet selected_version
- **deal_size**: Volume d'investissement en hectares
- **current_intention_of_investment**: Nature de l'investissement (agriculture, mine, etc.)
- **current_implementation_status**: Phase de mise en œuvre
- **current_negotiation_status**: Statut légal/contractuel
- **initiation_year**: Année de début pour l'analyse temporelle

### Données géographiques
- **locations**: Liste d'objets locatifs (DOIT rester itérable)
- **level_of_accuracy**: Précision de la localisation (essentiel pour la cartographie)

## Import/Export

### Importation
- Les données sont importées via le crawler depuis le Land Matrix Global
- Format d'entrée: API JSON
- Transformation et stockage dans les fichiers `.gpkg`

### Exportation
- **PDF**: Rapports avec cartes intégrées
- **CSV**: Données tabulaires pour analyse externe
- **Excel**: Sheets multicolonnes avec formatage

## Données de test

- **polygone_test.geojson**: Utilisé pour valider les requêtes spatiales
- Permet de tester les intersections, buffers et filtres géographiques
