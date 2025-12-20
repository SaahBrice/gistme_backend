from rest_framework import viewsets, filters, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from django.conf import settings
from django_filters.rest_framework import DjangoFilterBackend
from .models import Article, Comment, ArticleCategory
from .serializers import ArticleSerializer, CommentSerializer, ArticleCategorySerializer
from rest_framework.pagination import PageNumberPagination

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

class ArticleCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for fetching article categories.
    GET /api/categories/ - List all active categories
    GET /api/categories/?main_category=ACTUALITY - Filter by main category
    """
    queryset = ArticleCategory.objects.filter(is_active=True)
    serializer_class = ArticleCategorySerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['main_category']
    ordering_fields = ['order', 'name_en']
    pagination_class = None  # Return all categories without pagination


class ArticleViewSet(viewsets.ModelViewSet):
    """
    API endpoint for articles with filtering by category and main_category.
    GET /api/articles/ - List all articles
    GET /api/articles/?main_category=ACTUALITY - Filter by main category
    GET /api/articles/?category__slug=politics - Filter by category slug
    GET /api/articles/?search=keyword - Full-text search
    """
    queryset = Article.objects.all()  # Required for router
    serializer_class = ArticleSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = {
        'mood': ['exact'],
        'category': ['exact'],
        'category__slug': ['exact'],
        'category__main_category': ['exact'],
    }
    search_fields = ['headline', 'headline_en', 'headline_fr', 'french_summary', 'english_summary']
    ordering_fields = ['created_at', 'view_count', 'reaction_count', 'comment_count']

    def get_queryset(self):
        """
        Get articles, optionally filtered by main_category query param.
        Excludes articles without a category.
        """
        queryset = Article.objects.filter(
            category__isnull=False,
            category__is_active=True
        ).select_related('category').order_by('-created_at')
        
        # Shorthand: ?main_category=ACTUALITY
        main_category = self.request.query_params.get('main_category')
        if main_category:
            queryset = queryset.filter(category__main_category=main_category)
        
        return queryset

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
            
            # Send onboarding complete notification
            try:
                from notifications.service import notify
                
                user_lang = getattr(request, 'LANGUAGE_CODE', 'en')[:2]
                user_name = request.user.get_full_name() or request.user.email.split('@')[0]
                
                notify(
                    'onboarding_complete',
                    recipient_email=request.user.email,
                    recipient_user=request.user,
                    context={'user_name': user_name},
                    language=user_lang,
                    channels=['email']
                )
            except Exception as e:
                logger.warning(f"Failed to send onboarding notification: {e}")
            
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
            
            # Send notifications
            try:
                from notifications.service import notify
                
                # Determine user's language preference
                user_lang = getattr(request, 'LANGUAGE_CODE', 'en')[:2]
                
                # Notification to mentee (the user who requested)
                mentee_name = request.user.get_full_name() or request.user.email.split('@')[0]
                notify(
                    'mentor_request_mentee',
                    recipient_email=request.user.email,
                    recipient_user=request.user,
                    context={
                        'mentee_name': mentee_name,
                        'mentor_name': mentor.name,
                        'mentor_profession': mentor.profession,
                    },
                    language=user_lang,
                    channels=['email']
                )
                
                # Notification to mentor (if they have an email)
                if mentor.email:
                    notify(
                        'mentor_request_mentor',
                        recipient_email=mentor.email,
                        context={
                            'mentor_name': mentor.name,
                            'mentee_name': mentee_name,
                            'mentee_email': request.user.email,
                        },
                        language=user_lang,  # Use same language as request
                        channels=['email']
                    )
            except Exception as e:
                logger.warning(f"Failed to send mentor request notifications: {e}")
            
            return Response({
                "status": "success",
                "message": f"Request sent to {mentor.name}! We'll connect you soon.",
                "request_id": mentor_request.id
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Mentor request failed: {e}", exc_info=True)
            return Response({"error": "Failed to send request"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AssistanceRequestView(APIView):
    """
    API endpoint for users to request assistance from Gist4U team.
    POST /api/assistance-requests/ - Create a new assistance request
    """
    permission_classes = [AllowAny]
    authentication_classes = []  # No auth required
    
    def post(self, request):
        from .serializers import AssistanceRequestSerializer
        from .models import AssistanceRequest
        
        serializer = AssistanceRequestSerializer(data=request.data)
        if serializer.is_valid():
            assistance_request = serializer.save()
            
            # Log the request for team notification
            logger.info(
                f"New assistance request #{assistance_request.id} for article {assistance_request.article.id}: "
                f"{assistance_request.message[:50]}..."
            )
            
            return Response({
                "status": "success",
                "message": "Your request has been sent! A Gist4U agent will contact you shortly.",
                "request_id": assistance_request.id
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChatView(APIView):
    """
    API endpoint for AI chat using Gemini.
    POST /api/chat/ - Send a message and get AI response
    """
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def post(self, request):
        from api.utils.gemini import get_ai_response
        from api.models import Article
        
        # Extract request data
        article_id = request.data.get('article_id')
        user_message = request.data.get('message', '').strip()
        chat_history = request.data.get('history', [])
        language = request.data.get('lang', 'en')
        
        # Validate
        if not user_message:
            return Response({
                'success': False,
                'response': 'Message is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not article_id:
            return Response({
                'success': False,
                'response': 'Article ID is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get article context
        try:
            article = Article.objects.get(id=article_id)
            article_context = {
                'title': article.headline_en if language == 'en' else article.headline_fr or article.headline,
                'summary': article.english_summary if language == 'en' else article.french_summary
            }
        except Article.DoesNotExist:
            article_context = {'title': 'Unknown', 'summary': 'Article not found'}
        
        # Get AI response
        result = get_ai_response(
            article_context=article_context,
            user_message=user_message,
            chat_history=chat_history,
            language=language
        )
        
        return Response(result, status=status.HTTP_200_OK)


class DailyQuoteViewSet(viewsets.ModelViewSet):
    """
    API endpoint for daily quotes with bilingual support.
    GET /api/quotes/ - List all quotes (with filtering)
    GET /api/quotes/{id}/ - Get a specific quote
    GET /api/quotes/today/ - Get today's quote for a category
    POST /api/quotes/ - Create a new quote (API key required)
    PUT/PATCH /api/quotes/{id}/ - Update a quote (API key required)
    DELETE /api/quotes/{id}/ - Delete a quote (API key required)
    
    Query params:
        - lang: 'en' or 'fr' (default: 'en') - Returns content in specified language
    """
    from .models import DailyQuote
    from .serializers import DailyQuoteSerializer
    
    queryset = DailyQuote.objects.all()
    serializer_class = DailyQuoteSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['category', 'date']
    ordering_fields = ['date', 'category', 'created_at']
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [HasAPIKey]
        else:
            permission_classes = [AllowAny]
        return [permission() for permission in permission_classes]
    
    def get_serializer_context(self):
        """Add language to serializer context"""
        context = super().get_serializer_context()
        lang = self.request.query_params.get('lang', 'en')
        context['lang'] = lang if lang in ['en', 'fr'] else 'en'
        return context
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        """
        Get today's quote for a specific category.
        If no quote exists for today, returns the most recent quote for that category.
        Query params:
            - category: GENERAL (default), CHRISTIAN, or ISLAMIC
            - lang: 'en' or 'fr' (default: 'en')
        """
        from datetime import date
        from .models import DailyQuote
        
        category = request.query_params.get('category', 'GENERAL').upper()
        if category not in ['GENERAL', 'CHRISTIAN', 'ISLAMIC']:
            category = 'GENERAL'
        
        lang = request.query_params.get('lang', 'en')
        if lang not in ['en', 'fr']:
            lang = 'en'
        
        today = date.today()
        
        # Try to get today's quote
        quote = DailyQuote.objects.filter(category=category, date=today).first()
        
        # If no quote for today, get the most recent one
        if not quote:
            quote = DailyQuote.objects.filter(category=category).order_by('-date').first()
        
        if not quote:
            return Response({
                'error': 'No quote available',
                'message': 'No quotes found for this category'
            }, status=status.HTTP_404_NOT_FOUND)
        
        from .serializers import DailyQuoteSerializer
        serializer = DailyQuoteSerializer(quote, context={'lang': lang})
        return Response(serializer.data)


class UserNotificationViewSet(viewsets.ModelViewSet):
    """
    API endpoint for user notifications.
    
    GET /api/notifications/ - List current user's notifications
    GET /api/notifications/{id}/ - Get a specific notification
    POST /api/notifications/ - Create notification (API key required)
    POST /api/notifications/{id}/read/ - Mark as read
    POST /api/notifications/read-all/ - Mark all as read
    GET /api/notifications/unread-count/ - Get unread count for badge
    DELETE /api/notifications/{id}/ - Delete notification
    
    Query params:
        - lang: 'en' or 'fr' (default: 'en')
        - is_read: 'true' or 'false' to filter by read status
        - notification_type: Filter by type
    """
    from .models import UserNotification
    from .serializers import UserNotificationSerializer
    
    serializer_class = UserNotificationSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['is_read', 'notification_type']
    ordering_fields = ['created_at', 'is_read']
    
    def get_queryset(self):
        """Return notifications for the current user only"""
        from .models import UserNotification
        user = self.request.user
        if user.is_authenticated:
            return UserNotification.objects.filter(user=user)
        return UserNotification.objects.none()
    
    def get_permissions(self):
        """
        - GET (list, retrieve, unread_count): Requires authenticated user
        - POST (create): Requires API key (for external scripts)
        - POST (read, read_all): Requires authenticated user
        - DELETE: Requires authenticated user
        """
        if self.action == 'create':
            permission_classes = [HasAPIKey]
        elif self.action in ['list', 'retrieve', 'read', 'read_all', 'unread_count', 'destroy']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_serializer_context(self):
        """Add language to serializer context"""
        context = super().get_serializer_context()
        lang = self.request.query_params.get('lang', 'en')
        context['lang'] = lang if lang in ['en', 'fr'] else 'en'
        return context
    
    @action(detail=True, methods=['post'])
    def read(self, request, pk=None):
        """Mark a single notification as read"""
        notification = self.get_object()
        notification.mark_as_read()
        serializer = self.get_serializer(notification)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], url_path='read-all')
    def read_all(self, request):
        """Mark all notifications as read for the current user"""
        from django.utils import timezone
        from .models import UserNotification
        
        count = UserNotification.objects.filter(
            user=request.user, 
            is_read=False
        ).update(
            is_read=True, 
            read_at=timezone.now()
        )
        
        return Response({
            'message': f'Marked {count} notifications as read',
            'count': count
        })
    
    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        """Get the count of unread notifications for badge display"""
        from .models import UserNotification
        
        count = UserNotification.objects.filter(
            user=request.user, 
            is_read=False
        ).count()
        
        return Response({
            'unread_count': count
        })
