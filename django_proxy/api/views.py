import requests
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import geopandas as gpd
import pandas as pd
from shapely import Polygon,MultiPolygon,Point,intersects,within
from shapely.geometry import shape
point_ref=gpd.read_file(r'django_proxy\data\projet_imaginaire.geojson')
polygone_ref=gpd.read_file(r'django_proxy\data\region_perou.geojson')
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
        geojson = json.loads(request.body)  # ← récupère le GeoJSON envoyé
        geoms = [shape(f["geometry"]) for f in geojson["features"]]
        props = [f.get("properties") or {} for f in geojson["features"]]
        
        # Convertir GeoJSON → GeoDataFrame
        query = gpd.GeoDataFrame(props, geometry=geoms, crs="EPSG:3857")
        print("GeoDataFrame reçu :", query, flush=True)
        point_ref=gpd.read_file(r'A:\serveur_landmatrix\master-land-matrix\django_proxy\data\projet_imaginaire.geojson')
        polygone_ref=gpd.read_file(r'A:\serveur_landmatrix\master-land-matrix\django_proxy\data\region_perou.geojson')
        # test=gpd.read_file(r'django_proxy\data\polygone_test.geojson')
        def is_within(research : gpd.GeoDataFrame,region : gpd.GeoDataFrame=polygone_ref,project : gpd.GeoDataFrame=point_ref)->gpd.GeoDataFrame:
            roi=research['geometry'] #region of interests ie geojson provide by clients
            liste_geoseries = []
            for r in roi:
                filtred_region=region[region.apply(lambda x: intersects(r,x['geometry']),axis=1)]['geometry']#I did a lambda function because this part must be as fast as possible   
                liste_geoseries.append(filtred_region)
            series_roi=pd.concat(liste_geoseries, ignore_index=True)
            list_geodataframe=[]
            for s in series_roi:
                poi=project[project.apply(lambda x: within(x['geometry'],s),axis=1)]
                list_geodataframe.append(poi)
            selected_project=gpd.GeoDataFrame(pd.concat(list_geodataframe,ignore_index=True),crs='EPSG:3857')
            return selected_project
        gdf=is_within(query)
        export=gdf.to_json()
        response={"status" : f"spatial selection sucessfull, number of found deal : {len(gdf)}",
            'data':json.loads(export)}
        return JsonResponse(response,
        status=200
    )
    except Exception as e:
        print("Erreur dans geom :", e, flush=True)
        return JsonResponse({"error": str(e)}, status=500)
def is_within(research : gpd.GeoDataFrame,region : gpd.GeoDataFrame=polygone_ref,project : gpd.GeoDataFrame=point_ref)->gpd.GeoDataFrame:
    roi=research['geometry'] #region of interests ie geojson provide by clients
    liste_geoseries = []
    for r in roi:
        filtred_region=region[region.apply(lambda x: intersects(r,x['geometry']),axis=1)]['geometry']#I did a lambda function because this part must be as fast as possible   
        liste_geoseries.append(filtred_region)
    series_roi=pd.concat(liste_geoseries, ignore_index=True)
    list_geodataframe=[]
    for s in series_roi:
        poi=project[project.apply(lambda x: within(x['geometry'],s),axis=1)]
        list_geodataframe.append(poi)
    selected_project=gpd.GeoDataFrame(pd.concat(list_geodataframe,ignore_index=True),crs='EPSG:3857')
    return selected_project

