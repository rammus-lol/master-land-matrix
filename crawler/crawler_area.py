import wget
import requests
import geopandas as gpd
import json
from pathlib import Path
import time
def intention_finder(row_data, index, deal_id : int):
    """Return the intention_of_investment based on a dictionary
        builds like a BTREE SQL index.
        Making the extraction extremely fast."""
    return row_data[index[deal_id]]['selected_version']['current_intention_of_investment']


def crawling_areas():
    start = time.time()
    areas = gpd.read_file(wget.download("https://landmatrix.org/api/gis_export/areas/?&subset=PUBLIC&format=json")
                          ,engine="pyogrio")
    print(f"Reading {time.time()-start} seconds")
    areas.to_crs("EPSG:3857", inplace=True)
    world_regions = gpd.read_file(Path("../django_proxy/data/world_region_light.gpkg"), engine="pyogrio")
    areas.rename(columns={"id": "nid", "deal_id": "id"}, inplace=True)
    areas["intention"] = None
    deal_base = requests.get(f"https://landmatrix.org/api/deals/")#brut force but faster than api/deals/{id} method
    if deal_base.status_code == 200:
        data = deal_base.json()
        deal_id_index={}
        for idx,d in enumerate(data):
            deal_id_index[d["id"]]=idx
        areas["intention"] = areas.apply(
            lambda row: intention_finder(data,deal_id_index,row["id"]), axis=1)
        areas.reset_index(inplace=True, drop=True)
        joined = gpd.sjoin(areas, world_regions[['iso_3166_2', 'geometry']],
                           how='left', predicate='intersects')
        region_lists = joined.groupby(level=0)['iso_3166_2'].apply(
            lambda x: [] if x.isna().all() else x.dropna().tolist()
        )
        areas["region_list"] = region_lists.reindex(areas.index, fill_value=None)
        areas["region_list"] = areas["region_list"].apply(json.dumps)
        """Unfortunately geopandas's driver for geopackages doesn't allow to store list type data
        I was tricked by Qgis.
        so I use .dumps() method which transform an Iterable in json-like string
        for reading I use .loads() which does the opposite.
        For further PostGIS export of the database, a jsonb column
        will do the job."""
        return areas
    else:
       return f"Houston we got an HTML problem :{deal_base.status_code}"
