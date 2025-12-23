from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User
from django.contrib.auth.signals import user_logged_in
from django.dispatch import receiver


class UserProfile(models.Model):
    """Extended user profile for onboarding preferences"""
    
    EDUCATION_CHOICES = [
        ('FSLC', 'FSLC (Primary)'),
        ('GCE_OL', 'GCE O/L'),
        ('GCE_AL', 'GCE A/L'),
        ('HND', 'HND'),
        ('BACHELOR', 'Bachelor\'s Degree'),
        ('MASTERS', 'Master\'s Degree'),
        ('PHD', 'PhD'),
        ('RAS', 'Prefer not to say'),
    ]
    
    BACKGROUND_CHOICES = [
        ('ARTS', 'Arts & Humanities'),
        ('SCIENCE', 'Science & Technology'),
        ('RAS', 'Prefer not to say'),
    ]
    
    REGION_CHOICES = [
        ('ADAMAWA', 'Adamawa'),
        ('CENTRE', 'Centre'),
        ('EAST', 'East'),
        ('FAR_NORTH', 'Far North'),
        ('LITTORAL', 'Littoral'),
        ('NORTH', 'North'),
        ('NORTHWEST', 'Northwest'),
        ('SOUTH', 'South'),
        ('SOUTHWEST', 'Southwest'),
        ('WEST', 'West'),
        ('RAS', 'Prefer not to say'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone = models.CharField(max_length=20, help_text="Cameroon phone number (6XXXXXXXX)")
    region = models.CharField(max_length=20, choices=REGION_CHOICES, default='RAS', help_text="Region of residence")
    
    # Interests stored as JSON list
    interests = models.JSONField(default=list, help_text="Selected interest categories")
    
    education_level = models.CharField(max_length=20, choices=EDUCATION_CHOICES, default='RAS')
    background = models.CharField(max_length=20, choices=BACKGROUND_CHOICES, default='RAS')
    
    # Notification preferences
    notification_time = models.TimeField(default='08:00', help_text="Preferred notification time")
    
    # Quote preferences
    QUOTE_CATEGORY_CHOICES = [
        ('GENERAL', 'General'),
        ('CHRISTIAN', 'Christian'),
        ('ISLAMIC', 'Islamic'),
    ]
    receive_quotes = models.BooleanField(default=True, help_text="Receive daily quotes")
    quote_category = models.CharField(max_length=20, choices=QUOTE_CATEGORY_CHOICES, default='GENERAL', help_text="Quote category preference")
    
    # Optional custom desires
    custom_desires = models.TextField(blank=True, null=True, help_text="User's specific needs")
    
    # Tracking
    onboarding_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'
    
    def __str__(self):
        return f"{self.user.email} - {'✓' if self.onboarding_completed else '○'}"
    
    @classmethod
    def get_interest_options(cls):
        """Returns all available interest options"""
        return [
            {'id': 'jobs_abroad', 'label': 'Jobs Abroad', 'emoji': '🌍'},
            {'id': 'jobs_cameroon', 'label': 'Jobs in Cameroon', 'emoji': '🇨🇲'},
            {'id': 'scholarships_abroad', 'label': 'Scholarships Abroad', 'emoji': '🎓'},
            {'id': 'scholarships_local', 'label': 'Local Scholarships', 'emoji': '📚'},
            {'id': 'concours', 'label': 'Concours (ENS, ENAM, etc.)', 'emoji': '📝'},
            {'id': 'university_free', 'label': 'Free University Admissions', 'emoji': '🆓'},
            {'id': 'university_paid', 'label': 'Paid University Admissions', 'emoji': '💰'},
            {'id': 'competitions', 'label': 'Competitions & Contests', 'emoji': '🏆'},
        ]


# Signal: Auto-create UserProfile when user logs in (especially for Google OAuth)
@receiver(user_logged_in)
def ensure_user_profile_on_login(sender, user, request, **kwargs):
    """
    Automatically create a UserProfile for users who don't have one.
    This ensures Google OAuth users (who skip onboarding) still have profiles.
    """
    UserProfile.objects.get_or_create(user=user)


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


class SponsorPartnerInquiry(models.Model):
    """Model to store sponsor/partner applications"""
    
    INQUIRY_TYPE_CHOICES = [
        ('SPONSOR', 'Sponsor'),
        ('PARTNER', 'Partner'),
        ('BOTH', 'Both Sponsor & Partner'),
    ]
    
    # Contact Info
    name = models.CharField(max_length=100, help_text="Full name of contact person")
    email = models.EmailField()
    phone = models.CharField(max_length=20, help_text="Contact phone number")
    
    # Organization Info
    organization_name = models.CharField(max_length=200, blank=True, null=True, help_text="Company/Organization name (optional for individuals)")
    website = models.URLField(blank=True, null=True, help_text="Website URL (optional)")
    
    # Inquiry Details
    inquiry_type = models.CharField(max_length=20, choices=INQUIRY_TYPE_CHOICES, default='SPONSOR')
    description = models.TextField(help_text="Brief description of how they want to collaborate")
    
    # Status Tracking
    contacted = models.BooleanField(default=False, help_text="Has our founder contacted them?")
    notes = models.TextField(blank=True, null=True, help_text="Internal notes about this inquiry")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Sponsor/Partner Inquiry'
        verbose_name_plural = 'Sponsor/Partner Inquiries'
    
    def __str__(self):
        type_emoji = {'SPONSOR': '💰', 'PARTNER': '🤝', 'BOTH': '💰🤝'}
        status = '✓' if self.contacted else '○'
        return f"{status} {type_emoji.get(self.inquiry_type, '')} {self.name} - {self.organization_name or 'Individual'}"


class MentorCategory(models.Model):
    """Dynamic categories for mentors - manageable from admin"""
    
    # Icon choices - maps to SVG icons in frontend
    ICON_CHOICES = [
        ('users', 'Users (👥)'),
        ('palette', 'Palette (🎨)'),
        ('flask', 'Flask (🧪)'),
        ('heart', 'Heart (❤️)'),
        ('book', 'Book (📚)'),
        ('briefcase', 'Briefcase (💼)'),
        ('music', 'Music (🎵)'),
        ('globe', 'Globe (🌍)'),
        ('code', 'Code (💻)'),
        ('graduation', 'Graduation (🎓)'),
        ('star', 'Star (⭐)'),
        ('lightbulb', 'Lightbulb (💡)'),
    ]
    
    name = models.CharField(max_length=50, unique=True)
    label = models.CharField(max_length=100, help_text="Display label for the category")
    icon = models.CharField(max_length=20, choices=ICON_CHOICES, default='users')
    order = models.PositiveIntegerField(default=0, help_text="Order in which categories appear")
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['order', 'name']
        verbose_name = 'Mentor Category'
        verbose_name_plural = 'Mentor Categories'
    
    def __str__(self):
        return self.label


class Mentor(models.Model):
    """Mentors available for mentorship"""
    
    LANGUAGE_CHOICES = [
        ('EN', 'English'),
        ('FR', 'French'),
        ('BI', 'Bilingual'),
    ]
    
    name = models.CharField(max_length=100)
    profession = models.CharField(max_length=150)
    location = models.CharField(max_length=100)
    bio = models.TextField(help_text="Short bio about the mentor")
    picture = models.URLField(blank=True, null=True, help_text="URL to mentor's photo (if no file uploaded)")
    picture_file = models.ImageField(upload_to='mentors/', blank=True, null=True, help_text="Upload mentor's photo directly")
    category = models.ForeignKey(
        MentorCategory, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='mentors'
    )
    language = models.CharField(max_length=2, choices=LANGUAGE_CHOICES, default='BI')
    
    # Contact info (not displayed publicly)
    phone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    
    # Status
    is_active = models.BooleanField(default=True, help_text="Is mentor currently accepting requests?")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        verbose_name = 'Mentor'
        verbose_name_plural = 'Mentors'
    
    def __str__(self):
        category_name = self.category.label if self.category else 'No Category'
        return f"{self.name} - {self.profession} ({category_name})"
    
    @property
    def get_picture_url(self):
        """Returns uploaded file URL or fallback to URL field"""
        if self.picture_file:
            return self.picture_file.url
        return self.picture


class MentorRequest(models.Model):
    """Requests from users to connect with mentors"""
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('CONTACTED', 'Contacted'),
        ('MATCHED', 'Matched'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
        ('EXPIRED', 'Expired'),
    ]
    
    # Default connection duration in days
    DEFAULT_DURATION_DAYS = 30
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='mentor_requests')
    mentor = models.ForeignKey(Mentor, on_delete=models.CASCADE, related_name='requests')
    
    message = models.TextField(blank=True, null=True, help_text="User's message to the mentor")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    # Expiry tracking
    expires_at = models.DateTimeField(blank=True, null=True, help_text="When this mentorship connection expires")
    
    # Admin notes
    notes = models.TextField(blank=True, null=True, help_text="Internal notes")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Mentor Request'
        verbose_name_plural = 'Mentor Requests'
    
    def save(self, *args, **kwargs):
        # Auto-set expires_at when matched
        if self.status == 'MATCHED' and not self.expires_at:
            from datetime import timedelta
            from django.utils import timezone
            self.expires_at = timezone.now() + timedelta(days=self.DEFAULT_DURATION_DAYS)
        super().save(*args, **kwargs)
    
    @property
    def days_remaining(self):
        """Returns days remaining until expiry, or None if not set"""
        if not self.expires_at:
            return None
        from django.utils import timezone
        delta = self.expires_at - timezone.now()
        return max(0, delta.days)
    
    @property
    def is_active_connection(self):
        """Returns True if this is an active, non-expired connection"""
        if self.status not in ['MATCHED', 'CONTACTED', 'PENDING']:
            return False
        if self.expires_at:
            from django.utils import timezone
            return timezone.now() < self.expires_at
        return True
    
    def __str__(self):
        status_emoji = {'PENDING': '⏳', 'CONTACTED': '📞', 'MATCHED': '✓', 'COMPLETED': '✅', 'CANCELLED': '✕', 'EXPIRED': '⌛'}
        return f"{status_emoji.get(self.status, '')} {self.user.email} → {self.mentor.name}"


class GameProgress(models.Model):
    """Tracks user's progress in the Relax mirror game"""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='game_progress')
    level = models.IntegerField(default=1)
    score = models.IntegerField(default=0)  # Can be negative due to penalties
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-score']  # Leaderboard order by score
        verbose_name = 'Game Progress'
        verbose_name_plural = 'Game Progress'
        indexes = [
            models.Index(fields=['-score']),  # Fast leaderboard queries
        ]
    
    def __str__(self):
        return f"{self.user.email} - Level {self.level} - ⭐{self.score}"

