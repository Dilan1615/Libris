from django.urls import path, include
from .router import router  # importamos el router

urlpatterns = [
    # Incluimos todas las rutas del router
    path('', include(router.urls)),
]
