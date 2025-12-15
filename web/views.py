from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django_ratelimit.decorators import ratelimit
import json
from .models import Subscription, Advertisement, Coupon, CouponUsage
from django.conf import settings
import os
from django.http import HttpResponse

def index(request):
    # If user is already logged in, redirect to feed
    if request.user.is_authenticated:
        return redirect('feed')
    return render(request, 'web/index.html')

@ratelimit(key='ip', rate='10/m', block=True)
def auth_page(request):
    """Dedicated authentication page with Google + email options"""
    # If already logged in, redirect to onboarding or feed
    if request.user.is_authenticated:
        return redirect('onboarding')
    
    context = {
        'recaptcha_site_key': settings.RECAPTCHA_SITE_KEY,
    }
    return render(request, 'web/login.html', context)

@login_required
def onboarding(request):
    """Onboarding page for new users to curate their content"""
    return render(request, 'web/onboarding.html')

@login_required
def feed(request):
    return render(request, 'web/feed.html')

def legal(request):
    return render(request, 'web/legal.html')

def terms(request):
    return render(request, 'web/terms.html')

def contact(request):
    return render(request, 'web/contact.html')


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


def firebase_messaging_sw(request):
    """Serve the Firebase Messaging Service Worker from the root."""
    path = os.path.join(settings.BASE_DIR, 'web', 'static', 'firebase-messaging-sw.js')
    try:
        with open(path, 'r') as f:
            content = f.read()
        return HttpResponse(content, content_type='application/javascript')
    except FileNotFoundError:
        return HttpResponse("Service Worker not found", status=404)


# ============ FAPSHI PAYMENT ENDPOINTS ============

from .models import PaymentTransaction
from api.utils.fapshi import initiate_payment as fapshi_initiate_payment, check_payment_status
from django.utils import timezone


@csrf_exempt
@require_http_methods(["POST"])
def initiate_payment(request):
    """
    Initiate a Fapshi payment for Pro subscription.
    Returns a payment link to redirect user to Fapshi checkout.
    """
    try:
        data = json.loads(request.body)
        
        name = data.get('name', '').strip()
        phone = data.get('phone', '').strip()
        email = data.get('email', '').strip().lower()
        gist_preferences = data.get('gist_preferences', 'scholarships, concours and jobs').strip()
        coupon_code = data.get('coupon_code', '').strip().upper()
        is_renewal = data.get('renew', False)
        
        # Validation
        if not all([name, phone, email]):
            return JsonResponse({
                'success': False,
                'error': 'Name, phone, and email are required'
            }, status=400)
        
        # Check if already subscribed (and valid)
        existing_sub = Subscription.objects.filter(email=email).first()
        if existing_sub and existing_sub.is_valid() and not is_renewal:
            return JsonResponse({
                'success': False,
                'error': f'You already have an active Pro subscription until {existing_sub.expiry_date.strftime("%B %d, %Y")}!'
            }, status=400)
        
        # Calculate price with coupon
        base_price = Coupon.BASE_PRICE
        final_price = base_price
        applied_coupon = None
        
        if coupon_code:
            try:
                coupon = Coupon.objects.get(code__iexact=coupon_code)
                if coupon.is_valid() and not CouponUsage.objects.filter(coupon=coupon, email=email).exists():
                    applied_coupon = coupon
                    final_price = coupon.get_discounted_price()
            except Coupon.DoesNotExist:
                pass
        
        # Build redirect URL - where user returns after payment
        redirect_url = f"{settings.SITE_URL}/payment-callback/"
        
        # Initiate Fapshi payment (returns checkout link)
        result = fapshi_initiate_payment(
            amount=final_price,
            redirect_url=redirect_url,
            email=email,
            message="Gist4U Pro Subscription (3 months)"
        )
        
        if not result['success']:
            return JsonResponse({
                'success': False,
                'error': result['message']
            }, status=400)
        
        # Create payment transaction record
        transaction = PaymentTransaction.objects.create(
            trans_id=result['trans_id'],
            email=email,
            name=name,
            phone=phone,
            amount=base_price,
            final_amount=final_price,
            status='PENDING',
            coupon=applied_coupon,
            gist_preferences=gist_preferences,
            is_renewal=is_renewal
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Redirecting to payment...',
            'payment_link': result['link'],
            'trans_id': result['trans_id'],
            'amount': final_price
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["GET"])
def get_payment_status(request, trans_id):
    """
    Check the status of a payment transaction.
    Frontend polls this to know when payment completes.
    """
    try:
        # Get local transaction record
        try:
            transaction = PaymentTransaction.objects.get(trans_id=trans_id)
        except PaymentTransaction.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Transaction not found'
            }, status=404)
        
        # If already completed, return cached status
        if transaction.status in ['SUCCESSFUL', 'FAILED', 'EXPIRED']:
            return JsonResponse({
                'success': True,
                'status': transaction.status,
                'completed': transaction.status == 'SUCCESSFUL'
            })
        
        # Check with Fapshi
        result = check_payment_status(trans_id)
        
        if not result.get('success'):
            return JsonResponse({
                'success': True,
                'status': 'PENDING',
                'completed': False
            })
        
        fapshi_status = result.get('status', 'PENDING')
        
        # Update local record
        if fapshi_status in ['SUCCESSFUL', 'FAILED', 'EXPIRED']:
            transaction.status = fapshi_status
            transaction.medium = result.get('medium')
            transaction.financial_trans_id = result.get('financial_trans_id')
            
            if fapshi_status == 'SUCCESSFUL':
                transaction.completed_at = timezone.now()
                # Activate subscription
                _activate_subscription(transaction)
            
            transaction.save()
        
        return JsonResponse({
            'success': True,
            'status': fapshi_status,
            'completed': fapshi_status == 'SUCCESSFUL',
            'expiry_date': _get_expiry_date(transaction) if fapshi_status == 'SUCCESSFUL' else None
        })
        
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def fapshi_webhook(request):
    """
    Webhook endpoint for Fapshi to notify us of payment status changes.
    """
    try:
        data = json.loads(request.body)
        
        trans_id = data.get('transId')
        status = data.get('status')
        
        if not trans_id:
            return JsonResponse({'error': 'Missing transId'}, status=400)
        
        try:
            transaction = PaymentTransaction.objects.get(trans_id=trans_id)
        except PaymentTransaction.DoesNotExist:
            return JsonResponse({'error': 'Transaction not found'}, status=404)
        
        # Update transaction status
        if status in ['SUCCESSFUL', 'FAILED', 'EXPIRED']:
            transaction.status = status
            transaction.medium = data.get('medium')
            transaction.financial_trans_id = data.get('financialTransId')
            
            if status == 'SUCCESSFUL':
                transaction.completed_at = timezone.now()
                _activate_subscription(transaction)
            
            transaction.save()
        
        return JsonResponse({'success': True})
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


def _activate_subscription(transaction):
    """
    Activate or renew subscription after successful payment.
    """
    from api.utils.email import send_receipt_email
    
    # Check for existing subscription
    existing = Subscription.objects.filter(email=transaction.email).first()
    
    if existing:
        # Renew existing
        existing.name = transaction.name
        existing.phone = transaction.phone
        existing.gist_preferences = transaction.gist_preferences
        existing.reactivate()
    else:
        # Create new subscription
        Subscription.objects.create(
            name=transaction.name,
            phone=transaction.phone,
            email=transaction.email,
            gist_preferences=transaction.gist_preferences
        )
    
    # Record coupon usage
    if transaction.coupon:
        CouponUsage.objects.get_or_create(
            coupon=transaction.coupon,
            email=transaction.email
        )
        transaction.coupon.current_uses += 1
        transaction.coupon.save(update_fields=['current_uses'])
    
    # Send receipt email
    try:
        send_receipt_email(transaction)
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Failed to send receipt: {e}")


def _get_expiry_date(transaction):
    """Get the expiry date for a subscription."""
    sub = Subscription.objects.filter(email=transaction.email).first()
    if sub:
        return sub.expiry_date.strftime('%B %d, %Y')
    return None


def payment_callback(request):
    """
    Handle redirect from Fapshi after payment.
    Checks payment status and activates subscription if successful.
    """
    # Get transaction ID from URL params (Fapshi appends it)
    trans_id = request.GET.get('transId')
    
    if not trans_id:
        return render(request, 'web/payment_result.html', {
            'success': False,
            'message': 'Invalid payment callback'
        })
    
    try:
        transaction = PaymentTransaction.objects.get(trans_id=trans_id)
    except PaymentTransaction.DoesNotExist:
        return render(request, 'web/payment_result.html', {
            'success': False,
            'message': 'Transaction not found'
        })
    
    # Check status with Fapshi
    result = check_payment_status(trans_id)
    
    if result.get('success') and result.get('status') == 'SUCCESSFUL':
        # Activate subscription if not already done
        if transaction.status != 'SUCCESSFUL':
            transaction.status = 'SUCCESSFUL'
            transaction.completed_at = timezone.now()
            transaction.medium = result.get('medium')
            transaction.financial_trans_id = result.get('financial_trans_id')
            transaction.save()
            _activate_subscription(transaction)
        
        sub = Subscription.objects.filter(email=transaction.email).first()
        return render(request, 'web/payment_result.html', {
            'success': True,
            'message': 'Payment successful!',
            'expiry_date': sub.expiry_date.strftime('%B %d, %Y') if sub else ''
        })
    else:
        # Payment failed or pending
        status = result.get('status', 'UNKNOWN')
        transaction.status = status
        transaction.save()
        
        return render(request, 'web/payment_result.html', {
            'success': False,
            'message': f'Payment {status.lower()}. Please try again.'
        })


