from django.db import models
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
import random


class ArticleCategory(models.Model):
    """Dynamic categories for articles - manageable from admin"""
    
    MAIN_CATEGORY_CHOICES = [
        ('ACTUALITY', 'Actuality'),
        ('OPPORTUNITY', 'Opportunity'),
        ('FOR_YOU', 'For You'),
    ]
    
    name_en = models.CharField(max_length=100, help_text="English name")
    name_fr = models.CharField(max_length=100, help_text="French name")
    slug = models.SlugField(unique=True, help_text="URL-friendly identifier")
    main_category = models.CharField(
        max_length=20, 
        choices=MAIN_CATEGORY_CHOICES, 
        db_index=True,
        help_text="Parent category (Actuality, Opportunity, or For You)"
    )
    emoji = models.CharField(max_length=10, blank=True, help_text="Optional emoji icon")
    order = models.PositiveIntegerField(default=0, help_text="Display order within main category")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['main_category', 'order', 'name_en']
        verbose_name = 'Article Category'
        verbose_name_plural = 'Article Categories'
    
    def __str__(self):
        return f"{self.emoji} {self.name_en}" if self.emoji else self.name_en


class Article(models.Model):
    # Bilingual headlines
    headline_en = models.CharField(max_length=300, null=True, blank=True)
    headline_fr = models.CharField(max_length=300, null=True, blank=True)
    # Legacy headline field for backward compatibility
    headline = models.CharField(max_length=300, null=True, blank=True)
    
    # New dynamic category (ForeignKey)
    category = models.ForeignKey(
        ArticleCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='articles',
        db_index=True
    )
    # Legacy category field for migration (will be removed after migration)
    category_legacy = models.CharField(max_length=100, db_index=True, blank=True, null=True)
    
    french_summary = models.TextField()
    english_summary = models.TextField()
    mood = models.CharField(max_length=100, db_index=True)
    source_urls = models.JSONField(default=list, blank=True)
    source_names = models.JSONField(default=list, blank=True)
    thumbnails = models.JSONField(default=list, blank=True)
    # Temporary field for uploading a single thumbnail
    thumbnail_image = models.ImageField(upload_to='thumbnails/', null=True, blank=True)
    
    french_audio = models.FileField(upload_to='audio/french/', max_length=500, null=True, blank=True)
    english_audio = models.FileField(upload_to='audio/english/', max_length=500, null=True, blank=True)
    timestamp = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    view_count = models.PositiveIntegerField(default=0, db_index=True)
    comment_count = models.PositiveIntegerField(default=0)
    reaction_count = models.PositiveIntegerField(default=0)
    send_notification = models.BooleanField(default=False)
    
    # Deadline for time-sensitive articles (scholarships, jobs, concours, etc.)
    deadline = models.DateField(
        null=True, 
        blank=True, 
        db_index=True,
        help_text="Application/submission deadline (for scholarships, jobs, concours)"
    )

    def save(self, *args, **kwargs):
        # Backward compatibility: populate headline_en/headline_fr from headline if missing
        if not self.headline_en and not self.headline_fr and self.headline:
            self.headline_en = self.headline
            self.headline_fr = self.headline
        
        # Ensure at least one headline exists
        if not self.headline and (self.headline_en or self.headline_fr):
            self.headline = self.headline_en or self.headline_fr
        
        if not self.view_count:
            self.view_count = random.randint(1000, 5000000)
        
        if not self.reaction_count:
            upper_limit = min(100000, self.view_count)
            if upper_limit < 100:
                self.reaction_count = upper_limit
            else:
                self.reaction_count = random.randint(100, upper_limit)

        super().save(*args, **kwargs)

        # Post-save: if thumbnail_image exists, add to thumbnails list if not present
        if self.thumbnail_image:
            try:
                url = self.thumbnail_image.url
                if url not in self.thumbnails:
                    self.thumbnails.insert(0, url)
                    # Avoid infinite recursion by updating only the thumbnails field
                    super().save(update_fields=['thumbnails'])
            except Exception:
                pass

    def __str__(self):
        return self.headline_en or self.headline_fr or self.headline or 'No headline'


class Comment(models.Model):
    article = models.ForeignKey(Article, related_name='comments', on_delete=models.CASCADE)
    commenter_name = models.CharField(max_length=50)
    comment_text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        headline = self.article.headline_en or self.article.headline_fr or self.article.headline or 'No headline'
        return f"{self.commenter_name} on {headline[:30]}"

class VisitorSubscription(models.Model):
    session_key = models.CharField(max_length=40, unique=True)
    endpoint = models.URLField(max_length=500)
    p256dh = models.CharField(max_length=255)
    auth = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Subscription for {self.session_key}"


class FCMSubscription(models.Model):
    LANGUAGE_CHOICES = [
        ('fr', 'French'),
        ('en', 'English'),
    ]
    
    token = models.CharField(max_length=500, unique=True)
    email = models.EmailField(
        null=True,
        blank=True,
        db_index=True,
        help_text='Email for linking to Pro subscription (optional)'
    )
    preferred_language = models.CharField(
        max_length=2,
        choices=LANGUAGE_CHOICES,
        default='fr',
        db_index=True,  # Index for fast language-based queries
        help_text='User\'s preferred language for notifications'
    )
    category_preferences = models.JSONField(
        default=list,
        blank=True,
        help_text='List of preferred category IDs for targeted notifications'
    )
    # Daily notification tracking for users without preferences
    notifications_sent_today = models.PositiveIntegerField(
        default=0,
        help_text='Number of random notifications sent today (for users without preferences)'
    )
    last_notification_date = models.DateField(
        null=True,
        blank=True,
        help_text='Date of last notification sent (for daily limit reset)'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    last_used_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        if self.email:
            return f"FCM Token {self.token[:20]}... ({self.preferred_language}) - {self.email}"
        return f"FCM Token {self.token[:20]}... ({self.preferred_language})"


# Signals to automatically update comment_count
@receiver(post_save, sender=Comment)
def increment_comment_count(sender, instance, created, **kwargs):
    """Increment article comment_count when a new comment is created"""
    if created:
        instance.article.comment_count += 1
        instance.article.save(update_fields=['comment_count'])


@receiver(post_delete, sender=Comment)
def decrement_comment_count(sender, instance, **kwargs):
    """Decrement article comment_count when a comment is deleted"""
    instance.article.comment_count = max(0, instance.article.comment_count - 1)
    instance.article.save(update_fields=['comment_count'])


@receiver(post_save, sender=Article)
def trigger_push_notification(sender, instance, created, **kwargs):
    """
    Trigger FCM push notification if send_notification is True.
    """
    if instance.send_notification:
        try:
            from api.utils.fcm import send_push_notification
            # Send notification (non-blocking is handled inside send_push_notification)
            send_push_notification(instance)
            
            # Optional: Reset the flag to prevent re-sending on subsequent edits
            # instance.send_notification = False
            # instance.save(update_fields=['send_notification'])
            # CAUTION: Saving here triggers the signal again. 
            # If we want to reset, we must disconnect signal or handle recursion.
            # For now, we leave it as is, assuming the uploader sets it once.
        except Exception as e:
            print(f"Error triggering notification: {e}")


class AssistanceRequest(models.Model):
    """
    Request for assistance from Gist4U team on a specific article.
    Users can ask for help with concours, scholarships, job applications, etc.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    article = models.ForeignKey(
        Article, 
        on_delete=models.CASCADE, 
        related_name='assistance_requests',
        help_text="The article the user needs help with"
    )
    user_name = models.CharField(max_length=100, blank=True, help_text="User's name (optional)")
    user_email = models.EmailField(blank=True, help_text="User's email for follow-up")
    user_phone = models.CharField(max_length=20, blank=True, help_text="User's WhatsApp/phone number")
    message = models.TextField(help_text="User's description of what help they need")
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='pending',
        db_index=True
    )
    admin_notes = models.TextField(blank=True, help_text="Internal notes for team")
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Assistance Request'
        verbose_name_plural = 'Assistance Requests'
    
    def __str__(self):
        article_title = self.article.headline_en or self.article.headline_fr or 'Unknown'
        return f"Request for '{article_title[:30]}...' - {self.status}"


class AISettings(models.Model):
    """
    Singleton model for admin-configurable AI settings.
    Controls the behavior of the Reepls AI chat assistant.
    """
    ai_name = models.CharField(
        max_length=50, 
        default="Reepls AI",
        help_text="Name the AI uses to identify itself"
    )
    system_prompt = models.TextField(
        default="""You are Reepls AI, a helpful assistant for Gist4U - a platform that helps users discover opportunities in Cameroon (scholarships, jobs, concours, news).

Your role is to help users understand articles and answer questions about opportunities.

Guidelines:
- Be concise (max 500 characters per response)
- Be friendly but professional
- Answer in the same language the user writes in
- If you don't know something, say so honestly
- On your FIRST response, you may reference the article context
- On follow-up responses, answer naturally without repeatedly saying "this article" - just respond directly to the user's question
- Have a natural conversation flow, like a helpful friend who read the article""",
        help_text="System instructions sent to Gemini API"
    )
    max_response_length = models.PositiveIntegerField(
        default=500,
        help_text="Maximum characters for AI responses"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Enable/disable AI chat feature"
    )
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'AI Settings'
        verbose_name_plural = 'AI Settings'
    
    def save(self, *args, **kwargs):
        # Ensure only one instance exists (singleton)
        self.pk = 1
        super().save(*args, **kwargs)
    
    @classmethod
    def get_settings(cls):
        """Get or create the singleton settings instance"""
        obj, created = cls.objects.get_or_create(pk=1)
        return obj
    
    def __str__(self):
        return f"AI Settings (Updated: {self.updated_at})"


class DailyQuote(models.Model):
    """
    Daily quotes with three categories: General, Christian, and Islamic.
    One quote per category per day. Updated daily by admin.
    Bilingual support: English (en) and French (fr).
    """
    CATEGORY_CHOICES = [
        ('GENERAL', 'General'),
        ('CHRISTIAN', 'Christian'),
        ('ISLAMIC', 'Islamic'),
    ]
    
    category = models.CharField(
        max_length=20, 
        choices=CATEGORY_CHOICES, 
        db_index=True,
        help_text="Quote category matching user preferences"
    )
    date = models.DateField(
        db_index=True,
        help_text="The date this quote is for"
    )
    
    # Bilingual quote text
    quote_text_en = models.TextField(default='', help_text="The quote in English")
    quote_text_fr = models.TextField(default='', help_text="The quote in French")
    
    author = models.CharField(max_length=150, help_text="Author or source of the quote")
    
    # Bilingual explanation
    explanation_en = models.TextField(default='', help_text="Explanation in English")
    explanation_fr = models.TextField(default='', help_text="Explanation in French")
    
    # Bilingual affirmations
    affirmations_en = models.JSONField(
        default=list, 
        blank=True,
        help_text="List of affirmation strings in English"
    )
    affirmations_fr = models.JSONField(
        default=list, 
        blank=True,
        help_text="List of affirmation strings in French"
    )
    
    source_reference = models.CharField(
        max_length=200, 
        blank=True,
        help_text="Bible verse, Hadith reference, book title, etc."
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['category', 'date']  # One quote per category per day
        ordering = ['-date', 'category']
        verbose_name = 'Daily Quote'
        verbose_name_plural = 'Daily Quotes'
    
    def __str__(self):
        return f"{self.date} - {self.category}: {self.quote_text_en[:50]}..."
    
    def get_quote_text(self, lang='en'):
        """Return quote text in requested language"""
        return self.quote_text_fr if lang == 'fr' else self.quote_text_en
    
    def get_explanation(self, lang='en'):
        """Return explanation in requested language"""
        return self.explanation_fr if lang == 'fr' else self.explanation_en
    
    def get_affirmations(self, lang='en'):
        """Return affirmations in requested language"""
        return self.affirmations_fr if lang == 'fr' else self.affirmations_en


class UserNotification(models.Model):
    """
    In-app notifications for users.
    Stores persistent notification records that users can view in a notification center.
    """
    NOTIFICATION_TYPE_CHOICES = [
        ('FOR_YOU', 'For You (Personalized)'),
        ('ARTICLE', 'New Article'),
        ('SYSTEM', 'System Notification'),
        ('PROMO', 'Promotional'),
        ('REMINDER', 'Reminder'),
    ]
    
    user = models.ForeignKey(
        'auth.User',
        on_delete=models.CASCADE,
        related_name='notifications',
        db_index=True
    )
    
    # Bilingual title and message
    title_en = models.CharField(max_length=200, help_text="Notification title in English")
    title_fr = models.CharField(max_length=200, blank=True, help_text="Notification title in French")
    message_en = models.TextField(help_text="Notification message in English")
    message_fr = models.TextField(blank=True, help_text="Notification message in French")
    
    # Optional link to related article
    article = models.ForeignKey(
        'Article',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='notifications',
        help_text="Related article (if applicable)"
    )
    
    # Media and links
    thumbnail_url = models.URLField(max_length=500, blank=True, help_text="Image URL for notification")
    link_url = models.URLField(max_length=500, blank=True, help_text="Custom URL if no article linked")
    
    # Notification metadata
    notification_type = models.CharField(
        max_length=20,
        choices=NOTIFICATION_TYPE_CHOICES,
        default='ARTICLE',
        db_index=True
    )
    
    # Read status
    is_read = models.BooleanField(default=False, db_index=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'User Notification'
        verbose_name_plural = 'User Notifications'
        indexes = [
            models.Index(fields=['user', 'is_read', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.email}: {self.title_en[:50]}"
    
    def get_title(self, lang='en'):
        """Return title in requested language"""
        if lang == 'fr' and self.title_fr:
            return self.title_fr
        return self.title_en
    
    def get_message(self, lang='en'):
        """Return message in requested language"""
        if lang == 'fr' and self.message_fr:
            return self.message_fr
        return self.message_en
    
    def get_link(self, lang='en'):
        """Return the appropriate link for this notification"""
        if self.article:
            return f"/{lang}/article/{self.article.id}/"
        return self.link_url or ""
    
    def mark_as_read(self):
        """Mark notification as read"""
        if not self.is_read:
            from django.utils import timezone
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])
