from rest_framework.views import exception_handler
from rest_framework.response import Response
import logging

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    # Call REST framework's default exception handler first,
    # to get the standard error response.
    response = exception_handler(exc, context)

    # Log the exception
    logger.error(f"Exception in {context['view'].__class__.__name__}: {exc}", exc_info=True)

    if response is not None:
        response.data['status_code'] = response.status_code
    else:
        # Handle unexpected errors
        response = Response({
            'error': 'Internal Server Error',
            'detail': str(exc)
        }, status=500)

    return response
