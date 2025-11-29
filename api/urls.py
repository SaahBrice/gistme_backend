from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ArticleViewSet, CommentViewSet, SubscribeView, FileUploadView, FCMSubscribeView

router = DefaultRouter()
router.register(r'articles', ArticleViewSet)
router.register(r'comments', CommentViewSet)

from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

urlpatterns = [
    path('', include(router.urls)),
    path('subscribe/', SubscribeView.as_view(), name='subscribe'),
    path('fcm/subscribe/', FCMSubscribeView.as_view(), name='fcm_subscribe'),
    path('upload/', FileUploadView.as_view(), name='upload'),
    path('schema/', SpectacularAPIView.as_view(), name='schema'),
    path('schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

