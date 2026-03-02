# ⚠️ Mandatory Fields – Central API Integrity
First thank for your well documented API.
The stability of our app depends entirely on the availability of specific keys within the JSON response. 
Deleting, renaming, or altering the structure of the following fields will cause critical failures 
in data processing and UI rendering.
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

here's the organisation tree in the JSON given by LM API : 

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
           ]```