# Master Land Matrix - Documentation

## Table of Contents

This documentation is organized into multiple chapters covering all aspects of the Master Land Matrix platform.

### Core Documentation

1. **[00 - Introduction](00-introduction.md)**
   - Project overview
   - Main goals
   - Project structure
   - Data integrity concepts

2. **[01 - Frontend](01-frontend.md)**
   - Vite-based web interface
   - Folder structure
   - Key files and configuration
   - Running and building

3. **[02 - Backend](02-backend.md)**
   - Django API architecture
   - Main components and services
   - API endpoints
   - Configuration

4. **[03 - Crawler](03-crawler.md)**
   - Data collection module
   - How it works
   - Commands and scheduling
   - Logs and debugging

5. **[04 - Data](04-data.md)**
   - Data storage and formats
   - GeoPackage and GeoJSON files
   - Data schema (critical fields)
   - Import and export

6. **[05 - Deployment](05-deployment.md)**
   - Development and production environments
   - Docker setup
   - Configuration settings
   - Performance and monitoring

7. **[06 - Workflow](06-workflow.md)**
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
**Project version**: Master Land Matrix
