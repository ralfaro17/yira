from __future__ import annotations

from datetime import datetime, timedelta
from typing import cast

import pandas as pd
from django.http import HttpRequest, JsonResponse
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from . import services
from .analysis import anomaly, derived, frames, reference, summary, trends
from .analysis.thresholds import evaluate
from .models import Alert, CrewMember, Measurement, Metric, OperatorProfile
from .serializers import (
    AlertSerializer,
    CrewMemberSerializer,
    CsvUploadSerializer,
    MeasurementBulkSerializer,
    MeasurementSerializer,
    MeSerializer,
)

MAX_CSV_BYTES = 5 * 1024 * 1024
RESOLUTIONS = {"5min", "15min", "30min", "1h", "6h", "12h", "1D"}


@ensure_csrf_cookie
def csrf(request: HttpRequest) -> JsonResponse:
    """Sets the ``csrftoken`` cookie so the SPA can send ``X-CSRFToken`` to allauth/DRF."""
    return JsonResponse({"detail": "CSRF cookie set"})


# --------------------------------------------------------------------------- helpers


def _param_datetime(request: Request, name: str) -> datetime | None:
    raw = request.query_params.get(name)
    if not raw:
        return None
    value = parse_datetime(raw)
    if value is None:
        raise ValidationError({name: f"Invalid ISO 8601 datetime '{raw}'."})
    return services._to_aware(value)


def _param_duration(request: Request, name: str, default: str) -> timedelta:
    try:
        return frames.parse_duration(request.query_params.get(name, default))
    except ValueError as exc:
        raise ValidationError({name: str(exc)}) from exc


def _param_metrics(request: Request) -> list[str]:
    raw = request.query_params.get("metric")
    if not raw:
        return list(Metric.values)
    metrics = [m.strip() for m in raw.split(",") if m.strip()]
    bad = [m for m in metrics if m not in Metric.values]
    if bad:
        raise ValidationError({"metric": f"Unknown metric(s): {', '.join(bad)}"})
    return metrics


def _window(
    request: Request, crew: CrewMember, default: str
) -> tuple[datetime | None, datetime | None]:
    """Window ending at ``end`` (or the newest measurement) spanning ``window`` (or from ``start``)."""
    end = _param_datetime(request, "end") or services.latest_measurement_time(crew)
    if end is None:
        return None, None
    start = _param_datetime(request, "start") or end - _param_duration(
        request, "window", default
    )
    if start > end:
        raise ValidationError({"start": "start must be before end."})
    return start, end


def _ingest_response(result: dict) -> Response:
    return Response(
        {
            "created": result["created"],
            "alerts": AlertSerializer(result["alerts"], many=True).data,
            "alerts_updated": result["alerts_updated"],
        },
        status=status.HTTP_201_CREATED,
    )


# --------------------------------------------------------------------------- views


class MetricCatalogView(APIView):
    permission_classes = [AllowAny]

    def get(self, request: Request) -> Response:
        return Response(
            {
                "disclaimer": reference.DISCLAIMER,
                "metrics": [spec.to_dict() for spec in reference.METRICS.values()],
            }
        )


class CrewMemberViewSet(viewsets.ModelViewSet):
    serializer_class = CrewMemberSerializer

    def get_queryset(self):
        return CrewMember.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    # ---- data in / out

    @action(detail=True, methods=["get", "post"])
    def measurements(self, request: Request, pk=None) -> Response:
        crew = self.get_object()
        if request.method == "POST":
            ser = MeasurementBulkSerializer(data=request.data)
            ser.is_valid(raise_exception=True)
            result = services.ingest_measurements(
                crew, ser.validated_data["measurements"], ser.validated_data["source"]
            )
            return _ingest_response(result)
        qs = Measurement.objects.filter(
            crew_member=crew, metric__in=_param_metrics(request)
        )
        if start := _param_datetime(request, "start"):
            qs = qs.filter(recorded_at__gte=start)
        if end := _param_datetime(request, "end"):
            qs = qs.filter(recorded_at__lte=end)
        page = self.paginate_queryset(qs.order_by("recorded_at"))
        return self.get_paginated_response(MeasurementSerializer(page, many=True).data)

    @action(
        detail=True,
        methods=["post"],
        url_path="measurements/upload",
        parser_classes=[MultiPartParser, FormParser],
    )
    def upload(self, request: Request, pk=None) -> Response:
        crew = self.get_object()
        ser = CsvUploadSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        upload = ser.validated_data["file"]
        if upload.size > MAX_CSV_BYTES:
            raise ValidationError({"file": "CSV must be 5 MB or smaller."})
        try:
            rows = services.parse_csv(upload.read().decode("utf-8-sig"))
        except (UnicodeDecodeError, ValueError) as exc:
            raise ValidationError({"file": str(exc)}) from exc
        if not rows:
            raise ValidationError({"file": "CSV contained no measurements."})
        result = services.ingest_measurements(crew, rows, Measurement.Source.CSV)
        return _ingest_response(result)

    # ---- analysis

    @action(detail=True, methods=["get"])
    def summary(self, request: Request, pk=None) -> Response:
        crew = self.get_object()
        start, end = _window(request, crew, "7d")
        metrics = _param_metrics(request)
        # Derived indicators need blood pressure even when the caller filters metrics.
        needed = set(metrics) | {Metric.SYSTOLIC_BP, Metric.DIASTOLIC_BP}
        df = (
            services.load_frame(crew, needed, start, end)
            if end
            else frames.empty_frame()
        )
        stats = []
        for metric in metrics:
            s = frames.series(df, metric)
            base = (
                services.personal_baseline(crew, metric)
                if reference.get(metric).baseline_tracked
                else None
            )
            stats.append(summary.metric_stats(s, metric, base))
        sbp, dbp = (
            frames.series(df, Metric.SYSTOLIC_BP),
            frames.series(df, Metric.DIASTOLIC_BP),
        )
        map_series = derived.mean_arterial_pressure(sbp, dbp)
        rad_all = frames.series(
            services.load_frame(crew, [Metric.RADIATION_DOSE]), Metric.RADIATION_DOSE
        )
        return Response(
            {
                "crew_member": crew.id,
                "start": start,
                "end": end,
                "metrics": stats,
                "derived": {
                    "mean_arterial_pressure": {
                        "unit": "mmHg",
                        "mean": float(map_series.mean())
                        if not map_series.empty
                        else None,
                        "latest": float(map_series.iloc[-1])
                        if not map_series.empty
                        else None,
                    },
                    "radiation": derived.radiation_status(rad_all, pd.Timestamp(end))
                    if end
                    else None,
                },
                "disclaimer": reference.DISCLAIMER,
            }
        )

    @action(detail=True, methods=["get"])
    def timeseries(self, request: Request, pk=None) -> Response:
        crew = self.get_object()
        start, end = _window(request, crew, "24h")
        resolution = request.query_params.get("resolution", "1h")
        if resolution not in RESOLUTIONS:
            raise ValidationError(
                {"resolution": f"Use one of: {', '.join(sorted(RESOLUTIONS))}"}
            )
        metrics = _param_metrics(request)
        df = (
            services.load_frame(crew, metrics, start, end)
            if end
            else frames.empty_frame()
        )
        return Response(
            {
                "crew_member": crew.id,
                "start": start,
                "end": end,
                "resolution": resolution,
                "series": {
                    m: {
                        "unit": reference.get(m).unit,
                        "points": summary.timeseries(
                            frames.series(df, m), m, resolution
                        ),
                    }
                    for m in metrics
                },
            }
        )

    @action(detail=True, methods=["get"])
    def anomalies(self, request: Request, pk=None) -> Response:
        """On-demand anomaly scan. ``method=baseline`` (default) or ``method=rolling``."""
        crew = self.get_object()
        start, end = _window(request, crew, "7d")
        method = request.query_params.get("method", "baseline")
        if method not in {"baseline", "rolling"}:
            raise ValidationError({"method": "Use 'baseline' or 'rolling'."})
        try:
            z = float(request.query_params.get("z", anomaly.DEFAULT_Z))
        except ValueError as exc:
            raise ValidationError({"z": "Must be a number."}) from exc
        try:
            persistence = max(
                1,
                int(
                    request.query_params.get(
                        "persistence", services.ANOMALY_PERSISTENCE
                    )
                ),
            )
        except ValueError as exc:
            raise ValidationError({"persistence": "Must be an integer."}) from exc
        metrics = [
            m for m in _param_metrics(request) if reference.get(m).baseline_tracked
        ]
        df = (
            services.load_frame(crew, metrics, start, end)
            if end
            else frames.empty_frame()
        )
        results: dict[str, dict] = {}
        for metric in metrics:
            s = frames.series(df, metric)
            if method == "rolling":
                found = anomaly.rolling_anomalies(s, z_threshold=z)
                base = None
            else:
                base = services.personal_baseline(crew, metric)
                if base is None:
                    results[metric] = {
                        "baseline": None,
                        "anomalies": [],
                        "note": "Not enough data for a baseline.",
                    }
                    continue
                found = anomaly.baseline_anomalies(
                    s[s.index > base.end], base, z, persistence
                )
            results[metric] = {
                "baseline": base.to_dict() if base else None,
                "anomalies": [
                    {
                        "recorded_at": pd.Timestamp(r["recorded_at"]).isoformat(),
                        "value": float(r["value"]),
                        "z": round(float(r["z"]), 2),
                        **(
                            {"expected": float(r["expected"])}
                            if "expected" in r
                            else {}
                        ),
                    }
                    for r in found.to_dict("records")
                ],
            }
        return Response(
            {
                "crew_member": crew.id,
                "start": start,
                "end": end,
                "method": method,
                "z_threshold": z,
                "results": results,
            }
        )

    @action(detail=True, methods=["get"])
    def trends(self, request: Request, pk=None) -> Response:
        crew = self.get_object()
        start, end = _window(request, crew, "14d")
        metrics = [m for m in _param_metrics(request) if m in trends.CONCERN_DIRECTION]
        df = (
            services.load_frame(crew, metrics, start, end)
            if end
            else frames.empty_frame()
        )
        out = {}
        for metric in metrics:
            t = trends.linear_trend(frames.series(df, metric), metric)
            out[metric] = t.to_dict() if t else None
        return Response(
            {"crew_member": crew.id, "start": start, "end": end, "trends": out}
        )

    @action(detail=True, methods=["get"])
    def systems(self, request: Request, pk=None) -> Response:
        crew = self.get_object()
        try:
            days = min(max(int(request.query_params.get("days", 7)), 1), 30)
        except ValueError as exc:
            raise ValidationError({"days": "Must be an integer."}) from exc
        return Response({"crew_member": crew.id, **services.crew_systems(crew, days)})

    @action(detail=True, methods=["get"])
    def risk(self, request: Request, pk=None) -> Response:
        crew = self.get_object()
        return Response({"crew_member": crew.id, **services.crew_risk(crew)})


class AlertViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = AlertSerializer
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        qs = Alert.objects.filter(crew_member__owner=self.request.user).select_related(
            "crew_member", "acknowledged_by"
        )
        params = self.request.query_params
        if crew := params.get("crew_member"):
            qs = qs.filter(crew_member_id=crew)
        for name in ("severity", "kind", "metric"):
            if value := params.get(name):
                qs = qs.filter(**{f"{name}__in": value.split(",")})
        if (ack := params.get("acknowledged")) is not None:
            qs = qs.filter(acknowledged=ack.lower() in {"1", "true", "yes"})
        return qs

    @action(detail=False, methods=["post"], url_path="acknowledge-all")
    def acknowledge_all(self, request: Request) -> Response:
        """Acknowledge every open alert (optionally filtered like the list endpoint)."""
        updated = (
            self.get_queryset()
            .filter(acknowledged=False)
            .update(
                acknowledged=True,
                acknowledged_by=request.user,
                acknowledged_at=timezone.now(),
            )
        )
        return Response({"acknowledged": updated})


class DashboardView(APIView):
    def get(self, request: Request) -> Response:
        crew_out = []
        for crew in CrewMember.objects.filter(owner_id=request.user.pk).order_by("id"):
            latest = services.latest_values(crew)
            risk = services.crew_risk(crew)
            sys_result = services.crew_systems(crew, days=7, risk_result=risk)
            crew_out.append(
                {
                    **CrewMemberSerializer(crew).data,
                    "latest": {
                        m: {
                            **v,
                            "status": _status(m, v["value"]),
                            "unit": reference.get(m).unit,
                        }
                        for m, v in latest.items()
                    },
                    "open_alerts": services.open_alert_counts(crew),
                    "risk": risk,
                    "status": sys_result["status"],
                    "last_scan_at": sys_result["as_of"],
                    "systems": [
                        {k: s[k] for k in ("key", "score", "status", "estimated")}
                        for s in sys_result["systems"]
                    ],
                    "stress_level": sys_result["stress_level"],
                    "current_issue": sys_result["current_issue"],
                    "daily": sys_result["daily"],
                }
            )
        heart_rates = [
            c["latest"]["heart_rate"]["value"]
            for c in crew_out
            if "heart_rate" in c["latest"]
        ]
        totals = {
            "crew": len(crew_out),
            "stable": sum(c["status"] == "stable" for c in crew_out),
            "observation": sum(c["status"] == "observation" for c in crew_out),
            "critical": sum(c["status"] == "critical" for c in crew_out),
            "avg_heart_rate": round(sum(heart_rates) / len(heart_rates))
            if heart_rates
            else None,
            "unread_alerts": Alert.objects.filter(
                crew_member__owner_id=request.user.pk, acknowledged=False
            ).count(),
        }
        return Response(
            {"crew": crew_out, "totals": totals, "disclaimer": reference.DISCLAIMER}
        )


class MeView(APIView):
    # Current operator: account identity plus editable profile and preferences.

    def _profile(self, request: Request) -> OperatorProfile:
        profile, _ = OperatorProfile.objects.get_or_create(
            user_id=cast(int, request.user.pk),
            defaults={"display_name": request.user.get_username()},
        )
        return profile

    def get(self, request: Request) -> Response:
        return Response(MeSerializer(self._profile(request)).data)

    def patch(self, request: Request) -> Response:
        ser = MeSerializer(self._profile(request), data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data)


def _status(metric: str, value: float) -> str:
    if metric == Metric.RADIATION_DOSE:
        return "n/a"
    breach = evaluate(metric, value)
    return breach.severity if breach else "normal"


class SessionPreferenceView(APIView):
    """``{"remember": false}`` makes the current session end when the browser closes."""

    def post(self, request: Request) -> Response:
        data = request.data if isinstance(request.data, dict) else {}
        remember = bool(data.get("remember", True))
        request.session.set_expiry(None if remember else 0)
        return Response({"remember": remember})
