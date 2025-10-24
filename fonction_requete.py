import requests
import geopandas as gpd
import shapely
from shapely import Point, Polygon
import openpyxl #library for excel files manipulation, I use it for styling cells according to the level of accuracy
import matplotlib.pyplot as plt
import pprint as pp
import pandas as pd
import traceback
url="https://landmatrix.org/api/deals/?minerals=ALU"#I don't know which URL use but this one works fine for testing
fichier=r"A:\cours_m2\land_matrix\bdd_test.gpkg"
def buffer_creation(geom:gpd.GeoDataFrame,is_agricultural=False):
    geom.to_crs(epsg=3857,inplace=True)
    zoning=gpd.GeoDataFrame(geometry=geom.buffer(10500),crs=3857) 
    return zoning 
"""I'm using a radius a little bit bigger than 10 km,
making sure it's englobing a 10 km circle and not 9945 meters because of shape's weirdness."""
def eval_geom(buffer,points): #spatial querying 
    result=points.sjoin(buffer, predicate="within")
    result=result.drop(columns="index_right")
    return result if not result.empty else "The database stocks no points within the given shape"
def api_call(): #create the point geodataframe object
    data=requests.get(url).json()
    extract=[]
    crs_validation=set()
    for d in data:
        location=d["selected_version"]["locations"]
        for l in location:
            temp={}
            temp["nid"]=l["nid"]
            temp["crs"]=l["point"]["crs"]["properties"]["name"]
            crs_validation.add(temp["crs"])
            temp["lon"]=l["point"]["coordinates"][0]
            temp["lat"]=l["point"]["coordinates"][1]
            temp["accuracy"]=l["level_of_accuracy"]
            extract.append(temp)         
    if len(crs_validation)!=1:
        for e in extract:
            if [any(c) is None for c in [e["lon"],e["lat"]]]:
                df=pd.DataFrame({'lon':[e["lon"]],'lat':[e["lat"]],'crs':[e["crs"]]})#pandas asks for an iterable object 
                print(df)
                if e["crs"]!="EPSG:4326":
                    gdf=gpd.GeoDataFrame(df,geometry=gpd.points_from_xy(df["lon"],df["lat"],crs=df["crs"].iloc[0]))
                    gdf.to_crs(4326)
                    x=e["lon"]
                    y=e["lat"]
                    e["lon"]=gdf.geometry.x.iloc[0]
                    e["lat"]=gdf.geometry.y.iloc[0]
                    # print(f"coordonnées changée : {[x,y]}>>{[e["lon"],e["lat"]]}")
                    df=pd.DataFrame(extract)
                    gdf=gpd.GeoDataFrame(df,geometry=gpd.points_from_xy(df['lon'],df["lat"]),crs=df['crs'].iloc[0])
                    gdf.to_crs(3857,inplace=True)               
                else:
                    continue
            else:
                print(f"donnée incompléte pour {e["nid"]}")
    else:
        df=pd.DataFrame(extract)
        gdf=gpd.GeoDataFrame(df,geometry=gpd.points_from_xy(df['lon'],df["lat"]),crs=df['crs'].iloc[0])
        gdf.to_crs(3857,inplace=True)
        gdf = gdf.drop(columns="crs")
    return gdf
test_2=api_call()
print(test_2)
polygon=buffer_creation(gpd.read_file(fichier,layer="test_polygone"))
print(polygon)
filtre=eval_geom(polygon,test_2)
print(filtre)
# test_2.to_file(fichier,driver='GPKG',layer="test_2")
# filtre.to_file(fichier,driver='GPKG',layer="filtre")

