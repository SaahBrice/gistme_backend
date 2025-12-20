from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.conf import settings
from django_filters.rest_framework import DjangoFilterBackend
from .models import Article, Comment
from .serializers import ArticleSerializer, CommentSerializer
from rest_framework.pagination import PageNumberPagination

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.all()  # Required for router
    serializer_class = ArticleSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['mood', 'category']
    search_fields = ['headline', 'headline_en', 'headline_fr', 'french_summary', 'english_summary']
    ordering_fields = ['created_at', 'view_count', 'reaction_count', 'comment_count']

    def get_queryset(self):
        """
        Exclude pro-* categories from the public feed.
        Pro content is delivered via email only.
        """
        return Article.objects.exclude(
            category__istartswith='pro-'
        ).order_by('-created_at')

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [HasAPIKey]
        else:
            permission_classes = []
        return [permission() for permission in permission_classes]

    def create(self, request, *args, **kwargs):
        # source_code check is replaced by HasAPIKey permission
        return super().create(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def comment(self, request, pk=None):
        article = self.get_object()
        data = request.data.copy()
        data['article'] = article.id
        serializer = CommentSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all().order_by('-timestamp')
    serializer_class = CommentSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['article']
    ordering_fields = ['timestamp']

from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django.core.files.storage import default_storage
from .serializers import VisitorSubscriptionSerializer
from .tasks import process_uploaded_media
from .permissions import HasAPIKey
import logging

logger = logging.getLogger(__name__)

class SubscribeView(APIView):
    def post(self, request):
        try:
            # Ensure session exists
            if not request.session.session_key:
                request.session.create()
            
            serializer = VisitorSubscriptionSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(session_key=request.session.session_key)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Subscription failed: {e}", exc_info=True)
            return Response({"error": "Subscription failed"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class FileUploadView(APIView):
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [HasAPIKey]

    def post(self, request, *args, **kwargs):
        try:
            file_obj = request.data.get('file')
            if not file_obj:
                 return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)

            file_name = default_storage.save(file_obj.name, file_obj)
            file_url = default_storage.url(file_name)
            
            # Trigger async task
            from django_q.tasks import async_task
            async_task(process_uploaded_media, file_url)

            logger.info(f"File uploaded successfully: {file_name}")
            return Response({'file_url': file_url}, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"File upload failed: {e}", exc_info=True)
            return Response({"error": "Upload failed"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class FCMSubscribeView(APIView):
    def post(self, request):
        try:
            from .models import FCMSubscription
            
            token = request.data.get('token')
            preferred_language = request.data.get('preferred_language', 'fr')
            
            if not token:
                return Response({"error": "Token is required"}, status=status.HTTP_400_BAD_REQUEST)
            
            # Update or create - this will update the language if token exists
            subscription, created = FCMSubscription.objects.update_or_create(
                token=token,
                defaults={'preferred_language': preferred_language}
            )
            
            if created:
                logger.info(f"New FCM subscription created: {token[:20]}... (lang: {preferred_language})")
                return Response({
                    "status": "subscribed",
                    "token": token,
                    "preferred_language": preferred_language
                }, status=status.HTTP_201_CREATED)
            else:
                logger.info(f"FCM subscription updated: {token[:20]}... (lang: {preferred_language})")
                return Response({
                    "status": "updated",
                    "token": token,
                    "preferred_language": preferred_language
                }, status=status.HTTP_200_OK)
                
        except Exception as e:
            logger.error(f"FCM Subscription failed: {e}", exc_info=True)
            return Response({"error": "Subscription failed"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CategoryPreferencesView(APIView):
    """API for managing category preferences for FCM subscribers."""
    
    def get(self, request):
        """Get category preferences for a given FCM token."""
        try:
            from .models import FCMSubscription
            
            token = request.query_params.get('token')
            if not token:
                return Response({"error": "Token is required"}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                subscription = FCMSubscription.objects.get(token=token)
                return Response({
                    "preferences": subscription.category_preferences or []
                }, status=status.HTTP_200_OK)
            except FCMSubscription.DoesNotExist:
                return Response({"preferences": []}, status=status.HTTP_200_OK)
                
        except Exception as e:
            logger.error(f"Get preferences failed: {e}", exc_info=True)
            return Response({"error": "Failed to get preferences"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request):
        """Toggle a category preference (add if not present, remove if present)."""
        try:
            from .models import FCMSubscription
            
            token = request.data.get('token')
            category_id = request.data.get('category_id')
            
            if not token:
                return Response({"error": "Token is required"}, status=status.HTTP_400_BAD_REQUEST)
            if not category_id:
                return Response({"error": "category_id is required"}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                subscription = FCMSubscription.objects.get(token=token)
            except FCMSubscription.DoesNotExist:
                return Response({"error": "Subscription not found"}, status=status.HTTP_404_NOT_FOUND)
            
            # Ensure category_preferences is a list
            preferences = subscription.category_preferences or []
            if not isinstance(preferences, list):
                preferences = []
            
            # Toggle: add if not present, remove if present
            if category_id in preferences:
                preferences.remove(category_id)
                action = "removed"
            else:
                preferences.append(category_id)
                action = "added"
            
            subscription.category_preferences = preferences
            subscription.save(update_fields=['category_preferences'])
            
            logger.info(f"Category preference {action}: {category_id} for token {token[:20]}...")
            
            return Response({
                "status": action,
                "category_id": category_id,
                "preferences": preferences
            }, status=status.HTTP_200_OK)
                
        except Exception as e:
            logger.error(f"Toggle preference failed: {e}", exc_info=True)
            return Response({"error": "Failed to update preference"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class OnboardingView(APIView):
    """API endpoint for saving onboarding preferences."""
    
    def post(self, request):
        try:
            from web.models import UserProfile
            
            if not request.user.is_authenticated:
                return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
            
            # Get or create profile
            profile, created = UserProfile.objects.get_or_create(user=request.user)
            
            # Update fields
            profile.phone = request.data.get('phone', '')
            profile.region = request.data.get('region', 'RAS')
            profile.interests = request.data.get('interests', [])
            profile.education_level = request.data.get('education_level', 'RAS')
            profile.background = request.data.get('background', 'RAS')
            
            # Parse time
            notification_time = request.data.get('notification_time', '08:00')
            profile.notification_time = notification_time
            
            profile.custom_desires = request.data.get('custom_desires', '')
            profile.onboarding_completed = True
            profile.save()
            
            logger.info(f"Onboarding completed for user {request.user.email}")
            
            return Response({
                "status": "success",
                "message": "Preferences saved successfully"
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Onboarding failed: {e}", exc_info=True)
            return Response({"error": "Failed to save preferences"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MentorCategoriesView(APIView):
    """API endpoint for fetching mentor categories."""
    
    def get(self, request):
        try:
            from web.models import MentorCategory
            
            categories = MentorCategory.objects.filter(is_active=True).order_by('order')
            
            data = [{
                'id': cat.id,
                'name': cat.name,
                'label': cat.label,
                'icon': cat.icon,
            } for cat in categories]
            
            return Response(data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Failed to fetch categories: {e}", exc_info=True)
            return Response({"error": "Failed to fetch categories"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MentorsView(APIView):
    """API endpoint for fetching mentors with optional category filter."""
    
    def get(self, request):
        try:
            from web.models import Mentor, MentorRequest
            
            mentors = Mentor.objects.filter(is_active=True).select_related('category')
            
            # Optional category filter
            category_id = request.query_params.get('category')
            if category_id and category_id != 'all':
                mentors = mentors.filter(category_id=category_id)
            
            # Get user's active requests if authenticated
            user_requests = {}
            if request.user.is_authenticated:
                active_requests = MentorRequest.objects.filter(
                    user=request.user,
                    status__in=['PENDING', 'CONTACTED', 'MATCHED']
                ).select_related('mentor')
                for req in active_requests:
                    if req.is_active_connection:
                        user_requests[req.mentor_id] = {
                            'status': req.status,
                            'status_display': req.get_status_display(),
                            'days_remaining': req.days_remaining,
                            'request_id': req.id
                        }
            
            data = []
            for m in mentors:
                mentor_data = {
                    'id': m.id,
                    'name': m.name,
                    'profession': m.profession,
                    'location': m.location,
                    'bio': m.bio,
                    'picture': m.get_picture_url,
                    'language': m.language,
                    'language_display': m.get_language_display(),
                    'category_id': m.category_id,
                    'category_name': m.category.name if m.category else None,
                    'user_request': user_requests.get(m.id, None)
                }
                data.append(mentor_data)
            
            return Response(data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Failed to fetch mentors: {e}", exc_info=True)
            return Response({"error": "Failed to fetch mentors"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class MentorRequestView(APIView):
    """API endpoint for creating mentor requests."""
    
    def post(self, request):
        try:
            from web.models import Mentor, MentorRequest
            
            if not request.user.is_authenticated:
                return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
            
            mentor_id = request.data.get('mentor_id')
            message = request.data.get('message', '')
            
            if not mentor_id:
                return Response({"error": "Mentor ID is required"}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                mentor = Mentor.objects.get(id=mentor_id, is_active=True)
            except Mentor.DoesNotExist:
                return Response({"error": "Mentor not found"}, status=status.HTTP_404_NOT_FOUND)
            
            # Check if user already has a pending request for this mentor
            existing = MentorRequest.objects.filter(
                user=request.user, 
                mentor=mentor, 
                status__in=['PENDING', 'CONTACTED']
            ).exists()
            
            if existing:
                return Response({"error": "You already have an active request with this mentor"}, status=status.HTTP_400_BAD_REQUEST)
            
            # Create the request
            mentor_request = MentorRequest.objects.create(
                user=request.user,
                mentor=mentor,
                message=message
            )
            
            logger.info(f"Mentor request created: {request.user.email} -> {mentor.name}")
            
            return Response({
                "status": "success",
                "message": f"Request sent to {mentor.name}! We'll connect you soon.",
                "request_id": mentor_request.id
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Mentor request failed: {e}", exc_info=True)
            return Response({"error": "Failed to send request"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
