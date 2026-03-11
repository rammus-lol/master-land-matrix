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
DATA_DIR = settings.BASE_DIR /  "data"
_DEALS_CACHE = None
_AREAS_CACHE = None
_REGIONS_CACHE = None
def get_data():
    """ A function allowing to read geopackages even
    if they are not present in the folder (like when it's a fresh installation)
    by calling it in app.py they are loaded in ram at each start"""
    global _DEALS_CACHE, _AREAS_CACHE,_REGIONS_CACHE
    if _DEALS_CACHE is None:
        path = DATA_DIR / "deals.gpkg"
        if not path.exists():
            print(f"{path} don't exists. Crawler don't end did it ?")
            _DEALS_CACHE = gpd.GeoDataFrame()
        else:
            _DEALS_CACHE = gpd.read_file(path)
    if _REGIONS_CACHE is None:
        path = DATA_DIR / "world_region_light.gpkg"
        if not path.exists():
            print(f"{path} don't exists. Crawler don't end did it ?")
            _REGIONS_CACHE = gpd.GeoDataFrame()
        else:
            _REGIONS_CACHE = gpd.read_file(path)
    if _AREAS_CACHE is None:
        path = DATA_DIR / "areas.gpkg"
        if not path.exists():
            print(f"{path} don't exists. Crawler don't end did it ?")
            _AREAS_CACHE = gpd.GeoDataFrame()
        else:
            _AREAS_CACHE = gpd.read_file(DATA_DIR / "areas.gpkg" )
            _AREAS_CACHE["region_list"] = _AREAS_CACHE ["region_list"].apply(json.loads)  # Managing SQLite goofy JSON type logic.
    return _DEALS_CACHE,_AREAS_CACHE,_REGIONS_CACHE

def regional_prefilter(query, projects, regions):
    """A function catching regions crossing the brought polygons,
        return all the concerned regions and deals with buffers"""
    filtered_regions=gpd.sjoin(regions,query).drop(columns=["id","index_right"],errors="ignore")
    selected_projects = gpd.sjoin(projects, filtered_regions)
    col_to_keep = ("admin","geometry","name","name_en","type","type_en")
    col_to_drop=[col for col in filtered_regions.columns if col not in col_to_keep]
    col_to_drop+=["admin_right",'index_right',"feature_type_right"]
    selected_projects.drop(col_to_drop,axis=1,inplace=True,errors="ignore")
    selected_projects.rename(columns={"admin_left":'admin',"feature_type_left":"feature_type"},inplace=True)
    return selected_projects,filtered_regions

def which_areas(query, regions, polygone_projects):
    """A function performing spatial selection between deals with polygons.
        and selected regions, by applying a filter on stored regions id first
        the by spatial selection with brought polygons.
        """
    def region_checker(region_list : list,region_id_list : list):
        """A function to pre-filter areas.gpkg using a region_list.
        By intersecting region ID with deals attributes,
        it optimizes the spatial selection process
        by significantly reducing the number of candidate polygons."""
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

def buffer_filtering(query : gpd.GeoDataFrame, regions : gpd.GeoDataFrame,
                     projects : gpd.GeoDataFrame, selected_projects : gpd.GeoDataFrame,
                     precision_boolean : bool)-> gpd.GeoDataFrame:
    """A function performing compound selection between deals represented with a buffer
    on deal size. with 3 methods :
    -Which deals are in the coutry managing the concerned regions and have a level_of_accuracy
    equals to 'COUNTRY' ?
    -Which deals are in the concerned regions and have a level_of_accuracy
    equals to 'ADMINISTRATIVE_REGION' ?
    -Which deals are precisly located and crossed the given polygons ?
    Then the duplicates are dropped.
    if precision_boolean are set to true, the first to methods are skipped.
    """
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


def geom_constructor(query : gpd.GeoDataFrame, precision_boolean : bool) \
        -> tuple[gpd.GeoDataFrame,int] | tuple[str,int]:
    """ Main function calling all the blocs and returning it to backend for export."""
    DEALS,AREAS,REGIONS = get_data()
    selected_deals,filtered_regions = regional_prefilter(query, DEALS, REGIONS)
    final_areas=which_areas(query,filtered_regions,AREAS)
    if final_areas.empty and selected_deals.empty:
        return "code_1", 0
    final_deals = buffer_filtering(query, filtered_regions, DEALS, selected_deals, precision_boolean)
    if final_deals.empty and final_areas.empty:
        return "code_2", 0
    nb_deals = len(final_areas)+len(final_deals)
    combined_deals=gpd.GeoDataFrame(pd.concat([final_deals, final_areas,filtered_regions]
                                              ,ignore_index=True),crs="EPSG:3857")
    return combined_deals,nb_deals