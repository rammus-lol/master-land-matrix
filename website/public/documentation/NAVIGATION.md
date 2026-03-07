# Navigation Guide - Master Land Matrix

## Quick Access

### Main Pages
- **Documentation**: `/documentation.html` - The page you are currently reading
- **Interactive Maps**: `/maps.html` - Geospatial data visualization

### Documentation Sections (in order)

1. **INDEX** - Home and complete overview
   - Project overview
   - General architecture
   - Essential commands
   - Critical points

2. **DASHBOARD** - Real-time status and metrics
   - Service status
   - Available data
   - System performance
   - Alerts and maintenance

3. **00-Introduction** - Fundamental concepts
   - Project objectives
   - Organizational structure
   - Data integrity

4. **01-Frontend** - Web interface
   - Vite.js architecture
   - File structure
   - Configuration and deployment

5. **02-Backend** - Django API
   - REST endpoints
   - Custom services
   - Management commands

6. **03-Crawler** - Automated scraping
   - Scraping orchestration
   - Log files
   - Integration points

7. **04-Data** - Resources and formats
   - GeoPackage (.gpkg)
   - GeoJSON and JSON
   - Critical data structure

8. **05-Deployment** - Production setup
   - Development vs Production
   - Docker and configuration
   - PostgreSQL database

9. **06-Workflow** - Processes and flows
   - Data lifecycle
   - Common scenarios
   - Error handling

---

## Quick Start

### First-time Installation
```bash
# Backend
cd django_proxy
pip install -r requirements.txt
python manage.py migrate

# Frontend
cd website
npm install
```

### Development
```bash
# Terminal 1
cd django_proxy && python manage.py runserver

# Terminal 2
cd website && npm run dev
```

### Update Data
```bash
cd django_proxy
python manage.py crawler_main
```

---

## Search Documentation by Topic

### Configuration and Setup
- See: Deployment (05-deployment.md)
- See: Workflow (06-workflow.md)

### Data and Formats
- See: Data (04-data.md)
- See: Introduction (00-introduction.md)

### Development
- Frontend: See 01-frontend.md
- Backend: See 02-backend.md
- Data: See 03-crawler.md

### Production and Monitoring
- See: Deployment (05-deployment.md)
- See: Dashboard (DASHBOARD.md)

---

## Useful Commands

### Common Shortcuts

| Action | Command | Location |
|--------|---------|----------|
| View crawler logs | Check reports directory | N/A |
| View reports | `ls django_proxy/data/reports/` | N/A |
| Restart Django | `python manage.py runserver` | django_proxy |
| Frontend watch | `npm run dev` | website |
| Production build | `npm run build` | website |

### Important Files

| File | Location | Role |
|------|----------|------|
| `settings.py` | `django_proxy/proxy_project/` | Django config |
| `requirements.txt` | `django_proxy/` | Python dependencies |
| `package.json` | `website/` | npm dependencies |
| `urls.py` | `django_proxy/api/` | API routes |
| `models.py` | `django_proxy/api/` | Data models |
| `document.js` | `website/src/scripts/` | Documentation loader |

---

## FAQ - Frequently Asked Questions

### Q: How to add a new documentation section?
**A**: Create a `.md` file in `/website/public/documentation/` and add its path in the `documentationFiles` array in `document.js`.

### Q: Where to find geospatial data?
**A**: In `/django_proxy/data/` - check `.gpkg` (GeoPackage) and `.geojson` files.

### Q: How to export data?
**A**: Through Django API endpoints or directly via GDAL tools (`ogrinfo` / `ogr2ogr`).

### Q: Crawler not fetching data?
**A**: Check logs in `django_proxy/api/management/commands/logs/` for errors. Also verify internet connectivity and API availability.

### Q: Port 8000 or 5173 already in use?
**A**: Use `python manage.py runserver 8001` or `npm run dev -- --port 5174`

### Q: How to use PostgreSQL instead of SQLite?
**A**: See "Database" section in 05-deployment.md

---

## External Resources

### Official Documentation
- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Vite.js Documentation](https://vitejs.dev/)
- [marked.js](https://marked.js.org/)

### Geospatial Tools
- [GeoPandas](https://geopandas.org/)
- [GDAL/OGR](https://gdal.org/)
- [Shapely](https://shapely.readthedocs.io/)

### Land Matrix
- [Land Matrix Global](https://landmatrix.org/)
- [API Documentation](https://landmatrix.org/api/)

---

## Naming Conventions

### Log Files
```
Format: log_YYYY_MM_DD_HH_MM_SS.txt
```

### Report Files
```
Format: report_YYYY_MM_DD_HH_MM_SS.json
Location: /django_proxy/data/reports/
```

### Documentation Files
```
Format: XX-section-name.md
Special: INDEX.md, DASHBOARD.md, README.md, etc.
```

---

## Deployment Checklist

- [ ] All `requirements.txt` updated
- [ ] Database migrated (`python manage.py migrate`)
- [ ] Environment variables configured
- [ ] `DEBUG=False` in production
- [ ] `SECRET_KEY` changed
- [ ] `ALLOWED_HOSTS` configured
- [ ] CORS configured correctly
- [ ] Unit tests passing
- [ ] Frontend build optimized (`npm run build`)
- [ ] Backups in place
- [ ] Monitoring configured
- [ ] Documentation updated

---

**Navigation Guide - Version 1.0**  
**Last updated**: March 2026
