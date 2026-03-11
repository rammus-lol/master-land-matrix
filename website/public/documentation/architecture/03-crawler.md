# 03 - Crawler Module

## 1) What the crawler is for

The crawler module automates the collection and update of land investment data from external sources. It retrieves information from the Land Matrix API, validates it, and stores it locally in GeoPackage files.

This allows the platform to:
- refresh data without manual intervention,
- keep local datasets synchronized with upstream sources,
- maintain an audit trail through detailed logs.

---

## 2) How it works

The crawler is implemented as Django management commands located in:
```text
django_proxy/api/management/commands/
├── crawler_main.py
├── crawler_area.py
├── crawler_points.py
└── logs/
```

When executed, the crawler:
1. connects to external data sources (typically the Land Matrix API),
2. fetches updated records,
3. validates the data structure,
4. writes the data to GeoPackage files in `django_proxy/data/`,
5. generates a JSON report with metadata and statistics,
6. logs the entire process with timestamps in `django_proxy/api/management/commands/logs/`.

---

## 3) Crawler commands

The project includes several specialized crawler commands:

- **`crawler_main.py`**: orchestrates the main crawling process.
- **`crawler_area.py`**: focuses on area/region data.
- **`crawler_points.py`**: focuses on point location data.

Run a crawler command:
```bash
cd django_proxy
python manage.py <command_name>
```

For example:
```bash
python manage.py crawler_main
```

---

## 4) Output files

The crawler produces:

- **GeoPackage data** (`areas.gpkg`, `deals.gpkg`) stored in `django_proxy/data/`.
- **JSON reports** in `django_proxy/data/reports/` with naming format `report_YYYY_MM_DD_HH_MM_SS.json`.
- **Log files** in `django_proxy/api/management/commands/logs/` documenting the process, including errors and progress.

---

## 5) Scheduling

The crawler can be:
- run manually when needed,
- scheduled via `cron` (Linux) or Task Scheduler (Windows) for regular updates.

Example cron setup (daily at 2 AM):
```cron
0 2 * * * cd /path/to/django_proxy && /path/to/python manage.py crawler_main >> /var/log/crawler.log 2>&1
```

---

## 6) Important considerations

- **Rate limiting**: respect external API rate limits to avoid blocking.
- **Timeouts**: configure appropriate network timeouts.
- **Data validation**: ensure incoming data matches the expected schema (see data integrity section in the introduction).
- **Error handling**: the crawler should retry failed requests and log errors clearly.

---

## 7) Logs and debugging

Logs provide:
- timestamps for each crawling step,
- records of how many entities were fetched,
- error messages when requests or validations fail.

Check logs when:
- data appears incomplete,
- scheduled jobs fail silently,
- debugging data quality issues.

---

## 8) Summary

The crawler module is a data collection pipeline built into Django management commands. It keeps the local dataset in sync with external sources and provides transparency through logging and JSON reports.
