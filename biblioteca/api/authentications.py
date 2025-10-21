from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken

class CookiesJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        access_token = request.COOKIES.get('access_token')
        if not access_token:
            return None  # o raise AuthenticationFailed("No se encontró access token")
        
        try:
            validated_token = self.get_validated_token(access_token)
            user = self.get_user(validated_token)
        except (AuthenticationFailed, TokenError, InvalidToken):
            raise AuthenticationFailed("Token inválido o expirado")

        return (user, validated_token)
