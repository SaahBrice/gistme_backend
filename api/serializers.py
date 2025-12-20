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
            'view_count', 'comment_count', 'reaction_count', 'comments', 'send_notification',
            'deadline'
        ]
        read_only_fields = ['created_at', 'view_count', 'comment_count', 'reaction_count']


class AssistanceRequestSerializer(serializers.ModelSerializer):
    """Serializer for assistance requests from users"""
    article_title = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        from .models import AssistanceRequest
        model = AssistanceRequest
        fields = [
            'id', 'article', 'article_title', 'user_name', 'user_email', 
            'user_phone', 'message', 'status', 'created_at'
        ]
        read_only_fields = ['id', 'status', 'created_at', 'article_title']
    
    def get_article_title(self, obj):
        return obj.article.headline_en or obj.article.headline_fr or 'Unknown'
    
    def validate_message(self, value):
        if not value or len(value.strip()) < 10:
            raise serializers.ValidationError("Please provide a message with at least 10 characters.")
        return value.strip()


class DailyQuoteSerializer(serializers.ModelSerializer):
    """
    Serializer for daily quotes with bilingual support.
    Returns language-specific content based on 'lang' context.
    """
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    
    # Dynamic fields that return based on language
    quote_text = serializers.SerializerMethodField()
    explanation = serializers.SerializerMethodField()
    affirmations = serializers.SerializerMethodField()
    
    class Meta:
        from .models import DailyQuote
        model = DailyQuote
        fields = [
            'id', 'category', 'category_display', 'date', 
            'quote_text', 'quote_text_en', 'quote_text_fr',
            'author', 
            'explanation', 'explanation_en', 'explanation_fr',
            'affirmations', 'affirmations_en', 'affirmations_fr',
            'source_reference',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'category_display', 'created_at', 'updated_at']
    
    def get_quote_text(self, obj):
        """Return quote text in requested language"""
        lang = self.context.get('lang', 'en')
        return obj.get_quote_text(lang)
    
    def get_explanation(self, obj):
        """Return explanation in requested language"""
        lang = self.context.get('lang', 'en')
        return obj.get_explanation(lang)
    
    def get_affirmations(self, obj):
        """Return affirmations in requested language"""
        lang = self.context.get('lang', 'en')
        return obj.get_affirmations(lang)


class UserNotificationSerializer(serializers.ModelSerializer):
    """
    Serializer for user notifications with bilingual support.
    Returns language-specific content based on 'lang' context.
    """
    # Dynamic fields based on language
    title = serializers.SerializerMethodField()
    message = serializers.SerializerMethodField()
    link = serializers.SerializerMethodField()
    
    # Article details if linked
    article_headline = serializers.SerializerMethodField()
    
    class Meta:
        from .models import UserNotification
        model = UserNotification
        fields = [
            'id', 'user', 'title', 'message', 'link',
            'title_en', 'title_fr', 'message_en', 'message_fr',
            'article', 'article_headline', 'thumbnail_url', 'link_url',
            'notification_type', 'is_read', 'read_at', 'created_at'
        ]
        read_only_fields = ['id', 'read_at', 'created_at']
        extra_kwargs = {
            'user': {'write_only': True}  # Don't expose user in list
        }
    
    def get_title(self, obj):
        """Return title in requested language"""
        lang = self.context.get('lang', 'en')
        return obj.get_title(lang)
    
    def get_message(self, obj):
        """Return message in requested language"""
        lang = self.context.get('lang', 'en')
        return obj.get_message(lang)
    
    def get_link(self, obj):
        """Return the link for this notification"""
        lang = self.context.get('lang', 'en')
        return obj.get_link(lang)
    
    def get_article_headline(self, obj):
        """Return article headline if linked"""
        if not obj.article:
            return None
        lang = self.context.get('lang', 'en')
        if lang == 'fr':
            return obj.article.headline_fr or obj.article.headline_en or obj.article.headline
        return obj.article.headline_en or obj.article.headline_fr or obj.article.headline
