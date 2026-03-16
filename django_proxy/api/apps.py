# # Copyright (c) 2026, Land Matrix Geodata Visualiser
# All rights reserved.
# 
# This software is governed by the CeCILL license under French law and
# abiding by the rules of distribution of free software.  You can  use, 
# modify and/ or redistribute the software under the terms of the CeCILL
# license as circulated by CEA, CNRS and INRIA at the following URL
# "http://www.cecill.info".

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