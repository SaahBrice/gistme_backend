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
    list_display = ('headline', 'headline_en', 'headline_fr', 'category', 'category_legacy', 'mood', 'created_at', 'view_count')
    list_filter = ('category__main_category', 'category', 'mood', 'created_at')
    search_fields = ('headline', 'headline_en', 'headline_fr', 'french_summary', 'english_summary')
    raw_id_fields = ('category',)
    list_select_related = ('category',)


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

