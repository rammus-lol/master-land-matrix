import geopandas as gpd
import pandas as pd
import openpyxl
from pathlib import Path
import os
import sys
import django
import time
BASE_PATH = Path(__file__).resolve().parents[3]

if str(BASE_PATH) not in sys.path:
    sys.path.insert(0, str(BASE_PATH))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'proxy_project.settings')

try:
    django.setup()
    print("Django setup successful!")
except Exception as e:
    print(f"Django setup failed: {e}")

from django.conf import settings
DATA_DIR = settings.BASE_DIR / "data"
DEALS =DATA_DIR / "deals.gpkg"
AREAS = DATA_DIR / "areas.gpkg"


def table_constructor(id_list : list[int])-> pd.DataFrame:
    """A function which extract a non-spatial table for user downloading
    with formating of certain fields"""
    ids =", ".join([str(i) for i in id_list])

    sql_query = f"""
        SELECT 
            id as deal_id, 
            admin as country, 
            deal_size, 
            (SELECT group_concat(value) FROM json_each(current_intention_of_investment)) as current_intention_of_investment,
            --this field is a JSON list we were asked to retrieve [] and '"'.
            current_implementation_status, 
            current_negotiation_status,
            level_of_accuracy,
            quality_of_precision, 
            initiation_year
        FROM deals
        WHERE id IN ({ids})
        """
    #Don't worry django serializers before calling manage SQL injection (since you
    table_deals = gpd.read_file(DEALS,sql =sql_query)
    table_areas = gpd.read_file(AREAS,sql =sql_query.replace("deals","areas"))
    table=pd.concat([table_deals,table_areas]).drop_duplicates()


    return table

if __name__=="__main__":
    with pd.option_context('display.max_rows', None, 'display.max_columns', None):
        print(table_constructor([8,11,12,13,14]))