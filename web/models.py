from django.db import models
from django.utils import timezone


class Subscription(models.Model):
    """Model to store Pro subscription data"""
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
