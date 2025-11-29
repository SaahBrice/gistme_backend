from rest_framework import serializers
from .models import Article, Comment, VisitorSubscription

class VisitorSubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = VisitorSubscription
        fields = ['endpoint', 'p256dh', 'auth']


class FCMSubscriptionSerializer(serializers.ModelSerializer):
    preferred_language = serializers.CharField(max_length=2, required=False, default='fr')
    
    class Meta:
        from .models import FCMSubscription
        model = FCMSubscription
        fields = ['token', 'preferred_language']


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
            'id', 'headline_en', 'headline_fr', 'headline', 'category', 'french_summary', 'english_summary',
            'mood', 'source_urls', 'source_names', 'thumbnails', 'thumbnail_image',
            'french_audio', 'english_audio', 'timestamp', 'created_at',
            'mood', 'source_urls', 'source_names', 'thumbnails', 'thumbnail_image',
            'french_audio', 'english_audio', 'timestamp', 'created_at',
            'view_count', 'comment_count', 'reaction_count', 'comments', 'send_notification'
        ]
        read_only_fields = ['created_at', 'view_count', 'comment_count', 'reaction_count']
