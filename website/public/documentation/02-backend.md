# 02 - Backend (Django API)

## 1) What the backend is for

The backend is a Django API that acts as a data layer and processing engine for the application. It handles requests from the frontend, performs spatial operations, and manages data storage.

The backend is responsible for:
- serving data to the frontend through REST endpoints,
- running geospatial queries and analyses,
- generating reports in various formats (PDF, Excel, CSV),
- proxying requests to external Land Matrix API,
- coordinating data updates through crawler commands.

---

## 2) Technologies used

- **Django**: web framework and project structure.
- **Django REST Framework**: REST API and endpoint management.
- **GeoPandas**: geospatial data manipulation.
- **Pandas**: tabular data processing.
- **ReportLab**: PDF report generation.
- **Requests**: HTTP client for external API calls.
- **OpenPyXL**: Excel file generation and manipulation.

---

## 3) Backend folder structure

```text
django_proxy/
├── api/
│   ├── views.py                  # API endpoints and logic
│   ├── serializers.py            # Data serialization
│   ├── urls.py                   # URL routing
│   ├── models.py                 # Database models (if any)
│   ├── custom_service/
│   │   ├── pdf_report.py         # PDF generation logic
│   │   ├── spatial_function.py   # Geospatial operations
│   │   └── table_function.py     # Table processing
│   └── management/
│       └── commands/             # Django management commands
│           ├── crawler_main.py
│           ├── crawler_area.py
│           ├── crawler_points.py
│           └── logs/             # Crawler execution logs
├── data/
│   ├── areas.gpkg                # Geographic areas data
│   ├── deals.gpkg                # Investment deals data
│   ├── world_region_light.gpkg   # World regions reference
│   └── reports/                  # Generated reports
├── proxy_project/
│   ├── settings.py               # Django configuration
│   ├── urls.py                   # Root URL routing
│   ├── wsgi.py                   # WSGI config
│   └── asgi.py                   # ASGI config
├── manage.py                     # Django management interface
├── requirements.txt              # Python dependencies (pip)
├── pyproject.toml                # Project config (uv)
└── uv.lock                       # Dependency lock file (uv)
```

---

## 4) Key components

### `api/views.py`
Contains REST endpoints that:
- proxy requests to the external Land Matrix API (`generic_proxy`),
- process user-defined geometries for spatial analysis,
- trigger PDF and Excel exports,
- return GeoJSON features for map rendering.

### `custom_service/spatial_function.py`
Handles geospatial operations:
- geometric intersections with stored GeoPackage data,
- filtering by spatial criteria,
- building GeoJSON outputs from query results.

### `custom_service/table_function.py`
Handles data aggregation:
- organizing tabular data for reports,
- computing statistics,
- formatting data for Excel sheets.

### `custom_service/pdf_report.py`
Generates PDF reports:
- combines textual summaries with maps,
- uses layout templates,
- outputs ready-to-download files.

### `management/commands/`
Contains Django commands for administrative tasks:
- crawler commands for data updates,
- batch processing scripts.

---

## 5) Running the backend

### Development mode
```bash
cd django_proxy
python manage.py runserver
```

The server starts at `http://127.0.0.1:8000/`.

### Production deployment
See the deployment chapter for Docker and production configurations.

---

## 6) Main API endpoints

- **GET `/api/<path:endpoint>`**: generic proxy to Land Matrix API endpoints (e.g., `/api/countries`, `/api/deals`).
- **POST `/api/geom/`**: process user geometry (GeoJSON FeatureCollection in EPSG:3857) with precision filtering. Returns matching deals.
- **POST `/api/sheet/`**: generate Excel/CSV exports based on spatial query results.

The `/api/geom/` endpoint:
- Accepts GeoJSON with optional `radius` field for point features (creates circular buffers)
- Supports `is_precise` flag to filter deals by location accuracy
- Returns status messages: "No deal found", "No deal inside but nearby", or success with data

Check `api/urls.py` for the complete endpoint configuration.

---

## 7) Database

- **Development**: SQLite (`db.sqlite3`)
- **Production option**: PostgreSQL with PostGIS extension for spatial queries.

Currently, most data is stored in GeoPackage files rather than in a relational database.

---

## 8) Dependencies

See `requirements.txt`:
- Django 5.2+
- djangorestframework
- geopandas
- pandas
- reportlab
- openpyxl
- requests

Install with:
```bash
pip install -r requirements.txt
```

---

## 9) Configuration

Main settings are in `proxy_project/settings.py`:
- `ALLOWED_HOSTS`: allowed domains.
- `CORS_ALLOWED_ORIGINS`: frontend origins.
- `DEBUG`: set to `False` in production.
- `SECRET_KEY`: should be set via environment variable.

---

## 10) Summary

The Django backend serves as the data and processing layer. It proxies external APIs, runs spatial analysis, generates exports, and provides structured data to the frontend through REST endpoints.
