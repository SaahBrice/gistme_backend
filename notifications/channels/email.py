"""
Email Channel Handler
Handles sending email notifications with HTML templates.
"""
import logging
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)

# Email templates mapping
EMAIL_TEMPLATES = {
    # Mentor notifications
    'mentor_request_mentee': {
        'subject_en': '🎓 Your Mentor Request Has Been Received!',
        'subject_fr': '🎓 Votre demande de mentorat a été reçue !',
        'template': 'notifications/email/mentor_request_mentee.html',
    },
    'mentor_request_mentor': {
        'subject_en': '🌟 You Have a New Mentee Request!',
        'subject_fr': '🌟 Vous avez une nouvelle demande de mentorat !',
        'template': 'notifications/email/mentor_request_mentor.html',
    },
    # User lifecycle
    'welcome': {
        'subject_en': '🎉 Welcome to Gist4U!',
        'subject_fr': '🎉 Bienvenue sur Gist4U !',
        'template': 'notifications/email/welcome.html',
    },
    'onboarding_complete': {
        'subject_en': '🚀 You\'re All Set! Start Exploring',
        'subject_fr': '🚀 Vous êtes prêt ! Commencez à explorer',
        'template': 'notifications/email/onboarding_complete.html',
    },
    # Admin notifications
    'admin_new_user': {
        'subject_en': '👤 New User Signup: {user_email}',
        'subject_fr': '👤 Nouvelle inscription: {user_email}',
        'template': 'notifications/email/admin_new_user.html',
    },
    'admin_assistance_request': {
        'subject_en': '🆘 New Assistance Request #{request_id}',
        'subject_fr': '🆘 Nouvelle demande d\'assistance #{request_id}',
        'template': 'notifications/email/admin_assistance_request.html',
    },
    'admin_mentor_request': {
        'subject_en': '🎓 New Mentor Request: {mentee_name} → {mentor_name}',
        'subject_fr': '🎓 Nouvelle demande de mentorat: {mentee_name} → {mentor_name}',
        'template': 'notifications/email/admin_mentor_request.html',
    },
    'admin_sponsor_request': {
        'subject_en': '💼 New {inquiry_type} Request from {name}',
        'subject_fr': '💼 Nouvelle demande {inquiry_type} de {name}',
        'template': 'notifications/email/admin_sponsor_request.html',
    },
}


def send_email_notification(notification_type: str, recipient_email: str, context: dict, language: str = 'en'):
    """
    Send an email notification using HTML templates.
    
    Args:
        notification_type: Type identifier to look up template
        recipient_email: Recipient's email address
        context: Template context variables
        language: Language code ('en' or 'fr')
    """
    if notification_type not in EMAIL_TEMPLATES:
        raise ValueError(f"Unknown email notification type: {notification_type}")
    
    template_config = EMAIL_TEMPLATES[notification_type]
    
    # Get subject based on language and format with context variables
    subject = template_config.get(f'subject_{language}', template_config.get('subject_en'))
    try:
        subject = subject.format(**context)
    except KeyError:
        pass  # Keep original subject if formatting fails
    
    # Add language to context
    context['language'] = language
    context['site_url'] = getattr(settings, 'SITE_URL', 'https://gist4u.co')
    
    # Render HTML template
    try:
        html_message = render_to_string(template_config['template'], context)
    except Exception as e:
        logger.error(f"[Email] Template render error for {notification_type}: {e}")
        # Fallback to simple text
        html_message = _get_fallback_html(notification_type, context, language)
    
    # Plain text version
    plain_message = strip_tags(html_message)
    
    # Send email
    send_mail(
        subject=subject,
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[recipient_email],
        html_message=html_message,
        fail_silently=False,
    )
    
    logger.info(f"[Email] Sent {notification_type} to {recipient_email}")


def _get_fallback_html(notification_type: str, context: dict, language: str) -> str:
    """Generate a simple fallback HTML if template fails."""
    messages = {
        'mentor_request_mentee': {
            'en': f"Hi {context.get('mentee_name', 'there')},\n\nWe've received your request to connect with {context.get('mentor_name', 'a mentor')}. We'll process it within 24 hours.\n\nBest,\nGist4U Team",
            'fr': f"Bonjour {context.get('mentee_name', '')},\n\nNous avons reçu votre demande de mentorat avec {context.get('mentor_name', 'un mentor')}. Nous la traiterons dans les 24 heures.\n\nCordialement,\nL'équipe Gist4U",
        },
        'mentor_request_mentor': {
            'en': f"Hey {context.get('mentor_name', 'there')}! 🎉\n\nGreat news - {context.get('mentee_name', 'Someone')} wants YOU as their mentor! We'll check if they're a good fit and connect you soon.\n\nExciting times!\nGist4U Team",
            'fr': f"Salut {context.get('mentor_name', '')} ! 🎉\n\nBonne nouvelle - {context.get('mentee_name', 'Quelqu un')} vous a choisi comme mentor ! Nous vérifierons si c'est compatible et nous vous mettrons en contact bientôt.\n\nQue l'aventure commence !\nL'équipe Gist4U",
        },
        'welcome': {
            'en': f"Welcome to Gist4U, {context.get('user_name', 'friend')}! 🎉\n\nWe're thrilled to have you. Get ready to discover opportunities!",
            'fr': f"Bienvenue sur Gist4U, {context.get('user_name', 'ami')} ! 🎉\n\nNous sommes ravis de vous accueillir. Préparez-vous à découvrir des opportunités !",
        },
        'onboarding_complete': {
            'en': f"You're all set, {context.get('user_name', 'friend')}! 🚀\n\nThe long chase is over. We're bringing gists and opportunities right to your door. Start exploring!",
            'fr': f"Vous êtes prêt, {context.get('user_name', 'ami')} ! 🚀\n\nLa longue course est terminée. Nous apportons les gists et opportunités directement à votre porte. Commencez à explorer !",
        },
        # Admin notifications
        'admin_new_user': {
            'en': f"New user signup!\n\nEmail: {context.get('user_email', 'N/A')}\nName: {context.get('user_name', 'N/A')}\nTime: {context.get('signup_time', 'N/A')}",
            'fr': f"Nouvelle inscription!\n\nEmail: {context.get('user_email', 'N/A')}\nNom: {context.get('user_name', 'N/A')}\nHeure: {context.get('signup_time', 'N/A')}",
        },
        'admin_assistance_request': {
            'en': f"New assistance request!\n\nRequest ID: #{context.get('request_id', 'N/A')}\nArticle: {context.get('article_title', 'N/A')}\nEmail: {context.get('user_email', 'N/A')}\nPhone: {context.get('phone', 'N/A')}\nMessage: {context.get('message', 'N/A')}",
            'fr': f"Nouvelle demande d'assistance!\n\nID Demande: #{context.get('request_id', 'N/A')}\nArticle: {context.get('article_title', 'N/A')}\nEmail: {context.get('user_email', 'N/A')}\nTéléphone: {context.get('phone', 'N/A')}\nMessage: {context.get('message', 'N/A')}",
        },
        'admin_mentor_request': {
            'en': f"New mentor request!\n\nMentee: {context.get('mentee_name', 'N/A')} ({context.get('mentee_email', 'N/A')})\nMentor: {context.get('mentor_name', 'N/A')}\nMessage: {context.get('message', 'N/A')}",
            'fr': f"Nouvelle demande de mentorat!\n\nMentoré: {context.get('mentee_name', 'N/A')} ({context.get('mentee_email', 'N/A')})\nMentor: {context.get('mentor_name', 'N/A')}\nMessage: {context.get('message', 'N/A')}",
        },
        'admin_sponsor_request': {
            'en': f"New {context.get('inquiry_type', 'sponsor/partner')} request!\n\nName: {context.get('name', 'N/A')}\nEmail: {context.get('email', 'N/A')}\nPhone: {context.get('phone', 'N/A')}\nOrganization: {context.get('organization', 'N/A')}\nDescription: {context.get('description', 'N/A')}",
            'fr': f"Nouvelle demande {context.get('inquiry_type', 'sponsor/partenaire')}!\n\nNom: {context.get('name', 'N/A')}\nEmail: {context.get('email', 'N/A')}\nTéléphone: {context.get('phone', 'N/A')}\nOrganisation: {context.get('organization', 'N/A')}\nDescription: {context.get('description', 'N/A')}",
        },
    }
    
    message = messages.get(notification_type, {}).get(language, 'Notification from Gist4U')
    
    return f"""
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto;">
            <h2 style="color: #FACC15;">Gist4U</h2>
            <div style="white-space: pre-wrap;">{message}</div>
        </div>
    </body>
    </html>
    """
