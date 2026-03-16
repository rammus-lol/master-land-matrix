# # Copyright (c) 2026, Land Matrix Geodata Visualiser
# All rights reserved.
# 
# This software is governed by the CeCILL license under French law and
# abiding by the rules of distribution of free software.  You can  use, 
# modify and/ or redistribute the software under the terms of the CeCILL
# license as circulated by CEA, CNRS and INRIA at the following URL
# "http://www.cecill.info".

from django.urls import path
from . import views
urlpatterns = [
    # Proxy générique pour tous les autres endpoints
    # Doit être en dernier pour ne pas intercepter les routes spécifiques
    path("geom/", views.geom, name = "geom"),
    path("sheet/", views.sheet, name = "sheet"),
    path('<path:endpoint>', views.generic_proxy, name='generic_proxy'),
]
