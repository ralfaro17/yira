from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AlertViewSet,
    CrewMemberViewSet,
    DashboardView,
    MetricCatalogView,
    MeView,
    SessionPreferenceView,
)

router = DefaultRouter()
router.register("crew", CrewMemberViewSet, basename="crew")
router.register("alerts", AlertViewSet, basename="alert")

urlpatterns = [
    path("metrics/", MetricCatalogView.as_view(), name="metric-catalog"),
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
    path("me/", MeView.as_view(), name="me"),
    path("me/session/", SessionPreferenceView.as_view(), name="me-session"),
    path("", include(router.urls)),
]
