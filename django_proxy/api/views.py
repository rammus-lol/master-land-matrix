import requests
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import geopandas as gpd
import pandas as pd
import numpy as np
from shapely import within
from shapely.geometry import shape
import traceback
point_ref=gpd.read_file(r"data\projet_imaginaire.geojson")
polygone_ref=gpd.read_file(r'data\region_monde_light.gpkg')
test=gpd.read_file(r'data\polygone_test.geojson')
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
    selected_projects["color"] = selected_projects.apply(
    lambda row: accuracy_measure(row["level_of_accuracy"], row["geometry"], research),
    axis=1)
    selected_projects = selected_projects[selected_projects["color"].notna()]
    #finnaly we need to create points and buffer based on the filed "deal_size"
    buffer_geoms = selected_projects["geometry"].buffer(
        np.sqrt(selected_projects["deal_size"] / np.pi) #formula for finding radius with area 
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
def accuracy_measure(precision, geometry, query):
    """Check if a project geometry is inside any polygon from query, 
    and assign a color inside the landmatrix style guide."""
    test = query["geometry"].apply(lambda query_geom: within(geometry, query_geom))
    
    if any(test):
        if precision in accurate_points:
            return "#fc941d"
        elif precision in ['ADMINISTRATIVE_REGION', "COUNTRY"]:
            return "#43b6b5"
        else:
            return "#000000"
    elif precision in ['ADMINISTRATIVE_REGION', "COUNTRY"]:
        return "#43b6b5"
    elif precision in accurate_points:
        return None  # we drop the well knowed location outside of user query
    else:
        return "#000000"
export=is_within(test)
export.to_file("data/test_coloration.geojson",driver="GeoJSON")
print(export)
