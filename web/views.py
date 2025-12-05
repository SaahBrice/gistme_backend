from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
from .models import Subscription, Advertisement, Coupon, CouponUsage
from django.conf import settings
import os
from django.http import HttpResponse

def index(request):
    return render(request, 'web/index.html')

def feed(request):
    return render(request, 'web/feed.html')


@csrf_exempt
@require_http_methods(["POST"])
def validate_coupon(request):
    """API endpoint to validate a coupon code in real-time"""
    try:
        data = json.loads(request.body)
        code = data.get('code', '').strip().upper()
        email = data.get('email', '').strip().lower()
        
        if not code:
            return JsonResponse({
                'valid': False,
                'message': 'Please enter a coupon code'
            })
        
        # Find coupon
        try:
            coupon = Coupon.objects.get(code__iexact=code)
        except Coupon.DoesNotExist:
            return JsonResponse({
                'valid': False,
                'message': 'Invalid coupon code'
            })
        
        # Check if coupon is active and has uses left
        if not coupon.is_active:
            return JsonResponse({
                'valid': False,
                'message': 'This coupon is no longer active'
            })
        
        if coupon.current_uses >= coupon.max_uses:
            return JsonResponse({
                'valid': False,
                'message': 'This coupon has reached its usage limit'
            })
        
        # Check if user already used this coupon
        if email and CouponUsage.objects.filter(coupon=coupon, email=email.lower()).exists():
            return JsonResponse({
                'valid': False,
                'message': 'You have already used this coupon'
            })
        
        # Coupon is valid!
        return JsonResponse({
            'valid': True,
            'message': f'{coupon.discount_percent}% discount applied!',
            'discount_percent': coupon.discount_percent,
            'original_price': Coupon.BASE_PRICE,
            'final_price': coupon.get_discounted_price()
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'valid': False, 'message': 'Invalid request'})
    except Exception as e:
        return JsonResponse({'valid': False, 'message': str(e)})


@csrf_exempt
@require_http_methods(["POST"])
def subscribe(request):
    """API endpoint to handle subscription submissions and resubscriptions"""
    try:
        data = json.loads(request.body)
        
        # Extract form data
        name = data.get('name', '').strip()
        phone = data.get('phone', '').strip()
        email = data.get('email', '').strip().lower()
        gist_preferences = data.get('gist_preferences', 'scholarships, concours and jobs').strip()
        is_renewal = data.get('renew', False)
        coupon_code = data.get('coupon_code', '').strip().upper()
        
        # Basic validation
        if not all([name, phone, email]):
            return JsonResponse({
                'success': False,
                'error': 'All fields are required'
            }, status=400)
        
        # Process coupon if provided
        applied_coupon = None
        final_price = Coupon.BASE_PRICE
        
        if coupon_code:
            try:
                coupon = Coupon.objects.get(code__iexact=coupon_code)
                # Re-validate at payment time
                if coupon.is_valid() and not CouponUsage.objects.filter(coupon=coupon, email=email).exists():
                    applied_coupon = coupon
                    final_price = coupon.get_discounted_price()
            except Coupon.DoesNotExist:
                pass  # Invalid coupon - just charge full price
        
        # Check if subscription already exists for this email
        existing_sub = Subscription.objects.filter(email=email).first()
        
        if existing_sub:
            if is_renewal or not existing_sub.is_valid():
                # Reactivate/renew the subscription
                existing_sub.name = name
                existing_sub.phone = phone
                existing_sub.gist_preferences = gist_preferences
                existing_sub.reactivate()
                
                # Record coupon usage if applied
                if applied_coupon:
                    CouponUsage.objects.create(coupon=applied_coupon, email=email)
                    applied_coupon.current_uses += 1
                    applied_coupon.save(update_fields=['current_uses'])
                
                return JsonResponse({
                    'success': True,
                    'message': 'Subscription renewed successfully! Your Pro access is now active for 3 months.',
                    'subscription_id': existing_sub.id,
                    'renewed': True,
                    'expiry_date': existing_sub.expiry_date.strftime('%B %d, %Y'),
                    'final_price': final_price,
                    'coupon_applied': applied_coupon.code if applied_coupon else None
                })
            else:
                return JsonResponse({
                    'success': False,
                    'error': f'You already have an active Pro subscription until {existing_sub.expiry_date.strftime("%B %d, %Y")}!'
                }, status=400)
        
        # Create new subscription
        subscription = Subscription.objects.create(
            name=name,
            phone=phone,
            email=email,
            gist_preferences=gist_preferences
        )
        
        # Record coupon usage if applied
        if applied_coupon:
            CouponUsage.objects.create(coupon=applied_coupon, email=email)
            applied_coupon.current_uses += 1
            applied_coupon.save(update_fields=['current_uses'])
        
        return JsonResponse({
            'success': True,
            'message': 'Subscription successful! Welcome to Gist4U Pro!',
            'subscription_id': subscription.id,
            'renewed': False,
            'expiry_date': subscription.expiry_date.strftime('%B %d, %Y'),
            'final_price': final_price,
            'coupon_applied': applied_coupon.code if applied_coupon else None
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
        
        organization_name = data.get('organization_name', '').strip()
        phone = data.get('phone', '').strip()
        email = data.get('email', '').strip()
        
        if not all([organization_name, phone, email]):
            return JsonResponse({
                'success': False,
                'error': 'All fields are required'
            }, status=400)
        
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
        
        if data.get('website'):
            return JsonResponse({
                'success': True,
                'message': 'Successfully joined!'
            })
            
        email = data.get('email', '').strip()
        phone = data.get('phone', '').strip()
        
        if not email:
            return JsonResponse({
                'success': False,
                'error': 'Email is required'
            }, status=400)
            
        from .models import WaitingList
        
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
    """Serve the Firebase Messaging Service Worker from the root."""
    path = os.path.join(settings.BASE_DIR, 'web', 'static', 'firebase-messaging-sw.js')
    try:
        with open(path, 'r') as f:
            content = f.read()
        return HttpResponse(content, content_type='application/javascript')
    except FileNotFoundError:
        return HttpResponse("Service Worker not found", status=404)
