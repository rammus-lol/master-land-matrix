# ⚠️ Mandatory Fields – Central API Integrity
First, thank you for your well-documented API.
The stability of our app depends entirely on the availability of specific keys within the JSON response.
Deleting, renaming, or altering the structure of the following fields will cause critical failures
in data processing and UI rendering.

Our backend/database docker container can be run without updating data
using environment variable please contact someone related to the project
if you need to alter one of the following fields,
especially during the next 10 days.

### 1. Root Identifiers

These fields are essential for data indexing and relational mapping.

- **id**: Unique identifier for the record.
- **country_id**: Necessary for regional filtering and database linking.

### 2. The selected_version Object

This part contains the data useful for map popups and exporting data through Excel/CSV file:

| Field | Purpose |
|---|---|
| **deal_size** | Required for volume calculations and metrics. |
| **current_intention_of_investment** | Defines the nature of the investment. |
| **current_implementation_status** | Tracks project lifecycle progress. |
| **current_negotiation_status** | Indicates the legal/contractual stage. |
| **initiation_year** | Essential for timeline views and historical data. |

### 3. Geographical Data (locations)

The application iterates through this list to populate maps and location-based reports.

- **locations** (list): Must remain a list-like iterable object.

- **level_of_accuracy**: Located within each dictionary in the list; required for map precision.

Ideally data types should all remain the same as today.

Here's the organization tree in the JSON given by LM API of the fields used
by our crawlers:

```
api_json[
root_element{
├── id
├── country_id
└── selected_version
    ├── deal_size
    ├── current_intention_of_investment
    ├── current_implementation_status
    ├── current_negotiation_status
    ├── initiation_year
    └── locations (list)
        └── [list of dictionaries]
            └── {level_of_accuracy}
}
]
```

### For deals represented by a polygon

Since it would be pretty hard to find which deals have registered their real shape
or not from the API, we download them from this link https://landmatrix.org/api/gis_export/areas/?&subset=PUBLIC&format=json
This solution comes with one problem: it's very slow — the 130 megabytes takes
between 50 and 96 seconds to download and 15 seconds to be read by geopandas/GDAL.

**Please don't delete this link** since it's the only difference between deals with and without a shape
in terms of data used by both crawlers. The tree is valid for this one too.

If this is important for you: data is stored in a sqlite/spatialite wrapper
file format for now and uses atomic renaming to update data even if the
data is locked during writing.
