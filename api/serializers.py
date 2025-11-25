from rest_framework import serializers
from .models import Article, Comment

class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ['id', 'article', 'commenter_name', 'comment_text', 'timestamp']
        read_only_fields = ['timestamp']

class ArticleSerializer(serializers.ModelSerializer):
    comments = CommentSerializer(many=True, read_only=True)
    mood = serializers.CharField(max_length=100)

    class Meta:
        model = Article
        fields = [
            'id', 'headline', 'category', 'french_summary', 'english_summary',
            'mood', 'source_urls', 'source_names', 'thumbnails',
            'french_audio', 'english_audio', 'timestamp', 'created_at',
            'view_count', 'comment_count', 'reaction_count', 'comments'
        ]
        read_only_fields = ['created_at', 'view_count', 'comment_count', 'reaction_count']
