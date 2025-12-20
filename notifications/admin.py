from django.contrib import admin
from .models import NotificationLog


@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    list_display = ('notification_type', 'channel', 'recipient_email', 'language', 'status', 'created_at', 'sent_at')
    list_filter = ('notification_type', 'channel', 'status', 'language', 'created_at')
    search_fields = ('recipient_email', 'notification_type', 'error_message')
    readonly_fields = ('notification_type', 'channel', 'recipient_email', 'recipient_user', 'language', 'context', 'status', 'error_message', 'created_at', 'sent_at')
    date_hierarchy = 'created_at'
    
    list_per_page = 50
    
    def has_add_permission(self, request):
        return False  # Logs are created programmatically
    
    def has_change_permission(self, request, obj=None):
        return False  # Logs are read-only
