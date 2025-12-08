import json
import pandas as pd
import geopandas as gpd
import requests
from copy import deepcopy
import traceback
from pathlib import Path
def deal_dict(deal : dict):
    """Summarize a deal into a smaller dict well fitted for spatial querying"""
    return {"id":deal["id"],"deal_size":deal['selected_version']['deal_size'],
            "intention":deal["selected_version"]["current_intention_of_investment"]}
def geom_from_list(report_list,row_deal,location : list,index : int=0):
    """extract the geometric information from a list with an index
    if no geometric informations are provided, take the entire dictionnary and ad it into a report
    list for further investigation"""
    try:
        point=location[index]["point"]
        return {"nid":location[index]["nid"],"crs":point["crs"]["properties"]["name"],
           "long":point["coordinates"][0],
           "lat":point["coordinates"][1],
           "level_of_accuracy":location[index]['level_of_accuracy']}
    except TypeError:
        report_list.append(row_deal)
        return {
    "nid": location[index].get("nid"),
    "crs": None,
    "long": None,
    "lat": None,
    "level_of_accuracy": location[index].get('level_of_accuracy')
}
def key_extraction(js, key, path=[]):
    """Because of the complexity of the /api/dels/ exit, i use this recursion 
    for finding a key I want and format it with [] for dictionnary searching"""
    def path_construction(path_in_list):
        #format a list for dictionaries searching
        return '["'+'"]["'.join(path_in_list)+'"]'#yeah it's a weird string but it works
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
def gpkg_extraction(calling : dict|list[dict]):
    """Take a list from API and format it into a GeoDataFrame"""
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
                geometry=geom_from_list(report,c,geom)#it's called geometry but it isnt a geometry object
                deal.update(geometry)
                summary.append(deal)
        except (KeyError,TypeError) as e:
            print(f"Problem with {c['id']} : {e}")
            print(traceback.format_exc()) 
            summary.append(deal)
            report.append(c)
            continue
    df=pd.DataFrame(summary)
    gdf=gpd.GeoDataFrame(df,geometry=gpd.points_from_xy(df["long"],df["lat"]),crs="EPSG:4326")
    return gdf,report
try:
    call=requests.get("https://landmatrix.org/api/deals/", timeout=10)
    call.raise_for_status()
    data = call.json()
    print(f"requête ok {call.status_code}")
except requests.exceptions.RequestException as e:
    print(f"Houston we got an HTML problem : {e}")
test_s,report=gpkg_extraction(data)
test_s.to_file(Path(r"django_proxy\data\projects.gpkg"),driver="GPKG")
with open(Path(r"crawler\report.json"),"w",encoding='utf-8') as f:
    json.dump(report,f,ensure_ascii=False,indent=2)#exporting deals without geometrics info into a json
print(f"The export of deals in geopackage ends well, the script have founded {len(report)} without coordinates.")

    
        
        


        
    

