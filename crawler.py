import requests
import pandas as pd
import geopandas as gpd
import json
from pathlib import Path
url="https://landmatrix.org/api/deals/"
data=requests.get(url).json()
row=[]
error=[]
for d in data:
    try:
        temp=list(d["selected_version"].items())
        deal_size=temp[0][1]
        geom_info=temp[1][1][0]
        temp={'id':d['id'],
            'deal_size':deal_size,
        'crs':geom_info['point']['crs']['properties']['name'],
        'type':geom_info['point']['type'],
        'x':geom_info['point']['coordinates'][0],
        'y':geom_info['point']['coordinates'][1],
        'level_of_accuracy':geom_info['level_of_accuracy']
        }
        row.append(temp)
    except TypeError:
        error_temp = {'id':d['id'],
    'deal_size': deal_size,
    'level_of_accuracy': geom_info.get('level_of_accuracy')}
        error.append(error_temp)
        continue
df_deal=pd.DataFrame(row)
gdf_deal=gpd.GeoDataFrame(df_deal,geometry=gpd.points_from_xy(df_deal['x'],df_deal['y']),crs='EPSG:4326')
gdf_deal.drop(['crs','x','y'],axis=1,inplace=True)
gdf_deal.to_crs('EPSG:3857',inplace=True)
gdf_deal.to_file(Path('django_proxy/data/projects.gpkg'),driver='GPKG')
with open(Path('unlocated_point.json'),"w",encoding='utf-8') as f:
    json.dump(error,f,indent=2)
print(f'number of points with no location info : {len(error)} points')

    