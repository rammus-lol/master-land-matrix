from geopandas.geodataframe import GeoDataFrame
from crawler_area import crawling_areas
from crawler_points import deal_gpkg_writer
from pathlib import Path
"""WARNING. Before you need to add a file containing world coverage for admin-1 inside root/django_proxy/data folder
you can use https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-1-states-provinces/
with the first option Download states and provinces.
We recommend to open it in a SIG software and select the fields you think are importants,
but it works well if you just export it in a geopackage"""
def main(making_areas=True):
    """Update database directly from API for points represented deals
    and from wget on areas.geojson downloading link.
    Since this part takes 3 minutes just for downloading and transform it
    into GeoDataFrame, you can set making_areas to False,
    this way it will skip area updating."""
    # First create the folder.
    output_dir = Path("../django_proxy/data")
    output_dir.mkdir(parents=True, exist_ok=True)

    # Second manage point represented deals the function.Usually it returns None but you can set debug to True if you wanna chack something.
    deal_gpkg_writer(output_dir,debug=False)

    # Third manage polygon represented deals.
    if making_areas:
        areas : GeoDataFrame = crawling_areas()
        areas.to_file(output_dir / "areas.gpkg",driver="GPKG",layer="areas")
        for ext in ["*.geojson", "*.tmp"]:
            for file in Path(__file__).parent.glob(ext):
                file.unlink()
if __name__ == "__main__":
    main()



