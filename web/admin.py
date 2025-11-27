from django.contrib import admin
from .models import Subscription


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'phone', 'subscribed_at', 'is_active')
    list_filter = ('is_active', 'subscribed_at')
    search_fields = ('name', 'email', 'phone')
    readonly_fields = ('subscribed_at',)
    date_hierarchy = 'subscribed_at'
    
    fieldsets = (
        ('Subscriber Information', {
            'fields': ('name', 'email', 'phone')
        }),
        ('Subscription Status', {
            'fields': ('is_active', 'subscribed_at')
        }),
    )
