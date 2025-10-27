from rest_framework import status,viewsets,permissions  # Códigos de estado HTTP
from rest_framework.views import APIView  # Base para crear vistas de DRF tipo clase
from rest_framework.response import Response  # Para devolver respuestas JSON
from rest_framework.permissions import IsAuthenticated, AllowAny  # Permiso para rutas protegidas
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView    
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from rest_framework_simplejwt.tokens import RefreshToken  # Para generar JWT (access y refresh)
from rest_framework.permissions import AllowAny
from .authentications import MicroserviceJWTAuthentication

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

from .models import Libro,Manga,Novela, RegistroLectura, MaterialGeneral 
from .serializers import LibroSerializer,NovelaSerializer,MangaSerializer,RegistroLecturaSerializer, MaterialGeneralSerializer 


# Definimos la constante del rol localmente, asegurando que coincida con el valor en el payload
ADMIN_ROL_VALUE = 'ADMIN' 

class IsAdminCustom(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        if not request.user.is_authenticated:
            return False

        # Leemos el campo 'rol' inyectado en el objeto user/token por simplejwt.
        user_role = getattr(request.user, 'rol', None) 
        
        # La comparación usa solo el valor constante, no el modelo CustomUser.
        return user_role == ADMIN_ROL_VALUE
# -----------------------------
# LIBROS
# -----------------------------

class LibroViewSet(viewsets.ModelViewSet):
    queryset = Libro.objects.all()
    serializer_class = LibroSerializer
    authentication_classes = [MicroserviceJWTAuthentication]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]

    # Campos por los que se puede filtrar
    filterset_fields = ['genero', 'anio_publicacion', 'editorial']

    # Campos por los que se puede buscar
    search_fields = ['titulo', 'autor', 'isbn']

    # Campos por los que se puede ordenar
    ordering_fields = ['anio_publicacion', 'titulo', 'autor']
    ordering = ['titulo']  # orden por defecto

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminCustom()]  

class MangaViewSet(viewsets.ModelViewSet):
    queryset = Manga.objects.all()
    serializer_class = MangaSerializer
    authentication_classes = [MicroserviceJWTAuthentication]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]

    # Campos por los que se puede filtrar
    filterset_fields = ['genero', 'anio_publicacion', 'editorial']

    # Campos por los que se puede buscar
    search_fields = ['titulo', 'autor', 'isbn']

    # Campos por los que se puede ordenar
    ordering_fields = ['anio_publicacion', 'titulo', 'autor']
    ordering = ['titulo']  # orden por defecto

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminCustom()]


class NovelaViewSet(viewsets.ModelViewSet):
    queryset = Novela.objects.all()
    serializer_class = NovelaSerializer
    authentication_classes = [MicroserviceJWTAuthentication]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]

    # Campos por los que se puede filtrar
    filterset_fields = ['genero', 'anio_publicacion', 'editorial']

    # Campos por los que se puede buscar
    search_fields = ['titulo', 'autor', 'isbn']

    # Campos por los que se puede ordenar
    ordering_fields = ['anio_publicacion', 'titulo', 'autor']
    ordering = ['titulo']  # orden por defecto
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminCustom()]

class RegistroLecturaViewSet(viewsets.ModelViewSet):
    queryset = RegistroLectura.objects.all()
    serializer_class = RegistroLecturaSerializer
    authentication_classes = [MicroserviceJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        user_id_from_token = self.request.user.pk
        serializer.save(user_id=user_id_from_token)

    def get_queryset(self):
        return self.queryset.filter(user_id=self.request.user.pk)

class MaterialGeneralViewSet(viewsets.ModelViewSet):
    queryset = MaterialGeneral.objects.all()
    serializer_class = MaterialGeneralSerializer
    permission_classes = [permissions.IsAuthenticated]  # Solo si usas JWT    
