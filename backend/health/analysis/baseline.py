"""Personal baselines using robust statistics (median and MAD).

Each crew member is their own control. Physiological adaptation to
microgravity means population ranges alone miss meaningful individual shifts.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import timedelta

import numpy as np
import pandas as pd

MAD_TO_SIGMA = 1.4826  # MAD * 1.4826 ~= standard deviation for normal data
MIN_POINTS = 12


@dataclass(frozen=True)
class Baseline:
    median: float
    mad: float
    n: int
    start: pd.Timestamp | None = None
    end: pd.Timestamp | None = None

    @property
    def scale(self) -> float:
        """Robust sigma estimate, never zero."""
        sigma = self.mad * MAD_TO_SIGMA
        return sigma if sigma > 1e-9 else max(abs(self.median) * 1e-3, 1e-6)

    def robust_z(self, values):
        """Robust z-score: (x - median) / (1.4826 * MAD). Works on scalars and arrays."""
        return (np.asarray(values, dtype=float) - self.median) / self.scale

    def to_dict(self) -> dict:
        d = asdict(self)
        d["start"] = self.start.isoformat() if self.start is not None else None
        d["end"] = self.end.isoformat() if self.end is not None else None
        return d


def from_values(values: pd.Series) -> Baseline | None:
    clean = values.dropna()
    if len(clean) < MIN_POINTS:
        return None
    arr = clean.to_numpy(dtype=float)
    median = float(np.median(arr))
    mad = float(np.median(np.abs(arr - median)))
    idx = clean.index if isinstance(clean.index, pd.DatetimeIndex) else None
    return Baseline(
        median=median,
        mad=mad,
        n=len(arr),
        start=idx.min() if idx is not None else None,
        end=idx.max() if idx is not None else None,
    )


def initial_baseline(series: pd.Series, days: float = 3) -> Baseline | None:
    """Baseline from the first ``days`` of data (a stand-in for preflight data)."""
    if series.empty:
        return None
    cutoff = series.index.min() + timedelta(days=days)
    return from_values(series[series.index < cutoff])


def trailing_baseline(
    series: pd.Series, before: pd.Timestamp, window: timedelta
) -> Baseline | None:
    """Baseline from the ``window`` immediately preceding ``before``."""
    sub = series[(series.index < before) & (series.index >= before - window)]
    return from_values(sub)


BUCKET_HOURS = 1
MIN_BUCKET_POINTS = 8


@dataclass(frozen=True)
class CircadianBaseline:
    """Per time-of-day baselines (``BUCKET_HOURS`` buckets) with an overall fallback.

    Heart rate at 03:00 asleep and at 14:00 during exercise are both normal, but
    for very different reasons; comparing each reading with the person's own
    norm for that time of day removes most schedule-driven false positives.
    """

    overall: Baseline
    buckets: dict[int, Baseline]
    bucket_hours: int = BUCKET_HOURS

    @property
    def start(self):
        return self.overall.start

    @property
    def end(self):
        return self.overall.end

    def _bucket_ids(self, index: pd.Index) -> np.ndarray:
        return np.asarray(pd.DatetimeIndex(index).hour) // self.bucket_hours

    def _params(self, index: pd.Index) -> tuple[np.ndarray, np.ndarray]:
        ids = self._bucket_ids(index)
        med = np.full(len(ids), self.overall.median)
        scale = np.full(len(ids), self.overall.scale)
        for b, base in self.buckets.items():
            sel = ids == b
            med[sel], scale[sel] = base.median, base.scale
        return med, scale

    def expected(self, index: pd.Index) -> np.ndarray:
        return self._params(index)[0]

    def robust_z(self, values, index: pd.Index) -> np.ndarray:
        med, scale = self._params(index)
        return (np.asarray(values, dtype=float) - med) / scale

    def to_dict(self) -> dict:
        return {
            "overall": self.overall.to_dict(),
            "bucket_hours": self.bucket_hours,
            "buckets": {
                f"{b * self.bucket_hours:02d}:00": {
                    "median": v.median,
                    "mad": v.mad,
                    "n": v.n,
                }
                for b, v in sorted(self.buckets.items())
            },
        }


def circadian_baseline(
    series: pd.Series, days: float = 3, bucket_hours: int = BUCKET_HOURS
) -> CircadianBaseline | None:
    """Time-of-day-aware baseline from the first ``days`` of data."""
    if series.empty:
        return None
    window = series[series.index < series.index.min() + timedelta(days=days)]
    overall = from_values(window)
    if overall is None:
        return None
    buckets: dict[int, Baseline] = {}
    ids = np.asarray(window.index.hour) // bucket_hours
    for b in np.unique(ids):
        sub = window[ids == b]
        if len(sub) >= MIN_BUCKET_POINTS:
            arr = sub.to_numpy(dtype=float)
            med = float(np.median(arr))
            buckets[int(b)] = Baseline(
                median=med, mad=float(np.median(np.abs(arr - med))), n=len(arr)
            )
    return CircadianBaseline(
        overall=overall, buckets=buckets, bucket_hours=bucket_hours
    )
