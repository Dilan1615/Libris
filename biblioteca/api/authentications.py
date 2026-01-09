from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken

class CookiesJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        # Primero intenta obtener el token de las cookies
        access_token = request.COOKIES.get('access_token')
        
        # Si no está en cookies, intenta obtenerlo del header Authorization
        if not access_token:
            # Llama a la implementación padre para buscar en headers
            header_auth = super().authenticate(request)
            if header_auth:
                return header_auth
            return None
        
        try:
            validated_token = self.get_validated_token(access_token)
            user = self.get_user(validated_token)
            return (user, validated_token)
        except (AuthenticationFailed, TokenError, InvalidToken):
            # Si el token de cookies falla, intenta con headers
            try:
                return super().authenticate(request)
            except:
                raise AuthenticationFailed("Token inválido o expirado")
