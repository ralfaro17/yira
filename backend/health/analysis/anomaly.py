"""Anomaly detection against personal baselines."""

from __future__ import annotations

import numpy as np
import pandas as pd

from .baseline import MAD_TO_SIGMA, Baseline, CircadianBaseline

DEFAULT_Z = 3.5  # Iglewicz & Hoaglin's recommended modified z-score cutoff


def baseline_anomalies(
    series: pd.Series,
    baseline: Baseline | CircadianBaseline,
    z_threshold: float = DEFAULT_Z,
    persistence: int = 1,
) -> pd.DataFrame:
    """Return the points whose robust z-score against ``baseline`` exceeds the threshold.

    With ``persistence=k`` a point is only flagged if it and the k-1 readings before it
    all exceed the threshold, which suppresses single-sample sensor glitches.
    Columns: recorded_at, value, z, expected (the baseline median used for that point).
    """
    if series.empty:
        return pd.DataFrame(columns=["recorded_at", "value", "z", "expected"])
    values = series.to_numpy(dtype=float)
    if isinstance(baseline, CircadianBaseline):
        z = baseline.robust_z(values, series.index)
        expected = baseline.expected(series.index)
    else:
        z = baseline.robust_z(values)
        expected = np.full(len(values), baseline.median)
    exceed = np.abs(z) > z_threshold
    if persistence > 1:
        run = (
            pd.Series(exceed.astype(float))
            .rolling(persistence, min_periods=persistence)
            .min()
        )
        exceed = run.fillna(0).to_numpy(dtype=bool)
    mask = exceed
    return pd.DataFrame(
        {
            "recorded_at": series.index[mask],
            "value": values[mask],
            "z": z[mask],
            "expected": expected[mask],
        }
    ).reset_index(drop=True)


def rolling_anomalies(
    series: pd.Series,
    window: str = "24h",
    min_periods: int = 12,
    z_threshold: float = DEFAULT_Z,
) -> pd.DataFrame:
    """Flag points that deviate from the preceding ``window`` (median/MAD, current point excluded).

    Useful for streams without an established baseline.
    """
    if series.empty:
        return pd.DataFrame(columns=["recorded_at", "value", "z"])
    s = series.sort_index()
    roll = s.rolling(window, min_periods=min_periods)
    med = roll.median().shift(1)
    mad = roll.apply(lambda a: np.median(np.abs(a - np.median(a))), raw=True).shift(1)
    scale = (mad * MAD_TO_SIGMA).where(lambda x: x > 1e-9)
    z = (s - med) / scale
    mask = z.abs() > z_threshold
    return pd.DataFrame(
        {
            "recorded_at": s.index[mask],
            "value": s[mask].to_numpy(),
            "z": z[mask].to_numpy(),
        }
    ).reset_index(drop=True)
