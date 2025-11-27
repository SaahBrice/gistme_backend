from django.db import models
from django.utils import timezone


class Subscription(models.Model):
    """Model to store Pro subscription data"""
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20, help_text="Cameroon phone number")
    email = models.EmailField()
    subscribed_at = models.DateTimeField(default=timezone.now)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-subscribed_at']
        verbose_name = 'Pro Subscription'
        verbose_name_plural = 'Pro Subscriptions'
    
    def __str__(self):
        return f"{self.name} - {self.email}"


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

