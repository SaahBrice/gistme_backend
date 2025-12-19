"""
URL configuration for gistme_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.conf.urls.i18n import i18n_patterns
from django.shortcuts import redirect
from django.utils.translation import get_language_from_request


def language_redirect(request):
    """Redirect root URL to the appropriate language-prefixed version."""
    # Check for existing language cookie
    if 'django_language' in request.COOKIES:
        lang = request.COOKIES['django_language']
    else:
        # Detect from browser Accept-Language header
        lang = get_language_from_request(request, check_path=False) or 'en'
    
    # Ensure it's one of our supported languages
    if lang not in ['en', 'fr']:
        lang = 'en'
    
    return redirect(f'/{lang}/')


# Non-localized URLs (API, admin, webhooks should not have language prefix)
urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("api.urls")),
    path("accounts/", include("allauth.urls")),  # Google OAuth URLs
    # Language selection endpoint
    path('i18n/', include('django.conf.urls.i18n')),
    # Root redirect based on language preference
    path('', language_redirect, name='root_redirect'),
]

# Localized URLs (all web pages get /en/ or /fr/ prefix)
urlpatterns += i18n_patterns(
    path("", include("web.urls")),
    prefix_default_language=True,  # Show /en/ even for default language
)

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
