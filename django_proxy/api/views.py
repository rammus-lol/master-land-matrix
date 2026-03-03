import io
import requests
from django.http import JsonResponse,HttpResponse
from django.views.decorators.csrf import csrf_exempt
import json
import geopandas as gpd
import pandas as pd
from shapely.geometry import shape
import traceback
from pathlib import Path
from django.conf import settings
from land_matrix_function import export
from api.custom_service.spatial_function import  geom_constructor
from api.custom_service.table_function import table_constructor
from rest_framework.decorators import api_view
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse
from drf_spectacular.types import OpenApiTypes
from .serializers import *

@extend_schema(exclude=True)
@api_view(['GET'])
@csrf_exempt
def generic_proxy(request, endpoint):
    """
    Generic proxy for the landmatrix.org API.
    Routes /api/<endpoint> requests to https://landmatrix.org/api/<endpoint>.
    """
    try:
        url = f'https://landmatrix.org/api/{endpoint}'
        params = request.GET.dict()
        response = requests.get(url, params=params, timeout=10)
        return JsonResponse(
            response.json(),
            status=response.status_code,
            safe=False
        )
    except requests.exceptions.RequestException as e:
        return JsonResponse(
            {'error': str(e)},
            status=500
        )
@csrf_exempt
@extend_schema(
    summary="Spatial analysis and geometry processing",
    description="""
        Processes a standard GeoJSON FeatureCollection to perform spatial queries.

        The endpoint performs the following operations:
        1. **Parsing**: Validates the incoming GeoJSON structure.
        2. **Geometry Reconstruction**: Handles standard geometries (Points, Polygons, etc.).
        3. **Extended Properties**: Detects custom spatial definitions within the 'properties' object 
           (e.g., handles 'Circle' types by utilizing the 'radius' and 'original_type' attributes).
        4. **Spatial Querying**: Forwards the cleaned geometries to the internal spatial engine 
           to generate a contextual response.
        """,
    request=GeoJSONInputSerializer,
    responses={
        200: GeomResponseSerializer,
    },
    tags=['geography']
)
@api_view(['POST'])
def geom(request):
    input_serializer = GeoJSONInputSerializer(data=request.data)
    if not input_serializer.is_valid():
        return Response({"error": "Invalid format for geom endpoint"}, status=400)
    try:
        geojson=request.data
        geoms = [shape(f["geometry"]) for f in geojson["features"]]
        props = [f.get("properties") or {} for f in geojson["features"]]

        # Convert to GeoDataFrame : filter JSON|point->transform into circle->combine into GeoDataFrame of polygons
        #                                      |polygon->do nothing
        query = gpd.GeoDataFrame(props, geometry=geoms, crs="EPSG:3857")
        test=query.get("radius")#->test if user asked for circular form
        if test is not None:
            gdf_circle=query[query.geometry.geom_type == 'Point']
            gdf_polygon=query[query.geometry.geom_type != 'Point']
            buffer=gdf_circle.buffer(gdf_circle['radius'])
            gdf_circle["geometry"]=buffer
            query=gpd.GeoDataFrame(pd.concat([gdf_circle,gdf_polygon],ignore_index=True),crs='EPSG:3857')
        spatial_query,number_of_deals=geom_constructor(query)
        if type(spatial_query) is str:
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
            return JsonResponse(response,status=200)

    except Exception as e:
        print("error in geom api querying :", e, flush=True)
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=500)
@csrf_exempt
@extend_schema(
    summary="Requesting for data in spreadsheet format",
    description="""
        Processes a list of IDs and exports the corresponding deals into a spreadsheet 
        (Excel or CSV) based on the requested format.
    """,
    request=SheetInputSerializer,
    responses={
        200: OpenApiResponse(
            description="The generated spreadsheet file",
            response=OpenApiTypes.BINARY,
        ),
        400: OpenApiResponse(description="Invalid IDs or format provided"),
    },
    tags=["spreadsheet file"]
)
@api_view(['POST'])
def sheet(request):
    id_list=request['id_list']
    file_format = request['file_format']
    table = table_constructor([id_list],file_format)
    if file_format == "xlsx":
        output = io.BytesIO()
        table.to_excel(output, index=False, engine='openpyxl')
        content_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        filename = "export.xlsx"
        data = output.getvalue()
    else:
        output = io.StringIO()
        table.to_csv(output, sep=";", index=False)
        content_type = "text/csv"
        filename = "export.csv"
        data = output.getvalue()
    response = HttpResponse(data, content_type=content_type)
    response['Content-Disposition'] = f'attachment; filename="{filename}"'

    return response

