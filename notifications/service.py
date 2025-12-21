"""
Centralized Notification Service
Routes notifications to appropriate channels based on type and recipient preferences.
"""
import logging
import threading
from django.utils import timezone
from django.conf import settings

from .models import NotificationLog

logger = logging.getLogger(__name__)


class NotificationService:
    """
    Central notification service that handles all app notifications.
    
    Usage:
        from notifications.service import notify
        
        notify(
            notification_type='mentor_request_mentee',
            recipient_email='user@example.com',
            context={'mentor_name': 'Dr. John', 'mentee_name': 'Jane'},
            language='en',
            channels=['email']
        )
    """
    
    @staticmethod
    def send(
        notification_type: str,
        recipient_email: str = None,
        recipient_user=None,
        context: dict = None,
        language: str = 'en',
        channels: list = None
    ):
        """
        Send a notification through specified channels.
        
        Args:
            notification_type: Type identifier (e.g., 'mentor_request_mentee')
            recipient_email: Email address of recipient
            recipient_user: User model instance (optional, for user-linked notifications)
            context: Dictionary of context variables for templates
            language: Language code ('en' or 'fr')
            channels: List of channels to use ['email', 'push']. Defaults to ['email']
        """
        if channels is None:
            channels = ['email']
        
        if context is None:
            context = {}
        
        # Get recipient email from user if not provided
        if not recipient_email and recipient_user:
            recipient_email = getattr(recipient_user, 'email', None)
        
        # Determine language from user preference if not specified
        if recipient_user and hasattr(recipient_user, 'preferred_language'):
            language = recipient_user.preferred_language or language
        
        results = {}
        
        for channel in channels:
            # Create log entry
            log = NotificationLog.objects.create(
                notification_type=notification_type,
                channel=channel,
                recipient_email=recipient_email,
                recipient_user=recipient_user,
                language=language,
                context=context,
                status='pending'
            )
            
            try:
                if channel == 'email':
                    from .channels.email import send_email_notification
                    # Run in background thread for non-blocking
                    thread = threading.Thread(
                        target=_send_and_log,
                        args=(send_email_notification, log, notification_type, recipient_email, context, language)
                    )
                    thread.start()
                    results[channel] = 'queued'
                    
                elif channel == 'push':
                    from .channels.push import send_push_notification
                    thread = threading.Thread(
                        target=_send_and_log,
                        args=(send_push_notification, log, notification_type, recipient_email, context, language)
                    )
                    thread.start()
                    results[channel] = 'queued'
                    
                else:
                    log.status = 'failed'
                    log.error_message = f'Unknown channel: {channel}'
                    log.save()
                    results[channel] = 'failed'
                    
            except Exception as e:
                logger.error(f"Failed to queue {channel} notification: {e}")
                log.status = 'failed'
                log.error_message = str(e)
                log.save()
                results[channel] = 'failed'
        
        return results


def _send_and_log(send_func, log, notification_type, recipient_email, context, language):
    """Helper to send notification and update log status."""
    try:
        send_func(notification_type, recipient_email, context, language)
        log.status = 'sent'
        log.sent_at = timezone.now()
        log.save()
        logger.info(f"[Notification] Sent {notification_type} to {recipient_email} via {log.channel}")
    except Exception as e:
        log.status = 'failed'
        log.error_message = str(e)
        log.save()
        logger.error(f"[Notification] Failed {notification_type} to {recipient_email}: {e}")


# Convenience function
def notify(notification_type, **kwargs):
    """Shortcut for NotificationService.send()"""
    return NotificationService.send(notification_type, **kwargs)
