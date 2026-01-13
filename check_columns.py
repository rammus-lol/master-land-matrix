import geopandas as gpd
import json

print("=== DEALS.GPKG ===")
gdf = gpd.read_file('django_proxy/data/deals.gpkg')
print('Columns:', list(gdf.columns))
print('\nFirst row properties:')
sample = gdf.iloc[0].to_dict()
for k, v in list(sample.items()):
    if k != 'geometry':
        print(f'{k}: {v}')

print("\n\n=== AREAS.GPKG ===")
gdf2 = gpd.read_file('django_proxy/data/areas.gpkg')
print('Columns:', list(gdf2.columns))
print('\nFirst row properties:')
sample2 = gdf2.iloc[0].to_dict()
for k, v in list(sample2.items()):
    if k != 'geometry':
        print(f'{k}: {v}')
