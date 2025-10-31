from rest_framework import status,viewsets,permissions  # Códigos de estado HTTP
from rest_framework.views import APIView  # Base para crear vistas de DRF tipo clase
from rest_framework.response import Response  # Para devolver respuestas JSON
from rest_framework.permissions import IsAuthenticated, AllowAny  # Permiso para rutas protegidas
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView    
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from rest_framework_simplejwt.tokens import RefreshToken  # Para generar JWT (access y refresh)
from rest_framework.permissions import AllowAny
from .authentications import CookiesJWTAuthentication
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

from .models import CustomUser,Libro,Manga,Novela, RegistroLectura,MaterialGeneral,Comentarios
from .serializers import RegisterSerializer, UserProfileSerializer,LibroSerializer,NovelaSerializer,MangaSerializer,RegistroLecturaSerializer, MaterialGeneralSerializer,ComentariosSerializer 

# -----------------------------
# Registro de usuario
# -----------------------------
class RegisterView(APIView):
    def post(self, request):
        # Recibe los datos enviados por el frontend en JSON
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():  # Valida que los datos cumplan con las reglas del serializer
            serializer.save()  # Crea el usuario en la base de datos
            data = serializer.data
            # Eliminamos password y password2 de la respuesta por seguridad
            data.pop('password', None)
            data.pop('password2', None)
            return Response({
                "message": "Usuario registrado exitosamente.",
                "status": True,
                "data": data  # Devuelve datos del usuario sin la contraseña
            }, status=status.HTTP_201_CREATED)
        # Si hay errores de validación, se devuelven con código 400
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# -----------------------------
# Login de usuario
# -----------------------------
class LoginView(APIView):
    def post(self, request):
        username = request.data.get('username')  # Obtiene el username del JSON
        password = request.data.get('password')  # Obtiene la contraseña del JSON
        user = CustomUser.objects.filter(username=username).first()  # Busca el usuario en la base de datos

        # Si el usuario existe y la contraseña coincide
        if user and user.check_password(password):
            # Genera un token JWT para el usuario
            refresh = RefreshToken.for_user(user)
            return Response({
                "access_token": str(refresh.access_token),  # Token corto que se usa en cada request
                "refresh_token": str(refresh)  # Token largo para renovar el access token
            })
        
        # Si no coincide el username o la contraseña
        return Response({"detail": "Credenciales inválidas"}, status=status.HTTP_401_UNAUTHORIZED)

#-----------------------------
# Cookies de autenticación
#-----------------------------
class LoginView(TokenObtainPairView):
    def post(self, request):
      
        username = request.data.get('username')
        password = request.data.get('password')
        user = CustomUser.objects.filter(username=username).first()
        if user and user.check_password(password):
            refresh = RefreshToken.for_user(user)
            response = Response({
                "access_token": str(refresh.access_token),
                "refresh_token": str(refresh)
            })
            # Establece las cookies en la respuesta
            response.set_cookie(
                key='access_token',
                value=str(refresh.access_token),
                httponly=True,
                secure=False,
                samesite='None',
                path='/'
            )

            response.set_cookie(
                key='refresh_token',
                value=str(refresh),
                httponly=True,
                secure=False,
                samesite='None',
                path='/'
            )
            return response
        return Response({"detail": "Credenciales inválidas"}, status=status.HTTP_401_UNAUTHORIZED)


class CustomTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        try:
            refresh_token = request.COOKIES.get('refresh_token')

            if not refresh_token:
                return Response(
                    {'refreshed': False, 'error': 'No hay refresh_token'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Asignar refresh token al cuerpo
            request.data['refresh'] = refresh_token

            # Obtener nuevo access token desde la vista base
            response = super().post(request, *args, **kwargs)
            tokens = response.data
            access_token = tokens.get('access')

            # Nueva respuesta personalizada
            res = Response({
                'refreshed': True,
                'access': access_token
            }, status=status.HTTP_200_OK)

            # Guardar el nuevo access token en cookie segura
            res.set_cookie(
                key='access_token',
                value=access_token,
                httponly=True,
                secure=False,      
                samesite='None',
                path='/'
            )

            return res

        except Exception as e:
            print("Error al refrescar token:", e)
            res = Response({
                'refreshed': False,
                'error': 'Token invalido o expirado'
            }, status=status.HTTP_401_UNAUTHORIZED)
            res.delete_cookie('access_token', path='/')
            res.delete_cookie('refresh_token', path='/')
            return res    

class LogoutView(APIView):
    def post(self, request):
        try:
            refresh_token = request.COOKIES.get('refresh_token')
            token = RefreshToken(refresh_token)
            # ← Se agrega a la lista negra
            response = Response({"success": "Logout exitoso"}, status=status.HTTP_205_RESET_CONTENT)
            response.delete_cookie('access_token')
            response.delete_cookie('refresh_token')
            return response
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)       

# -----------------------------
# Ver perfil del usuario
# -----------------------------
class ProfileView(APIView):
    permission_classes = [IsAuthenticated]  # Solo usuarios autenticados pueden acceder
    authentication_classes = [CookiesJWTAuthentication]  # Usar autenticación por cookies
    def get(self, request):
        user = request.user  # Obtiene el usuario a partir del token enviado en los headers
        serializer = UserProfileSerializer(user)  # Serializa solo los campos seguros (sin contraseña)
        return Response(serializer.data)  # Devuelve la información del usuario en JSON


# cree esta clase porque no me funcionaba el IsAdminUser para verificar el rol de admin
class IsAdminCustom(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.rol == CustomUser.Roles.ADMIN
# -----------------------------
# LIBROS
# -----------------------------

class LibroViewSet(viewsets.ModelViewSet):
    queryset = Libro.objects.all()
    serializer_class = LibroSerializer
    authentication_classes = [CookiesJWTAuthentication]
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
    authentication_classes = [CookiesJWTAuthentication]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['genero', 'anio_publicacion', 'editorial']
    search_fields = ['titulo', 'autor']
    ordering_fields = ['anio_publicacion', 'titulo']
    ordering = ['titulo']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminCustom()]


class NovelaViewSet(viewsets.ModelViewSet):
    queryset = Novela.objects.all()
    serializer_class = NovelaSerializer
    authentication_classes = [CookiesJWTAuthentication]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['genero', 'anio_publicacion', 'editorial']
    search_fields = ['titulo', 'autor']
    ordering_fields = ['anio_publicacion', 'titulo']
    ordering = ['titulo']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminCustom()]


class RegistroLecturaViewSet(viewsets.ModelViewSet):
    queryset = RegistroLectura.objects.all()
    serializer_class = RegistroLecturaSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [CookiesJWTAuthentication]  # Usar autenticación por cookies

    def get_queryset(self):
        return RegistroLectura.objects.filter(user=self.request.user)

    # Al crear un registro, asigna automáticamente el usuario actual
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class MaterialGeneralViewSet(viewsets.ModelViewSet):
    queryset = MaterialGeneral.objects.all()
    serializer_class = MaterialGeneralSerializer
    permission_classes = [permissions.IsAuthenticated]  
    authentication_classes = [CookiesJWTAuthentication]  # Usar autenticación por cookies

    def get_queryset(self):
        tipo = self.request.query_params.get('tipo')
        user = self.request.user

        # Filtra los registros de ese usuario
        registros_usuario = RegistroLectura.objects.filter(user=user)

        # Obtiene solo los materiales asociados a esos registros
        queryset = MaterialGeneral.objects.filter(id__in=registros_usuario.values_list('material_id', flat=True))

        # Opcional: filtra por tipo si se pasa como query param
        if tipo:
            queryset = queryset.filter(tipo=tipo)

        return queryset

class ComentarioViewSet(viewsets.ModelViewSet):
    queryset = Comentarios.objects.all()
    serializer_class = ComentariosSerializer

    def get_queryset(self):
        # Devuelve todos los comentarios (públicos)
        return Comentarios.objects.all()

    def perform_create(self, serializer):
        # Asigna automáticamente el usuario que crea el comentario
        serializer.save(user=self.request.user) 
    