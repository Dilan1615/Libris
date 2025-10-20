from rest_framework import status,viewsets,permissions  # Códigos de estado HTTP
from rest_framework.views import APIView  # Base para crear vistas de DRF tipo clase
from rest_framework.response import Response  # Para devolver respuestas JSON
from rest_framework.permissions import IsAuthenticated  # Permiso para rutas protegidas
from rest_framework_simplejwt.tokens import RefreshToken  # Para generar JWT (access y refresh)
from rest_framework.permissions import AllowAny

from .models import CustomUser,Libro,Manga,Novela, RegistroLectura    
from .serializers import RegisterSerializer, UserProfileSerializer,LibroSerializer,NovelaSerializer,MangaSerializer,RegistroLecturaSerializer 

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

# -----------------------------
# Ver perfil del usuario
# -----------------------------
class ProfileView(APIView):
    permission_classes = [IsAuthenticated]  # Solo usuarios autenticados pueden acceder

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

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:  # Solo ver
            return [AllowAny()]
        return [IsAdminCustom()]  


class MangaViewSet(viewsets.ModelViewSet):
    queryset = Manga.objects.all()
    serializer_class = MangaSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminCustom()]


class NovelaViewSet(viewsets.ModelViewSet):
    queryset = Novela.objects.all()
    serializer_class = NovelaSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminCustom()]

class RegistroLecturaViewSet(viewsets.ModelViewSet):
    queryset = RegistroLectura.objects.all()
    serializer_class = RegistroLecturaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):        
        return self.queryset.filter(user=self.request.user)