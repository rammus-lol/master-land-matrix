# Master Land Matrix - Documentation Home

## What is Master Land Matrix?

Master Land Matrix is a comprehensive geospatial analysis platform for visualizing and analyzing global land investments. It combines a robust Django API, an interactive Vite-based web interface, and automated data collection tools to provide a complete analysis solution.

---

## Main Features

- Visualize land investments on interactive maps
- Analyze spatial data by region, year, and investment type
- Export reports in PDF, CSV, or Excel formats
- Automatically update data through the crawler module
- Store and manage large geospatial datasets

---

## Platform Architecture

```
Web Interface (Vite.js + Frontend)
           ↓
    Django API
           ↓
  Spatial Services + Export Services
           ↓
   Database + GeoPackage Data + Crawler
```

---

## Project Components

The project is organized into four major components:

### 1. Frontend (`/website`)
- Interactive user interface
- Data visualization
- Documentation access

### 2. Backend API (`/django_proxy`)
- Django REST server
- Spatial query processing
- Data export functionality
- Database integration

### 3. Crawler Module
- Located in `django_proxy/api/management/commands/`
- External data retrieval via Django commands
- Automated updates (crawler_main, crawler_area, crawler_points)
- Data validation and transformation

### 4. Analysis Scripts (`/R_script`)
- Advanced statistical analysis
- Graphic reports
- R visualizations

---

## Essential Commands

### Development
```bash
# Terminal 1 - Backend
cd django_proxy
python manage.py runserver

# Terminal 2 - Frontend
cd website
npm run dev
```

### Data Update
```bash
cd django_proxy
python manage.py crawler_main
```

### Production Build
```bash
cd website
npm run build
```

---

## Documentation Structure

This documentation is divided into seven main sections:

1. **Introduction** - Overview and key concepts
2. **Frontend** - Web interface and Vite.js
3. **Backend** - Django API and endpoints
4. **Crawler** - Data scraping and updates
5. **Data** - Formats and data structure
6. **Deployment** - Configuration and production
7. **Workflow** - Processes and scenarios

---

## Initial Setup

### Prerequisites
- Python 3.8+ (Docker uses 3.14)
- Node.js 16+ (Docker uses 20)
- PostgreSQL (optional, SQLite by default)
- GDAL (for spatial operations)

### Installation

```bash
# Clone repository
git clone <repository>
cd master-land-matrix

# Backend setup
cd django_proxy
pip install -r requirements.txt
python manage.py migrate

# Frontend setup
cd ../website
npm install
```

---

## Critical Data Fields

These fields are essential for application functionality and must not be modified:
- `id` and `country_id` - Identifiers
- `deal_size` - Investment size
- `locations` - Geometry list (must remain iterable)
- `level_of_accuracy` - Geographic precision

### Directory Structure
- Do not rename key folders
- Preserve GeoPackage file organization
- Maintain Django migrations structure

---

## Troubleshooting

### Check Logs
- **Crawler logs**: `django_proxy/api/management/commands/logs/`
- **Crawler reports**: `django_proxy/data/reports/`
- **Django**: Development console output
- **Frontend**: Browser console (F12)

### Common Issues
- Import errors: Check `requirements.txt`
- CORS errors: Configure `CORS_ALLOWED_ORIGINS` in Django settings
- Missing data: Run the crawler
- Port conflicts: Change port in command

---

**Last updated**: March 2026  
**Maintained by**: Master Land Matrix Team
