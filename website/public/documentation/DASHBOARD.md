# System Dashboard and Status

## System Status

### Active Services
- **Django API**: http://localhost:8000 (development)
- **Frontend Web**: http://localhost:5173 (development)
- **Database**: SQLite - `django_proxy/db.sqlite3`

### Available Data

| Resource | File | Type | Status |
|----------|------|------|--------|
| Geographic areas | `areas.gpkg` | GeoPackage | Available |
| Investments | `deals.gpkg` | GeoPackage | Available |
| World regions | `world_region_light.gpkg` | GeoPackage | Reference |
| Spatial test | `polygone_test.geojson` | GeoJSON | Test |

### Generated Reports

```
django_proxy/data/reports/
├── report_2026_02_17_*.json
├── report_2026_02_26_*.json
├── report_2026_03_02_*.json
└── report_2026_03_03_*.json
```

**Total reports**: Check directory for current count

### Crawler Status

| Component | Last Execution | Status |
|-----------|---------------|--------|
| crawler_main | Check logs | View logs |
| crawler_area | Check logs | View logs |
| crawler_points | Check logs | View logs |

---

## Disk Usage

### Large Directories
```
django_proxy/data/                  ~500 MB (GeoPackage files)
website/node_modules/               ~400 MB (npm dependencies)
django_proxy/__pycache__/           ~30 MB (Python compiled)
django_proxy/api/__pycache__/       ~20 MB (Python compiled)
```

**Estimated total**: ~1 GB

---

## Security Configuration

### Production Checklist

- [ ] **SECRET_KEY**: Set via environment variable
- [ ] **DEBUG**: Set to `False` in production
- [ ] **ALLOWED_HOSTS**: Add production domains
- [ ] **CORS_ALLOWED_ORIGINS**: Configure allowed origins
- [ ] **Database**: Migrate to PostgreSQL + PostGIS
- [ ] **SSL/HTTPS**: Configure certificates
- [ ] **Authentication**: Add auth systems if required

---

## Performance Metrics

### Frontend
- **Bundle size**: ~200 KB (depends on dependencies)
- **Load time**: ~1-2 seconds (local network)
- **Refresh rate**: 60 FPS (interactive maps)

### Backend
- **API response time**: ~100-500ms (depends on complexity)
- **Spatial queries**: ~500ms to 5s (depending on area)
- **PDF export**: ~2-5 seconds

### Database
- **Connection**: SQLite (local)
- **Pending migrations**: Run `python manage.py showmigrations`
- **Integrity**: Verify regularly

---

## Scheduled Maintenance

### Recurring Tasks

| Task | Frequency | Notes |
|------|-----------|-------|
| Data update | Weekly | Run crawler |
| Database backup | Daily | Automated recommended |
| Log cleanup | Monthly | Prevent disk overflow |
| Integrity check | Monthly | Verify data quality |

---

## Alerts and Warnings

### Current Warnings
Check logs for any current warnings or errors.

### Notifications
Monitor crawler execution and report generation in `django_proxy/data/reports/`.

---

## Support and Logs

### Available Logs for Troubleshooting

**Crawler logs**:
Check `django_proxy/data/reports/` for JSON reports and execution logs.

**Django logs**: View console output when running the development server.

**Frontend logs**: Open Developer Tools (F12) in browser.

---

## Deployment History

| Date | Type | Version | Status | Notes |
|------|------|---------|--------|-------|
| 2026-03 | Update | 1.x | Success | Documentation standardized |

---

**Dashboard last updated**: March 2026  
**Overall status**: Monitor logs for current system state
