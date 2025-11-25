from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ArticleViewSet, CommentViewSet, SubscribeView, FileUploadView

router = DefaultRouter()
router.register(r'articles', ArticleViewSet)
router.register(r'comments', CommentViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('subscribe/', SubscribeView.as_view(), name='subscribe'),
    path('upload/', FileUploadView.as_view(), name='upload'),
]

