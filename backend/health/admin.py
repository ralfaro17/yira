from django.contrib import admin

from .models import Alert, CrewMember, Measurement


@admin.register(CrewMember)
class CrewMemberAdmin(admin.ModelAdmin):
    list_display = ["name", "mission", "role", "owner", "created_at"]
    list_filter = ["mission"]
    search_fields = ["name", "mission"]


@admin.register(Measurement)
class MeasurementAdmin(admin.ModelAdmin):
    list_display = ["crew_member", "metric", "value", "recorded_at", "source"]
    list_filter = ["metric", "source"]
    date_hierarchy = "recorded_at"
    raw_id_fields = ["crew_member"]


@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = [
        "crew_member",
        "severity",
        "kind",
        "metric",
        "message",
        "triggered_at",
        "acknowledged",
    ]
    list_filter = ["severity", "kind", "metric", "acknowledged"]
    raw_id_fields = ["crew_member", "measurement", "acknowledged_by"]
