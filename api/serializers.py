from rest_framework import serializers
from .models import Article, Comment, VisitorSubscription, ArticleCategory


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


class ArticleCategorySerializer(serializers.ModelSerializer):
    """Serializer for article categories with EN/FR names"""
    
    class Meta:
        model = ArticleCategory
        fields = ['id', 'name_en', 'name_fr', 'slug', 'main_category', 'emoji', 'order']


class ArticleSerializer(serializers.ModelSerializer):
    """
    Article serializer with nested category details and language-aware fields.
    Consumers can use 'headline_en'/'headline_fr' and 'english_summary'/'french_summary'
    based on the user's language preference.
    """
    comments = CommentSerializer(many=True, read_only=True)
    category_details = ArticleCategorySerializer(source='category', read_only=True)
    
    # Category info for easier frontend consumption
    category_slug = serializers.CharField(source='category.slug', read_only=True, allow_null=True)
    category_name_en = serializers.CharField(source='category.name_en', read_only=True, allow_null=True)
    category_name_fr = serializers.CharField(source='category.name_fr', read_only=True, allow_null=True)
    main_category = serializers.CharField(source='category.main_category', read_only=True, allow_null=True)

    class Meta:
        model = Article
        fields = [
            'id', 'headline_en', 'headline_fr', 'headline',
            'category', 'category_details', 'category_slug', 'category_name_en', 'category_name_fr', 'main_category',
            'french_summary', 'english_summary',
            'mood', 'source_urls', 'source_names', 'thumbnails', 'thumbnail_image',
            'french_audio', 'english_audio', 'timestamp', 'created_at',
            'view_count', 'comment_count', 'reaction_count', 'comments', 'send_notification'
        ]
        read_only_fields = ['created_at', 'view_count', 'comment_count', 'reaction_count']

