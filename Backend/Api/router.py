from rest_framework.routers import DefaultRouter
from Api.views import LibroViewSet, MangaViewSet, NovelaViewSet, RegistroLecturaViewSet, MaterialGeneralViewSet

router = DefaultRouter()
router.register('libros', LibroViewSet)
router.register('mangas', MangaViewSet)
router.register('novelas', NovelaViewSet)
router.register('registros-lectura', RegistroLecturaViewSet)
router.register('material-general', MaterialGeneralViewSet)
