from django.contrib import admin
from .models import Subscription, Advertisement, Coupon, CouponUsage, PaymentTransaction, UserProfile


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


@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display = ('trans_id', 'email', 'name', 'final_amount', 'status', 'medium', 'created_at', 'completed_at')
    list_filter = ('status', 'medium', 'created_at', 'is_renewal')
    search_fields = ('trans_id', 'email', 'name', 'phone', 'financial_trans_id')
    readonly_fields = ('trans_id', 'created_at', 'completed_at', 'financial_trans_id')
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Transaction Info', {
            'fields': ('trans_id', 'status', 'medium', 'financial_trans_id')
        }),
        ('Customer', {
            'fields': ('name', 'email', 'phone', 'gist_preferences')
        }),
        ('Payment', {
            'fields': ('amount', 'final_amount', 'coupon', 'is_renewal')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'completed_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'phone', 'education_level', 'background', 'onboarding_completed', 'created_at')
    list_filter = ('onboarding_completed', 'education_level', 'background')
    search_fields = ('user__email', 'phone', 'custom_desires')
    readonly_fields = ('created_at', 'updated_at')
