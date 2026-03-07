# 06 - Workflow and Usage

## 1) Data lifecycle overview

```
External Source (Land Matrix API)
           ↓
    Crawler Module
           ↓
Local Storage (GeoPackage files)
           ↓
   Django API (processing)
           ↓
    Frontend (display)
```

---

## 2) Common workflows

### Workflow 1: Updating the data

**Goal**: Refresh local data with the latest information from the external API.

**Steps**:
1. Run the crawler command:
   ```bash
   cd django_proxy
   python manage.py crawler_main
   ```
   Or use specific crawlers:
   ```bash
   python manage.py crawler_area
   python manage.py crawler_points
   ```

2. The crawler:
   - connects to the Land Matrix API,
   - fetches new or updated records,
   - validates data structure,
   - writes to `areas.gpkg` and `deals.gpkg` in `data/`,
   - generates a JSON report in `data/reports/`,
   - logs execution in `api/management/commands/logs/`.

3. Optionally restart the Django server to reload data if caching is enabled.

---

### Workflow 2: Viewing data on the map

**Goal**: Display land investment locations interactively.

**Steps**:
1. User opens the website and navigates to the maps page.
2. Frontend loads the map interface (OpenLayers).
3. Frontend requests data from the Django API.
4. API reads GeoPackage files and returns GeoJSON.
5. Map displays the locations.
6. User can filter by country, year, or investment type.

---

### Workflow 3: Generating a report

**Goal**: Create a PDF or Excel report based on user-selected criteria.

**Steps**:
1. User draws or selects an area on the map and sets parameters (precision level).
2. Frontend sends a POST request to `/api/geom/` with:
   - GeoJSON FeatureCollection in EPSG:3857
   - `is_precise` flag for accuracy filtering
3. API processes the spatial request:
   - handles points with radius (circular buffers),
   - reads data from GeoPackage files,
   - performs spatial intersection,
   - filters by precision level if requested,
   - returns matching deals as GeoJSON.
4. Map displays the results with visual feedback.
5. User can export results via `/api/sheet/` endpoint for Excel/CSV.

---

### Workflow 4: Adding or modifying a feature

**Goal**: Develop a new feature or fix a bug.

**Steps**:
1. Identify the component:
   - Frontend: `website/src/scripts/`
   - Backend: `django_proxy/api/views.py` or `custom_service/`
2. Make changes in the appropriate file.
3. Test locally:
   - Backend: `python manage.py runserver`
   - Frontend: `npm run dev`
4. Verify no errors in browser console or Django logs.
5. Build for production:
   - Frontend: `npm run build`
6. Deploy updated code.

---

## 3) Integration points

### Frontend ↔ Backend
- Communication: HTTP requests (Fetch API)
- Data format: JSON (often GeoJSON for spatial data)
- CORS: configured in `settings.py`

### Backend ↔ Data
- ORM: Django ORM for database (if used)
- GeoPandas: for GeoPackage file operations
- Transactions: ensure data consistency

### Crawler ↔ Storage
- Direct file writes to GeoPackage
- JSON reports for metadata
- Logs for audit trail

---

## 4) Scheduling and automation

### Crawler scheduling
- **Manual**: run when needed.
- **Automated**: use cron (Linux) or Task Scheduler (Windows).

Example cron entry (daily at 2 AM):
```cron
0 2 * * * cd /path/to/django_proxy && /path/to/venv/bin/python manage.py crawler_main >> /var/log/crawler.log 2>&1
```

---

## 5) Error handling

### Crawler errors
- Logged to file with timestamps.
- Check logs when data appears stale or incomplete.

### API errors
- Return appropriate HTTP status codes (400, 404, 500).
- Include error messages in JSON responses.

### Frontend errors
- Display user-friendly messages.
- Log errors to browser console for debugging.

### Data quality issues
- If required fields are missing, spatial operations may fail.
- Validate incoming data in the crawler.

---

## 6) Summary

This chapter describes how different parts of the system interact. Understanding these workflows helps with troubleshooting, feature development, and maintaining the platform over time.

