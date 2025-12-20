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
