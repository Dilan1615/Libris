
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from django.conf import settings # Importar settings para acceder a la configuración de cookies

# Simulación de un objeto de usuario en el Microservicio de Lectura.
# Este usuario solo existe en memoria y se crea a partir de los datos del token JWT.
class MockUser:
    is_authenticated = True
    
    def __init__(self, id, rol):
        self.id = id
        self.pk = id   # ← ESTA LINEA FALTABA
        self.rol = rol

    def __str__(self):
        return f"MockUser-{self.id}"



class MicroserviceJWTAuthentication(JWTAuthentication):

    def authenticate(self, request):
        # Intentar obtener el token de la cookie
        access_token = request.COOKIES.get(settings.SIMPLE_JWT.get('AUTH_COOKIE'))

        # Si no hay token en la cookie, intentar del header (Bearer)
        if not access_token:
            header = self.get_header(request)
            if header is None:
                # ← No hay token ni en cookie ni en header → no autenticar, dejar acceso libre
                return None
            raw_token = self.get_raw_token(header)
            if raw_token is None:
                return None
            access_token = raw_token

        try:
            # Validar token
            validated_token = self.get_validated_token(access_token)
            # Crear usuario simulado
            user = self.get_user(validated_token)
        except (AuthenticationFailed, TokenError, InvalidToken):
            # Token inválido → tratar como no autenticado, no lanzar error
            return None

        return (user, validated_token)

    """
    Clase de autenticación para microservicios.
    
    1. Lee el token del campo 'access_token' de las cookies.
    2. Sobrescribe 'get_user' para no buscar en la DB local, sino crear un MockUser
       a partir del payload del token (ID de usuario y rol).
    """
    
    def authenticate(self, request):
        # Intentar obtener el token de la cookie
        access_token = request.COOKIES.get(settings.SIMPLE_JWT.get('AUTH_COOKIE'))
        
        # Si no hay token en la cookie, intentar del header (Bearer) como fallback
        if not access_token:
            return super().authenticate(request)
        
        try:
            # Valida el token usando la lógica de simplejwt
            validated_token = self.get_validated_token(access_token)
            
            #Obtener el usuario simulado (MockUser)
            user = self.get_user(validated_token)
            
        except (AuthenticationFailed, TokenError, InvalidToken):
            # Si el token no es válido o está expirado
            raise AuthenticationFailed("Token de cookie inválido o expirado")
        
        return (user, validated_token)

    def get_user(self, validated_token):
        """
        Sobrescribe el método base para evitar la consulta a la base de datos (DB).
        En su lugar, crea un MockUser con los datos del payload.
        """
        try:
            user_id = validated_token[settings.SIMPLE_JWT['USER_ID_FIELD']]
            # Asume que el Microservicio de Login incluyó el 'rol' en el payload.
            rol = validated_token.get('rol', 'cliente') 
            
            # ¡Retorna el usuario simulado en lugar de buscarlo en la DB!
            return MockUser(id=user_id, rol=rol)
            
        except KeyError:
            # Si el token no tiene el campo ID o Rol necesario
            raise InvalidToken("Token payload incompleto o mal formado.")