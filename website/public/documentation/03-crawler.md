# Module Crawler

## Vue d'ensemble

Le module Crawler est responsable du scraping automatique et de la mise à jour des données d'investissement foncier. Il récupère les données de sources multiples et les stocke dans le système de fichiers ou la base de données.

## Structure

```
crawler/
├── __pycache__/       # Fichiers compilés Python
├── logs/              # Journaux d'exécution
│   └── log_*.txt      # Fichiers de log horodatés
└── [scripts Python]   # Modules de scraping
```

## Fichiers de log

Les logs sont générés automatiquement avec un horodatage:
- Format de nom: `log_YYYY_MM_DD_HH_MM_SS.txt`
- Enregistrent l'avancement du crawling
- Utiles pour le débogage et le suivi des erreurs

## Points d'intégration

Le crawler s'intègre avec les commandes Django dans `django_proxy/management/commands/`:

- **crawler_main.py**: Orchestration générale du scraping
- **crawler_area.py**: Scraping des zones géographiques
- **crawler_points.py**: Scraping des points de données

## Fonctionnement attendu

1. **Initialisation**: Les commandes Django lancent le crawler
2. **Scraping**: Les données sont récupérées depuis les sources externes
3. **Transformation**: Les données sont formatées et validées
4. **Stockage**: Les données sont sauvegardées dans les fichiers GeoPackage
5. **Logging**: L'avancement est enregistré dans les fichiers de log

## Sorties de données

Le crawler produit:
- Fichiers GeoPackage (`.gpkg`) dans `/django_proxy/data/`
- Rapports JSON dans `/django_proxy/data/reports/`
- Journaux texte dans `/crawler/logs/`

## Considérations importantes

- **Timeouts**: Gérer les timeouts réseau appropriés
- **Rate limiting**: Respecter les limites de requêtes des sources
- **Validation**: Vérifier l'intégrité des données scarpa
- **Récupération**: Implémenter la logique de retry en cas d'erreur
