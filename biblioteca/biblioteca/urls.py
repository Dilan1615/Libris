from django.urls import path
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from api.views import (LibroViewSet, MangaViewSet, NovelaViewSet, RegisterView, LoginView, 
                       ProfileView, RegistroLecturaViewSet, MaterialGeneralViewSet,LogoutView, LoginView
                       ,ComentarioViewSet, CustomTokenRefreshView, obtener_libros, UsuariosViewSet, GeneroTagViewSet,
                       CalificacionViewSet, FavoritoViewSet
                       )
from api import views
from django.views.static import serve
from django.http import FileResponse
import os

def serve_pdf(request, path):
    """Sirve archivos PDF con Content-Disposition inline para renderizar en navegador"""
    file_path = os.path.join(settings.MEDIA_ROOT, path)
    if os.path.exists(file_path) and path.lower().endswith('.pdf'):
        response = FileResponse(open(file_path, 'rb'), content_type='application/pdf')
        response['Content-Disposition'] = 'inline; filename="{}"'.format(os.path.basename(file_path))
        response['X-Content-Type-Options'] = 'nosniff'
        # Eliminar X-Frame-Options para permitir iframe
        if 'X-Frame-Options' in response:
            del response['X-Frame-Options']
        return response
    return serve(request, path, document_root=settings.MEDIA_ROOT)

router = DefaultRouter()
router.register(r'libros', LibroViewSet, basename='libro')
router.register(r'mangas', MangaViewSet, basename='manga')
router.register(r'novelas', NovelaViewSet, basename='novela')
router.register(r'registros', RegistroLecturaViewSet, basename='registro')
router.register(r'material', MaterialGeneralViewSet, basename='material')
router.register(r'comentarios', ComentarioViewSet, basename='comentario')
router.register(r'usuarios', UsuariosViewSet, basename='usuario')
router.register(r'generos', GeneroTagViewSet, basename='genero-tag')
router.register(r'calificaciones', CalificacionViewSet, basename='calificacion')
router.register(r'favoritos', FavoritoViewSet, basename='favorito')



urlpatterns = [
    path('', views.root, name='root'),
    path('api/register/', RegisterView.as_view()),
    path('api/login/', LoginView.as_view()),
    path('api/profile/', ProfileView.as_view()),   
    path('api/logout/', LogoutView.as_view()), 
    path('api/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('api/libros-externos/', obtener_libros, name='obtener_libros'),
    path('api/', include(router.urls)),
    path('admin/', admin.site.urls),   # <- ESTA ES LA QUE IMPORTA

]

# Servir archivos media en desarrollo con PDF inline
if settings.DEBUG:
    from django.urls import re_path
    urlpatterns += [
        re_path(r'^media/(?P<path>.*)$', serve_pdf, name='media'),
    ]

