from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

def custom_exception_handler(exc, context):
    """
    Handler uniforme para errores: Devuelve JSON con 'status', 'message' y 'errors'.
    """
    response = exception_handler(exc, context)
    
    if response is not None:
        # Personaliza la respuesta
        custom_data = {
            'status': False,
            'message': response.data.get('detail', 'Error desconocido'),
            'errors': response.data if 'detail' not in response.data else None
        }
        return Response(custom_data, status=response.status_code)
    
    # Para errores no manejados por DRF
    return Response({
        'status': False,
        'message': 'Error interno del servidor',
        'errors': str(exc)
    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)