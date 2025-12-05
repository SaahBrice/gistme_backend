from django.db import models
from django.utils import timezone


class Subscription(models.Model):
    """Model to store Pro subscription data"""
    PRO_DURATION_DAYS = 90  # 3 months
    
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20, help_text="Cameroon phone number")
    email = models.EmailField()
    subscribed_at = models.DateTimeField(default=timezone.now)
    is_active = models.BooleanField(default=True)
    gist_preferences = models.CharField(
        max_length=100, 
        default="scholarships, concours and jobs",
        help_text="What type of gist would you like to receive?"
    )
    notified_of_expiry = models.BooleanField(
        default=False,
        help_text="Has the user been notified their subscription expired?"
    )
    
    class Meta:
        ordering = ['-subscribed_at']
        verbose_name = 'Pro Subscription'
        verbose_name_plural = 'Pro Subscriptions'
    
    @property
    def expiry_date(self):
        """Calculate when the subscription expires (90 days from subscribed_at)"""
        from datetime import timedelta
        return self.subscribed_at + timedelta(days=self.PRO_DURATION_DAYS)
    
    def is_valid(self):
        """Check if subscription is still valid (active and not expired)"""
        return self.is_active and timezone.now() < self.expiry_date
    
    def reactivate(self):
        """Reactivate/renew the subscription"""
        self.subscribed_at = timezone.now()
        self.is_active = True
        self.notified_of_expiry = False
        self.save()
    
    def __str__(self):
        status = "✓" if self.is_valid() else "✗"
        return f"{status} {self.name} - {self.email}"


class Advertisement(models.Model):
    """Model to store advertising inquiries from organizations"""
    organization_name = models.CharField(max_length=200)
    phone = models.CharField(max_length=20, help_text="Organization contact number")
    email = models.EmailField()
    created_at = models.DateTimeField(default=timezone.now)
    contacted = models.BooleanField(default=False, help_text="Has our agent contacted them?")
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Advertisement Inquiry'
        verbose_name_plural = 'Advertisement Inquiries'
    
    def __str__(self):
        return f"{self.organization_name} - {self.email}"


class WaitingList(models.Model):
    """Model to store waiting list signups"""
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True, null=True, help_text="Cameroon phone number")
    created_at = models.DateTimeField(default=timezone.now)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Waiting List Entry'
        verbose_name_plural = 'Waiting List Entries'
    
    def __str__(self):
        return self.email


class Coupon(models.Model):
    """Discount coupon with usage limits"""
    BASE_PRICE = 1500  # Base subscription price in FCFA
    
    code = models.CharField(max_length=20, unique=True, help_text="Unique coupon code (e.g., GIST20)")
    discount_percent = models.IntegerField(help_text="Discount percentage (1-100)")
    max_uses = models.IntegerField(default=100, help_text="Maximum number of times this coupon can be used")
    current_uses = models.IntegerField(default=0, help_text="How many times this coupon has been used")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def is_valid(self):
        """Check if coupon is still valid (active and under max uses)"""
        return self.is_active and self.current_uses < self.max_uses
    
    def get_discounted_price(self):
        """Calculate the final price after discount"""
        discount = (self.discount_percent / 100) * self.BASE_PRICE
        return int(self.BASE_PRICE - discount)
    
    def remaining_uses(self):
        """How many uses are left"""
        return max(0, self.max_uses - self.current_uses)
    
    def __str__(self):
        status = "✓" if self.is_valid() else "✗"
        return f"{status} {self.code} ({self.discount_percent}% off) - {self.current_uses}/{self.max_uses} uses"


class CouponUsage(models.Model):
    """Tracks which users have used which coupons (one per user)"""
    coupon = models.ForeignKey(Coupon, on_delete=models.CASCADE, related_name='usages')
    email = models.EmailField(help_text="Email of user who used the coupon")
    used_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['coupon', 'email']  # Prevents same user using same coupon twice
        ordering = ['-used_at']
    
    def __str__(self):
        return f"{self.email} used {self.coupon.code}"


class PaymentTransaction(models.Model):
    """Tracks Fapshi payment transactions"""
    STATUS_CHOICES = [
        ('CREATED', 'Created'),
        ('PENDING', 'Pending'),
        ('SUCCESSFUL', 'Successful'),
        ('FAILED', 'Failed'),
        ('EXPIRED', 'Expired'),
    ]
    
    trans_id = models.CharField(max_length=100, unique=True, help_text="Fapshi transaction ID")
    email = models.EmailField()
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    amount = models.IntegerField(help_text="Amount in FCFA")
    final_amount = models.IntegerField(help_text="Amount after coupon discount")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    coupon = models.ForeignKey(Coupon, on_delete=models.SET_NULL, null=True, blank=True)
    gist_preferences = models.CharField(max_length=100, default="scholarships, concours and jobs")
    is_renewal = models.BooleanField(default=False)
    
    # Fapshi response data
    medium = models.CharField(max_length=50, blank=True, null=True, help_text="mobile money or orange money")
    financial_trans_id = models.CharField(max_length=100, blank=True, null=True, help_text="Operator transaction ID")
    
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Payment Transaction'
        verbose_name_plural = 'Payment Transactions'
    
    def __str__(self):
        return f"{self.status} - {self.email} - {self.final_amount} FCFA"


