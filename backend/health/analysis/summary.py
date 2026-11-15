"""Window statistics and chart-ready time series."""

from __future__ import annotations

from typing import cast

import numpy as np
import pandas as pd

from .baseline import Baseline, CircadianBaseline
from .reference import get
from .thresholds import evaluate


def _f(x) -> float | None:
    return (
        None if x is None or (isinstance(x, float) and not np.isfinite(x)) else float(x)
    )


def _pct_out_of_normal(
    arr: np.ndarray, low: float | None, high: float | None
) -> float | None:
    if low is None and high is None:
        return None
    mask = np.zeros(len(arr), dtype=bool)
    if low is not None:
        mask |= arr < low
    if high is not None:
        mask |= arr > high
    return float(100.0 * mask.mean())


def _latest_z(baseline, value: float, index: pd.Index) -> float | None:
    if baseline is None:
        return None
    if isinstance(baseline, CircadianBaseline):
        return _f(float(baseline.robust_z([value], index)[0]))
    return _f(float(baseline.robust_z(value)))


def metric_stats(
    series: pd.Series, metric: str, baseline: Baseline | CircadianBaseline | None = None
) -> dict:
    spec = get(metric)
    out: dict = {
        "metric": metric,
        "label": spec.label,
        "unit": spec.unit,
        "count": len(series),
    }
    if series.empty:
        return out
    arr = series.to_numpy(dtype=float)
    latest_value = float(arr[-1])
    breach = evaluate(metric, latest_value)
    out.update(
        mean=_f(arr.mean()),
        std=_f(arr.std(ddof=1)) if len(arr) > 1 else None,
        min=_f(arr.min()),
        max=_f(arr.max()),
        p05=_f(np.percentile(arr, 5)),
        p95=_f(np.percentile(arr, 95)),
        total=_f(arr.sum()) if spec.aggregate == "sum" else None,
        latest={
            "value": latest_value,
            "recorded_at": series.index[-1].isoformat(),
            "status": breach.severity if breach else "normal",
            "baseline_z": _latest_z(baseline, latest_value, series.index[-1:]),
        },
        pct_out_of_normal=_pct_out_of_normal(arr, spec.normal_low, spec.normal_high),
        baseline=baseline.to_dict() if baseline else None,
    )
    return out


def timeseries(series: pd.Series, metric: str, resolution: str = "1h") -> list[dict]:
    """Resample to ``resolution`` buckets with mean/min/max/count (plus sum for additive metrics)."""
    if series.empty:
        return []
    spec = get(metric)
    grouped = series.resample(resolution)
    frame = pd.DataFrame(
        {
            "mean": grouped.mean(),
            "min": grouped.min(),
            "max": grouped.max(),
            "count": grouped.count(),
        }
    )
    if spec.aggregate == "sum":
        frame["sum"] = grouped.sum()
    frame = frame[frame["count"] > 0]
    points = []
    for ts, row in frame.iterrows():
        point = {
            "t": cast(pd.Timestamp, ts).isoformat(),
            **{k: _f(v) for k, v in row.items() if k != "count"},
        }
        point["count"] = int(row["count"])
        points.append(point)
    return points
