# ⚠️ Mandatory Fields – Central API Integrity
First thank for your well documented API.
The stability of our app depends entirely on the availability of specific keys within the JSON response. 
Deleting, renaming, or altering the structure of the following fields will cause critical failures 
in data processing and UI rendering.

Our backend/database docker container can be run without updating datas 
using environment variable please contact someone related to the project
if you need to alter one of the following fields, 
especially during the next 10 days.

### 1. Root Identifiers

These fields are essential for data indexing and relational mapping.

- **id**: Unique identifier for the record.
- **country_id**: Necessary for regional filtering and database linking.

### 2. The selected_version Object

This part contains the data useful for map popups and exporting datas through Excel/CSV file:
Field	Purpose
**deal_size**	Required for volume calculations and metrics.
**current_intention_of_investment**	Defines the nature of the investment.
**current_implementation_status**	Tracks project lifecycle progress.
**current_negotiation_status**	Indicates the legal/contractual stage.
**initiation_year**	Essential for timeline views and historical data.

### 3. Geographical Data (locations)

The application iterates through this list to populate maps and location-based reports.

- **locations** (list): Must remain a list-like iterable object.

- **level_of_accuracy**: Located within each dictionary in the list; required for map precision.

Ideally data type should all remain the same as today.

here's the organization tree in the JSON given by LM API of the field used 
by our crawlers: 

```api_json[
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

### For deals represented by a polygone

Since it would be pretty hard to find which deal have registered its real shape 
or not from the api, we download them from this link https://landmatrix.org/api/gis_export/areas/?&subset=PUBLIC&format=json
this solution comes with one problem : it's super slow the 130 Megabytes takes 
between 50 and 96 secs to download  and 15 sec to been read by geopandas/GDAL

**Please don't delete this link** since it's the only difference between deals with and without a shape
in terms of data used by both crawler the tree  is valid for this one too.

If this is important for you. Datas are stored in a sqlite/spatialite wrapper 
file format for now and use atomic renaming to update datas even if the 
datas are locked during writing. 