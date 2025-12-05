import requests
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import geopandas as gpd
import pandas as pd
import numpy as np
from shapely import disjoint
from shapely.geometry import shape
import traceback
from pathlib import Path
from django.conf import settings
point_ref=gpd.read_file(settings.BASE_DIR.parent / "django_proxy" / "data" / "projects.gpkg")#good for production, bad for dev
polygone_ref=gpd.read_file(settings.BASE_DIR.parent / "django_proxy" / "data" / "region_monde_light.gpkg")
# polygone_ref=gpd.read_file(Path(r"django_proxy\data\region_monde_light.gpkg")) #for testing localy
# point_ref=gpd.read_file(Path(r"django_proxy\data\projects.gpkg"))
# test=gpd.read_file(Path(r'django_proxy\data\polygone_test.geojson'))
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
        gdf=is_within(query)
        export=gdf.to_json()
        response={"status" : f"spatial selection sucessfull, number of found deal : {len(gdf)}",
            'data':json.loads(export)}
        return JsonResponse(response,
        status=200
    )
    except Exception as e:
        print("Erreur dans geom :", e, flush=True)
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=500)
def is_within(research : gpd.GeoDataFrame,region : gpd.GeoDataFrame=polygone_ref,project : gpd.GeoDataFrame=point_ref)->gpd.GeoDataFrame:
    filtered_regions=gpd.sjoin(region,research)
    filtered_regions=filtered_regions[["geometry"]]
    selected_projects = (gpd.sjoin(project, filtered_regions, how='inner', predicate='within').drop(columns=['index_right']))
    mask_to_keep = ~selected_projects.apply(lambda row: accuracy_measure(row, research), axis=1)
    #we delete the deals when accuracy_measure return True
    selected_projects = selected_projects[mask_to_keep]
    #finnaly we need to create points and buffer based on the filed "deal_size"
    area = selected_projects["deal_size"].replace(0, 2000000)
    buffer_geoms = selected_projects["geometry"].buffer(
        np.sqrt( area*10000/ np.pi) #formula for finding radius with area 
    )
    points = selected_projects.copy()
    points['feature_type'] = 'point'
    buffers = selected_projects.copy()
    buffers['geometry'] = buffer_geoms  # Remplacer directement la géométrie
    buffers['feature_type'] = 'buffer'
    combined = gpd.GeoDataFrame(
        pd.concat([points, buffers], ignore_index=True),
        crs='EPSG:3857'
    )
    
    return combined
accurate_points=["APPROXIMATE_LOCATION", "EXACT_LOCATION", "COORDINATES"]
def accuracy_measure(row,query):
    """Check if a project geometry is disjoint from the polygons
    oprovided by users and if it's location is know precisly
    ie project we are 100% sure they are not in the polygons"""
    project = row["geometry"]
    precision = row["level_of_accuracy"]
    test_disjoint= query["geometry"].apply(lambda q_geom: disjoint(project, q_geom)).all()
    #checking if it's not in a polygon provided by user
    test_accuracy=precision in accurate_points
    return test_accuracy and test_disjoint
