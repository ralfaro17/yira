from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AlertViewSet, CrewMemberViewSet, DashboardView, MetricCatalogView

router = DefaultRouter()
router.register("crew", CrewMemberViewSet, basename="crew")
router.register("alerts", AlertViewSet, basename="alert")

urlpatterns = [
    path("metrics/", MetricCatalogView.as_view(), name="metric-catalog"),
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
    path("", include(router.urls)),
]
