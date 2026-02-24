import wget
import requests
import geopandas as gpd
import json
from pathlib import Path
import time
import pprint as pri

def crawling_areas(region_file : Path | str):
    areas = gpd.read_file(wget.download("https://landmatrix.org/api/gis_export/areas/?&subset=PUBLIC&format=json")
                          ,engine="pyogrio")
    areas.to_crs("EPSG:3857", inplace=True)
    world_regions = gpd.read_file(region_file, engine="pyogrio")
    areas.rename(columns={"id": "nid", "deal_id": "id"}, inplace=True)
    areas["intention"] = None
    areas["deal_size"] = 0.0
    deal_base = requests.get(f"https://landmatrix.org/api/deals/")#brut force but faster than api/deals/{id} method
    if deal_base.status_code == 200:
        data = deal_base.json()
        deal_id_index={}
        for idx,d in enumerate(data):
            deal_id_index[d["id"]]=idx
        mapping = {deal_id:{'deal_size' : data[idx]['selected_version']['deal_size'],
                            'intention': data[idx]['selected_version']['current_intention_of_investment']}
                            for deal_id,idx in deal_id_index.items()}
        areas['deal_size'] = areas['id'].map(lambda x: mapping[x]['deal_size'])
        areas['intention'] = areas['id'].map(lambda x: mapping[x]['intention'])
        areas.reset_index(inplace=True, drop=True)
        joined = gpd.sjoin(areas, world_regions[['iso_3166_2', 'geometry']],
                           how='left', predicate='intersects')
        region_lists = joined.groupby(level=0)['iso_3166_2'].apply(
            lambda x: [] if x.isna().all() else x.dropna().tolist()
        )
        areas["region_list"] = region_lists.reindex(areas.index, fill_value=None)
        areas["region_list"] = areas["region_list"].apply(json.dumps)
        areas["intention"] = areas["intention"].apply(json.dumps)
        """Unfortunately SQLite doesn't allow to store list type data as JSON 
        but you can store string looking alike a json object
        I was tricked by Qgis.
        so I use .dumps() method which transform an Iterable in json-like string
        for reading I use .loads() which does the opposite.
        For further PostGIS export of the database, a jsonb column
        will do the job."""
        return areas
    else:
       return f"Houston we got an HTTP problem :{deal_base.status_code}"
