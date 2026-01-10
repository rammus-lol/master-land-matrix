import requests
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import geopandas as gpd
import pandas as pd
import numpy as np
from shapely.geometry import shape
import traceback
from pathlib import Path
from django.conf import settings
from land_matrix_function import export

point_ref=gpd.read_file(settings.BASE_DIR.parent / "django_proxy" / "data" / "deals.gpkg")#good for production, bad for dev
polygon_ref=gpd.read_file(settings.BASE_DIR.parent / "django_proxy" / "data" / "world_region_light.gpkg")
polygon_project=gpd.read_file(settings.BASE_DIR.parent / "django_proxy" / "data" / "areas.gpkg")
# polygon_ref = gpd.read_file(Path("..") / "data" / "world_region_light.gpkg") #for testing localy
# point_ref = gpd.read_file(Path("..") / "data" / "deals.gpkg")
# polygon_project = gpd.read_file(Path("..") / "data" / "areas.gpkg")
# test = gpd.read_file(Path("..") / "data" / "polygone_test.geojson")
@csrf_exempt
def generic_proxy(request, endpoint):
    """
    Proxy générique pour n'importe quel endpoint de l'API landmatrix.org
    Permet d'accéder à /api/<endpoint> qui sera redirigé vers https://landmatrix.org/api/<endpoint>
    """
    try:
        # Construire l'URL complète
        url = f'https://landmatrix.org/api/{endpoint}'

        # Transmettre les paramètres de requête s'ils existent
        params = request.GET.dict()

        # Faire la requête vers l'API externe
        response = requests.get(url, params=params, timeout=10)

        # Retourner la réponse avec le même statut
        return JsonResponse(
            response.json(),
            status=response.status_code,
            safe=False
        )
    except requests.exceptions.RequestException as e:
        # En cas d'erreur, retourner une erreur 500
        return JsonResponse(
            {'error': str(e)},
            status=500
        )
@csrf_exempt
def geom(request):
    """Reicieve the calling from frontend
    and clean it for spatial queriying
    then give it back to the frontend"""
    if request.method != "POST":
        return JsonResponse({"error": "You have to make a POST request"}, status=400)
    try:
        geojson = json.loads(request.body)  # ← load json
        geoms = [shape(f["geometry"]) for f in geojson["features"]]
        props = [f.get("properties") or {} for f in geojson["features"]]

        # Convert to Geodataframe : filter json|point->transform into circle->combine into geodataframe of polygons
        #                                      |polygon->do nothing
        query = gpd.GeoDataFrame(props, geometry=geoms, crs="EPSG:3857")
        print("GeoDataFrame reçu :")
        print(query, flush=True)
        test=query.get("radius")#->test if user asked for cicular form
        if test is not None:
            gdf_circle=query[query.geometry.geom_type == 'Point']
            gdf_polygon=query[query.geometry.geom_type != 'Point']
            buffer=gdf_circle.buffer(gdf_circle['radius'])
            gdf_circle["geometry"]=buffer
            query=gpd.GeoDataFrame(pd.concat([gdf_circle,gdf_polygon],ignore_index=True),crs='EPSG:3857')
        spatial_query=is_within(query)
        export=spatial_query.to_json()
        if spatial_query not in ("code_1","code_2"):
            response={"status" : f"spatial selection sucessfull, number of found deal : {len(gdf)}",
                'data':json.loads(export)}
            return JsonResponse(response,
            status=200
        )
        elif spatial_query=="code_2":
            return JsonResponse({"status": "No deal inside the provided shapes but some are near by"
                                 ,"data": 0}, status=200)
        else:
            return JsonResponse({"status": "No deal found",
                                 "data":0}, status=200)
    except Exception as e:
        print("Erreur dans geom :", e, flush=True)
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=500)
def is_within(research : gpd.GeoDataFrame,region : gpd.GeoDataFrame=polygon_ref,
              project : gpd.GeoDataFrame=point_ref)->gpd.GeoDataFrame | str:
    """Spatial selection of deals and areas inside the polygons
    brought by user inside the frontend interface
    can return :
    -GeoDataFrame with project's centroid,buffers based on deal_size and digitalized deals
    -code_1 : The polygons provided are in a country with no deal.
    -code_2 : The polygons provided contains no deal, but some are nearby them."""
    export_list=[]
    filtered_regions=gpd.sjoin(region,research).drop(columns=["id","index_right"],errors="ignore")
    selected_projects = gpd.sjoin(project, filtered_regions, how='inner', predicate='within')
    col_to_drop=[col for col in filtered_regions.columns if col not in ("admin","geometry")]
    col_to_drop+=["admin_right",'index_right']
    selected_projects.drop(col_to_drop,axis=1,inplace=True,errors="ignore")
    selected_projects.rename(columns={"admin_left":'admin'},inplace=True)

    #First, we track deals inside the countries cover by the provided shapes with a COUNTRY accuracy.

    filtered_regions_countries = set(filtered_regions["admin"])
    country_project = project[
        (project['admin'].str.strip().isin(filtered_regions_countries)) &
        (project['level_of_accuracy'].str.strip() == 'COUNTRY')
        ]
    country_project['feature_type'] = 'point'#this column is for frontend displaying
    export_list.append(country_project)

    #Second, we search for areas crossing the provided shapes

    def region_checker(region_list : list,region_id_list : list):
        bool_list=[]
        for region in region_list:
            if region in region_id_list:
                bool_list.append(True)
            else:
                bool_list.append(False)
        return any(bool_list)
    filtered_regions_ids = list(filtered_regions["iso_3166_2"])
    filtered_areas = polygon_project[polygon_project["region_list"].apply(lambda x: region_checker(x, filtered_regions_ids))]
    selected_areas=gpd.sjoin(filtered_areas,research).drop(columns=["id_right","index_right"],errors="ignore")
    selected_areas.rename(columns={"id_left":"id"},inplace=True)
    selected_areas['feature_type'] = 'areas'
    export_list.append(selected_areas)
    if selected_projects.empty and selected_areas.empty:
        return "code_1"

    #Third we treat other deals and we draw a buffer around them based on the attributes 'deal_size'.

    if not selected_areas.empty:
        accurate_points = ["APPROXIMATE_LOCATION", "EXACT_LOCATION", "COORDINATES"]
        points_inaccurate = selected_projects[~selected_projects["level_of_accuracy"].isin(accurate_points)]
        point_inside = gpd.sjoin(selected_projects, research, how='inner').drop(columns=["id_right","index_right"],errors="ignore")
        final_points= gpd.GeoDataFrame(pd.concat([points_inaccurate, point_inside])).drop_duplicates(
            subset='geometry')
        if final_points.empty:
            return "code_2"
        area = final_points["deal_size"].replace(0, 2000000)
        buffer_geoms = final_points["geometry"].buffer(
            np.sqrt( area*10000/ np.pi) #formula for finding radius with area
        )
        points = final_points.copy()
        points['feature_type'] = 'point'
        export_list.append(points)
        buffers = final_points.copy()
        buffers['geometry'] = buffer_geoms
        buffers['feature_type'] = 'buffer'
        export_list.append(buffers)
    combined = gpd.GeoDataFrame(
        pd.concat(export_list, ignore_index=True),
        crs='EPSG:3857'
    ).drop_duplicates(subset='geometry')
    return combined
