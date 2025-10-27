
from rest_framework import status,viewsets,permissions  # Códigos de estado HTTP
from rest_framework.views import APIView  # Base para crear vistas de DRF tipo clase
from rest_framework.response import Response  # Para devolver respuestas JSON
from rest_framework.permissions import IsAuthenticated, AllowAny  # Permiso para rutas protegidas
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView    
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken  # Para generar JWT (access y refresh)
from rest_framework.permissions import AllowAny
from .authentications import CookiesJWTAuthentication
from .models import CustomUser

from .serializers import RegisterSerializer, UserProfileSerializer

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

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Añadir el rol del usuario al payload del token
        token['rol'] = user.rol 
        # También puedes añadir el ID aquí (aunque simplejwt ya lo hace)
        # token['user_id'] = user.pk 
        return token


class CustomLoginTokenView(TokenObtainPairView):
    # Esto le dice a simplejwt que use el serializador que inyecta el rol
    serializer_class = CustomTokenObtainPairSerializer


# -----------------------------
# Login de usuario
# -----------------------------
class LoginView(APIView):
    def post(self, request):
        # En lugar de reimplementar la lógica de autenticación y token
        # manualmente, usa el serializador de simplejwt que ya maneja errores y tokens.
        
        # 1. Utiliza el serializador para validar credenciales y generar tokens
        serializer = CustomTokenObtainPairSerializer(data=request.data)
        
        try:
            serializer.is_valid(raise_exception=True)
        except Exception:
            return Response({"detail": "Credenciales inválidas"}, status=status.HTTP_401_UNAUTHORIZED)
        
        # 2. Si es válido, obtén los tokens generados por el serializador (con el rol incluido)
        return Response({
            "access_token": serializer.validated_data.get('access'),
            "refresh_token": serializer.validated_data.get('refresh')
        })
    
#-----------------------------
# Cookies de autenticación (CORREGIDO)
#-----------------------------
class CustomAuthTokenView(TokenObtainPairView):
    # 1. Assign the custom serializer that injects the 'rol'
    serializer_class = CustomTokenObtainPairSerializer 

    def post(self, request):
        # 2. Use the serializer logic for validation and token generation
        serializer = self.get_serializer(data=request.data)
        
        try:
            # is_valid() calls the custom serializer's get_token() method, 
            # ensuring the 'rol' is in the payload.
            serializer.is_valid(raise_exception=True)
        except Exception:
            return Response({"detail": "Credenciales inválidas"}, status=status.HTTP_401_UNAUTHORIZED)
        
        tokens = serializer.validated_data # Contains 'access' and 'refresh' (with the 'rol' claim)
        
        # 3. Use the generated tokens for the response and cookies
        response = Response({
            "access_token": tokens.get('access'),
            "refresh_token": tokens.get('refresh')
        })
        
        # Set cookies using the tokens from the serializer
        response.set_cookie(
            key='access_token',
            value=tokens.get('access'), # Token with 'rol'
            httponly=True,
            secure=False,
            samesite='None',
            path='/'
        )

        response.set_cookie(
            key='refresh_token',
            value=tokens.get('refresh'), # Token with 'rol'
            httponly=True,
            secure=False,
            samesite='None',
            path='/'
        )
        return response


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
    authentication_classes = [CookiesJWTAuthentication]
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

