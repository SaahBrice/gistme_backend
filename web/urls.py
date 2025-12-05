from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('feed/', views.feed, name='feed'),
    path('subscribe/', views.subscribe, name='subscribe'),
    path('validate-coupon/', views.validate_coupon, name='validate_coupon'),
    path('advertise/', views.advertise, name='advertise'),
    path('join-waiting-list/', views.join_waiting_list, name='join_waiting_list'),
    path('firebase-messaging-sw.js', views.firebase_messaging_sw, name='firebase_messaging_sw'),
    # Footer pages
    path('legal/', views.legal, name='legal'),
    path('terms/', views.terms, name='terms'),
    path('contact/', views.contact, name='contact'),
    # Fapshi Payment
    path('initiate-payment/', views.initiate_payment, name='initiate_payment'),
    path('payment-status/<str:trans_id>/', views.get_payment_status, name='payment_status'),
    path('payment-callback/', views.payment_callback, name='payment_callback'),
    path('fapshi-webhook/', views.fapshi_webhook, name='fapshi_webhook'),
]

