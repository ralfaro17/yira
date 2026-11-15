import math
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from django.utils import timezone
from rest_framework import serializers

from .models import Alert, CrewMember, Measurement, Metric, OperatorProfile, Scan

MAX_BULK = 10_000


class CrewMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = CrewMember
        fields = [
            "id",
            "name",
            "mission",
            "role",
            "date_of_birth",
            "sex",
            "height_cm",
            "mass_kg",
            "photo",
            "age",
            "created_at",
        ]
        read_only_fields = ["id", "age", "created_at"]

    age = serializers.IntegerField(read_only=True)


class MeasurementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Measurement
        fields = ["id", "metric", "value", "recorded_at", "source"]
        read_only_fields = fields


class MeasurementInSerializer(serializers.Serializer):
    metric = serializers.ChoiceField(choices=Metric.choices)
    value = serializers.FloatField()
    recorded_at = serializers.DateTimeField()

    def validate_value(self, value: float) -> float:
        if not math.isfinite(value):
            raise serializers.ValidationError("Value must be a finite number.")
        return value


class MeasurementBulkSerializer(serializers.Serializer):
    source = serializers.ChoiceField(  # type: ignore[assignment]  # field named "source", popped by DRF's metaclass
        choices=[Measurement.Source.SENSOR, Measurement.Source.MANUAL],
        default=Measurement.Source.SENSOR,
    )
    measurements = MeasurementInSerializer(
        many=True,
        allow_empty=False,
        max_length=MAX_BULK,  # type: ignore[call-arg]  # ListSerializer kwarg
    )


class CsvUploadSerializer(serializers.Serializer):
    file = serializers.FileField()


class AlertSerializer(serializers.ModelSerializer):
    crew_member_name = serializers.CharField(source="crew_member.name", read_only=True)
    acknowledged_by = serializers.CharField(
        source="acknowledged_by.username", read_only=True, default=None
    )

    class Meta:
        model = Alert
        fields = [
            "id",
            "crew_member",
            "crew_member_name",
            "metric",
            "kind",
            "severity",
            "message",
            "value",
            "measurement",
            "triggered_at",
            "last_seen_at",
            "occurrences",
            "acknowledged",
            "acknowledged_by",
            "acknowledged_at",
        ]
        read_only_fields = [f for f in fields if f != "acknowledged"]

    def update(self, instance: Alert, validated_data: dict) -> Alert:
        ack = validated_data.get("acknowledged", instance.acknowledged)
        if ack and not instance.acknowledged:
            instance.acknowledged_by = self.context["request"].user
            instance.acknowledged_at = timezone.now()
        elif not ack:
            instance.acknowledged_by = None
            instance.acknowledged_at = None
        instance.acknowledged = ack
        instance.save(
            update_fields=["acknowledged", "acknowledged_by", "acknowledged_at"]
        )
        return instance


class MeSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = OperatorProfile
        fields = [
            "username",
            "email",
            "display_name",
            "role_label",
            "photo",
            "language",
            "timezone",
            "emergency_alerts",
            "daily_summary_time",
            "units",
        ]

    def validate_timezone(self, value: str) -> str:
        try:
            ZoneInfo(value)
        except (ZoneInfoNotFoundError, ValueError) as exc:
            raise serializers.ValidationError("Unknown time zone.") from exc
        return value


class ScanSerializer(serializers.ModelSerializer):
    performed_by = serializers.CharField(
        source="performed_by.username", read_only=True, default=None
    )

    class Meta:
        model = Scan
        fields = ["id", "crew_member", "completed_at", "performed_by"]
        read_only_fields = fields
