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
from api.spatial_service.spatial_function import  geom_constructor
import time as t
# test = gpd.read_file(Path("..") / "data" / "polygone_test.geojson") #works only for dev on my computer
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
    """Receive the calling from frontend
    and clean it for spatial querying
    then give it back to the frontend"""
    if request.method != "POST":
        return JsonResponse({"error": "You have to make a POST request"}, status=400)
    try:
        geojson = json.loads(request.body)  # ← load json
        geoms = [shape(f["geometry"]) for f in geojson["features"]]
        props = [f.get("properties") or {} for f in geojson["features"]]

        # Convert to GeoDataFrame : filter json|point->transform into circle->combine into geodataframe of polygons
        #                                      |polygon->do nothing
        query = gpd.GeoDataFrame(props, geometry=geoms, crs="EPSG:3857")
        test=query.get("radius")#->test if user asked for cicular form
        if test is not None:
            gdf_circle=query[query.geometry.geom_type == 'Point']
            gdf_polygon=query[query.geometry.geom_type != 'Point']
            buffer=gdf_circle.buffer(gdf_circle['radius'])
            gdf_circle["geometry"]=buffer
            query=gpd.GeoDataFrame(pd.concat([gdf_circle,gdf_polygon],ignore_index=True),crs='EPSG:3857')
        spatial_query,number_of_deals=geom_constructor(query)

        if spatial_query=="code_2":
            return JsonResponse({"status": "No deal inside the provided shapes but some are near by"
                                 ,"data": 0}, status=200)
        elif spatial_query=="code_1":
            return JsonResponse({"status": "No deal found",
                                 "data":0}, status=200)
        else:
            export = spatial_query.to_json()
            response = {"status": f"Spatial selection successful. Number of deals found: {number_of_deals}",
                        'data': json.loads(export)}
            return JsonResponse(response,
                                status=200
                                )
    except Exception as e:
        print("Erreur dans geom :", e, flush=True)
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=500)



