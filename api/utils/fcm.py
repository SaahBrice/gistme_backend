import firebase_admin
from firebase_admin import credentials, messaging
from django.conf import settings
import logging
import threading
from api.models import FCMSubscription

logger = logging.getLogger(__name__)

# Initialize Firebase Admin SDK
# TODO: Replace with actual path or environment variable for credentials
# For now, we'll assume GOOGLE_APPLICATION_CREDENTIALS env var is set or default creds work
# or we can initialize with a service account file if provided in settings.

_is_initialized = False

def initialize_firebase():
    global _is_initialized
    if _is_initialized:
        return

    try:
        # Check if already initialized by checking apps
        if not firebase_admin._apps:
            # Try to load from serviceAccountKey.json if it exists
            import os
            # Assuming the file is in the root of gistme_backend (parent of api)
            # Adjust path logic as needed. Here we assume CWD is gistme_backend or we find it relative to this file.
            base_dir = settings.BASE_DIR
            cred_path = os.path.join(base_dir, "serviceAccountKey.json")
            
            if os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
                logger.info(f"Firebase Admin SDK initialized with {cred_path}")
            else:
                # Fallback to default (environment variable)
                firebase_admin.initialize_app()
                logger.info("Firebase Admin SDK initialized with default credentials.")
                
        _is_initialized = True
    except Exception as e:
        logger.error(f"Failed to initialize Firebase Admin SDK: {e}")

def _send_multicast(article_data, tokens, language=''):
    """
    Internal function to send multicast message.
    Batches tokens into groups of 500 (Firebase limit).
    """
    initialize_firebase()
    
    if not tokens:
        return
    
    # Firebase limit: 500 tokens per multicast request
    BATCH_SIZE = 500
    total_tokens = len(tokens)
    total_success = 0
    total_failure = 0
    
    # Split tokens into batches of 500
    for batch_num, i in enumerate(range(0, total_tokens, BATCH_SIZE), 1):
        batch_tokens = tokens[i:i + BATCH_SIZE]
        batch_size = len(batch_tokens)
        
        logger.info(f"{language}Batch {batch_num}/{(total_tokens + BATCH_SIZE - 1) // BATCH_SIZE}: Sending to {batch_size} devices")

        # Build full URL - Firebase requires HTTPS even for localhost
        from django.conf import settings
        
        if hasattr(settings, 'SITE_URL'):
            base_url = settings.SITE_URL
        else:
            base_url = 'https://localhost:8000'
        
        link_url = f"{base_url}/article/{article_data.get('id')}/"
        
        message = messaging.MulticastMessage(
            notification=messaging.Notification(
                title=article_data.get('headline', 'New Article'),
                body=article_data.get('summary', 'Check out the latest update!'),
                image=article_data.get('thumbnail_url'),
            ),
            data={
                'click_action': link_url,
                'link': link_url,
                'article_id': str(article_data.get('id')),
            },
            webpush=messaging.WebpushConfig(
                notification=messaging.WebpushNotification(
                    icon='/static/web/img/icon.png',
                ),
                fcm_options=messaging.WebpushFCMOptions(
                    link=link_url
                )
            ),
            tokens=batch_tokens,
        )

        try:
            response = messaging.send_each_for_multicast(message)
            total_success += response.success_count
            total_failure += response.failure_count
            
            logger.info(f"{language}Batch {batch_num}: {response.success_count} successful, {response.failure_count} failed")
            
            if response.failure_count > 0:
                responses = response.responses
                failed_tokens = []
                for idx, resp in enumerate(responses):
                    if not resp.success:
                        failed_tokens.append(batch_tokens[idx])
                        logger.warning(f"Failed to send to token {batch_tokens[idx][:20]}...: {resp.exception}")
                
                # Optional: Clean up invalid tokens
                # FCMSubscription.objects.filter(token__in=failed_tokens).delete()
                
        except Exception as e:
            logger.error(f"{language}Batch {batch_num} error: {e}")
            total_failure += batch_size
    
    logger.info(f"{language}Total: {total_success} successful, {total_failure} failed out of {total_tokens}")


def send_push_notification(article):
    """
    Sends a push notification for the given article to all subscribers.
    Sends separate notifications for French and English users.
    Uses batching to handle 500+ users per language.
    This runs in a separate thread to be non-blocking.
    """
    try:
        # Prepare thumbnail URL
        thumbnail_url = None
        if article.thumbnails and len(article.thumbnails) > 0:
            thumbnail_url = article.thumbnails[0]
        elif article.thumbnail_image:
             thumbnail_url = article.thumbnail_image.url

        # Get all FCM subscriptions grouped by language
        # Using values_list for memory efficiency
        french_tokens = list(FCMSubscription.objects.filter(preferred_language='fr').values_list('token', flat=True))
        english_tokens = list(FCMSubscription.objects.filter(preferred_language='en').values_list('token', flat=True))
        
        logger.info(f"Preparing notifications: {len(french_tokens)} French, {len(english_tokens)} English")

        # Send French notifications
        if french_tokens:
            headline_fr = article.headline_fr or article.headline or "Nouvelle histoire"
            summary_fr = article.french_summary or "Lisez la dernière histoire sur Gist4u."
            summary_fr = (summary_fr[:100] + '...') if len(summary_fr) > 100 else summary_fr
            
            article_data_fr = {
                'id': article.id,
                'headline': headline_fr,
                'summary': summary_fr,
                'thumbnail_url': thumbnail_url
            }
            
            logger.info(f"Starting French notifications: {headline_fr}")
            thread = threading.Thread(target=_send_multicast, args=(article_data_fr, french_tokens, '[FR] '))
            thread.start()

        # Send English notifications
        if english_tokens:
            headline_en = article.headline_en or article.headline or "New Story"
            summary_en = article.english_summary or "Read the latest story on Gist4u."
            summary_en = (summary_en[:100] + '...') if len(summary_en) > 100 else summary_en
            
            article_data_en = {
                'id': article.id,
                'headline': headline_en,
                'summary': summary_en,
                'thumbnail_url': thumbnail_url
            }
            
            logger.info(f"Starting English notifications: {headline_en}")
            thread = threading.Thread(target=_send_multicast, args=(article_data_en, english_tokens, '[EN] '))
            thread.start()
        
        if not french_tokens and not english_tokens:
            logger.info("No FCM subscribers to notify.")
        
    except Exception as e:
        logger.error(f"Error preparing push notification: {e}")


