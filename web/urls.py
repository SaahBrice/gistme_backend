from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('feed/', views.feed, name='feed'),
    path('relax/', views.relax, name='relax'),
    path('login/', views.auth_page, name='login'),
    path('onboarding/', views.onboarding, name='onboarding'),
    path('subscribe/', views.subscribe, name='subscribe'),
    path('validate-coupon/', views.validate_coupon, name='validate_coupon'),
    path('advertise/', views.advertise, name='advertise'),
    path('firebase-messaging-sw.js', views.firebase_messaging_sw, name='firebase_messaging_sw'),
    # Footer pages
    path('legal/', views.legal, name='legal'),
    path('terms/', views.terms, name='terms'),
    path('contact/', views.contact, name='contact'),
    path('save-settings/', views.save_settings, name='save_settings'),
    # Fapshi Payment
    path('initiate-payment/', views.initiate_payment, name='initiate_payment'),
    path('payment-status/<str:trans_id>/', views.get_payment_status, name='payment_status'),
    path('payment-callback/', views.payment_callback, name='payment_callback'),
    path('fapshi-webhook/', views.fapshi_webhook, name='fapshi_webhook'),
]

