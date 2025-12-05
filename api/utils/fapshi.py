"""
Fapshi Payment Gateway utility.
Handles payment initiation and status checking via Fapshi API.
"""
import requests
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


class FapshiPaymentError(Exception):
    """Custom exception for Fapshi payment errors"""
    pass


def _get_headers():
    """Get authentication headers for Fapshi API"""
    return {
        'Content-Type': 'application/json',
        'apikey': settings.FAPSHI_API_KEY,
        'apiuser': settings.FAPSHI_API_USER,
    }


def initiate_payment(amount: int, redirect_url: str, email: str = None,
                     message: str = None) -> dict:
    """
    Initiate a payment using Fapshi's hosted checkout page.
    Returns a payment link where user completes payment.
    
    Args:
        amount: Amount in FCFA (minimum 100)
        redirect_url: URL to redirect after payment completion
        email: Optional email to pre-fill on checkout
        message: Optional reason for payment
        
    Returns:
        dict: {
            'success': bool,
            'link': str,  # Fapshi checkout URL
            'trans_id': str,  # Transaction ID
            'message': str,
            'date_initiated': str
        }
    """
    url = f"{settings.FAPSHI_BASE_URL}/initiate-pay"
    
    payload = {
        'amount': amount,
        'redirectUrl': redirect_url,
    }
    
    if email:
        payload['email'] = email
    if message:
        payload['message'] = message
    
    try:
        logger.info(f"[Fapshi] Initiating payment: {amount} FCFA")
        response = requests.post(url, json=payload, headers=_get_headers(), timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            logger.info(f"[Fapshi] Payment link created: {data.get('transId')}")
            return {
                'success': True,
                'link': data.get('link'),
                'trans_id': data.get('transId'),
                'message': data.get('message', 'Payment link created'),
                'date_initiated': data.get('dateInitiated')
            }
        else:
            error_msg = response.json().get('message', 'Payment initiation failed')
            logger.error(f"[Fapshi] Payment failed: {error_msg}")
            return {
                'success': False,
                'link': None,
                'trans_id': None,
                'message': error_msg,
                'date_initiated': None
            }
            
    except requests.exceptions.Timeout:
        logger.error("[Fapshi] Request timeout")
        return {
            'success': False,
            'link': None,
            'trans_id': None,
            'message': 'Payment service timeout. Please try again.',
            'date_initiated': None
        }
    except requests.exceptions.RequestException as e:
        logger.error(f"[Fapshi] Request error: {e}")
        return {
            'success': False,
            'link': None,
            'trans_id': None,
            'message': 'Payment service unavailable. Please try again.',
            'date_initiated': None
        }


def check_payment_status(trans_id: str) -> dict:
    """
    Check the status of a payment transaction.
    
    Args:
        trans_id: Fapshi transaction ID
        
    Returns:
        dict: {
            'status': str,  # CREATED, PENDING, SUCCESSFUL, FAILED, EXPIRED
            'amount': int,
            'revenue': int,  # Amount after Fapshi fees
            'payer_name': str,
            'email': str,
            'date_confirmed': str,
            'financial_trans_id': str  # Operator transaction ID
        }
    """
    url = f"{settings.FAPSHI_BASE_URL}/payment-status/{trans_id}"
    
    try:
        logger.info(f"[Fapshi] Checking status for: {trans_id}")
        response = requests.get(url, headers=_get_headers(), timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            # Response is an array, get first item
            if isinstance(data, list) and len(data) > 0:
                payment = data[0]
                return {
                    'success': True,
                    'status': payment.get('status', 'UNKNOWN'),
                    'amount': payment.get('amount'),
                    'revenue': payment.get('revenue'),
                    'payer_name': payment.get('payerName'),
                    'email': payment.get('email'),
                    'date_confirmed': payment.get('dateConfirmed'),
                    'financial_trans_id': payment.get('financialTransId'),
                    'medium': payment.get('medium')
                }
            return {
                'success': False,
                'status': 'NOT_FOUND',
                'message': 'Transaction not found'
            }
        else:
            return {
                'success': False,
                'status': 'ERROR',
                'message': 'Failed to check payment status'
            }
            
    except requests.exceptions.RequestException as e:
        logger.error(f"[Fapshi] Status check error: {e}")
        return {
            'success': False,
            'status': 'ERROR',
            'message': 'Failed to check payment status'
        }
