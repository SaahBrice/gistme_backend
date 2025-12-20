from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ArticleViewSet, ArticleCategoryViewSet, CommentViewSet, SubscribeView, FileUploadView, 
    FCMSubscribeView, CategoryPreferencesView, OnboardingView,
    MentorCategoriesView, MentorsView, MentorRequestView, AssistanceRequestView, ChatView,
    DailyQuoteViewSet, UserNotificationViewSet
)

router = DefaultRouter()
router.register(r'articles', ArticleViewSet)
router.register(r'categories', ArticleCategoryViewSet)
router.register(r'comments', CommentViewSet)
router.register(r'quotes', DailyQuoteViewSet)
router.register(r'notifications', UserNotificationViewSet, basename='notification')

from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

urlpatterns = [
    path('', include(router.urls)),
    path('subscribe/', SubscribeView.as_view(), name='subscribe'),
    path('fcm/subscribe/', FCMSubscribeView.as_view(), name='fcm_subscribe'),
    path('fcm/preferences/', CategoryPreferencesView.as_view(), name='fcm_preferences'),
    path('onboarding/', OnboardingView.as_view(), name='onboarding_api'),
    path('upload/', FileUploadView.as_view(), name='upload'),
    # Mentor endpoints
    path('mentors/categories/', MentorCategoriesView.as_view(), name='mentor_categories'),
    path('mentors/', MentorsView.as_view(), name='mentors_list'),
    path('mentors/request/', MentorRequestView.as_view(), name='mentor_request'),
    # Assistance requests
    path('assistance-requests/', AssistanceRequestView.as_view(), name='assistance_requests'),
    # AI Chat
    path('chat/', ChatView.as_view(), name='ai_chat'),
    # Schema
    path('schema/', SpectacularAPIView.as_view(), name='schema'),
    path('schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]
