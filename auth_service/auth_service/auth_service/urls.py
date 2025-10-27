from django.contrib import admin
from django.urls import path
from login.views import (RegisterView,ProfileView,LogoutView, CustomAuthTokenView
                       )

urlpatterns = [
    path('api/register/', RegisterView.as_view()),
    path('api/login/', CustomAuthTokenView.as_view()),
    path('api/profile/', ProfileView.as_view()),   
    path('api/logout/', LogoutView.as_view()),  # Reusing LoginView for logout
] 
