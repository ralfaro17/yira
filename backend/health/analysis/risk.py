"""Composite, explainable 0-100 health risk score.

Score = vitals component (<= 50) + open alerts (<= 30) + radiation budget (<= 20).
It is a triage aid for prioritizing attention, not a diagnosis.
"""

from __future__ import annotations

from .thresholds import normalized_deviation

VITALS_CAP = 50.0
ALERTS_CAP = 30.0
RADIATION_CAP = 20.0
POINTS_PER_METRIC_AT_CRITICAL = 15.0
ALERT_POINTS = {"critical": 10.0, "warning": 4.0, "info": 1.0}
LEVELS = [(20, "nominal"), (45, "elevated"), (70, "high"), (101, "critical")]


def level_for(score: float) -> str:
    for upper, name in LEVELS:
        if score < upper:
            return name
    return "critical"


def compute_risk(
    latest: dict[str, float],
    open_alerts: dict[str, int] | None = None,
    radiation_fraction: float = 0.0,
) -> dict:
    """
    latest: latest value per metric (radiation_dose is ignored here; use ``radiation_fraction``).
    open_alerts: count of unacknowledged alerts per severity.
    radiation_fraction: highest fraction of any cumulative radiation limit used (0..1+).
    """
    factors: list[dict] = []

    vitals_points = 0.0
    for metric, value in sorted(latest.items()):
        if metric == "radiation_dose":
            continue
        dev = normalized_deviation(metric, value)
        if dev > 0:
            pts = min(dev, 1.5) * POINTS_PER_METRIC_AT_CRITICAL
            vitals_points += pts
            factors.append(
                {
                    "factor": "vital_out_of_range",
                    "metric": metric,
                    "value": value,
                    "deviation": round(dev, 3),
                    "points": round(pts, 2),
                }
            )
    vitals_points = min(vitals_points, VITALS_CAP)

    alert_points = 0.0
    for severity, count in (open_alerts or {}).items():
        pts = ALERT_POINTS.get(severity, 0.0) * count
        if pts:
            alert_points += pts
            factors.append(
                {
                    "factor": "open_alerts",
                    "severity": severity,
                    "count": count,
                    "points": pts,
                }
            )
    alert_points = min(alert_points, ALERTS_CAP)

    rad_points = min(max(radiation_fraction, 0.0), 1.0) * RADIATION_CAP
    if rad_points > 0:
        factors.append(
            {
                "factor": "radiation_budget",
                "fraction": round(radiation_fraction, 4),
                "points": round(rad_points, 2),
            }
        )

    score = round(min(vitals_points + alert_points + rad_points, 100.0), 1)
    return {
        "score": score,
        "level": level_for(score),
        "components": {
            "vitals": round(vitals_points, 2),
            "alerts": round(alert_points, 2),
            "radiation": round(rad_points, 2),
        },
        "factors": sorted(factors, key=lambda f: -f["points"]),
    }
