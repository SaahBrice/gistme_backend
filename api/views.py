from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.conf import settings
from django_filters.rest_framework import DjangoFilterBackend
from .models import Article, Comment
from .serializers import ArticleSerializer, CommentSerializer
from rest_framework.pagination import PageNumberPagination

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.all().order_by('-created_at')
    serializer_class = ArticleSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['mood', 'category']
    search_fields = ['headline', 'headline_en', 'headline_fr', 'french_summary', 'english_summary']
    ordering_fields = ['created_at', 'view_count', 'reaction_count', 'comment_count']

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
