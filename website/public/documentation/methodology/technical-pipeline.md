# Technical Methodology

## 1) Purpose of the technical part

This chapter documents the **technical side of the methodology** used in the project.

Its purpose is to explain how Land Matrix data is:

- extracted,
- normalized,
- enriched with spatial metadata,
- stored locally in GeoPackages,
- and prepared for later querying and export.

This part focuses on the **data engineering and geospatial processing pipeline** behind the platform.

---

## 2) Technical pipeline overview

The project follows an ETL-like logic:

$$
\text{Land Matrix API} \rightarrow \text{Extraction} \rightarrow \text{Normalization} \rightarrow \text{Spatial enrichment} \rightarrow \text{GeoPackage storage} \rightarrow \text{Django API}
$$

The main technical idea is simple: the application does not query the public API every time a user clicks on the map. Instead, it builds a **local geospatial data layer** first, then serves user requests from this controlled local storage.

This provides:

- better performance,
- more predictable schemas,
- easier debugging,
- and a cleaner separation between ingestion and user interaction.

---

## 3) Data sources

### 3.1 Land Matrix API

The project uses two main remote sources:

- `https://landmatrix.org/api/deals/`
- `https://landmatrix.org/api/gis_export/areas/?&subset=PUBLIC&format=json`

The first endpoint is used for:

- deal identifiers,
- business attributes,
- location metadata,
- accuracy levels,
- and time-related fields.

The second endpoint is used for:

- polygon geometries of area-based projects.

### 3.2 Administrative reference data

The project also uses a local administrative reference dataset:

- `world_region_light.gpkg`

This file is the regional support layer used for:

- spatial joins,
- regional filtering,
- country / administrative context assignment,
- and interpretation of low-precision locations.

### 3.3 Unified working projection

The whole operational pipeline is normalized to **EPSG:3857**.

This projection is used because:

- it is consistent with web mapping workflows,
- buffers can be created directly in meters,
- and all local spatial datasets share the same working coordinate reference system.

---

## 4) Point-based deal extraction

Point-based deal processing is handled by the crawler logic dedicated to deals.

### 4.1 Reduced attribute schema

The crawler extracts only the fields required by the platform, such as:

- `id`
- `country_id`
- `deal_size`
- `current_intention_of_investment`
- `current_implementation_status`
- `current_negotiation_status`
- `initiation_year`

This reduced schema is important because the original API payload is much larger than what the application actually needs.

### 4.2 Multiple locations per deal

Some deals contain more than one location in `selected_version.locations`.

The crawler duplicates the attribute row for each location so that:

- one deal may generate several spatial rows,
- each row can receive its own geometry,
- and each location can be processed independently.

This avoids collapsing distinct locations into a single ambiguous geometry.

### 4.3 Coordinate extraction

For each location, the crawler extracts:

- `nid`
- `crs`
- longitude
- latitude
- `level_of_accuracy`

The first geometric representation is built as points in **EPSG:4326**, then converted to **EPSG:3857**.

---

## 5) Handling incomplete spatial data

Not all deals contain usable coordinates.

When a deal location is incomplete or missing, the crawler does not silently discard it. Instead:

- the problematic record is appended to a report list,
- the list is exported to a timestamped JSON file,
- the valid records continue through the pipeline.

This approach is methodologically useful because it preserves traceability of data loss.

The anomaly reports are written in:

- `django_proxy/data/reports/`

---

## 6) Spatial enrichment of point-based deals

Once the point dataset is normalized, the pipeline enriches it with spatial context.

### 6.1 Spatial join with administrative regions

The point GeoDataFrame is spatially joined to the world administrative layer:

```python
gdf = gpd.sjoin(gdf, gdf_region)
```

This operation provides:

- regional context,
- country / admin labels,
- and the regional backbone required for later spatial filtering.

### 6.2 Surface modeling from point data

If only a point is known, the project transforms it into a buffer so that it becomes spatially compatible with polygon-based analyses.

The buffer radius is derived from the declared area:

$$
r = \sqrt{\frac{A \times 10000}{\pi}}
$$

where:

- $A$ is the deal size in hectares,
- $10000$ converts hectares to square meters,
- $r$ is the radius in meters.

If `deal_size` is missing or equal to `0`, the implementation replaces it with a default value of **200 hectares**.

This choice allows the system to keep spatial information even when the source provides only a point.

### 6.3 Precision classification

The crawler transforms raw Land Matrix precision labels into operational categories.

| `level_of_accuracy` | Derived `quality_of_precision` | Derived `feature_type` |
|---|---|---|
| `EXACT_LOCATION` | `High accuracy location without shape provided` | `high_accuracy_location` |
| `APPROXIMATE_LOCATION` | `High accuracy location without shape provided` | `high_accuracy_location` |
| `COORDINATES` | `High accuracy location without shape provided` | `high_accuracy_location` |
| `ADMINISTRATIVE_REGION` | `Regionally accurate` | `low_accuracy_location` |
| `COUNTRY` | `Nationally accurate` | `low_accuracy_location` |

This derived classification is reused later by the spatial query service.

---

## 7) Polygon-based deal extraction

Area-based projects are processed by a separate crawler workflow.

### 7.1 Geometry download

Polygon geometries are downloaded from the GIS export endpoint and loaded as a GeoDataFrame.

### 7.2 Reprojection and schema alignment

The polygon layer is reprojected to **EPSG:3857** and some fields are renamed to match the local internal schema, for example:

- `id` → `nid`
- `deal_id` → `id`
- `country` → `admin`

This alignment is required so that point-based and polygon-based datasets can be queried together with a consistent attribute model.

### 7.3 Bulk enrichment using `/api/deals/`

The polygon export does not expose all business attributes required by the platform. To solve this, the crawler performs a bulk call to `/api/deals/` and creates an in-memory mapping:

$$
\text{deal\_id} \rightarrow \text{metadata dictionary}
$$

This mapping is merged into the polygon dataset to recover fields such as:

- `deal_size`
- `current_intention_of_investment`
- `current_implementation_status`
- `current_negotiation_status`
- `initiation_year`

### 7.4 Building `region_list`

Each polygon is spatially joined to the region layer. Since a polygon may intersect several regions, the matched `iso_3166_2` values are aggregated into a list.

Because GeoPackage / SQLite does not store native array-like values in the same way as PostGIS, the list is serialized using `json.dumps()` before being written.

This is an explicit storage compromise in the current implementation.

---

## 8) GeoPackage outputs

The crawler produces three key local geospatial datasets.

### 8.1 `deals.gpkg`

This file contains the processed point-derived deals, including:

- business attributes,
- original coordinate fields,
- derived metric coordinates,
- precision metadata,
- buffered geometries.

### 8.2 `areas.gpkg`

This file contains area-based projects, enriched with:

- business attributes,
- region lists,
- precision metadata,
- polygon geometries.

### 8.3 `world_region_light.gpkg`

This file acts as the administrative support layer used by both the crawler and the query service.

Together, these three datasets form the operational spatial base of the application.

---

## 9) Orchestration of the crawler pipeline

The command `crawler_main.py` orchestrates the complete technical workflow.

Its main responsibilities are:

1. ensure the data directory exists,
2. remove the freshness flag before crawling,
3. run the point crawler,
4. run the polygon crawler,
5. remove temporary files,
6. remove overlapping duplicate records when the same deal exists in two representations,
7. export datasets atomically,
8. recreate the freshness flag.

### Atomic replacement strategy

GeoPackages are first written to temporary files, then moved into place using atomic replacement.

This reduces the probability of exposing partially written files to the Django application during updates.

---

## 10) Logging, reporting, and freshness markers

The pipeline produces several side artifacts:

- timestamped logs in `api/management/commands/logs/`,
- anomaly reports in `data/reports/`,
- a `crawling_done.flag` file in `data/`.

These files support:

- monitoring,
- debugging,
- auditability,
- and update state tracking.

---

## 11) Technical strengths and current compromises

### Strengths

- local GeoPackages avoid repeated remote API queries,
- bulk enrichment is faster than requesting deals one by one,
- the point-to-buffer strategy preserves spatial usability,
- precision classification creates a stable internal logic for querying,
- atomic replacement limits update-time inconsistency.

### Compromises

- list-like fields such as `region_list` are stored as JSON strings,
- GeoPackage is practical but less expressive than a full PostGIS database,
- some records remain limited by the quality of the upstream source data.

---

## 12) Summary

The technical methodology of the project is based on a clear principle: **build a local, normalized, spatially enriched data layer first, then expose it through the application**.

This technical design supports:

- reproducible geospatial queries,
- better control of schema and quality,
- reliable exports,
- and a maintainable separation between ingestion and usage.
