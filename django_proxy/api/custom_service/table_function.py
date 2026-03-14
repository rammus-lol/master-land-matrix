import geopandas as gpd
import pandas as pd
from pathlib import Path
import os
import sys
from django.conf import settings

def get_paths():
    data_dir = settings.BASE_DIR / "data"
    return data_dir / "deals.gpkg", data_dir / "areas.gpkg"

def table_constructor(id_list : list[int],spatial : bool=False)-> pd.DataFrame | gpd.GeoDataFrame:
    """A function which extract a non-spatial table for user downloading
    with formating of certain fields
    id_list list of deal_ids
    spatial : boolean parameter used for geojson export"""
    DEALS, AREAS = get_paths()
    ids =", ".join([str(i) for i in id_list])
    if spatial:
        #for geojson
        geom_col = "geom,"
        intention_col = "current_intention_of_investment"
    else:
        #for xlsx and csv
        geom_col = ""
        intention_col = "(SELECT group_concat(value) FROM json_each(current_intention_of_investment))"
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
        WHERE id IN ({ids})
        """
    #Don't worry django serializers before calling manage SQL injection (since you have to pass a list of integers).
    table_deals = gpd.read_file(DEALS,sql =sql_query)
    table_areas = gpd.read_file(AREAS,sql =sql_query.replace("deals","areas"))
    table=pd.concat([table_deals,table_areas]).drop_duplicates()
    table = table.where(pd.notnull(table), None)
    return table
