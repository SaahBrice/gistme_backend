"""
Notification Signals
Hooks into Django/allauth signals to send notifications automatically.
"""
import logging
from django.db.models.signals import post_save
from django.dispatch import receiver

logger = logging.getLogger(__name__)


def send_welcome_notification(user, language='en'):
    """
    Send welcome email to a new user.
    Called after user creation via allauth.
    """
    try:
        from notifications.service import notify
        
        user_name = user.get_full_name() or user.email.split('@')[0]
        
        notify(
            'welcome',
            recipient_email=user.email,
            recipient_user=user,
            context={
                'user_name': user_name,
            },
            language=language,
            channels=['email']
        )
        logger.info(f"[Notification] Sent welcome email to {user.email}")
    except Exception as e:
        logger.error(f"[Notification] Failed to send welcome email to {user.email}: {e}")


def send_onboarding_complete_notification(user, language='en'):
    """
    Send onboarding complete email to a user who just finished onboarding.
    """
    try:
        from notifications.service import notify
        
        user_name = user.get_full_name() or user.email.split('@')[0]
        
        notify(
            'onboarding_complete',
            recipient_email=user.email,
            recipient_user=user,
            context={
                'user_name': user_name,
            },
            language=language,
            channels=['email']
        )
        logger.info(f"[Notification] Sent onboarding complete email to {user.email}")
    except Exception as e:
        logger.error(f"[Notification] Failed to send onboarding complete email to {user.email}: {e}")


# Signal receiver for user profile onboarding completion
@receiver(post_save, sender='web.UserProfile')
def on_userprofile_saved(sender, instance, created, **kwargs):
    """
    When UserProfile is updated with onboarding_completed=True, send notification.
    """
    if instance.onboarding_completed:
        # Check if onboarding was just completed (we don't want to send on every save)
        # We'll use a simple flag check
        if hasattr(instance, '_onboarding_notification_sent'):
            return
        
        # Get or create a simple flag to prevent duplicate sends
        from django.core.cache import cache
        cache_key = f"onboarding_notif_{instance.user_id}"
        
        if not cache.get(cache_key):
            # Determine language from request or default
            lang = 'fr' if hasattr(instance, 'preferred_language') and instance.preferred_language == 'fr' else 'en'
            send_onboarding_complete_notification(instance.user, language=lang)
            cache.set(cache_key, True, timeout=86400)  # 24 hours
