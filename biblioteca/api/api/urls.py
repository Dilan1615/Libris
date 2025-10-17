from rest_framework.routers import DefaultRouter
from api.api.views import PersonaViewSet, CuentaViewSet, LibroViewSet, MangaViewSet, NovelaViewSet, RegistroLecturaViewSet

router = DefaultRouter()
router.register('persona', PersonaViewSet)
router.register('cuenta', CuentaViewSet)
router.register('libro', LibroViewSet)
router.register('manga', MangaViewSet)
router.register('novela', NovelaViewSet)
router.register('registro_lectura', RegistroLecturaViewSet)


urlpatterns = router.urls