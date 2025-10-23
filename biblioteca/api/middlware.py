from django.utils.deprecation import MiddlewareMixin
from rest_framework.response import Response
from rest_framework import status
import json

class GlobalExceptionMiddleware(MiddlewareMixin):
    def process_exception(self, request, exception):
        """Captura cualquier excepción no manejada y responde con formato JSON uniforme."""
        return Response({
            "success": False,
            "error": {
                "message": str(exception),
                "type": exception.__class__.__name__,
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
