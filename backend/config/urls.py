"""URL configuration for the Yira backend."""

from django.contrib import admin
from django.urls import include, path

from health.views import csrf

urlpatterns = [
    path("admin/", admin.site.urls),
    # django-allauth headless API (browser/session client):
    # /_allauth/browser/v1/auth/{signup,login,session}
    path("_allauth/", include("allauth.headless.urls")),
    path("api/csrf/", csrf, name="csrf"),
    path("api/health/", include("health.urls")),
]
