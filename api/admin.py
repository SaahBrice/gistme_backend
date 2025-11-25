from django.contrib import admin
from .models import Article, Comment

@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ('headline', 'headline_en', 'headline_fr', 'category', 'mood', 'created_at', 'view_count')
    list_filter = ('category', 'mood', 'created_at')
    search_fields = ('headline', 'headline_en', 'headline_fr', 'french_summary', 'english_summary')

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('commenter_name', 'article', 'timestamp')
    list_filter = ('timestamp',)
    search_fields = ('commenter_name', 'comment_text')
