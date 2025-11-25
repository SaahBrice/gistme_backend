from rest_framework import viewsets, filters, status
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
    search_fields = ['headline', 'french_summary', 'english_summary']
    ordering_fields = ['created_at', 'view_count', 'reaction_count', 'comment_count']

    def create(self, request, *args, **kwargs):
        # Check for source_code in the request data for verification
        if request.data.get('source_code') != settings.API_SECRET_CODE:
            return Response(
                {"error": "Invalid or missing source_code"},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all().order_by('-timestamp')
    serializer_class = CommentSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['article']
    ordering_fields = ['timestamp']
