# 🗺️ Guide de navigation - Master Land Matrix

## Accès rapide

### 🏠 Pages principales
- **Documentation**: `/documentation.html` - Page que vous lisez actuellement
- **Cartes interactives**: `/maps.html` - Visualisation des données géospatiales

### 📚 Sections de documentation (dans l'ordre)

1. **INDEX** - Accueil et vue d'ensemble complète
   - Vue d'ensemble du projet
   - Architecture générale
   - Commandes essentielles
   - Points critiques

2. **DASHBOARD** - Statuts et métriques en temps réel
   - État des services
   - Données disponibles
   - Performance du système
   - Alertes et maintenance

3. **00-Introduction** - Concepts fondamentaux
   - Objectifs du projet
   - Structure organisationnelle
   - Intégrité des données

4. **01-Frontend** - Interface web
   - Architecture Vite.js
   - Structure des fichiers
   - Configuration et déploiement

5. **02-Backend** - API Django
   - Endpoints REST
   - Services personnalisés
   - Commandes de gestion

6. **03-Crawler** - Scraping automatisé
   - Orchestration du scraping
   - Fichiers de log
   - Points d'intégration

7. **04-Data** - Ressources et formats
   - GeoPackage (.gpkg)
   - GeoJSON et JSON
   - Structure critique des données

8. **05-Deployment** - Mise en production
   - Développement vs Production
   - Docker et configuration
   - Base de données PostgreSQL

9. **06-Workflow** - Processus et flux
   - Cycle de vie des données
   - Scénarios courants
   - Gestion des erreurs

---

## 🚀 Démarrer rapidement

### Installation (première fois)
```bash
# Backend
cd django_proxy
pip install -r requirements.txt
python manage.py migrate

# Frontend
cd website
npm install
```

### Démarrer le développement
```bash
# Terminal 1
cd django_proxy && python manage.py runserver

# Terminal 2
cd website && npm run dev
```

### Mettre à jour les données
```bash
cd django_proxy
python manage.py crawler_main
```

---

## 🔍 Chercher dans la documentation

### Par sujet

**Configuration et Setup**
- Voir: Déploiement (05-deployment.md)
- Voir: Workflow (06-workflow.md)

**Données et Formats**
- Voir: Data (04-data.md)
- Voir: Introduction (00-introduction.md)

**Développement**
- Frontend: Voir 01-frontend.md
- Backend: Voir 02-backend.md
- Données: Voir 03-crawler.md

**Production et Monitoring**
- Voir: Déploiement (05-deployment.md)
- Voir: Dashboard (DASHBOARD.md)

---

## 💡 Tips et astuces

### Raccourcis utiles

| Action | Commande | Fichier |
|--------|----------|---------|
| Voir les logs du crawler | `tail -f crawler/logs/log_*.txt` | N/A |
| Voir les rapports | `ls django_proxy/data/reports/` | N/A |
| Redémarrer Django | `python manage.py runserver` | django_proxy |
| Watcher frontend | `npm run dev` | website |
| Build production | `npm run build` | website |

### Fichiers importants à connaître

| Fichier | Localisation | Rôle |
|---------|-------------|------|
| `settings.py` | `django_proxy/proxy_project/` | Config Django |
| `requirements.txt` | `django_proxy/` | Dépendances Python |
| `package.json` | `website/` | Dépendances npm |
| `urls.py` | `django_proxy/api/` | Routes API |
| `models.py` | `django_proxy/api/` | Modèles de données |
| `document.js` | `website/src/scripts/` | Loader de documentation |

---

## ❓ FAQ - Questions fréquentes

### Q: Comment ajouter une nouvelle section de documentation?
**R**: Créez un fichier `.md` dans `/website/public/documentation/` et ajoutez son chemin dans le tableau `documentationFiles` de `document.js`.

### Q: Où trouver les données géospatiales?
**R**: Dans `/django_proxy/data/` - fichiers `.gpkg` (GeoPackage) et `.geojson`.

### Q: Comment exporter les données?
**R**: Via les endpoints API Django ou directement via GDAL `ogrinfo` / `ogr2ogr`.

### Q: Le crawler ne scrape pas les données?
**R**: Vérifiez les logs dans `/crawler/logs/` pour les erreurs. Vérifiez aussi la connectivité internet.

### Q: Port 8000 ou 5173 déjà utilisé?
**R**: `python manage.py runserver 8001` ou `npm run dev -- --port 5174`

### Q: Comment utiliser PostgreSQL au lieu de SQLite?
**R**: Voir section "Base de données" dans 05-deployment.md

---

## 🔗 Ressources externes

### Documentation officielle
- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Vite.js Documentation](https://vitejs.dev/)
- [marked.js](https://marked.js.org/)

### Outils géospatiaux
- [GeoPandas](https://geopandas.org/)
- [GDAL/OGR](https://gdal.org/)
- [Shapely](https://shapely.readthedocs.io/)

### Land Matrix
- [Land Matrix Global](https://landmatrix.org/)
- [API Documentation](https://landmatrix.org/api/)

---

## 📝 Convention de nommage

### Fichiers de log
```
/crawler/logs/log_YYYY_MM_DD_HH_MM_SS.txt
```

### Fichiers de rapport
```
/django_proxy/data/reports/report_YYYY_MM_DD_HH_MM_SS.json
```

### Fichiers de documentation
```
/website/public/documentation/XX-section-name.md
Index: INDEX.md, DASHBOARD.md
```

---

## ✅ Checklist de déploiement

- [ ] Tous les `requirements.txt` mis à jour
- [ ] Base de données migrée (`python manage.py migrate`)
- [ ] Variables d'environnement configurées
- [ ] `DEBUG=False` en production
- [ ] `SECRET_KEY` changée
- [ ] `ALLOWED_HOSTS` configuré
- [ ] CORS configuré correctement
- [ ] Tests unitaires passent
- [ ] Build frontend optimisée (`npm run build`)
- [ ] Sauvegardes en place
- [ ] Monitoring configuré
- [ ] Documentation à jour

---

**Guide de navigation - Version 1.0**  
**Dernière mise à jour**: 3 Mars 2026
