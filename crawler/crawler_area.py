import wget
import requests
import geopandas as gpd
import json

def intention_finder(row_data, index, deal_id : int):
    """brut forcing threw api exit : 1 seconds
    with indexing 0.015 seconds"""
    return row_data[index[deal_id]]['selected_version']['current_intention_of_investment']


def crawling_areas():
    #areas = gpd.read_file(wget.download("https://landmatrix.org/api/gis_export/areas/?&subset=PUBLIC&format=json")
                          #,engine="pyogrio")#using pyogrio accelerate the reading time
    areas = gpd.read_file("areas.geojson")
    areas.to_crs("EPSG:3857", inplace=True)
    world_regions = gpd.read_file("../django_proxy/data/world_region_light.gpkg", engine="pyogrio")
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
        return areas
    else:
       return f"Houston we got an HTML problem :{deal_base.status_code}"
gdf_test=crawling_areas()



"""For a reason I don't understand it's incredibly slow to update the GeoDataFrame
this way, since it's more elegant I keep it
def intention_finder(deal_id : int):
    try:
        calling=requests.get(f"https://landmatrix.org/api/deals/{deal_id}/")
        if calling.status_code == 200:
            data = calling.json()
            return data["selected_version"]["current_intention_of_investment"]
    except requests.exceptions.RequestException as e:
        print(f"Houston we got an HTML problem : {e}")

areas_test["intention"]=areas_test.apply(lambda row:intention_finder(row["id"]),axis=1)
print(areas_test["intention"])"""
