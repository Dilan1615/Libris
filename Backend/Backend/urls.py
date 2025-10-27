
from django.contrib import admin
from django.urls import path, include


urlpatterns = [
    # If using the router:
    path('api/', include('Api.urls')), # Or directly include the router
]

