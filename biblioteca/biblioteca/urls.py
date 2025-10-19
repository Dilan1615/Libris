from django.urls import path
from rest_framework.routers import DefaultRouter
from api.views import LibroViewSet, MangaViewSet, NovelaViewSet, RegisterView, LoginView, ProfileView, RegistroLecturaViewSet

router = DefaultRouter()
router.register('libros', LibroViewSet)
router.register('mangas', MangaViewSet)
router.register('novelas', NovelaViewSet)
router.register('registros-lectura', RegistroLecturaViewSet)

urlpatterns = [
    path('api/register/', RegisterView.as_view()),
    path('api/login/', LoginView.as_view()),
    path('api/profile/', ProfileView.as_view()),
] + router.urls

