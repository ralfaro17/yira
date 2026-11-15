"""Metric catalog: units, normal ranges and alert thresholds.

DISCLAIMER: these are demonstration values loosely based on adult resting
vital-sign norms and NASA-STD-3001 (Vol. 1) radiation limits. They are not
clinical guidance and must be reviewed by a flight surgeon before real use.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field


@dataclass(frozen=True)
class MetricSpec:
    key: str
    label: str
    unit: str
    normal_low: float | None = None
    normal_high: float | None = None
    # Value at/beyond which a warning/critical alert fires (low and high side).
    warn_low: float | None = None
    warn_high: float | None = None
    crit_low: float | None = None
    crit_high: float | None = None
    # Is this metric expected to vary within a person (used for baseline anomaly detection)?
    baseline_tracked: bool = True
    # How to aggregate when resampling time series.
    aggregate: str = "mean"
    notes: str = ""
    extra: dict[str, float] = field(default_factory=dict)

    def to_dict(self) -> dict:
        return asdict(self)


METRICS: dict[str, MetricSpec] = {
    spec.key: spec
    for spec in [
        MetricSpec(
            "heart_rate",
            "Heart rate",
            "bpm",
            normal_low=45,
            normal_high=100,
            warn_low=40,
            warn_high=120,
            crit_low=35,
            crit_high=150,
            notes="High limits sit above typical exercise HR because no activity context is "
            "available; resting tachycardia is caught by the personal-baseline anomaly check. "
            "Low limits allow for athletic bradycardia during sleep.",
        ),
        MetricSpec(
            "hrv_rmssd",
            "Heart rate variability (RMSSD)",
            "ms",
            normal_low=20,
            normal_high=100,
            warn_low=15,
            crit_low=10,
            notes="Lower HRV is associated with stress and fatigue.",
        ),
        MetricSpec(
            "spo2",
            "Blood oxygen saturation",
            "%",
            normal_low=95,
            normal_high=100,
            warn_low=94,
            crit_low=90,
        ),
        MetricSpec(
            "systolic_bp",
            "Systolic blood pressure",
            "mmHg",
            normal_low=90,
            normal_high=130,
            warn_low=85,
            warn_high=140,
            crit_low=80,
            crit_high=160,
        ),
        MetricSpec(
            "diastolic_bp",
            "Diastolic blood pressure",
            "mmHg",
            normal_low=60,
            normal_high=85,
            warn_low=55,
            warn_high=90,
            crit_low=50,
            crit_high=100,
        ),
        MetricSpec(
            "respiratory_rate",
            "Respiratory rate",
            "breaths/min",
            normal_low=12,
            normal_high=20,
            warn_low=10,
            warn_high=26,
            crit_low=8,
            crit_high=32,
        ),
        MetricSpec(
            "body_temp",
            "Body temperature",
            "°C",
            normal_low=36.1,
            normal_high=37.5,
            warn_low=35.5,
            warn_high=38.0,
            crit_low=35.0,
            crit_high=39.5,
            notes="Core temperature runs slightly higher in long-duration spaceflight.",
        ),
        MetricSpec(
            "sleep_duration",
            "Sleep duration",
            "h",
            normal_low=7,
            normal_high=9,
            warn_low=6,
            crit_low=4.5,
            baseline_tracked=False,
            aggregate="sum",
            notes="Reported per sleep period. NASA schedules 8.5 h for sleep on the ISS.",
        ),
        MetricSpec(
            "radiation_dose",
            "Radiation dose",
            "mSv",
            baseline_tracked=False,
            aggregate="sum",
            notes="Dose per reading. Cumulative limits are checked separately "
            "(NASA-STD-3001: 600 mSv career effective dose).",
            extra={
                "limit_30d": 250.0,
                "limit_365d": 500.0,
                "limit_career": 600.0,
                # ISS background is roughly 0.3-1 mSv/day; solar particle events can be far higher.
                "rate_24h_warn": 5.0,
                "rate_24h_crit": 50.0,
            },
        ),
        MetricSpec(
            "cabin_co2",
            "Cabin CO2 partial pressure",
            "mmHg",
            normal_low=0,
            normal_high=3.0,
            warn_high=4.0,
            crit_high=6.0,
            baseline_tracked=False,
            notes="Elevated CO2 on the ISS has been associated with headaches and reduced cognition.",
        ),
    ]
}

RADIATION_LIMITS = METRICS["radiation_dose"].extra

DISCLAIMER = (
    "Thresholds are demonstration values based on public references; "
    "not clinical guidance."
)


def get(metric: str) -> MetricSpec:
    try:
        return METRICS[metric]
    except KeyError as exc:
        raise ValueError(f"Unknown metric '{metric}'") from exc
