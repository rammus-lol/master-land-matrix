import geopandas as gpd
import pandas as pd
import numpy as np
from pathlib import Path
from django.conf import settings
"""Spatial processing of data sqlless using geopandas it can return
-A GeoDataFrame comporting evry shapes you need to bring back to frontend.
-code_1 their is no deals in the entier country.
-code_2 the processing find deals in the administrative regions crossing the polygons provided 
but is certain their is no one inside this polygons or any deals with APPROXIMATE_LOCATION near by."""
def which_regions(query, projects, regions):
    filtered_regions=gpd.sjoin(regions,query).drop(columns=["id","index_right"],errors="ignore")
    selected_projects = gpd.sjoin(projects, filtered_regions)
    col_to_drop=[col for col in filtered_regions.columns if col not in ("admin","geometry")]
    col_to_drop+=["admin_right",'index_right']
    selected_projects.drop(col_to_drop,axis=1,inplace=True,errors="ignore")
    selected_projects.rename(columns={"admin_left":'admin'},inplace=True)
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

    selected_areas=gpd.sjoin(filtered_areas,query).drop(columns=["id_right","index_right"],errors="ignore")
    selected_areas.rename(columns={"id_left":"id"},inplace=True)
    selected_areas['feature_type'] = 'areas'
    return selected_areas

def final_filtering(query, regions, projects, selected_projects):
    filtered_regions_countries = set(regions["admin"])
    country_projects = projects[
        (projects['admin'].str.strip().isin(filtered_regions_countries)) &
        (projects['level_of_accuracy'].str.strip() == 'COUNTRY')
        ]

    accurate_points = ["APPROXIMATE_LOCATION", "EXACT_LOCATION", "COORDINATES"]
    projects_inaccurate = selected_projects[~selected_projects["level_of_accuracy"]
        .isin(accurate_points)]
    projects_inside = (gpd.sjoin(selected_projects, query, how='inner')
                    .drop(columns=["id_right", "index_right"],errors="ignore"))

    final_projects = (gpd.GeoDataFrame(
        pd.concat([projects_inaccurate, projects_inside, country_projects], ignore_index=True))
        .drop_duplicates(subset='nid'))

    final_projects['feature_type'] = 'point'
    return final_projects

DEALS = gpd.read_file(
    settings.BASE_DIR.parent / "django_proxy" / "data" / "deals.gpkg")  # good for production, bad for dev
REGIONS = gpd.read_file(
    settings.BASE_DIR.parent / "django_proxy" / "data" / "world_region_light.gpkg")
AREAS = gpd.read_file(
    settings.BASE_DIR.parent / "django_proxy" / "data" / "areas.gpkg")
# DEALS = gpd.read_file(Path("..") / "data" / "deals.gpkg")
# REGIONS = gpd.read_file(Path("..") / "data" / "world_region_light.gpkg") #for testing locally
# AREAS = gpd.read_file(Path("..") / "data" / "areas.gpkg")

def geom_constructor(query):
    selected_deals,filtered_regions = which_regions(query,DEALS,REGIONS)
    final_areas=which_areas(query,filtered_regions,AREAS)
    if final_areas.empty and selected_deals.empty:
        return "code_1", 0
    final_deals = final_filtering(query,filtered_regions,DEALS,selected_deals)
    if final_deals.empty:
        return "code_2", 0
    nb_deals = len(final_areas)+len(final_deals)
    buffers= final_deals.copy()
    area = final_deals["deal_size"].replace(0, 2000000)
    buffers_geoms = final_deals["geometry"].buffer(
        np.sqrt(area * 10000 / np.pi))  # formula for finding radius with area
    buffers["geometry"] = buffers_geoms
    buffers['feature_type'] = 'buffer'
    combined_deals=gpd.GeoDataFrame(pd.concat([final_deals, buffers,final_areas]
                                              ,ignore_index=True),crs="EPSG:3857")
    return combined_deals,nb_deals





