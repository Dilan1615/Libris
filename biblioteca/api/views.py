from rest_framework.parsers import JSONParser, FormParser, MultiPartParser
from django.http import JsonResponse, HttpResponse, HttpResponseRedirect
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.conf import settings
from django.db import IntegrityError
import requests
from threading import Thread
from rest_framework import status,viewsets,permissions  # Códigos de estado HTTP
from rest_framework.views import APIView  # Base para crear vistas de DRF tipo clase
from rest_framework.response import Response  # Para devolver respuestas JSON
from rest_framework.permissions import IsAuthenticated, AllowAny, BasePermission  # Permiso para rutas protegidas
from rest_framework.decorators import action  # Para crear acciones custom en ViewSet
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView    
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from rest_framework_simplejwt.tokens import RefreshToken  # Para generar JWT (access y refresh)
from rest_framework.permissions import AllowAny
from .authentications import CookiesJWTAuthentication
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from django.db.models import Avg, Count

from .models import CustomUser,Libro,Manga,Novela, RegistroLectura,MaterialGeneral, Comentarios, GeneroTag, Calificacion, Favorito   
from .serializers import RegisterSerializer, UserProfileSerializer, UserUpdateSerializer, LibroSerializer,NovelaSerializer,MangaSerializer,RegistroLecturaSerializer, MaterialGeneralSerializer, ComentariosSerializer, GeneroTagSerializer, CalificacionSerializer, FavoritoSerializer, EstadisticasUsuarioSerializer 
# -----------------------------
# Raíz: mensaje/redirect
# -----------------------------
def root(request):
    # Muestra un mensaje simple para la raíz del backend
    return HttpResponse("Libris backend en ejecución. Usa /api/ o el frontend.")


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
# Login de usuario con Cookies JWT
# -----------------------------
class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]  # Permitir acceso sin autenticación
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = CustomUser.objects.filter(username=username).first()
        if user and user.check_password(password):
            refresh = RefreshToken.for_user(user)
            response = Response({
                "success": True,
                "access_token": str(refresh.access_token),
                "refresh_token": str(refresh),
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "rol": user.rol
                }
            })
            # Establece las cookies en la respuesta
            response.set_cookie(
                key='access_token',
                value=str(refresh.access_token),
                httponly=True,
                secure=False,
                samesite='Lax',
                path='/'
            )

            response.set_cookie(
                key='refresh_token',
                value=str(refresh),
                httponly=True,
                secure=False,
                samesite='Lax',
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

# ----------------------s-------
# Ver perfil del usuario
# -----------------------------
class ProfileView(APIView):
    permission_classes = [IsAuthenticated]  # Solo usuarios autenticados pueden acceder
    authentication_classes = [CookiesJWTAuthentication]  # Usar autenticación por cookies
    def get(self, request):
        user = request.user  # Obtiene el usuario a partir del token enviado en los headers
        serializer = UserProfileSerializer(user, context={'request': request})  # Serializa con request para URLs absolutas
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
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]

    # Campos por los que se puede filtrar
    filterset_fields = ['generos__nombre', 'anio_publicacion', 'editorial']

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
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['generos__nombre', 'anio_publicacion', 'editorial']
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
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['generos__nombre', 'anio_publicacion', 'editorial']
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
        queryset = RegistroLectura.objects.filter(user=self.request.user).select_related(
            'material', 
            'material__libro', 
            'material__manga', 
            'material__novela'
        )
        print(f"📚 Registros para usuario {self.request.user.username}: {queryset.count()}")
        return queryset

    # Al crear un registro, asigna automáticamente el usuario actual
    def perform_create(self, serializer):
        # El serializer ya toma el usuario desde request.context
        registro = serializer.save()
        print(f"✅ Registro creado: ID={registro.id}, Usuario={registro.user.username}, Material={registro.material}")
        return registro

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


# Permiso personalizado: Solo el propietario puede modificar/eliminar
class IsCommentOwner(BasePermission):
    """
    Permite que solo el propietario del comentario pueda modificarlo o eliminarlo.
    Cualquiera puede leer los comentarios.
    """
    def has_object_permission(self, request, view, obj):
        # Lectura permitida para todos
        if request.method in permissions.SAFE_METHODS:
            return True
        # Solo el propietario puede modificar o eliminar
        return obj.user == request.user


class ComentarioViewSet(viewsets.ModelViewSet):
    queryset = Comentarios.objects.all()
    serializer_class = ComentariosSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsCommentOwner]
    authentication_classes = [CookiesJWTAuthentication]

    def get_queryset(self):
        # Optimización: usar select_related para evitar N+1 queries
        qs = Comentarios.objects.select_related('user', 'libro', 'manga', 'novela').order_by('-fecha')
        libro_id = self.request.query_params.get('libro')
        manga_id = self.request.query_params.get('manga')
        novela_id = self.request.query_params.get('novela')

        if libro_id:
            qs = qs.filter(libro_id=libro_id)
        if manga_id:
            qs = qs.filter(manga_id=manga_id)
        if novela_id:
            qs = qs.filter(novela_id=novela_id)

        return qs

    def perform_create(self, serializer):
        # Validar que SOLO un material sea enviado
        libro = serializer.validated_data.get('libro')
        manga = serializer.validated_data.get('manga')
        novela = serializer.validated_data.get('novela')

        materiales = [libro, manga, novela]
        materiales_elegidos = [m for m in materiales if m is not None]

        if len(materiales_elegidos) == 0:
            raise ValidationError("Debes seleccionar libro, manga o novela.")
        if len(materiales_elegidos) > 1:
            raise ValidationError("Solo puedes comentar un tipo de material a la vez.")
        # Asigna automaticamente el usuario actual
        serializer.save(user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        # Obtener comentario antes de eliminarlo
        comentario = self.get_object()
        
        # Verificar que el usuario sea el propietario o un admin
        if comentario.user != request.user and not request.user.is_staff:
            return Response(
                {"detail": "No tienes permiso para eliminar este comentario. Solo el propietario puede hacerlo."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        user_email = comentario.user.email
        user_username = comentario.user.username
        comentario_texto = comentario.descripcion[:100] + "..." if len(comentario.descripcion) > 100 else comentario.descripcion
        
        # Obtener nombre del material
        material_titulo = comentario.get_titulo_material() if hasattr(comentario, 'get_titulo_material') else "un material"
        
        # Determinar si lo elimina el propietario o un admin
        es_propietario = comentario.user == request.user
        
        # Enviar email notificando eliminación del comentario
        try:
            if es_propietario:
                subject = "✅ Tu comentario ha sido eliminado en Libris"
                message = f"""Hola {user_username},

Tu comentario en "{material_titulo}" ha sido eliminado correctamente.

Comentario eliminado: "{comentario_texto}"

¡Gracias por usar Libris!
"""
            else:
                subject = "⚠️ Tu comentario ha sido eliminado en Libris"
                message = f"""Hola {user_username},

Tu comentario en "{material_titulo}" ha sido eliminado por un administrador.

Comentario eliminado: "{comentario_texto}"

Razón: Tu comentario no cumple con nuestros términos de servicio. Si continúas publicando contenido inapropiado, tu cuenta podría ser suspendida.

¡Gracias por entender!
"""
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user_email],
                fail_silently=True,
            )
        except Exception as e:
            print(f"⚠️ Error al enviar correo de eliminación de comentario: {e}")
        
        return super().destroy(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        """Permitir que solo el propietario actualice el comentario"""
        comentario = self.get_object()
        
        # Verificar que el usuario sea el propietario
        if comentario.user != request.user:
            return Response(
                {"detail": "No tienes permiso para editar este comentario. Solo el propietario puede hacerlo."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().update(request, *args, **kwargs)


# -----------------------------
# Generos disponibles por tipo
# -----------------------------
class GeneroTagViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = GeneroTag.objects.all()
    authentication_classes = [CookiesJWTAuthentication]
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['tipo']

    def list(self, request, *args, **kwargs):
        tipo = request.query_params.get('tipo')
        qs = self.get_queryset()
        if tipo:
            qs = qs.filter(tipo=tipo)
        data = [{'id': g.id, 'nombre': g.nombre, 'tipo': g.tipo} for g in qs.order_by('nombre')]
        return Response(data)


def obtener_libros(request):
    try:
        # URL de la API externa
        url = "https://www.googleapis.com/books/v1/volumes?q=python&maxResults=10"

        # Realizar la petición
        respuesta = requests.get(url)
        datos = respuesta.json()

        # Extraer información relevante
        libros = []
        for item in datos.get("items", []):
            info = item["volumeInfo"]
            
            # Crear un ID único basado en Google ID + prefijo
            google_id = item.get("id", "")
            
            libros.append({
                "id": f"google_{google_id}",  # ID único para identificar como externo
                "titulo": info.get("title", "Sin título"),
                "autor": ", ".join(info.get("authors", ["Autor desconocido"])),
                "anio_publicacion": int(info.get("publishedDate", "0000")[:4]) or 0,
                "genero": "Programación",  # Búsqueda fija por python
                "editorial": info.get("publisher", "Editorial desconocida"),
                "isbn": info.get("industryIdentifiers", [{}])[0].get("identifier", ""),
                "descripcion": info.get("description", ""),
                "imagen": info.get("imageLinks", {}).get("thumbnail", ""),
                "es_externo": True,  # Marcar como externo
                "tipo": "libro"
            })

        # Devolver los datos en formato JSON con estructura similar a DRF
        return JsonResponse({"results": libros, "count": len(libros)}, status=200)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

# ============================================
# ViewSet para Usuarios (Admin)
# ============================================
class UsuariosViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    permission_classes = [IsAuthenticated]
    authentication_classes = [CookiesJWTAuthentication]
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    serializer_class = UserProfileSerializer

    def get_permissions(self):
        # Permitir que cualquier usuario autenticado acceda a sus propios datos en `me` y `estadisticas`
        if self.action in ['me', 'estadisticas']:
            return [IsAuthenticated()]
        # Para el resto de acciones del ViewSet, requerir admin
        return [IsAdminCustom()]
    
    def destroy(self, request, *args, **kwargs):
        # No permitir auto-eliminarse (seguridad)
        user = self.get_object()
        if user.id == request.user.id:
            return Response({"error": "No puedes eliminarte a ti mismo"}, status=status.HTTP_403_FORBIDDEN)
        
        # Guardar datos antes de eliminar para enviar email (asincrónico)
        user_email = user.email
        user_username = user.username
        
        # Enviar email de forma asincrónica (no bloquea la respuesta)
        def send_deletion_email():
            try:
                subject = "⚠️ Tu cuenta en Libris ha sido eliminada"
                message = f"""Hola {user_username},

Tu cuenta en Libris ha sido eliminada por un administrador.

Si crees que esto es un error, contacta con soporte.

¡Te echaremos de menos!
"""
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user_email],
                    fail_silently=True,
                )
            except Exception as e:
                print(f"⚠️ Error al enviar correo de eliminación: {e}")
        
        # Ejecutar envío de email en segundo plano
        thread = Thread(target=send_deletion_email)
        thread.daemon = True
        thread.start()
        
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=False, methods=['get', 'put', 'patch'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """
        Obtener y actualizar el perfil del usuario autenticado
        GET /api/usuarios/me/
        PUT /api/usuarios/me/
        PATCH /api/usuarios/me/
        """
        user = request.user
        
        if request.method == 'GET':
            serializer = self.get_serializer(user)
            return Response(serializer.data)
        
        elif request.method in ['PUT', 'PATCH']:
            # Importar el serializer correcto
            from .serializers import UserSelfUpdateSerializer
            serializer = UserSelfUpdateSerializer(user, data=request.data, partial=request.method == 'PATCH')
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def estadisticas(self, request, pk=None):
        """
        Obtener estadísticas personalizadas del usuario
        GET /api/usuarios/{id}/estadisticas/
        """
        usuario = self.get_object()
        
        # Solo mostrar estadísticas del propio usuario o si es admin
        if usuario != request.user and not request.user.is_staff:
            return Response(
                {"error": "No puedes ver las estadísticas de otro usuario"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Calcular estadísticas
        total_libros_leidos = RegistroLectura.objects.filter(user=usuario).count()
        total_comentarios = Comentarios.objects.filter(user=usuario).count()
        
        # Géneros favoritos (de los materiales en favoritos)
        favoritos = Favorito.objects.filter(user=usuario)
        generos_set = set()
        for fav in favoritos:
            if fav.libro:
                generos_set.update(fav.libro.generos.values_list('nombre', flat=True))
            elif fav.manga:
                generos_set.update(fav.manga.generos.values_list('nombre', flat=True))
            elif fav.novela:
                generos_set.update(fav.novela.generos.values_list('nombre', flat=True))
        generos_favoritos = list(generos_set)
        
        # Calificación promedio dada por el usuario
        avg_rating = Calificacion.objects.filter(user=usuario).aggregate(Avg('rating'))['rating__avg']
        calificacion_promedio_dada = round(avg_rating, 2) if avg_rating else 0.0
        
        total_favoritos = favoritos.count()
        
        # Crear diccionario con las estadísticas
        data = {
            'total_libros_leidos': total_libros_leidos,
            'total_comentarios': total_comentarios,
            'generos_favoritos': generos_favoritos,
            'calificacion_promedio_dada': calificacion_promedio_dada,
            'total_favoritos': total_favoritos,
        }
        
        return Response(data)


# ============================================
# ViewSet para Calificaciones (Ratings)
# ============================================
class CalificacionViewSet(viewsets.ModelViewSet):
    serializer_class = CalificacionSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [CookiesJWTAuthentication]
    
    def get_queryset(self):
        # Cada usuario solo ve sus propias calificaciones
        return Calificacion.objects.filter(user=self.request.user).select_related('user')
    
    def perform_create(self, serializer):
        # Asignar automáticamente el usuario actual
        serializer.save(user=self.request.user)
    
    def destroy(self, request, *args, **kwargs):
        # Permitir que un usuario solo elimine sus propias calificaciones
        calificacion = self.get_object()
        if calificacion.user != request.user:
            return Response(
                {"error": "No puedes eliminar la calificación de otro usuario"},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)


# ============================================
# ViewSet para Favoritos
# ============================================
class FavoritoViewSet(viewsets.ModelViewSet):
    serializer_class = FavoritoSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [CookiesJWTAuthentication]
    
    def get_queryset(self):
        # Cada usuario solo ve sus propios favoritos
        return Favorito.objects.filter(user=self.request.user).select_related('user', 'libro', 'manga', 'novela')
    
    def perform_create(self, serializer):
        # Validar que SOLO un material sea enviado
        libro = serializer.validated_data.get('libro')
        manga = serializer.validated_data.get('manga')
        novela = serializer.validated_data.get('novela')

        materiales = [libro, manga, novela]
        materiales_elegidos = [m for m in materiales if m is not None]

        if len(materiales_elegidos) == 0:
            raise ValidationError("Debes seleccionar un libro, manga o novela.")
        if len(materiales_elegidos) > 1:
            raise ValidationError("Solo puedes agregar un tipo de material a favoritos a la vez.")
        
        # Intentar guardar y capturar error de duplicado
        try:
            serializer.save(user=self.request.user)
        except IntegrityError:
            # El material ya está en favoritos (violación de unique_together)
            material = libro or manga or novela
            material_name = material.titulo if material else "este material"
            from rest_framework.exceptions import ValidationError as DRFValidationError
            raise DRFValidationError({"detail": f"Ya tienes '{material_name}' en tus favoritos."})
    
    def destroy(self, request, *args, **kwargs):
        # Permitir que un usuario solo elimine sus propios favoritos
        favorito = self.get_object()
        if favorito.user != request.user:
            return Response(
                {"error": "No puedes eliminar el favorito de otro usuario"},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)

