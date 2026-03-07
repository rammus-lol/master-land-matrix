# Master Land Matrix - Project Introduction

## 1) What this project is

Master Land Matrix is a full web application designed to visualize, explore, and analyze geospatial data about land-related investments around the world.

It combines:
- a Django API backend for data access and processing,
- a Vite-based web frontend for interactive user experience,
- data and analysis modules for reporting and geospatial workflows.

---

## 2) Main goals

The project focuses on four core goals:

- **Map visualization**: show investment locations on an interactive map.
- **Spatial analysis**: run geospatial analysis workflows on available data.
- **Data export**: produce outputs such as PDF reports and tabular exports (Excel/CSV depending on workflow).
- **Data updates**: support data collection/update pipelines through crawler-based processes when enabled.

---

## 3) Project structure (high level)

The repository is organized into major functional areas:

- **Django Proxy API** (`django_proxy/`): main backend API and data services.
- **Website** (`website/`): frontend application built with Vite.
- **R Scripts** (`R_script/`): statistical and geospatial analysis scripts.
- **Crawler module**: data scraping/update component used in environments where it is deployed.

---

## 4) Key concept: data integrity

A central technical constraint of this project is strict compatibility with the Land Matrix JSON structure.

If required fields are missing, renamed, or deeply restructured, critical features may fail.

### Required root fields
- `id`
- `country_id`

### Required version-related fields
- `deal_size`
- `current_intention_of_investment`
- `current_implementation_status`
- `current_negotiation_status`
- `initiation_year`

### Required geographic data format
- `locations` must remain an iterable list-like structure.
- Each location entry must keep `level_of_accuracy`.

---

## 5) Why this matters

The platform depends on predictable data to:
- place investments correctly on maps,
- run filters and analysis logic,
- generate reliable exports,
- avoid runtime errors in both backend and frontend.

In short, **stable data structure is a functional requirement**, not only a data quality preference.

---

## 6) Summary

Master Land Matrix is built as a data-driven geospatial platform. The backend, frontend, and analysis modules work together around one critical principle: preserving the expected data schema so that visualization, analysis, and reporting remain reliable.
