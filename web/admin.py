from django.contrib import admin
from .models import Subscription, Advertisement, WaitingList, Coupon, CouponUsage


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'phone', 'gist_preferences', 'subscribed_at', 'is_active')
    list_filter = ('is_active', 'subscribed_at')
    search_fields = ('name', 'email', 'phone', 'gist_preferences')
    readonly_fields = ('subscribed_at',)
    date_hierarchy = 'subscribed_at'
    
    fieldsets = (
        ('Subscriber Information', {
            'fields': ('name', 'email', 'phone', 'gist_preferences')
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


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ('code', 'discount_percent', 'current_uses', 'max_uses', 'remaining_uses', 'is_active', 'created_at')
    list_filter = ('is_active', 'discount_percent', 'created_at')
    search_fields = ('code',)
    readonly_fields = ('current_uses', 'created_at')
    list_editable = ('is_active',)
    
    fieldsets = (
        ('Coupon Details', {
            'fields': ('code', 'discount_percent')
        }),
        ('Usage Limits', {
            'fields': ('max_uses', 'current_uses', 'is_active')
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )


@admin.register(CouponUsage)
class CouponUsageAdmin(admin.ModelAdmin):
    list_display = ('coupon', 'email', 'used_at')
    list_filter = ('coupon', 'used_at')
    search_fields = ('email', 'coupon__code')
    readonly_fields = ('coupon', 'email', 'used_at')
    date_hierarchy = 'used_at'

