from django.apps import AppConfig
from django.conf import settings

class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'
    def ready(self):
        from api.custom_service import spatial_function
        print("--- Loading Geopackage in ram ---")
        spatial_function.get_data()
        print("--- Succes : Data ready in RAM ---")