"""Glue between the ORM and the pure analysis package.

``ingest_measurements`` is the single entry point for new data (API, CSV and the
simulator all use it), so alerting behaves the same regardless of the source.
"""

from __future__ import annotations

import csv
import io
from collections.abc import Iterable
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta

import pandas as pd
from django.db import transaction
from django.db.models import Count, Max, Min
from django.utils.dateparse import parse_datetime
from django.utils.timezone import is_naive, make_aware

from .analysis import (
    anomaly,
    derived,
    frames,
    reference,
    risk,
    systems,
    thresholds,
    trends,
)
from .analysis import baseline as baseline_mod
from .models import Alert, CrewMember, Measurement, Metric, Scan

BASELINE_DAYS = 3
TREND_WINDOW = timedelta(days=14)
LATEST_STALENESS = timedelta(hours=36)
ACTIVE_ALERT_WINDOW = timedelta(hours=24)  # alerts seen this recently count toward risk
ANOMALY_Z = 3.5
ANOMALY_WARNING_Z = 6.0
ANOMALY_PERSISTENCE = 3  # consecutive readings
# Maximum gap between breaches that still counts as the same alert episode.
COOLDOWN = {
    Alert.Kind.THRESHOLD: timedelta(hours=1),
    Alert.Kind.ANOMALY: timedelta(hours=3),
    Alert.Kind.TREND: timedelta(hours=36),
    Alert.Kind.CUMULATIVE: timedelta(hours=36),
}
# Alarm delay: consecutive breaching samples required before a threshold alert fires
# (like bedside monitors), for high-rate metrics where one-sample blips are common.
THRESHOLD_PERSISTENCE: dict[str, int] = {
    Metric.HEART_RATE: 2,
    Metric.HRV_RMSSD: 2,
    Metric.SPO2: 2,
    Metric.RESPIRATORY_RATE: 2,
}
# Metrics sampled about once a day need a longer gap.
METRIC_COOLDOWN: dict[str, timedelta] = {Metric.SLEEP_DURATION: timedelta(hours=36)}


# --------------------------------------------------------------------------- data access


def load_frame(
    crew_member: CrewMember,
    metrics: Iterable[str] | None = None,
    start: datetime | None = None,
    end: datetime | None = None,
) -> pd.DataFrame:
    qs = Measurement.objects.filter(crew_member=crew_member)
    if metrics is not None:
        qs = qs.filter(metric__in=list(metrics))
    if start is not None:
        qs = qs.filter(recorded_at__gte=start)
    if end is not None:
        qs = qs.filter(recorded_at__lte=end)
    return frames.make_frame(
        qs.order_by("recorded_at").values_list("recorded_at", "metric", "value")
    )


def latest_measurement_time(crew_member: CrewMember) -> datetime | None:
    return Measurement.objects.filter(crew_member=crew_member).aggregate(
        t=Max("recorded_at")
    )["t"]


def latest_values(crew_member: CrewMember) -> dict[str, dict]:
    """Latest value per metric (PostgreSQL DISTINCT ON)."""
    rows = (
        Measurement.objects.filter(crew_member=crew_member)
        .order_by("metric", "-recorded_at")
        .distinct("metric")
        .values("metric", "value", "recorded_at")
    )
    return {
        r["metric"]: {"value": r["value"], "recorded_at": r["recorded_at"]}
        for r in rows
    }


def last_scan_at(crew_member: CrewMember) -> datetime | None:
    """When this crew member was last scanned from the app (``None`` if never)."""
    return Scan.objects.filter(crew_member=crew_member).aggregate(
        t=Max("completed_at")
    )["t"]


def open_alert_counts(
    crew_member: CrewMember, since: datetime | None = None
) -> dict[str, int]:
    """Unacknowledged alerts per severity, optionally only those still active since ``since``."""
    qs = Alert.objects.filter(crew_member=crew_member, acknowledged=False)
    if since is not None:
        qs = qs.filter(last_seen_at__gte=since)
    rows = qs.values("severity").annotate(n=Count("id"))
    return {r["severity"]: r["n"] for r in rows}


def personal_baseline(
    crew_member: CrewMember, metric: str
) -> baseline_mod.CircadianBaseline | None:
    """Time-of-day-aware baseline from the first ``BASELINE_DAYS`` of a crew member's ``metric`` data."""
    first = Measurement.objects.filter(
        crew_member=crew_member, metric=metric
    ).aggregate(t=Min("recorded_at"))["t"]
    if first is None:
        return None
    df = load_frame(crew_member, [metric], first, first + timedelta(days=BASELINE_DAYS))
    return baseline_mod.circadian_baseline(
        frames.series(df, metric), days=BASELINE_DAYS
    )


# --------------------------------------------------------------------------- analysis views


def crew_risk(crew_member: CrewMember) -> dict:
    latest = latest_values(crew_member)
    newest = max((v["recorded_at"] for v in latest.values()), default=None)
    fresh = {
        m: v["value"]
        for m, v in latest.items()
        if newest is not None and newest - v["recorded_at"] <= LATEST_STALENESS
    }
    rad_df = load_frame(crew_member, [Metric.RADIATION_DOSE])
    rad = derived.radiation_status(frames.series(rad_df, Metric.RADIATION_DOSE))
    active = (
        open_alert_counts(crew_member, newest - ACTIVE_ALERT_WINDOW) if newest else {}
    )
    result = risk.compute_risk(fresh, active, rad["max_fraction"])
    result["as_of"] = newest.isoformat() if newest else None
    result["disclaimer"] = reference.DISCLAIMER
    return result


SYSTEMS_HISTORY_PAD = timedelta(
    days=7
)  # extra data so day-1 of the history has a 7-day window


def crew_systems(
    crew_member: CrewMember, days: int = 7, risk_result: dict | None = None
) -> dict:
    """System scores now, a ``days``-long daily history and the overall crew status."""
    newest = latest_measurement_time(crew_member)
    if newest is None:
        return {
            "as_of": None,
            "status": "unknown",
            "risk_level": None,
            "systems": [],
            "stress_level": None,
            "current_issue": None,
            "daily": [],
        }
    as_of = pd.Timestamp(newest)
    df = load_frame(
        crew_member,
        start=newest - timedelta(days=days) - SYSTEMS_HISTORY_PAD,
        end=newest,
    )
    tracked = {
        c.metric
        for cfg in systems.SYSTEMS.values()
        for c in cfg["components"]
        if c.direction and reference.get(c.metric).baseline_tracked
    }
    baselines = {m: personal_baseline(crew_member, m) for m in sorted(tracked)}
    radiation = frames.series(
        load_frame(crew_member, [Metric.RADIATION_DOSE]), Metric.RADIATION_DOSE
    )
    now = systems.score_systems(df, as_of, baselines, radiation)
    risk_result = risk_result or crew_risk(crew_member)
    return {
        **now,
        "status": systems.overall_status(now["systems"], risk_result["level"]),
        "risk_level": risk_result["level"],
        "current_issue": systems.current_issue(now["systems"]),
        "daily": systems.daily_scores(df, as_of, days, baselines, radiation),
        "disclaimer": reference.DISCLAIMER,
    }


# --------------------------------------------------------------------------- ingestion


@dataclass
class _AlertWriter:
    """Collects alerts for one ingest, folding repeated breaches into episodes.

    A breach whose (metric, kind, severity) matches an open alert last seen less
    than the cooldown gap earlier extends that alert (``occurrences`` and
    ``last_seen_at``) instead of creating a new one, so a fever that lasts a day
    is one alert, not 288.
    """

    crew_member: CrewMember
    new: list[Alert] = field(default_factory=list)
    dirty: dict[int, Alert] = field(default_factory=dict)
    open: dict[tuple[str, str, str], Alert] = field(default_factory=dict)

    def __post_init__(self) -> None:
        latest_open = (
            Alert.objects.filter(crew_member=self.crew_member, acknowledged=False)
            .order_by("metric", "kind", "severity", "-last_seen_at")
            .distinct("metric", "kind", "severity")
        )
        self.open = {(a.metric, a.kind, a.severity): a for a in latest_open}

    def add(
        self, *, metric, kind, severity, message, at, value=None, measurement=None
    ) -> None:
        key = (str(metric), str(kind), str(severity))
        current = self.open.get(key)
        gap = max(COOLDOWN[kind], METRIC_COOLDOWN.get(metric, timedelta(0)))
        if current is not None and timedelta(0) <= at - current.last_seen_at < gap:
            current.occurrences += 1
            current.last_seen_at = at
            if current.pk is not None:
                self.dirty[current.pk] = current
            return
        if current is not None and at < current.last_seen_at:
            return  # late, out-of-order data inside an episode we already reported
        alert = Alert(
            crew_member=self.crew_member,
            metric=metric,
            kind=kind,
            severity=severity,
            message=message[:500],
            value=value,
            measurement=measurement,
            triggered_at=at,
            last_seen_at=at,
        )
        self.open[key] = alert
        self.new.append(alert)

    def flush(self) -> tuple[list[Alert], int]:
        created = Alert.objects.bulk_create(self.new)
        if self.dirty:
            Alert.objects.bulk_update(
                self.dirty.values(), ["occurrences", "last_seen_at"]
            )
        return created, len(self.dirty)


def _to_aware(value) -> datetime:
    if isinstance(value, str):
        parsed = parse_datetime(value)
        if parsed is None:
            raise ValueError(f"Invalid datetime '{value}'")
        value = parsed
    if isinstance(value, pd.Timestamp):
        value = value.to_pydatetime()
    if is_naive(value):
        value = make_aware(value, UTC)
    return value


@transaction.atomic
def ingest_measurements(
    crew_member: CrewMember,
    rows: Iterable[dict],
    source: str = Measurement.Source.SENSOR,
) -> dict:
    """Store measurements and run threshold, anomaly, radiation and trend checks on them.

    ``rows`` are dicts with ``metric``, ``value`` and ``recorded_at``.
    """
    objs = []
    for row in rows:
        metric = row["metric"]
        reference.get(metric)  # validates the metric key
        objs.append(
            Measurement(
                crew_member=crew_member,
                metric=metric,
                value=float(row["value"]),
                recorded_at=_to_aware(row["recorded_at"]),
                source=source,
            )
        )
    if not objs:
        return {"created": 0, "alerts": [], "alerts_updated": 0}
    objs.sort(key=lambda m: m.recorded_at)
    created = Measurement.objects.bulk_create(objs)

    writer = _AlertWriter(crew_member)
    breached: set[int] = set()
    _check_thresholds(created, writer, breached)
    _check_anomalies(crew_member, created, writer, breached)
    _check_radiation(crew_member, created, writer)
    _check_trends(crew_member, created, writer)
    alerts, updated = writer.flush()
    return {"created": len(created), "alerts": alerts, "alerts_updated": updated}


def _check_thresholds(
    created: list[Measurement], writer: _AlertWriter, breached: set[int]
) -> None:
    streak: dict[
        str, int
    ] = {}  # consecutive breaching samples per metric within this batch
    for m in created:
        if m.metric == Metric.RADIATION_DOSE:
            continue  # per-reading dose depends on sampling interval; rate/cumulative checks handle it
        breach = thresholds.evaluate(m.metric, m.value)
        if breach is None:
            streak[m.metric] = 0
            continue
        breached.add(id(m))
        streak[m.metric] = streak.get(m.metric, 0) + 1
        if streak[m.metric] < THRESHOLD_PERSISTENCE.get(m.metric, 1):
            continue
        spec = reference.get(m.metric)
        writer.add(
            metric=m.metric,
            kind=Alert.Kind.THRESHOLD,
            severity=breach.severity,
            message=breach.describe(spec.label, m.value, spec.unit),
            at=m.recorded_at,
            value=m.value,
            measurement=m,
        )


def _check_anomalies(
    crew_member: CrewMember,
    created: list[Measurement],
    writer: _AlertWriter,
    breached: set[int],
) -> None:
    by_metric: dict[str, list[Measurement]] = {}
    for m in created:
        if reference.get(m.metric).baseline_tracked and id(m) not in breached:
            by_metric.setdefault(m.metric, []).append(m)
    for metric, items in by_metric.items():
        base = personal_baseline(crew_member, metric)
        if base is None or base.end is None:
            continue
        spec = reference.get(metric)
        items = [
            m for m in items if m.recorded_at > base.end
        ]  # skip the baseline period itself
        if not items:
            continue
        series = pd.Series(
            [m.value for m in items],
            index=pd.DatetimeIndex([m.recorded_at for m in items]),
        )
        found = anomaly.baseline_anomalies(series, base, ANOMALY_Z, ANOMALY_PERSISTENCE)
        hits = {pd.Timestamp(r["recorded_at"]): r for r in found.to_dict("records")}
        for m in items:
            row = hits.get(pd.Timestamp(m.recorded_at))
            if row is None:
                continue
            z = float(row["z"])
            writer.add(
                metric=metric,
                kind=Alert.Kind.ANOMALY,
                severity="warning" if abs(z) >= ANOMALY_WARNING_Z else "info",
                message=(
                    f"{spec.label} {m.value:g} {spec.unit} is {abs(z):.1f} robust SD "
                    f"{'above' if z > 0 else 'below'} this person's usual {float(row['expected']):g} {spec.unit} "
                    f"for this time of day"
                ),
                at=m.recorded_at,
                value=m.value,
                measurement=m,
            )


def _check_radiation(
    crew_member: CrewMember, created: list[Measurement], writer: _AlertWriter
) -> None:
    rad_points = [m for m in created if m.metric == Metric.RADIATION_DOSE]
    if not rad_points:
        return
    as_of = pd.Timestamp(max(m.recorded_at for m in rad_points))
    series = frames.series(
        load_frame(crew_member, [Metric.RADIATION_DOSE]), Metric.RADIATION_DOSE
    )
    status = derived.radiation_status(series, as_of)
    at = as_of.to_pydatetime()

    day_dose = status["totals"]["24h"]
    rate_sev = (
        "critical"
        if day_dose >= status["daily_rate_critical"]
        else "warning"
        if day_dose >= status["daily_rate_warning"]
        else None
    )
    if rate_sev:
        writer.add(
            metric=Metric.RADIATION_DOSE,
            kind=Alert.Kind.THRESHOLD,
            severity=rate_sev,
            message=f"Radiation dose {day_dose:.2f} mSv in the last 24 h (possible solar particle event)",
            at=at,
            value=day_dose,
        )

    window, fraction = max(status["fraction_of_limit"].items(), key=lambda kv: kv[1])
    cum_sev = (
        "critical"
        if fraction >= 1
        else "warning"
        if fraction >= 0.8
        else "info"
        if fraction >= 0.5
        else None
    )
    if cum_sev:
        writer.add(
            metric=Metric.RADIATION_DOSE,
            kind=Alert.Kind.CUMULATIVE,
            severity=cum_sev,
            message=(
                f"Cumulative {window} radiation dose {status['totals'][window]:.1f} mSv is "
                f"{fraction:.0%} of the {status['limits'][window]:g} mSv limit"
            ),
            at=at,
            value=status["totals"][window],
        )


def _check_trends(
    crew_member: CrewMember, created: list[Measurement], writer: _AlertWriter
) -> None:
    metrics = {m.metric for m in created} & set(trends.CONCERN_DIRECTION)
    if not metrics:
        return
    end = max(m.recorded_at for m in created)
    # Complete days only, so a partial day doesn't bias daily means/sums.
    day_end = pd.Timestamp(end).floor("1D").to_pydatetime()
    df = load_frame(
        crew_member,
        metrics,
        day_end - TREND_WINDOW,
        day_end - timedelta(microseconds=1),
    )
    for metric in sorted(metrics):
        t = trends.linear_trend(frames.series(df, metric), metric)
        if t is None or not t.concerning:
            continue
        spec = reference.get(metric)
        writer.add(
            metric=metric,
            kind=Alert.Kind.TREND,
            severity="warning",
            message=(
                f"{spec.label} trending {'up' if t.slope_per_day > 0 else 'down'} "
                f"{abs(t.slope_per_day):.2f} {spec.unit}/day over {t.days} days "
                f"(change {t.change_over_window:+.1f} {spec.unit})"
            ),
            at=end,
            value=t.slope_per_day,
        )


# --------------------------------------------------------------------------- CSV


def parse_csv(text: str) -> list[dict]:
    """Parse long (``metric,value,recorded_at``) or wide (``recorded_at,<metric>...``) CSV."""
    reader = csv.DictReader(io.StringIO(text))
    fields = [f.strip() for f in (reader.fieldnames or [])]
    reader.fieldnames = fields
    if "recorded_at" not in fields:
        raise ValueError("CSV must have a 'recorded_at' column")
    rows: list[dict] = []
    if {"metric", "value"} <= set(fields):
        for i, r in enumerate(reader, start=2):
            if not (r.get("metric") or "").strip():
                continue
            rows.append(_csv_row(i, r["metric"].strip(), r["value"], r["recorded_at"]))
        return rows
    metric_cols = [f for f in fields if f in reference.METRICS]
    unknown = [f for f in fields if f != "recorded_at" and f not in reference.METRICS]
    if not metric_cols:
        raise ValueError(
            "CSV needs 'metric' and 'value' columns or one column per metric"
        )
    if unknown:
        raise ValueError(f"Unknown metric columns: {', '.join(unknown)}")
    for i, r in enumerate(reader, start=2):
        for metric in metric_cols:
            raw = (r.get(metric) or "").strip()
            if raw:
                rows.append(_csv_row(i, metric, raw, r["recorded_at"]))
    return rows


def _csv_row(line: int, metric: str, value: str, recorded_at: str) -> dict:
    if metric not in reference.METRICS:
        raise ValueError(f"Line {line}: unknown metric '{metric}'")
    try:
        return {
            "metric": metric,
            "value": float(value),
            "recorded_at": _to_aware(recorded_at.strip()),
        }
    except (TypeError, ValueError) as exc:
        raise ValueError(f"Line {line}: {exc}") from exc
