import json
import pandas as pd
import geopandas as gpd
import requests
from copy import deepcopy
import traceback
from pathlib import Path
from datetime import datetime
from geopandas.geodataframe import GeoDataFrame
import pprint as pri

def deal_dict(deal : dict):
    """Summarize a deal into a smaller dict well-fitted for spatial querying"""
    return {"id":deal["id"],"deal_size":deal['selected_version']['deal_size'],
            "intention":deal["selected_version"]["current_intention_of_investment"]}
def geom_from_list(report_list,row_deal,location : list,index : int=0):
    """extract the geometric information from a list with an index
    if no geometric information are provided, take the entire dictionary and ad it into a report
    list for further investigation"""
    try:
        point=location[index]["point"]
        return {
            "nid":location[index]["nid"],
            "crs":point["crs"]["properties"]["name"],
           "long":point["coordinates"][0],
           "lat":point["coordinates"][1],
           "level_of_accuracy":location[index]['level_of_accuracy']
        }
    except TypeError:
        report_list.append(row_deal)
        return {
            "nid": location[index]["nid"],
            "crs": None,
            "long": None,
            "lat": None,
            "level_of_accuracy": location[index]['level_of_accuracy']
        }
def key_extraction(js, key, path=[]):
    """Because of the complexity of the /api/deals/ exit, I use this recursion
    for finding a key I want and format it with [] for dictionary searching"""
    def path_construction(path_in_list):
        #format a list for dictionaries searching
        return '["'+'"]["'.join(path_in_list)+'"]'#Yeah, it's a weird string but it works
    if isinstance(js, dict):
        for k, v in js.items():
            current_path = path + [k]
            if k == key:
                return current_path 
            result = key_extraction(v, key, current_path)
            if result:
                # return result #sometimes i get bug with return path_construction(result) so I keep this just in case
                return path_construction(result)
    elif isinstance(js, (tuple,list,set,frozenset)):
        for i, item in enumerate(js):
            current_path = path + [f"[{i}]"]
            result = key_extraction(item, key, current_path)
            if result:
                # return result
                return path_construction(result)
    return "This key doesn't exist"
def geodataframe_writer(calling : list[dict]):
    """Take an Iterable from API and format it into a GeoDataFrame"""
    report=[]
    summary=[]
    for c in calling:
        deal=deal_dict(c)
        try:
            geom = c['selected_version']["locations"]
            nb_geom=len(geom)
            if nb_geom>1:
                liste_point : list[dict]=[deal]
                for _ in range(nb_geom-1):
                    liste_point.append(deepcopy(deal))
                for i,_ in enumerate(geom):
                   geometry=geom_from_list(report,c,geom,i)
                   liste_point[i].update(geometry)
                summary.extend(liste_point)
            else:
                geometry=geom_from_list(report,c,geom) #it's called geometry but it isn't a geometry object
                deal.update(geometry)
                summary.append(deal)
        except (KeyError,TypeError) as e:
            print(f"Problem with {c['id']} : {e}")
            print(traceback.format_exc())
            report.append(c)
            continue
    df=pd.DataFrame(summary)
    gdf=gpd.GeoDataFrame(df,geometry=gpd.points_from_xy(df["long"],df["lat"]),crs="EPSG:4326")
    gdf.to_crs("EPSG:3857",inplace=True)
    gdf = gdf.dropna(subset=['crs', 'long', 'lat'])
    base_dir = Path(__file__).parents[1]
    gdf_region = gpd.read_file(base_dir / "django_proxy" / "data" / "world_region_light.gpkg")
    gdf = gpd.sjoin(gdf, gdf_region)
    col_to_drop = [col for col in gdf_region.columns if col not in ('admin', 'geometry')] + ['index_right']
    gdf.drop(col_to_drop, axis=1, inplace=True)
    return gdf,report # it returns something but only for debug, the function handle export
def api_calling():
    try:
        call=requests.get("https://landmatrix.org/api/deals/", timeout=10)
        call.raise_for_status()
        data = call.json()
        return  data
    except requests.exceptions.RequestException as e:
        print(f"Houston we got an HTTP problem : {e}")
        return str(e)
def deal_exporter(deal : GeoDataFrame,report,dir : Path) ->str :
    """Export a GeoDataFrame representing deals
        to the right location and a report on deals with no coordinates
        for further investigation.
        It returns a string for logging about deals with no coordinates"""
    report_dir = dir / "reports"
    report_dir.mkdir(parents=True, exist_ok=True)
    deal.to_file(Path(dir/"deals.gpkg"), driver="GPKG", layer="deals")
    report_name = f"report_{datetime.now().strftime('%Y_%m_%d_%H_%M_%S')}.json"
    with open(Path(report_dir/report_name), "w", encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)  # exporting deals without location infos into a json
        print(f"The export of deals to GeoPackage completed successfully. The script found {len(report)} deals without coordinates.")
    return f"""The export of deals to GeoPackage completed successfully.
The script found {len(report)} deals without coordinates."""
def logger(fast_report : str):
    log_name = f"log_{datetime.now().strftime('%Y_%m_%d_%H_%M_%S')}.txt"
    log_dir = Path(__file__).parent / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    with open(log_dir/log_name, "w", encoding='utf-8') as f:
        f.write(fast_report)
def deal_gpkg_writer(dir : Path,debug=False):
    data=api_calling()
    if type(data) != str:
        gdf_deal,report = geodataframe_writer(data)
        logging_string= deal_exporter(gdf_deal,report,dir)
        logger(logging_string)
        if debug:
            return gdf_deal,report
        return None
    else :
        logger(data)
        return None

        
        


        
    

