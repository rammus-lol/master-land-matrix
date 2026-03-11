# Methodological Workflow

## 1) Purpose of the methodological part

This chapter explains the **methodological logic of the user workflow**.

If the technical chapter describes how data is built, this chapter explains how the platform transforms a **user intention** into:

- a spatial selection,
- a validated result,
- and a downloadable document such as CSV, XLSX, or PDF.

This part is therefore more focused on **interaction logic, query strategy, and reporting methodology**.

---

## 2) General methodological principle

The user-facing workflow can be summarized as:

$$
\text{User geometry} \rightarrow \text{Spatial query} \rightarrow \text{Selected deal IDs} \rightarrow \text{Structured table} \rightarrow \text{Chosen output format}
$$

The application deliberately separates:

- **selection**,
- from **export**.

This is a strong methodological choice because it allows the user to first verify what was found on the map before generating a file.

---

## 3) User input as spatial intent

The workflow starts on the map interface.

The user can:

- draw geometries,
- upload geographic files,
- create a known point with a radius,
- combine multiple shapes.

This is important because the platform is designed around **places and territories**, not around manually typed IDs.

In methodological terms, the system starts from a **spatial intention**:

- “find deals in this area”,
- “find projects near this point”,
- “export what intersects my study zone”.

---

## 4) Frontend normalization before querying

Before sending the request to the backend, the frontend converts the current drawing state into standard GeoJSON.

### Key points

- the export geometry is serialized as a `FeatureCollection`,
- the working projection is `EPSG:3857`,
- circles are converted into points plus a `radius` property.

This is a methodological normalization step: the frontend converts various user interactions into a single backend-readable structure.

The frontend also sends the boolean flag `is_precise`, which lets the user decide whether the query should remain strict on location precision.

---

## 5) Backend validation as a control gate

The `/api/geom/` endpoint does not process raw user input directly.

It first validates:

- the GeoJSON structure,
- the presence of geometries,
- geometry compatibility,
- and the `is_precise` boolean.

This stage is methodologically essential because it separates:

- **user interaction**,
- from **trusted analytical input**.

Without this validation gate, the spatial workflow would be more fragile and harder to debug.

---

## 6) Precision-aware spatial selection

The project does not use a simplistic “geometry inside polygon = yes or no” model.

Instead, it applies a precision-aware strategy based on the semantic meaning of the Land Matrix location quality.

### Why this matters

Not all deals have the same geographic certainty:

- some have exact or approximate coordinates,
- some are only known at regional scale,
- some are only known at country scale.

If the application ignored this distinction, the results would be misleading.

### Selection logic

The query service combines three levels of inclusion:

| Deal type | Inclusion rule |
|---|---|
| High precision deals | geometry intersects the query area |
| Regional precision deals | the associated administrative region intersects the query area |
| Country-level deals | the associated country intersects the query area |

This methodology is one of the most important analytical features of the platform.

---

## 7) Why contextual regions are included in the map result

The backend response may include administrative regions in addition to actual deals.

This is useful because the platform does not only return “objects found”; it also returns **spatial context** that helps the user understand:

- why a low-precision deal was included,
- which region is related to the result,
- and how the selection was interpreted.

So the map result is a **review layer**, not yet the final export layer.

---

## 8) Review before export

The application first displays the result on the map, then allows the user to export it.

This is methodologically preferable to direct file download because it supports:

- visual verification,
- user confidence,
- correction before export,
- and transparency of spatial selection.

In short, the workflow is:

$$
\text{Query} \rightarrow \text{Visual review} \rightarrow \text{Export}
$$

---

## 9) Extracting stable export identifiers

Once the GeoJSON result is returned, the frontend extracts a clean list of deal IDs.

An important methodological rule is applied here:

- administrative helper layers are ignored,
- only actual exportable business objects are retained.

This ensures that the export is based on **stable identifiers**, not on temporary visualization artifacts.

---

## 10) Why the spatial query is re-run before export

When the user clicks on **CSV**, **Excel**, or **PDF**, the frontend may re-run the spatial query if drawing geometries are still present.

This prevents stale exports and guarantees that the file corresponds to the latest visible user selection.

This is a consistency safeguard, especially useful when the user has modified shapes after a first query.

---

## 11) Methodology of tabular reconstruction

The `/api/sheet/` endpoint receives:

- `id_list`,
- `file_format`.

It does not reuse the whole GeoJSON payload. Instead, it rebuilds a clean consolidated table from local GeoPackage layers.

This is a major methodological choice.

### Why rebuild the table?

Because the map result and the export result do not have the same role:

- the **map response** is optimized for visualization,
- the **export table** is optimized for reporting and office use.

This avoids coupling visual helper features to downstream exported documents.

---

## 12) Methodology of output specialization

Once the consolidated table exists, the platform specializes the rendering according to the requested format.

### 12.1 CSV

CSV is used as the simplest interoperable tabular format.

It is ideal for:

- quick reuse,
- spreadsheet loading,
- statistical workflows,
- manual filtering.

The project uses a semicolon-separated CSV to improve compatibility with many office environments.

### 12.2 Excel

Excel is used as the office-friendly tabular format.

The methodology here is not only to export data, but to produce a file that is immediately readable. That is why the backend adjusts column widths after writing the sheet.

This improves direct usability for non-technical users.

### 12.3 PDF

PDF is treated differently.

The goal of the PDF is not raw data reuse, but **communication and synthesis**. The report therefore contains:

- a title and generation timestamp,
- the number of rows and columns,
- a preview table,
- charts on selected categorical variables,
- and summary tables with counts and shares.

This means the PDF is a **reporting product**, while CSV and XLSX are **operational data products**.

---

## 13) Error handling as part of the methodology

The workflow includes explicit error handling.

### Examples

- if `id_list` is empty, the export is rejected,
- if IDs are not integers, the export is rejected,
- if the requested format is unsupported, the backend returns an explicit validation error,
- if no spatial result is found, the map receives a status message instead of a broken export.

Methodologically, this is important because the application gives the user **interpretable failure states** rather than silent failures.

---

## 14) Performance logic behind the methodology

The workflow is also designed with practical performance constraints in mind.

The project improves responsiveness by:

- using local GeoPackages rather than live API calls during map requests,
- loading operational layers directly in the query service,
- performing bulk ingestion during crawling,
- and limiting export work to a selected set of IDs.

So the methodology is not only conceptually clean; it is also operationally efficient.

---

## 15) End-to-end user scenario

An end-to-end example is the following:

1. the crawler updates local datasets,
2. the user opens the map,
3. the user draws a study area,
4. the frontend converts it to GeoJSON,
5. the backend validates and interprets the geometry,
6. the query service returns matching deals and context layers,
7. the user reviews the result visually,
8. the frontend extracts deal IDs,
9. the user requests CSV, XLSX, or PDF,
10. the backend rebuilds a clean table from local GeoPackages,
11. the selected output format is generated and downloaded.

This scenario illustrates the platform philosophy:

$$
\text{prepared local data} + \text{user spatial intent} = \text{controlled analytical output}
$$

---

## 16) Summary

The methodological part of the project is based on four principles:

1. start from spatial intent,
2. validate and interpret geometry carefully,
3. separate selection from export,
4. specialize each output according to its real use.

This gives the platform a workflow that is:

- pedagogical for users,
- transparent for analysts,
- robust for developers,
- and adaptable for future extensions.
