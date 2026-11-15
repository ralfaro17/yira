from django.conf import settings
from django.db import models


class Metric(models.TextChoices):
    HEART_RATE = "heart_rate", "Heart rate"
    HRV_RMSSD = "hrv_rmssd", "Heart rate variability (RMSSD)"
    SPO2 = "spo2", "Blood oxygen saturation"
    SYSTOLIC_BP = "systolic_bp", "Systolic blood pressure"
    DIASTOLIC_BP = "diastolic_bp", "Diastolic blood pressure"
    RESPIRATORY_RATE = "respiratory_rate", "Respiratory rate"
    BODY_TEMP = "body_temp", "Body temperature"
    SLEEP_DURATION = "sleep_duration", "Sleep duration"
    RADIATION_DOSE = "radiation_dose", "Radiation dose"
    CABIN_CO2 = "cabin_co2", "Cabin CO2 partial pressure"


class Severity(models.TextChoices):
    INFO = "info", "Info"
    WARNING = "warning", "Warning"
    CRITICAL = "critical", "Critical"


class CrewMember(models.Model):
    class Sex(models.TextChoices):
        FEMALE = "F", "Female"
        MALE = "M", "Male"
        OTHER = "X", "Other / unspecified"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="crew_members"
    )
    name = models.CharField(max_length=120)
    mission = models.CharField(max_length=120, blank=True)
    role = models.CharField(max_length=80, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    sex = models.CharField(max_length=1, choices=Sex.choices, default=Sex.OTHER)
    height_cm = models.FloatField(null=True, blank=True)
    mass_kg = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return f"{self.name} ({self.mission})" if self.mission else self.name


class Measurement(models.Model):
    class Source(models.TextChoices):
        SENSOR = "sensor", "Sensor"
        MANUAL = "manual", "Manual entry"
        CSV = "csv", "CSV import"
        SIMULATED = "simulated", "Simulated"

    crew_member = models.ForeignKey(
        CrewMember, on_delete=models.CASCADE, related_name="measurements"
    )
    metric = models.CharField(max_length=32, choices=Metric.choices)
    value = models.FloatField()
    recorded_at = models.DateTimeField()
    source = models.CharField(
        max_length=16, choices=Source.choices, default=Source.SENSOR
    )

    class Meta:
        ordering = ["recorded_at"]
        indexes = [models.Index(fields=["crew_member", "metric", "recorded_at"])]

    def __str__(self) -> str:
        return f"{self.crew_member_id}:{self.metric}={self.value}@{self.recorded_at:%Y-%m-%d %H:%M}"


class Alert(models.Model):
    class Kind(models.TextChoices):
        THRESHOLD = "threshold", "Threshold"
        ANOMALY = "anomaly", "Anomaly vs. personal baseline"
        TREND = "trend", "Trend"
        CUMULATIVE = "cumulative", "Cumulative exposure"

    crew_member = models.ForeignKey(
        CrewMember, on_delete=models.CASCADE, related_name="alerts"
    )
    metric = models.CharField(max_length=32, choices=Metric.choices)
    kind = models.CharField(max_length=16, choices=Kind.choices)
    severity = models.CharField(max_length=16, choices=Severity.choices)
    message = models.CharField(max_length=500)
    value = models.FloatField(null=True, blank=True)
    measurement = models.ForeignKey(
        Measurement,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="alerts",
    )
    triggered_at = models.DateTimeField(help_text="First breach of this episode.")
    last_seen_at = models.DateTimeField(
        help_text="Most recent breach folded into this episode."
    )
    occurrences = models.PositiveIntegerField(default=1)
    acknowledged = models.BooleanField(default=False)
    acknowledged_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="acknowledged_alerts",
    )
    acknowledged_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-triggered_at"]
        indexes = [models.Index(fields=["crew_member", "acknowledged", "severity"])]

    def __str__(self) -> str:
        return f"[{self.severity}] {self.metric}: {self.message}"
