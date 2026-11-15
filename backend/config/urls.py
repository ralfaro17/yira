"""URL configuration for the Yira backend."""

from django.contrib import admin
from django.db import connection
from django.http import HttpRequest, JsonResponse
from django.urls import include, path

from health.views import csrf


def healthz(request: HttpRequest) -> JsonResponse:
    """Liveness/readiness probe for Render: the app is up and the database answers."""
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
    except Exception:  # noqa: BLE001 - any DB failure means "not ready"
        return JsonResponse({"status": "error", "database": "unavailable"}, status=503)
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("healthz/", healthz, name="healthz"),
    path("admin/", admin.site.urls),
    # django-allauth headless API (browser/session client):
    # /_allauth/browser/v1/auth/{signup,login,session}
    path("_allauth/", include("allauth.headless.urls")),
    path("api/csrf/", csrf, name="csrf"),
    path("api/health/", include("health.urls")),
]
