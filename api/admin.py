from django.contrib import admin
from .models import Article, Comment, ArticleCategory


@admin.register(ArticleCategory)
class ArticleCategoryAdmin(admin.ModelAdmin):
    list_display = ('name_en', 'name_fr', 'slug', 'main_category', 'emoji', 'order', 'is_active')
    list_filter = ('main_category', 'is_active')
    search_fields = ('name_en', 'name_fr', 'slug')
    ordering = ('main_category', 'order')
    prepopulated_fields = {'slug': ('name_en',)}
    list_editable = ('order', 'is_active')
    actions = ['activate_categories', 'deactivate_categories']
    
    @admin.action(description='Activate selected categories')
    def activate_categories(self, request, queryset):
        queryset.update(is_active=True)
    
    @admin.action(description='Deactivate selected categories')
    def deactivate_categories(self, request, queryset):
        queryset.update(is_active=False)


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ('headline', 'category', 'deadline', 'mood', 'created_at', 'view_count')
    list_filter = ('category__main_category', 'category', 'mood', 'deadline', 'created_at')
    search_fields = ('headline', 'headline_en', 'headline_fr', 'french_summary', 'english_summary')
    raw_id_fields = ('category',)
    list_select_related = ('category',)
    date_hierarchy = 'created_at'


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('commenter_name', 'article', 'timestamp')
    list_filter = ('timestamp',)
    search_fields = ('commenter_name', 'comment_text')


from .models import FCMSubscription

@admin.register(FCMSubscription)
class FCMSubscriptionAdmin(admin.ModelAdmin):
    list_display = ('token', 'created_at', 'last_used_at')
    readonly_fields = ('created_at', 'last_used_at')
    search_fields = ('token',)


from .models import AssistanceRequest

@admin.register(AssistanceRequest)
class AssistanceRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'get_article_title', 'user_name', 'user_phone', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('user_name', 'user_email', 'user_phone', 'message', 'article__headline_en', 'article__headline_fr')
    readonly_fields = ('created_at', 'updated_at')
    raw_id_fields = ('article',)
    list_editable = ('status',)
    ordering = ('-created_at',)
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Request Info', {
            'fields': ('article', 'message', 'status')
        }),
        ('User Contact', {
            'fields': ('user_name', 'user_email', 'user_phone')
        }),
        ('Admin', {
            'fields': ('admin_notes', 'created_at', 'updated_at')
        }),
    )
    
    @admin.display(description='Article')
    def get_article_title(self, obj):
        return obj.article.headline_en or obj.article.headline_fr or 'Unknown'


from .models import AISettings

@admin.register(AISettings)
class AISettingsAdmin(admin.ModelAdmin):
    list_display = ('ai_name', 'max_response_length', 'is_active', 'updated_at')
    readonly_fields = ('updated_at',)
    
    fieldsets = (
        ('AI Identity', {
            'fields': ('ai_name', 'is_active')
        }),
        ('Configuration', {
            'fields': ('system_prompt', 'max_response_length')
        }),
        ('Info', {
            'fields': ('updated_at',),
            'classes': ('collapse',)
        }),
    )
    
    def has_add_permission(self, request):
        # Only allow one instance (singleton)
        return not AISettings.objects.exists()
    
    def has_delete_permission(self, request, obj=None):
        return False


from .models import DailyQuote

@admin.register(DailyQuote)
class DailyQuoteAdmin(admin.ModelAdmin):
    list_display = ('date', 'category', 'author', 'quote_text_short', 'created_at')
    list_filter = ('category', 'date')
    search_fields = ('quote_text_en', 'quote_text_fr', 'author', 'explanation_en', 'explanation_fr')
    ordering = ('-date', 'category')
    date_hierarchy = 'date'
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Quote Info', {
            'fields': ('category', 'date', 'author', 'source_reference')
        }),
        ('English Content 🇬🇧', {
            'fields': ('quote_text_en', 'explanation_en', 'affirmations_en'),
            'classes': ('wide',)
        }),
        ('French Content 🇫🇷', {
            'fields': ('quote_text_fr', 'explanation_fr', 'affirmations_fr'),
            'classes': ('wide',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    @admin.display(description='Quote (EN)')
    def quote_text_short(self, obj):
        return obj.quote_text_en[:60] + '...' if len(obj.quote_text_en) > 60 else obj.quote_text_en


from .models import UserNotification

@admin.register(UserNotification)
class UserNotificationAdmin(admin.ModelAdmin):
    list_display = ('user_email', 'title_short', 'notification_type', 'is_read', 'created_at')
    list_filter = ('notification_type', 'is_read', 'created_at')
    search_fields = ('user__email', 'title_en', 'title_fr', 'message_en', 'message_fr')
    ordering = ('-created_at',)
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at', 'read_at')
    raw_id_fields = ('user', 'article')
    
    fieldsets = (
        ('Recipient', {
            'fields': ('user', 'notification_type')
        }),
        ('English Content 🇬🇧', {
            'fields': ('title_en', 'message_en'),
            'classes': ('wide',)
        }),
        ('French Content 🇫🇷', {
            'fields': ('title_fr', 'message_fr'),
            'classes': ('wide', 'collapse')
        }),
        ('Links & Media', {
            'fields': ('article', 'thumbnail_url', 'link_url')
        }),
        ('Status', {
            'fields': ('is_read', 'read_at', 'created_at')
        }),
    )
    
    @admin.display(description='User')
    def user_email(self, obj):
        return obj.user.email
    
    @admin.display(description='Title')
    def title_short(self, obj):
        return obj.title_en[:50] + '...' if len(obj.title_en) > 50 else obj.title_en
