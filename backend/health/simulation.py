"""Synthetic mission data generator for demos and tests.

Produces plausible (not physiologically exact) crew telemetry with injected
scenarios so the alerting pipeline has something to find:

* ``spe``          solar particle event: radiation dose spike for all crew
* ``fever``        febrile episode (crew 0): temperature, HR and RR up
* ``co2``          CO2 scrubber degradation (all crew): cabin CO2, RR and HR up
* ``desaturation`` hypoxic episode (crew 2): SpO2 drops below 90%
* ``sleep_loss``   progressive sleep restriction (crew 1): sleep down, HRV down, HR up
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta

import numpy as np
import pandas as pd

SCENARIOS = ("spe", "fever", "co2", "desaturation", "sleep_loss")
SLEEP_START_H, SLEEP_END_H = 21.5, 6.0  # GMT, ISS-style schedule
EXERCISE_START_H, EXERCISE_END_H = 13.0, 15.0


@dataclass(frozen=True)
class CrewProfile:
    name: str
    role: str
    sex: str
    resting_hr: float
    hrv: float
    sbp: float
    dbp: float
    temp: float
    sleep_h: float


DEFAULT_CREW = [
    CrewProfile("A. Rivera", "Commander", "F", 58, 55, 112, 72, 36.7, 7.4),
    CrewProfile("K. Tanaka", "Pilot", "M", 62, 48, 118, 76, 36.8, 7.0),
    CrewProfile("S. Okafor", "Flight Engineer", "M", 55, 62, 115, 74, 36.6, 7.6),
    CrewProfile("L. Moreau", "Mission Specialist", "F", 64, 45, 108, 70, 36.9, 7.2),
    CrewProfile("D. Novak", "Mission Specialist", "M", 60, 52, 120, 78, 36.7, 7.1),
    CrewProfile("P. Singh", "Flight Surgeon", "F", 57, 58, 110, 71, 36.8, 7.5),
]


@dataclass(frozen=True)
class Window:
    start: pd.Timestamp
    end: pd.Timestamp

    def mask(self, idx: pd.DatetimeIndex) -> np.ndarray:
        return np.asarray((idx >= self.start) & (idx < self.end))

    def ramp(self, idx: pd.DatetimeIndex) -> np.ndarray:
        """0 outside the window, triangular 0 -> 1 -> 0 inside it."""
        span = (self.end - self.start).total_seconds()
        pos = (idx - self.start).total_seconds().to_numpy() / span
        return np.where((pos >= 0) & (pos < 1), 1 - np.abs(2 * pos - 1), 0.0)


def scenario_windows(
    start: pd.Timestamp, days: int, enabled: tuple[str, ...] = SCENARIOS
) -> dict[str, Window]:
    def at(frac: float, hours: float) -> Window:
        s = (start + timedelta(days=days * frac)).floor("1h")
        return Window(s, s + timedelta(hours=hours))

    windows = {
        "fever": at(0.45, 36),
        "spe": at(0.55, 8),
        "desaturation": at(0.62, 3),
        "co2": at(0.75, 10),
        # Sleep loss starts once the baseline period is over and runs to the end.
        "sleep_loss": Window(
            start + timedelta(days=max(3.0, days * 0.3)), start + timedelta(days=days)
        ),
    }
    return {k: v for k, v in windows.items() if k in enabled}


def _hour_of_day(idx: pd.DatetimeIndex) -> np.ndarray:
    return idx.hour.to_numpy() + idx.minute.to_numpy() / 60.0


def _asleep(idx: pd.DatetimeIndex) -> np.ndarray:
    h = _hour_of_day(idx)
    return (h >= SLEEP_START_H) | (h < SLEEP_END_H)


def _exercising(idx: pd.DatetimeIndex) -> np.ndarray:
    h = _hour_of_day(idx)
    return (h >= EXERCISE_START_H) & (h < EXERCISE_END_H)


def generate_crew_frame(
    profile: CrewProfile,
    crew_index: int,
    start: datetime,
    days: int,
    interval: timedelta = timedelta(minutes=5),
    seed: int = 42,
    scenarios: tuple[str, ...] = SCENARIOS,
) -> pd.DataFrame:
    """Return a long frame (recorded_at, metric, value) for one crew member."""
    rng = np.random.default_rng(seed + crew_index * 1009)
    t0 = (
        pd.Timestamp(start).tz_convert("UTC")
        if pd.Timestamp(start).tzinfo
        else pd.Timestamp(start, tz="UTC")
    )
    end = t0 + timedelta(days=days)
    win = scenario_windows(t0, days, scenarios)
    parts: list[pd.DataFrame] = []

    def emit(
        metric: str, idx: pd.DatetimeIndex, values: np.ndarray, decimals: int = 1
    ) -> None:
        parts.append(
            pd.DataFrame(
                {
                    "recorded_at": idx,
                    "metric": metric,
                    "value": np.round(values, decimals),
                }
            )
        )

    def days_into(w: Window, idx: pd.DatetimeIndex) -> np.ndarray:
        return np.clip(
            (idx - w.start).total_seconds().to_numpy() / 86400.0, 0, None
        ) * w.mask(idx)

    # ---- high-rate vitals (HR, HRV, SpO2, RR)
    idx = pd.date_range(t0, end, freq=interval, inclusive="left")
    asleep, exercising = _asleep(idx), _exercising(idx)
    phase = 2 * np.pi * (_hour_of_day(idx) - 16) / 24
    fever = win["fever"].ramp(idx) if "fever" in win else np.zeros(len(idx))
    co2 = win["co2"].ramp(idx) if "co2" in win else np.zeros(len(idx))
    desat = (
        win["desaturation"].mask(idx)
        if "desaturation" in win and crew_index == 2
        else np.zeros(len(idx), bool)
    )
    sleep_loss_days = (
        days_into(win["sleep_loss"], idx)
        if "sleep_loss" in win and crew_index == 1
        else np.zeros(len(idx))
    )
    if crew_index != 0:
        fever = np.zeros(len(idx))

    hr = (
        profile.resting_hr
        + 4 * np.cos(phase)
        - 5 * asleep
        + 45 * exercising
        + 22 * fever
        + 8 * co2
        + 0.9 * sleep_loss_days
        + rng.normal(0, 2.5, len(idx))
    )
    hrv = (
        profile.hrv * (1 + 0.25 * asleep - 0.45 * exercising - 0.35 * fever)
        - 1.6 * sleep_loss_days
    )
    hrv = np.clip(hrv + rng.normal(0, 3, len(idx)), 5, None)
    spo2 = 97.8 - 0.6 * asleep - 0.8 * exercising + rng.normal(0, 0.4, len(idx))
    spo2 = np.where(desat, 88.0 + rng.normal(0, 0.8, len(idx)), spo2)
    rr = (
        14.5
        - 1.5 * asleep
        + 6 * exercising
        + 6 * fever
        + 6 * co2
        + rng.normal(0, 0.6, len(idx))
    )
    emit("heart_rate", idx, hr, 1)
    emit("hrv_rmssd", idx, hrv, 1)
    emit("spo2", idx, np.clip(spo2, 70, 100), 1)
    emit("respiratory_rate", idx, np.clip(rr, 6, 40), 1)

    # ---- body temperature (15 min) and cabin CO2 (15 min)
    idx15 = pd.date_range(t0, end, freq="15min", inclusive="left")
    phase15 = 2 * np.pi * (_hour_of_day(idx15) - 17) / 24
    fever15 = win["fever"].ramp(idx15) if "fever" in win and crew_index == 0 else 0.0
    temp = (
        profile.temp
        + 0.3 * np.cos(phase15)
        + 2.3 * fever15
        + rng.normal(0, 0.08, len(idx15))
    )
    emit("body_temp", idx15, temp, 2)
    co2_15 = win["co2"].ramp(idx15) if "co2" in win else 0.0
    cabin = (
        2.4 + 0.25 * np.sin(phase15) + 4.5 * co2_15 + rng.normal(0, 0.12, len(idx15))
    )
    emit("cabin_co2", idx15, np.clip(cabin, 0.5, None), 2)

    # ---- blood pressure (hourly cuff)
    idx1h = pd.date_range(t0, end, freq="1h", inclusive="left")
    asleep1h = _asleep(idx1h)
    co2_1h = win["co2"].ramp(idx1h) if "co2" in win else 0.0
    sbp = profile.sbp - 8 * asleep1h + 10 * co2_1h + rng.normal(0, 4, len(idx1h))
    dbp = profile.dbp - 5 * asleep1h + 6 * co2_1h + rng.normal(0, 3, len(idx1h))
    emit("systolic_bp", idx1h, sbp, 0)
    emit("diastolic_bp", idx1h, dbp, 0)

    # ---- radiation dose (hourly), ~0.5 mSv/day background plus an SPE
    dose = np.clip(rng.normal(0.5 / 24, 0.004, len(idx1h)), 0.0, None)
    if "spe" in win:
        dose = dose + win["spe"].ramp(idx1h) * 22.0  # ~80-90 mSv total over the event
    emit("radiation_dose", idx1h, dose, 4)

    # ---- sleep duration, one reading per wake-up
    wakeups = pd.date_range(
        t0.normalize() + timedelta(hours=SLEEP_END_H), end, freq="1D"
    )
    wakeups = wakeups[wakeups >= t0]
    sleep = profile.sleep_h + rng.normal(0, 0.35, len(wakeups))
    if "sleep_loss" in win and crew_index == 1:
        sleep = sleep - 0.3 * days_into(win["sleep_loss"], wakeups)
    if "fever" in win and crew_index == 0:
        sleep = sleep - 1.5 * win["fever"].mask(wakeups)
    emit("sleep_duration", wakeups, np.clip(sleep, 2.0, 10.0), 2)

    frame = pd.concat(parts, ignore_index=True)
    return frame.sort_values("recorded_at", kind="stable").reset_index(drop=True)
