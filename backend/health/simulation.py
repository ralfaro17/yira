"""Synthetic mission data generator for demos and tests.

Produces plausible (not physiologically exact) crew telemetry with injected
scenarios so the analysis pipeline has something to find. Mission-wide events
affect everyone; personal events are assigned per crew profile and the
"current" ones run up to the end of the mission so they show as active now.

Mission-wide:
* ``spe``         solar particle event: radiation dose spike (mid-mission)
* ``co2``         CO2 scrubber degradation: cabin CO2, RR and HR up (late mission)

Personal:
* ``cardio``      cardiovascular episode during the last ~10 h: HR, BP up, SpO2 dips, HRV down
* ``fever``       febrile episode during the last ~30 h: temperature, HR and RR up
* ``sleep_loss``  progressive sleep restriction after the baseline period: sleep, HRV down
* ``deconditioning`` skipped countermeasure exercise over the last days
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timedelta

import numpy as np
import pandas as pd

MISSION_SCENARIOS = ("spe", "co2")
PERSONAL_SCENARIOS = ("cardio", "fever", "sleep_loss", "deconditioning")
SCENARIOS = MISSION_SCENARIOS + PERSONAL_SCENARIOS
SLEEP_START_H, SLEEP_END_H = 21.5, 6.0  # GMT, ISS-style schedule
EXERCISE_START_H, EXERCISE_END_H = 13.0, 15.0


@dataclass(frozen=True)
class CrewProfile:
    slug: str
    name: str
    age: int
    role: str
    sex: str
    resting_hr: float
    hrv: float
    sbp: float
    dbp: float
    temp: float
    sleep_h: float
    scenarios: tuple[str, ...] = ()
    photo: str = ""

    def date_of_birth(self, today: date | None = None) -> date:
        today = today or date.today()
        return date(today.year - self.age, 1, 1)


DEFAULT_CREW = [
    # The three crew members from the Yira design: stable, in observation, critical.
    CrewProfile(
        "alvaro",
        "Álvaro",
        21,
        "Tripulante",
        "M",
        58,
        58,
        114,
        73,
        36.6,
        7.6,
        photo="/crew/alvaro.png",
    ),
    CrewProfile(
        "rosa",
        "Rosa",
        38,
        "Tripulante",
        "F",
        62,
        50,
        112,
        72,
        36.7,
        7.3,
        scenarios=("cardio",),
        photo="/crew/rosa.png",
    ),
    CrewProfile(
        "mateo",
        "Mateo",
        23,
        "Tripulante",
        "M",
        60,
        54,
        116,
        75,
        36.7,
        7.4,
        scenarios=("fever", "sleep_loss", "deconditioning"),
        photo="/crew/mateo.png",
    ),
    # Extra crew for larger simulations (no portrait in the design).
    CrewProfile("lucia", "Lucía", 29, "Tripulante", "F", 61, 52, 110, 70, 36.8, 7.2),
    CrewProfile("diego", "Diego", 34, "Tripulante", "M", 59, 55, 118, 77, 36.6, 7.1),
    CrewProfile("ines", "Inés", 41, "Tripulante", "F", 63, 47, 116, 74, 36.7, 7.0),
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

    def onset(self, idx: pd.DatetimeIndex, rise: float = 0.2) -> np.ndarray:
        """0 outside the window; rises to 1 over the first ``rise`` fraction, then stays at 1."""
        span = (self.end - self.start).total_seconds()
        pos = (idx - self.start).total_seconds().to_numpy() / span
        return np.where((pos >= 0) & (pos < 1), np.clip(pos / rise, 0, 1), 0.0)

    def days_into(self, idx: pd.DatetimeIndex) -> np.ndarray:
        return np.clip(
            (idx - self.start).total_seconds().to_numpy() / 86400.0, 0, None
        ) * self.mask(idx)


def scenario_windows(start: pd.Timestamp, days: int) -> dict[str, Window]:
    end = start + timedelta(days=days)

    def at(frac: float, hours: float) -> Window:
        s = (start + timedelta(days=days * frac)).floor("1h")
        return Window(s, s + timedelta(hours=hours))

    def last(hours: float) -> Window:
        return Window(end - timedelta(hours=hours), end + timedelta(seconds=1))

    after_baseline = start + timedelta(days=max(3.0, days * 0.3))
    return {
        "spe": at(0.55, 8),
        "co2": at(0.75, 10),
        "cardio": last(10),
        "fever": last(30),
        "sleep_loss": Window(after_baseline, end + timedelta(days=1)),
        "deconditioning": Window(
            max(after_baseline, end - timedelta(days=5)), end + timedelta(days=1)
        ),
    }


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
    """Return a long frame (recorded_at, metric, value) for one crew member.

    ``scenarios`` enables scenarios globally; personal ones also need to be
    listed in ``profile.scenarios``.
    """
    rng = np.random.default_rng(seed + crew_index * 1009)
    ts = pd.Timestamp(start)
    t0 = ts.tz_convert("UTC") if ts.tzinfo else ts.tz_localize("UTC")
    end = t0 + timedelta(days=days)
    win = scenario_windows(t0, days)
    active = {s for s in scenarios if s in MISSION_SCENARIOS or s in profile.scenarios}
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

    def level(name: str, idx: pd.DatetimeIndex, shape: str = "ramp") -> np.ndarray:
        if name not in active:
            return np.zeros(len(idx))
        w = win[name]
        return (
            w.onset(idx)
            if shape == "onset"
            else w.days_into(idx)
            if shape == "days"
            else w.ramp(idx)
        )

    # ---- high-rate vitals (HR, HRV, SpO2, RR)
    idx = pd.date_range(t0, end, freq=interval, inclusive="left")
    asleep, exercising = _asleep(idx), _exercising(idx)
    phase = 2 * np.pi * (_hour_of_day(idx) - 16) / 24
    co2 = level("co2", idx)
    cardio = level("cardio", idx, "onset")
    fever = level("fever", idx, "onset")
    sleep_loss_days = level("sleep_loss", idx, "days")
    resting = 1 - exercising  # scenario effects are clearest at rest

    hr = (
        profile.resting_hr
        + 4 * np.cos(phase)
        - 5 * asleep
        + 45
        * exercising
        * (1 - 0.7 * np.maximum(fever, cardio))  # sick crew exercise little
        + 14 * cardio * resting
        + 12 * fever
        + 8 * co2
        + 0.9 * sleep_loss_days
        + rng.normal(0, 2.5, len(idx))
    )
    hrv = (
        profile.hrv
        * (1 + 0.25 * asleep - 0.45 * exercising - 0.3 * fever - 0.3 * cardio)
        - 1.2 * sleep_loss_days
    )
    hrv = np.clip(hrv + rng.normal(0, 3, len(idx)), 5, None)
    spo2 = (
        97.8
        - 0.6 * asleep
        - 0.8 * exercising
        - 2.5 * cardio
        + rng.normal(0, 0.4, len(idx))
    )
    rr = (
        14.5
        - 1.5 * asleep
        + 6 * exercising
        + 5 * fever
        + 2 * cardio
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
    temp = (
        profile.temp
        + 0.3 * np.cos(phase15)
        + 1.9 * level("fever", idx15, "onset")
        + rng.normal(0, 0.08, len(idx15))
    )
    emit("body_temp", idx15, temp, 2)
    cabin = (
        2.4
        + 0.25 * np.sin(phase15)
        + 4.5 * level("co2", idx15)
        + rng.normal(0, 0.12, len(idx15))
    )
    emit("cabin_co2", idx15, np.clip(cabin, 0.5, None), 2)

    # ---- blood pressure (hourly cuff)
    idx1h = pd.date_range(t0, end, freq="1h", inclusive="left")
    asleep1h = _asleep(idx1h)
    co2_1h, cardio_1h = level("co2", idx1h), level("cardio", idx1h, "onset")
    sbp = (
        profile.sbp
        - 8 * asleep1h
        + 10 * co2_1h
        + 22 * cardio_1h
        + rng.normal(0, 4, len(idx1h))
    )
    dbp = (
        profile.dbp
        - 5 * asleep1h
        + 6 * co2_1h
        + 10 * cardio_1h
        + rng.normal(0, 3, len(idx1h))
    )
    emit("systolic_bp", idx1h, sbp, 0)
    emit("diastolic_bp", idx1h, dbp, 0)

    # ---- radiation dose (hourly), ~0.5 mSv/day background plus an SPE
    dose = np.clip(rng.normal(0.5 / 24, 0.004, len(idx1h)), 0.0, None)
    dose = dose + level("spe", idx1h) * 22.0  # ~80-90 mSv total over the event
    emit("radiation_dose", idx1h, dose, 4)

    # ---- daily readings at wake-up: sleep duration and previous day's exercise
    wakeups = pd.date_range(
        t0.normalize() + timedelta(hours=SLEEP_END_H), end, freq="1D"
    )
    wakeups = wakeups[(wakeups >= t0) & (wakeups < end)]
    sleep = profile.sleep_h + rng.normal(0, 0.35, len(wakeups))
    sleep = (
        sleep
        - 0.2 * level("sleep_loss", wakeups, "days")
        - 1.5 * (level("fever", wakeups, "onset") > 0)
    )
    emit("sleep_duration", wakeups, np.clip(sleep, 2.0, 10.0), 2)
    exercise = 140 + rng.normal(0, 12, len(wakeups))
    exercise = np.where(
        level("deconditioning", wakeups, "days") > 0,
        25 + rng.normal(0, 8, len(wakeups)),
        exercise,
    )
    emit("exercise_minutes", wakeups, np.clip(exercise, 0, 240), 0)

    frame = pd.concat(parts, ignore_index=True)
    return frame.sort_values("recorded_at", kind="stable").reset_index(drop=True)
