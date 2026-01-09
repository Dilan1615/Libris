from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
import json

class GlobalExceptionMiddleware(MiddlewareMixin):
    def process_exception(self, request, exception):
        """Captura cualquier excepción no manejada y responde con formato JSON uniforme."""
        # Solo captura excepciones que no sean de DRF
        # DRF maneja sus propias excepciones correctamente
        return JsonResponse({
            "success": False,
            "error": {
                "message": str(exception),
                "type": exception.__class__.__name__,
            }
        }, status=500)
