"""
Script to create sample notifications for testing.
Run with: python create_sample_notifications.py
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gistme_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from api.models import UserNotification, Article

User = get_user_model()

# Get a user to create notifications for
user = User.objects.first()
if not user:
    print("No users in database! Create a user first.")
    sys.exit(1)

print(f"Creating notifications for user: {user.email}")

# Get some articles to link to (optional)
articles = list(Article.objects.all()[:3])

# Sample notifications
sample_notifications = [
    {
        "title_en": "New scholarship opportunity for you! 🎓",
        "title_fr": "Nouvelle opportunité de bourse pour vous! 🎓",
        "message_en": "Based on your preferences, we found a fully-funded Master's program in Canada that matches your profile.",
        "message_fr": "Selon vos préférences, nous avons trouvé un programme de Master entièrement financé au Canada qui correspond à votre profil.",
        "notification_type": "FOR_YOU",
        "thumbnail_url": "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=200",
    },
    {
        "title_en": "Don't miss this deadline! ⏰",
        "title_fr": "Ne manquez pas cette date limite! ⏰",
        "message_en": "The DAAD scholarship application closes in 3 days. Apply now before it's too late!",
        "message_fr": "La candidature à la bourse DAAD se ferme dans 3 jours. Postulez maintenant avant qu'il ne soit trop tard!",
        "notification_type": "REMINDER",
        "thumbnail_url": "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=200",
    },
    {
        "title_en": "Your daily gist is ready 📰",
        "title_fr": "Votre gist quotidien est prêt 📰",
        "message_en": "5 new opportunities matching your interests were just published. Check them out!",
        "message_fr": "5 nouvelles opportunités correspondant à vos intérêts viennent d'être publiées. Découvrez-les!",
        "notification_type": "ARTICLE",
        "thumbnail_url": "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=200",
    },
    {
        "title_en": "Welcome to Gist4U! 🎉",
        "title_fr": "Bienvenue sur Gist4U! 🎉",
        "message_en": "Thanks for joining! Start exploring scholarships, jobs, and opportunities tailored just for you.",
        "message_fr": "Merci de nous avoir rejoints! Commencez à explorer les bourses, emplois et opportunités faits pour vous.",
        "notification_type": "SYSTEM",
        "thumbnail_url": "",
        "is_read": True,  # Already read
    },
    {
        "title_en": "Special offer: 50% off Pro! 💎",
        "title_fr": "Offre spéciale: 50% de réduction sur Pro! 💎",
        "message_en": "Upgrade to Pro and get audio summaries, offline mode, and priority alerts for only 750 FCFA!",
        "message_fr": "Passez à Pro et obtenez des résumés audio, le mode hors ligne et les alertes prioritaires pour seulement 750 FCFA!",
        "notification_type": "PROMO",
        "link_url": "/pricing/",
        "thumbnail_url": "",
        "is_read": True,
    },
]

# Delete existing notifications for clean test
UserNotification.objects.filter(user=user).delete()
print("Cleared existing notifications.")

# Create notifications
created_count = 0
for i, notif_data in enumerate(sample_notifications):
    is_read = notif_data.pop('is_read', False)
    link_url = notif_data.pop('link_url', '')
    
    # Link to article if available
    article = articles[i % len(articles)] if articles and i < 3 else None
    
    notification = UserNotification.objects.create(
        user=user,
        article=article,
        link_url=link_url,
        is_read=is_read,
        **notif_data
    )
    created_count += 1
    status = "✓ (read)" if is_read else "○ (unread)"
    print(f"  {status} {notification.title_en[:40]}...")

print(f"\n✅ Created {created_count} sample notifications!")
print(f"Unread count: {UserNotification.objects.filter(user=user, is_read=False).count()}")
