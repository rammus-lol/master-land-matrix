import geopandas as gpd
import pandas as pd
from pathlib import Path
import os
import sys
from django.conf import settings

def get_paths():
    data_dir = settings.BASE_DIR / "data"
    return data_dir / "deals.gpkg", data_dir / "areas.gpkg"

def table_constructor(id_list : list[int], precise_only : bool, spatial : bool=False)-> pd.DataFrame | gpd.GeoDataFrame:
    """
    Extracts a table for user download with specific field formatting.

    Args:
        id_list (list[int]): List of deal IDs to extract. Serializers filter SQL injections
        precise_only (bool): If True, filters out deals with low location accuracy.
        spatial (bool): If True, maintains JSON structure for GeoJSON export;
                       otherwise, flattens lists for spreadsheet formats.
    """
    DEALS, AREAS = get_paths()
    ids =", ".join([str(i) for i in id_list])
    if precise_only:
        where_clause = "AND level_of_accuracy IN ('APPROXIMATE_LOCATION', 'EXACT_LOCATION', 'COORDINATES')"
    else:
        where_clause = ""
    if spatial:
        #for geojson
        geom_col = "geom,"
        intention_col = "current_intention_of_investment"
    else:
        #for xlsx and csv
        geom_col = ""
        intention_col = "(SELECT group_concat(value, ', ') FROM json_each(current_intention_of_investment))"
    sql_query = f"""
        SELECT 
            {geom_col}
            id as deal_id, 
            admin as country, 
            deal_size,
            {intention_col} as current_intention_of_investment,
            --this field is a JSON list we were asked to retrieve [] and '"' for spreadsheet exports.
            current_implementation_status, 
            current_negotiation_status,
            level_of_accuracy,
            quality_of_precision, 
            initiation_year
        FROM deals
        WHERE id IN ({ids}) {where_clause}
        """
    areas_sql_query = f"""SELECT 
            {geom_col}
            id as deal_id, 
            admin as country, 
            deal_size,
            {intention_col} as current_intention_of_investment,
            --this field is a JSON list we were asked to retrieve [] and '"' for spreadsheet exports.
            current_implementation_status, 
            current_negotiation_status,
            level_of_accuracy,
            quality_of_precision, 
            initiation_year
        FROM areas
        WHERE id IN ({ids})"""# no need to filter this file on level_of_accuracy
    #Don't worry django serializers before calling manage SQL injection (since you have to pass a list of integers).
    table_deals = gpd.read_file(DEALS,sql =sql_query)
    table_areas = gpd.read_file(AREAS,sql =areas_sql_query)
    table=pd.concat([table_deals,table_areas]).drop_duplicates()
    table = table.where(pd.notnull(table), None)
    return table
