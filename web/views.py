from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
from .models import Subscription, Advertisement
from django.conf import settings
import os
from django.http import HttpResponse

def index(request):
    return render(request, 'web/index.html')

def feed(request):
    return render(request, 'web/feed.html')

@csrf_exempt
@require_http_methods(["POST"])
def subscribe(request):
    """API endpoint to handle subscription submissions"""
    try:
        data = json.loads(request.body)
        
        # Extract form data
        name = data.get('name', '').strip()
        phone = data.get('phone', '').strip()
        email = data.get('email', '').strip()
        gist_preferences = data.get('gist_preferences', 'scholarships, concours and jobs').strip()
        
        # Basic validation
        if not all([name, phone, email]):
            return JsonResponse({
                'success': False,
                'error': 'All fields are required'
            }, status=400)
        
        # Create subscription
        subscription = Subscription.objects.create(
            name=name,
            phone=phone,
            email=email,
            gist_preferences=gist_preferences
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Subscription successful!',
            'subscription_id': subscription.id
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def advertise(request):
    """API endpoint to handle advertising inquiry submissions"""
    try:
        data = json.loads(request.body)
        
        # Extract form data
        organization_name = data.get('organization_name', '').strip()
        phone = data.get('phone', '').strip()
        email = data.get('email', '').strip()
        
        # Basic validation
        if not all([organization_name, phone, email]):
            return JsonResponse({
                'success': False,
                'error': 'All fields are required'
            }, status=400)
        
        # Create advertisement inquiry
        ad = Advertisement.objects.create(
            organization_name=organization_name,
            phone=phone,
            email=email
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Thank you! Our agent will contact you within 12 hours.',
            'inquiry_id': ad.id
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def join_waiting_list(request):
    """API endpoint to handle waiting list submissions"""
    try:
        data = json.loads(request.body)
        
        # Honeypot check (if 'website' field is filled, it's a bot)
        if data.get('website'):
            return JsonResponse({
                'success': True,  # Fake success to fool bots
                'message': 'Successfully joined!'
            })
            
        # Extract form data
        email = data.get('email', '').strip()
        phone = data.get('phone', '').strip()
        
        # Basic validation
        if not email:
            return JsonResponse({
                'success': False,
                'error': 'Email is required'
            }, status=400)
            
        # Create waiting list entry
        from .models import WaitingList
        
        # Get client IP
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
            
        entry, created = WaitingList.objects.get_or_create(
            email=email,
            defaults={
                'phone': phone,
                'ip_address': ip,
                'user_agent': request.META.get('HTTP_USER_AGENT', '')
            }
        )
        
        if not created and phone:
            # Update phone if provided and entry existed
            entry.phone = phone
            entry.save()
        
        return JsonResponse({
            'success': True,
            'message': 'You have been added to the waiting list!',
            'entry_id': entry.id
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


def firebase_messaging_sw(request):
    """
    Serve the Firebase Messaging Service Worker from the root.
    """
    path = os.path.join(settings.BASE_DIR, 'web', 'static', 'firebase-messaging-sw.js')
    try:
        with open(path, 'r') as f:
            content = f.read()
        return HttpResponse(content, content_type='application/javascript')
    except FileNotFoundError:
        return HttpResponse("Service Worker not found", status=404)
