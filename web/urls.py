from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('feed/', views.feed, name='feed'),
    path('subscribe/', views.subscribe, name='subscribe'),
    path('advertise/', views.advertise, name='advertise'),
    path('join-waiting-list/', views.join_waiting_list, name='join_waiting_list'),
    path('firebase-messaging-sw.js', views.firebase_messaging_sw, name='firebase_messaging_sw'),
]

