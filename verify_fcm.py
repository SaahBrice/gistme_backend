import os
import django
import sys
import logging

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gistme_backend.settings')
django.setup()

from api.models import Article, FCMSubscription
from api.utils.fcm import send_push_notification

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def verify_fcm():
    print("Starting FCM Verification...")

    # 1. Create a dummy subscription
    token = "test_token_" + os.urandom(4).hex()
    try:
        sub = FCMSubscription.objects.create(token=token)
        print(f"[PASS] Created FCMSubscription with token: {token}")
    except Exception as e:
        print(f"[FAIL] Failed to create FCMSubscription: {e}")
        return

    # 2. Create a dummy article with send_notification=True
    # This should trigger the signal, which calls send_push_notification
    try:
        article = Article.objects.create(
            headline="Test Article for FCM",
            category="Test",
            mood="Happy",
            french_summary="Ceci est un test.",
            english_summary="This is a test.",
            send_notification=True
        )
        print(f"[PASS] Created Article with send_notification=True. ID: {article.id}")
        
        # We can't easily verify the thread ran successfully without waiting or checking logs/mocking.
        # But if it didn't crash the main thread, that's a good sign for non-blocking.
        print("[INFO] Check console logs for 'Firebase Admin SDK initialized' or errors.")
        
    except Exception as e:
        print(f"[FAIL] Failed to create Article: {e}")

    # 3. Clean up
    try:
        sub.delete()
        article.delete()
        print("[PASS] Cleaned up test data.")
    except Exception as e:
        print(f"[WARN] Failed to clean up: {e}")

if __name__ == "__main__":
    verify_fcm()
