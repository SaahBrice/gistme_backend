from django.contrib import admin
from .models import Subscription, Advertisement, WaitingList


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


@admin.register(Advertisement)
class AdvertisementAdmin(admin.ModelAdmin):
    list_display = ('organization_name', 'email', 'phone', 'created_at', 'contacted')
    list_filter = ('contacted', 'created_at')
    search_fields = ('organization_name', 'email', 'phone')
    readonly_fields = ('created_at',)
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Organization Information', {
            'fields': ('organization_name', 'email', 'phone')
        }),
        ('Status', {
            'fields': ('contacted', 'created_at')
        }),
    )


@admin.register(WaitingList)
class WaitingListAdmin(admin.ModelAdmin):
    list_display = ('email', 'phone', 'created_at', 'ip_address')
    list_filter = ('created_at',)
    search_fields = ('email', 'phone', 'ip_address')
    readonly_fields = ('created_at', 'ip_address', 'user_agent')
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Contact Information', {
            'fields': ('email', 'phone')
        }),
        ('Technical Details', {
            'fields': ('ip_address', 'user_agent', 'created_at')
        }),
    )
