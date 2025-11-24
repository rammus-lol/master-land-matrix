from django.urls import path
from . import views

urlpatterns = [
    # Proxy générique pour tous les autres endpoints
    # Doit être en dernier pour ne pas intercepter les routes spécifiques
    path("geom/", views.geom),
    path('<path:endpoint>', views.generic_proxy, name='generic_proxy'),
]
