"""
Notification Models
Tracks all sent notifications for analytics and debugging.
"""
from django.db import models
from django.conf import settings


class NotificationLog(models.Model):
    """Logs all sent notifications for tracking and analytics."""
    
    CHANNEL_CHOICES = [
        ('email', 'Email'),
        ('push', 'Push Notification'),
        ('web', 'Web Notification'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
    ]
    
    # Notification type (e.g., 'mentor_request_mentee', 'welcome')
    notification_type = models.CharField(max_length=100, db_index=True)
    
    # Channel used
    channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES)
    
    # Recipient info
    recipient_email = models.EmailField(blank=True, null=True, db_index=True)
    recipient_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='notifications_received'
    )
    
    # Language used
    language = models.CharField(max_length=2, default='en')
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    error_message = models.TextField(blank=True, null=True)
    
    # Context/payload (stored as JSON for debugging)
    context = models.JSONField(default=dict, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Notification Log'
        verbose_name_plural = 'Notification Logs'
        indexes = [
            models.Index(fields=['notification_type', 'created_at']),
            models.Index(fields=['recipient_email', 'created_at']),
        ]
    
    def __str__(self):
        status_emoji = {'pending': '⏳', 'sent': '✅', 'failed': '❌'}
        return f"{status_emoji.get(self.status, '')} {self.notification_type} to {self.recipient_email or 'Unknown'}"
