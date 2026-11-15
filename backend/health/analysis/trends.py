"""Linear trend estimation on daily aggregates."""

from __future__ import annotations

from dataclasses import asdict, dataclass

import numpy as np
import pandas as pd

from .reference import get

# +1: rising is concerning; -1: falling is concerning.
CONCERN_DIRECTION: dict[str, int] = {
    "heart_rate": +1,
    "hrv_rmssd": -1,
    "spo2": -1,
    "systolic_bp": +1,
    "diastolic_bp": +1,
    "respiratory_rate": +1,
    "body_temp": +1,
    "sleep_duration": -1,
    "cabin_co2": +1,
}

T_CRITICAL = 2.0  # ~95% two-sided for moderate n; numpy-only approximation
MIN_DAYS = 4
MIN_RELATIVE_CHANGE = 0.05  # change across the window must be >= 5% of the mean


@dataclass(frozen=True)
class Trend:
    metric: str
    days: int
    slope_per_day: float
    intercept: float
    r2: float
    t_stat: float
    mean: float
    change_over_window: float
    significant: bool
    concerning: bool

    def to_dict(self) -> dict:
        return asdict(self)


def daily(series: pd.Series, metric: str) -> pd.Series:
    how = get(metric).aggregate
    grouped = series.resample("1D")
    out = grouped.sum(min_count=1) if how == "sum" else grouped.mean()
    return out.dropna()


def linear_trend(series: pd.Series, metric: str) -> Trend | None:
    d = daily(series, metric)
    n = len(d)
    if n < MIN_DAYS:
        return None
    x = (d.index - d.index[0]).total_seconds().to_numpy() / 86400.0
    y = d.to_numpy(dtype=float)
    slope, intercept = np.polyfit(x, y, 1)
    resid = y - (slope * x + intercept)
    ss_res = float(np.sum(resid**2))
    ss_tot = float(np.sum((y - y.mean()) ** 2))
    r2 = 1.0 - ss_res / ss_tot if ss_tot > 0 else 0.0
    sxx = float(np.sum((x - x.mean()) ** 2))
    se = np.sqrt(ss_res / (n - 2)) / np.sqrt(sxx) if n > 2 and sxx > 0 else np.inf
    t_stat = (
        float(slope / se) if se > 0 and np.isfinite(se) else (np.inf if slope else 0.0)
    )
    mean = float(y.mean())
    change = float(slope * (x[-1] - x[0]))
    relative = abs(change) / abs(mean) if mean else 0.0
    significant = bool(abs(t_stat) >= T_CRITICAL and relative >= MIN_RELATIVE_CHANGE)
    direction = CONCERN_DIRECTION.get(metric, 0)
    concerning = bool(significant and direction != 0 and np.sign(slope) == direction)
    return Trend(
        metric=metric,
        days=n,
        slope_per_day=float(slope),
        intercept=float(intercept),
        r2=float(r2),
        t_stat=float(t_stat) if np.isfinite(t_stat) else 1e9,
        mean=mean,
        change_over_window=change,
        significant=significant,
        concerning=concerning,
    )
