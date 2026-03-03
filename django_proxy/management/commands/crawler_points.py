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
import numpy as np

def key_extraction(js, key, path=None)->str | None:
    if path is None:
        path = []

    # String management
    if isinstance(js, str):
        return None

    # Dictionary management
    if isinstance(js, dict):
        for k, v in js.items():
            current_path = path + [k]
            if k == key:
                return current_path
            result = key_extraction(v, key, current_path)
            if result:
                return result

    # List-like management
    elif isinstance(js, (list, tuple, set)):
        for i, item in enumerate(js):
            current_path = path + [i]
            result = key_extraction(item, key, current_path)
            if result:
                return result

    return None

def path_construction(path_list : list)->str:
    if not path_list or not isinstance(path_list, list):
        return ""

    address = "root"
    for step in path_list:
        if isinstance(step, int):
            address += f"[{step}]"
        else:
            address += f"['{step}']"
    return address
def logger(fast_report : str):
    log_name = f"log_{datetime.now().strftime('%Y_%m_%d_%H_%M_%S')}.txt"
    log_dir = Path(__file__).parent / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    with open(log_dir/log_name, "w", encoding='utf-8') as f:
        f.write(fast_report)

def deal_dict(deal : dict )->dict | None:
    """Summarize a deal into a smaller dict containing all the non-spatial data that we need"""
    try:
        return {"id":deal["id"],
                "country_id":deal["country_id"],
                "deal_size":deal['selected_version']['deal_size'],
                "current_intention_of_investment":deal["selected_version"]["current_intention_of_investment"],
                'current_implementation_status':deal['selected_version']['current_implementation_status'],
                'current_negotiation_status' : deal['selected_version']['current_negotiation_status'],
                'initiation_year' :deal['selected_version']['initiation_year']
                }
    except KeyError as e:
        logger(str(e))
        print(e)
        return None
def geom_from_list(report_list,row_deal,location : list,index : int=0)->dict:
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
            "level_of_accuracy": location[index].get('level_of_accuracy')
            #When I read JSON most of the time points without coordinates comes with a level_of_accuracy but if it's not the case  it will return None
        }

def geodataframe_writer(calling : list[dict])->tuple[GeoDataFrame,list[dict]]:
    """Take an Iterable from API and format it into a GeoDataFrame using the functions above"""
    report=[]
    summary=[]
    for c in calling:
        deal=deal_dict(c)
        if type(deal)==KeyError:
            logger(str(deal))
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
                geometry=geom_from_list(report,c,geom) #it's called geometry, but it isn't a geometry object
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
    gdf["x"]=gdf["geometry"].x
    gdf["y"]=gdf["geometry"].y
    base_dir = Path(__file__).parents[2]
    gdf_region = gpd.read_file(base_dir /  "data" / "world_region_light.gpkg")
    gdf = gpd.sjoin(gdf, gdf_region)
    col_to_drop = [col for col in gdf_region.columns if col not in ('admin', 'geometry')] + ['index_right']
    gdf.drop(col_to_drop, axis=1, inplace=True)
    area = gdf["deal_size"].replace(0, 200)
    type_casting = ['deal_size', 'initiation_year']
    for col in type_casting:
        if col in gdf.columns:
            gdf[col] = gdf[col].fillna(0).astype('int32')
    buffers_geoms = gdf["geometry"].buffer(
        np.sqrt(area * 10000 / np.pi))  # formula for finding radius with area
    gdf["geometry"] = buffers_geoms
    conditions = [
        (gdf['level_of_accuracy'].isin(["APPROXIMATE_LOCATION", "EXACT_LOCATION", "COORDINATES"])),
        (gdf['level_of_accuracy']=="ADMINISTRATIVE_REGION"),
        (gdf['level_of_accuracy'] == "COUNTRY"),
    ]
    choices = ["High accuracy location without shape provided","Regionally accurate","Nationally accurate"]
    gdf['quality_of_precision'] = np.select(conditions,choices,"No accuracy qualification provided")
    gdf
    return gdf,report
def api_calling()->list[dict] | str:
    try:
        call=requests.get("https://landmatrix.org/api/deals/", timeout=10)
        call.raise_for_status()
        data = call.json()
        return  data
    except requests.exceptions.RequestException as e:
        print(f"Houston we got an HTTP problem : {e}")
        return str(e)
def deal_exporter(deal : GeoDataFrame,report : list[dict],dir : Path) ->str :
    """Export a GeoDataFrame representing deals
        to the right path and a report on deals with no coordinates
        for further investigation.
        It returns a string for logging about deals with no coordinates"""
    report_dir = dir / "reports"
    report_dir.mkdir(parents=True, exist_ok=True)
    deal.to_file(dir /"deals.gpkg", driver="GPKG", layer="deals")
    report_name = f"report_{datetime.now().strftime('%Y_%m_%d_%H_%M_%S')}.json"
    with open(Path(report_dir/report_name), "w", encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)  # exporting deals without location infos into a json
        print(f"The export of deals to GeoPackage completed successfully. The script found {len(report)} deals without coordinates.")
    return f"""The export of deals to GeoPackage completed successfully.
The script found {len(report)} deals without coordinates."""

def deal_gpkg_writer(dir : Path,debug=False):
    data=api_calling()
    if type(data) != str:
        gdf_deal,report = geodataframe_writer(data)
        logging_string= deal_exporter(gdf_deal,report,dir)
        logger(logging_string)
        if debug:
            return gdf_deal,report #return something in case you want to debug in another script
        return None
    else :
        logger(data)
        return None
if __name__=="__main__":
    v=5



        
    

