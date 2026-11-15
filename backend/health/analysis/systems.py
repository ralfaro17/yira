"""Per-body-system health scores (0-100) derived from raw telemetry.

Systems: cardiovascular, immune, musculoskeletal (estimated) and mental.

Each system combines *penalties* in [0, 1] from its metrics:

* range penalty: how far the recent value sits outside the normal range
  (warning breach >= 0.4, critical breach >= 0.75);
* baseline penalty: how far the recent values deviate from this person's
  time-of-day baseline, only in the clinically concerning direction (capped
  at 0.5 while the value is still inside the normal range).

score = 100 * (1 - (0.7 * worst_penalty + 0.3 * mean_penalty)), so one bad metric
dominates a system while several mild ones still add up.

These are triage indicators for a demo, not clinical measures.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import timedelta

import numpy as np
import pandas as pd

from . import frames
from .baseline import CircadianBaseline
from .derived import radiation_status
from .reference import get
from .thresholds import evaluate, normalized_deviation

STABLE_MIN = 75
OBSERVATION_MIN = 50
RECENT_VITALS = timedelta(hours=2)
RECENT_DAILY = timedelta(days=7)
RECENT_ENVIRONMENT = timedelta(hours=24)
IN_RANGE_DRIFT_CAP = 0.5


@dataclass(frozen=True)
class Component:
    metric: str
    window: timedelta
    use_range: bool = True
    direction: int = 0  # +1 rising is bad, -1 falling is bad, 0 baseline not used
    reducer: str = "median"  # median | mean | max


SYSTEMS: dict[str, dict] = {
    "cardiovascular": {
        "estimated": False,
        "components": [
            Component("heart_rate", RECENT_VITALS, direction=+1),
            Component("systolic_bp", RECENT_VITALS * 3),
            Component("diastolic_bp", RECENT_VITALS * 3),
            Component("spo2", RECENT_VITALS, direction=-1),
            Component("hrv_rmssd", RECENT_VITALS, use_range=False, direction=-1),
        ],
    },
    "immune": {
        "estimated": False,
        "components": [
            Component("body_temp", RECENT_VITALS, direction=+1),
            Component("respiratory_rate", RECENT_VITALS, direction=+1),
        ],
    },
    "musculoskeletal": {
        # No direct bone-density or muscle sensors: estimated from exercise
        # countermeasure adherence and the radiation budget.
        "estimated": True,
        "components": [Component("exercise_minutes", RECENT_DAILY, reducer="mean")],
    },
    "mental": {
        "estimated": False,
        "components": [
            Component("sleep_duration", RECENT_DAILY, reducer="mean"),
            Component("hrv_rmssd", RECENT_ENVIRONMENT, use_range=False, direction=-1),
            Component("cabin_co2", RECENT_ENVIRONMENT, reducer="max"),
        ],
    },
}

# Which protocol (frontend slug) addresses a degraded system.
PROTOCOL_FOR_SYSTEM = {
    "cardiovascular": "crisis-cardiovascular",
    "mental": "estres-salud-mental",
    "musculoskeletal": "cuidado-oseo-muscular",
    "immune": None,
}


def status_for(score: float) -> str:
    if score >= STABLE_MIN:
        return "stable"
    if score >= OBSERVATION_MIN:
        return "observation"
    return "critical"


def _reduce(values: np.ndarray, how: str) -> float:
    if how == "mean":
        return float(values.mean())
    if how == "max":
        return float(values.max())
    return float(np.median(values))


def _range_penalty(metric: str, value: float) -> float:
    penalty = min(normalized_deviation(metric, value), 1.0)
    breach = evaluate(metric, value)
    if breach is not None:
        penalty = max(penalty, 0.75 if breach.severity == "critical" else 0.4)
    return penalty


def _baseline_penalty(z: float, direction: int) -> float:
    directional = z * direction
    return float(np.clip((directional - 2.0) / 5.0, 0.0, 1.0))


def _recent(
    df: pd.DataFrame, metric: str, as_of: pd.Timestamp, window: timedelta
) -> pd.Series:
    s = frames.series(df, metric)
    return s[(s.index > as_of - window) & (s.index <= as_of)]


def _median_z(recent: pd.Series, baseline: CircadianBaseline | None) -> float | None:
    if baseline is None or recent.empty:
        return None
    return float(np.median(baseline.robust_z(recent.to_numpy(), recent.index)))


def score_systems(
    df: pd.DataFrame,
    as_of: pd.Timestamp,
    baselines: dict[str, CircadianBaseline | None] | None = None,
    radiation: pd.Series | None = None,
) -> dict:
    """Score all systems at ``as_of`` from a long frame (see ``frames``)."""
    baselines = baselines or {}
    systems = []
    for key, cfg in SYSTEMS.items():
        drivers = []
        for comp in cfg["components"]:
            recent = _recent(df, comp.metric, as_of, comp.window)
            if recent.empty:
                continue
            value = _reduce(recent.to_numpy(dtype=float), comp.reducer)
            penalty = _range_penalty(comp.metric, value) if comp.use_range else 0.0
            z = (
                _median_z(recent, baselines.get(comp.metric))
                if comp.direction
                else None
            )
            if z is not None:
                drift = _baseline_penalty(z, comp.direction)
                if normalized_deviation(comp.metric, value) == 0:
                    # Still inside the normal range: a personal shift warrants
                    # observation at most, never a critical score on its own.
                    drift = min(drift, IN_RANGE_DRIFT_CAP)
                penalty = max(penalty, drift)
            drivers.append(
                {
                    "metric": comp.metric,
                    "label": get(comp.metric).label,
                    "unit": get(comp.metric).unit,
                    "value": round(value, 2),
                    "baseline_z": round(z, 2) if z is not None else None,
                    "penalty": round(penalty, 3),
                }
            )
        if key == "musculoskeletal" and radiation is not None:
            frac = radiation_status(radiation[radiation.index <= as_of], as_of)[
                "max_fraction"
            ]
            drivers.append(
                {
                    "metric": "radiation_dose",
                    "label": "Radiation budget used",
                    "unit": "fraction",
                    "value": round(frac, 4),
                    "baseline_z": None,
                    "penalty": round(float(np.clip((frac - 0.3) / 0.7, 0, 1)), 3),
                }
            )
        penalties = [d["penalty"] for d in drivers]
        if penalties:
            score = 100.0 * (
                1.0 - (0.7 * max(penalties) + 0.3 * float(np.mean(penalties)))
            )
            score = round(float(np.clip(score, 0, 100)), 1)
        else:
            score = None
        systems.append(
            {
                "key": key,
                "score": score,
                "status": status_for(score) if score is not None else "unknown",
                "estimated": cfg["estimated"],
                "drivers": sorted(drivers, key=lambda d: -d["penalty"]),
            }
        )
    return {
        "as_of": as_of.isoformat(),
        "systems": systems,
        "stress_level": _stress(df, as_of, baselines),
    }


def _stress(df: pd.DataFrame, as_of: pd.Timestamp, baselines: dict) -> str | None:
    """Bajo/Medio/Alto proxy from HR rise and HRV drop against the personal baseline."""
    zs = []
    for metric, direction in (("heart_rate", +1), ("hrv_rmssd", -1)):
        z = _median_z(_recent(df, metric, as_of, RECENT_VITALS), baselines.get(metric))
        if z is not None:
            zs.append(z * direction)
    if not zs:
        return None
    worst = max(zs)
    return "low" if worst < 2 else "medium" if worst < 4 else "high"


def overall_status(systems: list[dict], risk_level: str | None) -> str:
    statuses = [s["status"] for s in systems]
    if risk_level == "critical" or statuses.count("critical") >= 2:
        return "critical"
    if risk_level in {"elevated", "high"} or any(
        s in {"observation", "critical"} for s in statuses
    ):
        return "observation"
    return "stable"


def current_issue(systems: list[dict]) -> dict | None:
    scored = [s for s in systems if s["score"] is not None and s["status"] != "stable"]
    if not scored:
        return None
    worst = min(scored, key=lambda s: s["score"])
    return {
        "system": worst["key"],
        "status": worst["status"],
        "score": worst["score"],
        "protocol": PROTOCOL_FOR_SYSTEM.get(worst["key"]),
        "driver": worst["drivers"][0] if worst["drivers"] else None,
    }


def daily_scores(
    df: pd.DataFrame,
    as_of: pd.Timestamp,
    days: int,
    baselines: dict[str, CircadianBaseline | None] | None = None,
    radiation: pd.Series | None = None,
) -> list[dict]:
    """Mean system score at the end of each of the last ``days`` days (oldest first)."""
    out = []
    end_of_today = as_of
    for back in range(days - 1, -1, -1):
        at = (
            end_of_today
            if back == 0
            else (as_of.floor("1D") - timedelta(days=back - 1)) - timedelta(seconds=1)
        )
        result = score_systems(df, at, baselines, radiation)
        scores = [s["score"] for s in result["systems"] if s["score"] is not None]
        mean = round(float(np.mean(scores)), 1) if scores else None
        out.append(
            {
                "date": at.date().isoformat(),
                "score": mean,
                "status": status_for(mean) if mean is not None else "unknown",
            }
        )
    return out
