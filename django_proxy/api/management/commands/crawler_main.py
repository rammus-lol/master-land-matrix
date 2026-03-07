import os
from django.core.management.base import BaseCommand
from django.conf import settings
from pathlib import Path
import geopandas as gpd
from .crawler_area import crawling_areas
from .crawler_points import crawling_deals
from .generic_function import atomic_gpkg_exporter


"""WARNING. Before running this, you need to add a file containing world coverage for admin-1 inside root/django_proxy/data folder
you can use https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-1-states-provinces/
with the first option Download states and provinces.
We recommend to open it in a SIG software and select the fields you think are importants,
but it works well if you just export it in a geopackage"""

#run command outside Docker: .venv/Scripts/python manage.py crawler_main
class Command(BaseCommand):
    help = "Update database directly from API and GeoJSON links"

    def handle(self, *args, **options):
        # making_areas = options['making_areas']
        data_dir = settings.BASE_DIR / "data"
        data_dir.mkdir(parents=True, exist_ok=True)

        flag_path = data_dir / "crawling_done.flag" # flag to signal "datas are outdated please crawl"
        if flag_path.exists():
            flag_path.unlink()

        self.stdout.write(self.style.SUCCESS("--- Starting Crawler Process ---"))

        # 1. land_matrix/api/deals management
        self.stdout.write("Processing deals (points)...")
        gdf_deals = crawling_deals(data_dir)

        # Preparing export, export function manage atomic renaming
        jobs = [(gdf_deals, data_dir / "deals.gpkg")]

        # 2. areas.geojson management
        self.stdout.write("Processing areas (polygons) - This may take 3 minutes...")
        gdf_areas = crawling_areas(data_dir / "world_region_light.gpkg")
        jobs.append((gdf_areas, data_dir / "areas.gpkg"))

        #Deleting geojson file
        for ext in ["*.geojson"]:
            for file in Path(__file__).parent.glob(ext):
                file.unlink()
        intersection = gpd.sjoin(gdf_deals, gdf_areas, how="inner", lsuffix="deals", rsuffix="areas")
        indices_to_exclude = intersection.loc[
        intersection["id_deals"] == intersection["id_areas"], "id_deals"].index.unique()
        gdf_deals.drop(indices_to_exclude,inplace=True)
        # 3. Exporting with Atomic renaming and retry loop
        for gdf, final_path in jobs:
            atomic_gpkg_exporter(gdf, final_path)

        # 4. End signal
        flag_path.touch() # flag to signal to the necessity to
        self.stdout.write(self.style.SUCCESS(f"--- All Done! Flag created at {flag_path} ---"))





