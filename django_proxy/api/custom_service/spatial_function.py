import os
import sys
import django
from pathlib import Path
#This is for direct testing
BASE_PATH = Path(__file__).resolve().parents[3]

if str(BASE_PATH) not in sys.path:
    sys.path.insert(0, str(BASE_PATH))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'proxy_project.settings')

try:
    django.setup()
    print("Django setup successful!")
except Exception as e:
    print(f"Django setup failed: {e}")

import geopandas as gpd
import pandas as pd
import json
from django.conf import settings
"""Spatial processing of data sqlless using geopandas it can return
-A GeoDataFrame comporting evry shapes you need to bring back to frontend.
-code_1 their is no deals in the entier country.
-code_2 the processing find deals in the administrative regions crossing the polygons provided 
but is certain their is no one inside this polygons or any deals with APPROXIMATE_LOCATION near by."""
def which_regions(query, projects, regions):
    filtered_regions=gpd.sjoin(regions,query).drop(columns=["id","index_right"],errors="ignore")
    selected_projects = gpd.sjoin(projects, filtered_regions)
    col_to_keep = ("admin","geometry","name","name_en","type","type_en")
    col_to_drop=[col for col in filtered_regions.columns if col not in col_to_keep]
    col_to_drop+=["admin_right",'index_right',"feature_type_right"]
    selected_projects.drop(col_to_drop,axis=1,inplace=True,errors="ignore")
    selected_projects.rename(columns={"admin_left":'admin',"feature_type_left":"feature_type"},inplace=True)
    return selected_projects,filtered_regions

def which_areas(query, regions, polygone_projects):

    def region_checker(region_list : list,region_id_list : list):
        bool_list=[]
        for region in region_list:
            if region in region_id_list:
                bool_list.append(True)
            else:
                bool_list.append(False)
        return any(bool_list)

    regions_ids = list(regions["iso_3166_2"])
    filtered_areas = polygone_projects[
    polygone_projects["region_list"].apply(lambda x: region_checker(x, regions_ids))]
    selected_areas=gpd.sjoin(filtered_areas,query).drop(columns=["index_right"],errors="ignore")
    return selected_areas

def final_filtering(query, regions, projects, selected_projects,precision_boolean):
    accurate_points = ["APPROXIMATE_LOCATION", "EXACT_LOCATION", "COORDINATES"]
    if precision_boolean:
        projects_accurate = selected_projects[selected_projects["level_of_accuracy"]
        .isin(accurate_points)]
        projects_inside = (gpd.sjoin(projects_accurate, query, how='inner')
                           .drop(columns=["id_right", "index_right"], errors="ignore"))
        return projects_inside

    else:
        filtered_regions_countries = set(regions["admin"])
        country_projects = projects[
            (projects['admin'].str.strip().isin(filtered_regions_countries)) &
            (projects['level_of_accuracy'].str.strip() == 'COUNTRY')
            ]

        projects_inaccurate = selected_projects[~selected_projects["level_of_accuracy"] #with this method you manage the case where the filed is None
            .isin(accurate_points)]
        projects_inside = (gpd.sjoin(selected_projects, query, how='inner')
                        .drop(columns=["id_right", "index_right"],errors="ignore"))

        final_projects = (gpd.GeoDataFrame(
            pd.concat([projects_inaccurate, projects_inside, country_projects], ignore_index=True))
            .drop_duplicates())
        return final_projects
DATA_DIR = settings.BASE_DIR / "data"

DEALS = gpd.read_file(DATA_DIR / "deals.gpkg")
REGIONS = gpd.read_file(DATA_DIR / "world_region_light.gpkg")
AREAS = gpd.read_file(DATA_DIR / "areas.gpkg")

AREAS["region_list"]=AREAS["region_list"].apply(json.loads) #Managing SQLite goofy JSON type logic.
def geom_constructor(query, precision_boolean):
    selected_deals,filtered_regions = which_regions(query,DEALS,REGIONS)
    final_areas=which_areas(query,filtered_regions,AREAS)
    if final_areas.empty and selected_deals.empty:
        return "code_1", 0
    final_deals = final_filtering(query,filtered_regions,DEALS,selected_deals,precision_boolean)
    if final_deals.empty:
        return "code_2", 0
    nb_deals = len(final_areas)+len(final_deals)
    combined_deals=gpd.GeoDataFrame(pd.concat([final_deals, final_areas,filtered_regions]
                                              ,ignore_index=True),crs="EPSG:3857")
    return combined_deals,nb_deals



