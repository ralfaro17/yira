"""Helpers for the long-format measurement frame used across the analysis package.

A *frame* has columns ``recorded_at`` (tz-aware datetime64), ``metric`` (str) and
``value`` (float). A *series* is a float Series indexed by a sorted DatetimeIndex.
"""

from __future__ import annotations

import re
from collections.abc import Iterable
from datetime import timedelta

import pandas as pd

COLUMNS = ["recorded_at", "metric", "value"]


def empty_frame() -> pd.DataFrame:
    return pd.DataFrame(
        {
            "recorded_at": pd.Series([], dtype="datetime64[ns, UTC]"),
            "metric": pd.Series([], dtype="object"),
            "value": pd.Series([], dtype="float64"),
        }
    )


def make_frame(rows: Iterable[tuple]) -> pd.DataFrame:
    """Build a frame from ``(recorded_at, metric, value)`` tuples."""
    df = pd.DataFrame(list(rows), columns=COLUMNS)
    if df.empty:
        return empty_frame()
    df["recorded_at"] = pd.to_datetime(df["recorded_at"], utc=True)
    df["value"] = df["value"].astype(float)
    return df.sort_values("recorded_at", kind="stable").reset_index(drop=True)


def series(df: pd.DataFrame, metric: str) -> pd.Series:
    sub = df[df["metric"] == metric]
    s = pd.Series(
        sub["value"].to_numpy(dtype=float), index=pd.DatetimeIndex(sub["recorded_at"])
    )
    s.index.name = "recorded_at"
    s.name = metric
    return s.sort_index()


_DURATION_RE = re.compile(r"^\s*(\d+(?:\.\d+)?)\s*([smhdw])\s*$", re.IGNORECASE)
_UNITS = {"s": "seconds", "m": "minutes", "h": "hours", "d": "days", "w": "weeks"}


def parse_duration(text: str) -> timedelta:
    """Parse '30m', '24h', '7d', '2w' into a timedelta."""
    match = _DURATION_RE.match(text or "")
    if not match:
        raise ValueError(f"Invalid duration '{text}'. Use e.g. 30m, 24h, 7d, 2w.")
    amount, unit = float(match.group(1)), match.group(2).lower()
    return timedelta(**{_UNITS[unit]: amount})
