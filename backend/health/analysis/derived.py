"""Derived indicators computed from raw metrics."""

from __future__ import annotations

from datetime import timedelta

import pandas as pd

from .reference import RADIATION_LIMITS


def mean_arterial_pressure(
    systolic: pd.Series, diastolic: pd.Series, resolution: str = "1h"
) -> pd.Series:
    """MAP = (SBP + 2*DBP) / 3, after aligning both series on a common grid."""
    if systolic.empty or diastolic.empty:
        return pd.Series(dtype=float)
    sbp = systolic.resample(resolution).mean()
    dbp = diastolic.resample(resolution).mean()
    return ((sbp + 2 * dbp) / 3).dropna().rename("mean_arterial_pressure")


def daily_sleep(sleep: pd.Series) -> pd.Series:
    return sleep.resample("1D").sum(min_count=1).dropna().rename("daily_sleep_h")


def radiation_status(dose: pd.Series, as_of: pd.Timestamp | None = None) -> dict:
    """Cumulative dose over the regulatory windows vs. NASA-STD-3001 limits."""
    if dose.empty:
        totals = {"24h": 0.0, "30d": 0.0, "365d": 0.0, "career": 0.0}
    else:
        as_of = as_of if as_of is not None else dose.index.max()
        upto = dose[dose.index <= as_of]

        def window(days: float) -> float:
            return float(upto[upto.index > as_of - timedelta(days=days)].sum())

        totals = {
            "24h": window(1),
            "30d": window(30),
            "365d": window(365),
            "career": float(upto.sum()),
        }
    limits = {
        "30d": RADIATION_LIMITS["limit_30d"],
        "365d": RADIATION_LIMITS["limit_365d"],
        "career": RADIATION_LIMITS["limit_career"],
    }
    fractions = {k: totals[k] / v for k, v in limits.items()}
    return {
        "unit": "mSv",
        "totals": totals,
        "limits": limits,
        "fraction_of_limit": fractions,
        "max_fraction": max(fractions.values()),
        "daily_rate_warning": RADIATION_LIMITS["rate_24h_warn"],
        "daily_rate_critical": RADIATION_LIMITS["rate_24h_crit"],
    }
