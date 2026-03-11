# Master Land Matrix - Documentation

## Table of Contents

This documentation is organized into multiple chapters covering all aspects of the Master Land Matrix platform.

### Methodology Part

1. **[07 - Technical Methodology](methodology/07-technical-pipeline.md)**
   - ETL-like pipeline
   - Point and polygon extraction
   - Spatial enrichment and GeoPackage storage
   - Crawler orchestration and technical compromises

2. **[08 - Methodological Workflow](methodology/08-methodological-workflow.md)**
   - User intent to spatial query
   - Precision-aware selection
   - Query → review → export logic
   - Output specialization for CSV / XLSX / PDF

### Architecture Part

3. **[00 - Introduction](architecture/00-introduction.md)**
   - Project overview
   - Main goals
   - Project structure
   - Data integrity concepts

4. **[01 - Frontend](architecture/01-frontend.md)**
   - Vite-based web interface
   - Folder structure
   - Key files and configuration
   - Running and building

5. **[02 - Backend](architecture/02-backend.md)**
   - Django API architecture
   - Main components and services
   - API endpoints
   - Configuration

6. **[03 - Crawler](architecture/03-crawler.md)**
   - Data collection module
   - How it works
   - Commands and scheduling
   - Logs and debugging

7. **[04 - Data](architecture/04-data.md)**
   - Data storage and formats
   - GeoPackage and GeoJSON files
   - Data schema (critical fields)
   - Import and export

8. **[05 - Deployment](architecture/05-deployment.md)**
   - Development and production environments
   - Docker setup
   - Configuration settings
   - Performance and monitoring

9. **[06 - Workflow](architecture/06-workflow.md)**
   - Data lifecycle
   - Common workflows
   - Integration points
   - Error handling

---

## Quick Start

### Development setup

```bash
# Backend
cd django_proxy
python manage.py runserver

# Frontend (new terminal)
cd website
npm run dev
```

### Update data

```bash
cd django_proxy
python manage.py crawler_main
```

---

## Important Notes

**Data Integrity**: The following fields must remain unchanged:
- `id`, `country_id`
- `deal_size`, `current_intention_of_investment`
- `current_implementation_status`, `current_negotiation_status`
- `initiation_year`, `locations`, `level_of_accuracy`

**File Structure**: Modifying GeoPackage files or directory organization may cause system failures.

**Performance**: Spatial operations on large datasets can be resource-intensive.

---

## Troubleshooting

- Check crawler logs in `django_proxy/data/reports/` for errors
- Use browser console (F12) for frontend debugging
- Review Django console output for backend errors

---

**Documentation last updated**: March 2026  
