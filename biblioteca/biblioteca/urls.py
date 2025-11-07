from django.urls import path
from django.contrib import admin
from rest_framework.routers import DefaultRouter
from api.views import (LibroViewSet, MangaViewSet, NovelaViewSet, RegisterView, LoginView, 
                       ProfileView, RegistroLecturaViewSet, MaterialGeneralViewSet,LogoutView, LoginView
                       ,ComentarioViewSet
                       )
from api import views

router = DefaultRouter()
router.register('libros', LibroViewSet)
router.register('mangas', MangaViewSet)
router.register('novelas', NovelaViewSet)
router.register('registros', RegistroLecturaViewSet)
router.register('material', MaterialGeneralViewSet)
router.register('comentarios', ComentarioViewSet)



urlpatterns = [
    path('api/register/', RegisterView.as_view()),
    path('api/login/', LoginView.as_view()),
    path('api/profile/', ProfileView.as_view()),   
    path('api/logout/', LogoutView.as_view()), 
    path('api/libros-externos/', views.obtener_libros, name='obtener_libros')
] + router.urls

