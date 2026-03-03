import wget
import requests
import geopandas as gpd
import pandas as pd
import json
from pathlib import Path
import time
import pprint as pri
def download_fast(url, filename):
    with requests.Session() as session:
        with session.get(url, stream=True) as r:
            r.raise_for_status()
            with open(filename, 'wb') as f:
                for chunk in r.iter_content(chunk_size=8192):
                    f.write(chunk)
def crawling_areas(region_file : Path | str):
    download_fast("https://landmatrix.org/api/gis_export/areas/?&subset=PUBLIC&format=json","areas.geojson")
    areas= gpd.read_file("areas.geojson",engine="pyogrio")
    areas.to_crs("EPSG:3857", inplace=True)
    world_regions = gpd.read_file(region_file, engine="pyogrio")
    areas.rename(columns={"id": "nid", "deal_id": "id","country" : "admin"}, inplace=True)
    deal_base = requests.get(f"https://landmatrix.org/api/deals/")#brut force but faster than api/deals/{id} method
    if deal_base.status_code == 200:
        data = deal_base.json()
        deal_id_index={}
        for idx,d in enumerate(data):
            deal_id_index[d["id"]]=idx
        mapping = {deal_id:{'deal_size' : data[idx]['selected_version']['deal_size'],
                            'current_intention_of_investment': data[idx]['selected_version']['current_intention_of_investment'],
                            'current_implementation_status':data[idx]['selected_version']['current_implementation_status'],
                            'current_negotiation_status': data[idx]['selected_version']['current_negotiation_status'],
                            'initiation_year': data[idx]['selected_version']['initiation_year']
                            }
                            for deal_id,idx in deal_id_index.items()}
        df_mapping = pd.DataFrame.from_dict(mapping, orient='index')
        areas = areas.merge(df_mapping, left_on="id", right_index=True, how='inner')
        joined = gpd.sjoin(areas, world_regions[['iso_3166_2', 'geometry']],
                           how='left', predicate='intersects')
        region_lists = joined.groupby(level=0)['iso_3166_2'].apply(
            lambda x: [] if x.isna().all() else x.dropna().tolist()
        )
        type_casting = ['deal_size', 'initiation_year']
        for col in type_casting:
            if col in areas.columns:
                areas[col] = areas[col].fillna(0).astype('int32')
        areas["region_list"] = region_lists.reindex(areas.index, fill_value=None)
        areas["region_list"] = areas["region_list"].apply(json.dumps)
        areas["current_intention_of_investment"] = areas["current_intention_of_investment"].apply(json.dumps)
        areas["quality_of_precision"] = "high accuracy location with shape provided"
        areas["feature_type"] = "areas"
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

if __name__ == "__main__":
    with pd.option_context('display.max_rows', None, 'display.max_columns', None):
        print(crawling_areas(r"A:\serveur_landmatrix\master-land-matrix\django_proxy\data\world_region_light.gpkg"))