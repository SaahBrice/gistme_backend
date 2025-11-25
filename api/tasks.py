from django_q.tasks import async_task
from .models import VisitorSubscription
from pywebpush import webpush, WebPushException
from django.conf import settings
import json

def process_uploaded_media(file_path):
    """
    Placeholder task for processing uploaded media (e.g., resizing images, transcoding audio).
    """
    print(f"Processing media file at: {file_path}")
    # Simulate processing time
    import time
    time.sleep(5)
    print(f"Finished processing: {file_path}")

def send_push_notification(payload, session_key=None):
    """
    Send a push notification to a specific user or all users.
    """
    subscriptions = VisitorSubscription.objects.all()
    if session_key:
        subscriptions = subscriptions.filter(session_key=session_key)

    for sub in subscriptions:
        try:
            webpush(
                subscription_info={
                    "endpoint": sub.endpoint,
                    "keys": {
                        "p256dh": sub.p256dh,
                        "auth": sub.auth
                    }
                },
                data=json.dumps(payload),
                vapid_private_key=settings.WEBPUSH_SETTINGS["VAPID_PRIVATE_KEY"],
                vapid_claims={
                    "sub": f"mailto:{settings.WEBPUSH_SETTINGS['VAPID_ADMIN_EMAIL']}"
                }
            )
        except WebPushException as ex:
            print(f"Web Push failed: {ex}")
            # If subscription is invalid, delete it
            if ex.response and ex.response.status_code == 410:
                sub.delete()
