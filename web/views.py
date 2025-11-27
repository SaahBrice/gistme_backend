from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
from .models import Subscription

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
            email=email
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


