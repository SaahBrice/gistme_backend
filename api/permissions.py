from rest_framework import permissions
from django.conf import settings

class HasAPIKey(permissions.BasePermission):
    """
    Allows access only if the X-API-KEY header matches the API_SECRET_CODE.
    """
    def has_permission(self, request, view):
        api_key = request.headers.get('X-API-KEY')
        return api_key == settings.API_SECRET_CODE
