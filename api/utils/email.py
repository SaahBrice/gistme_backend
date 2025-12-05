"""
Email utility for Pro member notifications.
Uses Django's built-in SMTP backend for sending emails asynchronously.
"""
import threading
import logging
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from urllib.parse import urlencode

logger = logging.getLogger(__name__)


def _send_email_async(subject, message, html_message, recipient_email):
    """
    Internal function to send email in a separate thread (non-blocking).
    """
    try:
        send_mail(
            subject=subject,
            message=message,  # Plain text fallback
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient_email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f"[Email] Successfully sent to {recipient_email}")
    except Exception as e:
        logger.error(f"[Email] Failed to send to {recipient_email}: {e}")


def send_pro_notification_email(subscriber, article):
    """
    Send a notification email to a Pro subscriber about new exclusive content.
    Non-blocking - runs in a separate thread.
    
    Args:
        subscriber: Subscription model instance
        article: Article model instance
    """
    # Determine language preference (you could add a language field to Subscription)
    # For now, default to English
    
    headline = article.headline_en or article.headline_fr or article.headline or "New Pro Content"
    summary = article.english_summary or article.french_summary or ""
    category = article.category.replace("pro-", "").title() if article.category else "Exclusive"
    
    # Get thumbnail URL
    thumbnail_url = None
    if article.thumbnails and len(article.thumbnails) > 0:
        thumbnail_url = article.thumbnails[0]
    elif article.thumbnail_image:
        thumbnail_url = article.thumbnail_image.url
    
    # Get source names for attribution
    sources = ", ".join(article.source_names) if article.source_names else "Gist4U"
    
    subject = f"🎓 Pro: {headline[:50]}{'...' if len(headline) > 50 else ''}"
    
    # Plain text version with FULL content
    message = f"""
Hi {subscriber.name},

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎓 EXCLUSIVE PRO CONTENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{headline}
Category: {category}

{summary}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Source: {sources}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is exclusive content for Gist4U Pro members only.
Your subscription is valid until: {subscriber.expiry_date.strftime('%B %d, %Y')}

---
Gist4U Pro - Never miss an opportunity
"""

    # HTML version with FULL content
    html_message = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
    <div style="background-color: #080808; color: white; padding: 20px; border-radius: 10px;">
        <h1 style="color: #FFDE00; margin: 0 0 10px 0;">🎓 Gist4U Pro</h1>
        <p style="margin: 0; opacity: 0.8;">Exclusive Content - Email Only</p>
    </div>
    
    <div style="background-color: white; padding: 25px; border-radius: 10px; margin-top: 10px;">
        <p style="font-size: 16px;">Hi <strong>{subscriber.name}</strong>,</p>
        
        <p style="font-size: 14px; color: #666; margin-bottom: 20px;">Here's your exclusive Pro content 👇</p>
        
        <!-- Article Content -->
        <div style="border: 2px solid #FFDE00; border-radius: 12px; overflow: hidden; margin: 20px 0;">
            {"<img src='" + thumbnail_url + "' style='width: 100%; display: block;' alt='Article image'>" if thumbnail_url else ""}
            
            <div style="padding: 20px;">
                <span style="background-color: #FFDE00; color: #080808; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; text-transform: uppercase;">{category}</span>
                
                <h2 style="margin: 15px 0 10px 0; color: #333; font-size: 22px; line-height: 1.3;">{headline}</h2>
                
                <div style="color: #444; font-size: 15px; line-height: 1.7; white-space: pre-wrap;">
{summary}
                </div>
                
                <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee; font-size: 12px; color: #999;">
                    📰 Source: {sources}
                </div>
            </div>
        </div>
        
        <div style="background-color: #f0f0f0; padding: 15px; border-radius: 8px; text-align: center; margin-top: 20px;">
            <p style="margin: 0; color: #666; font-size: 13px;">
                🔒 This content is exclusive to Pro members
            </p>
        </div>
    </div>
    
    <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
        <p>Your Pro subscription is valid until: <strong>{subscriber.expiry_date.strftime('%B %d, %Y')}</strong></p>
        <p>Gist4U Pro - Never miss an opportunity</p>
    </div>
</body>
</html>
"""

    # Send in background thread
    thread = threading.Thread(
        target=_send_email_async,
        args=(subject, message, html_message, subscriber.email)
    )
    thread.start()
    logger.info(f"[Email] Queued pro notification for {subscriber.email}")


def send_expiry_notification_email(subscriber, article):
    """
    Send an email notifying user their Pro subscription has expired.
    Includes a resubscription link.
    Non-blocking - runs in a separate thread.
    
    Args:
        subscriber: Subscription model instance (expired)
        article: Article model instance they're missing
    """
    headline = article.headline_en or article.headline_fr or article.headline or "Exclusive Content"
    
    # Build resubscription link - goes to homepage where the modal will auto-open
    params = urlencode({
        'email': subscriber.email,
        'name': subscriber.name,
        'renew': 'true'
    })
    resubscribe_link = f"{settings.SITE_URL}/?{params}"
    
    subject = f"⚠️ Your Gist4U Pro subscription has expired"
    
    # Plain text version
    message = f"""
Hi {subscriber.name},

You're missing out on exclusive Pro content like:
"{headline}"

Your Pro subscription expired on {subscriber.expiry_date.strftime('%B %d, %Y')}.

To continue receiving Pro content, renew your subscription:
{resubscribe_link}

---
Gist4U Pro - Don't miss exclusive opportunities!
"""

    # HTML version
    html_message = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
    <div style="background-color: #FF6B6B; color: white; padding: 20px; border-radius: 10px;">
        <h1 style="margin: 0 0 10px 0;">⚠️ Subscription Expired</h1>
        <p style="margin: 0; opacity: 0.9;">Your Gist4U Pro access has ended</p>
    </div>
    
    <div style="background-color: white; padding: 25px; border-radius: 10px; margin-top: 10px;">
        <p style="font-size: 16px;">Hi <strong>{subscriber.name}</strong>,</p>
        
        <p style="font-size: 15px; color: #666;">You're missing out on exclusive Pro content like:</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; border-left: 4px solid #FFDE00; margin: 20px 0;">
            <p style="margin: 0; font-style: italic; color: #333;">"{headline}"</p>
        </div>
        
        <p style="color: #999; font-size: 14px;">
            Your Pro subscription expired on <strong>{subscriber.expiry_date.strftime('%B %d, %Y')}</strong>
        </p>
        
        <p style="font-size: 15px; color: #333; margin-top: 20px;">
            Don't miss out on scholarships, concours, job opportunities, and more exclusive content!
        </p>
        
        <a href="{resubscribe_link}" style="display: inline-block; background-color: #FFDE00; color: #080808; padding: 15px 35px; text-decoration: none; border-radius: 25px; font-weight: bold; margin-top: 15px; font-size: 16px;">Renew My Subscription →</a>
    </div>
    
    <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
        <p>Gist4U Pro - Exclusive opportunities await</p>
    </div>
</body>
</html>
"""

    # Send in background thread
    thread = threading.Thread(
        target=_send_email_async,
        args=(subject, message, html_message, subscriber.email)
    )
    thread.start()
    logger.info(f"[Email] Queued expiry notification for {subscriber.email}")
