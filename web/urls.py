from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('feed/', views.feed, name='feed'),
    path('subscribe/', views.subscribe, name='subscribe'),
]
