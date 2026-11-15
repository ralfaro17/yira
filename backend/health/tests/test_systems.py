import numpy as np
import pandas as pd
from django.test import SimpleTestCase

from health.analysis import baseline, frames, systems


def _frame(rows_by_metric, end="2026-01-08T00:00:00Z", freq="5min", n=24):
    rows = []
    idx = pd.date_range(end=pd.Timestamp(end), periods=n, freq=freq)
    for metric, value in rows_by_metric.items():
        for t in idx:
            rows.append((t, metric, value))
    return frames.make_frame(rows), idx[-1]


NORMAL = {
    "heart_rate": 62,
    "systolic_bp": 115,
    "diastolic_bp": 75,
    "spo2": 98,
    "body_temp": 36.7,
    "respiratory_rate": 14,
    "sleep_duration": 7.5,
    "cabin_co2": 2.4,
    "exercise_minutes": 140,
}


def by_key(result):
    return {s["key"]: s for s in result["systems"]}


class SystemScoreTests(SimpleTestCase):
    def test_all_normal_is_stable(self):
        df, at = _frame(NORMAL)
        res = by_key(systems.score_systems(df, at))
        for key in ("cardiovascular", "immune", "musculoskeletal", "mental"):
            self.assertEqual(res[key]["status"], "stable", key)
        self.assertTrue(res["musculoskeletal"]["estimated"])

    def test_fever_degrades_immune(self):
        df, at = _frame({**NORMAL, "body_temp": 39.8})
        res = by_key(systems.score_systems(df, at))
        self.assertEqual(res["immune"]["status"], "critical")
        self.assertEqual(res["immune"]["drivers"][0]["metric"], "body_temp")
        self.assertEqual(res["cardiovascular"]["status"], "stable")

    def test_warning_is_observation(self):
        df, at = _frame({**NORMAL, "spo2": 93.5})
        self.assertEqual(
            by_key(systems.score_systems(df, at))["cardiovascular"]["status"],
            "observation",
        )

    def test_missing_data_is_unknown(self):
        df, at = _frame({"heart_rate": 60})
        res = by_key(systems.score_systems(df, at))
        self.assertIsNone(res["mental"]["score"])
        self.assertEqual(res["mental"]["status"], "unknown")

    def test_in_range_drift_capped_at_observation(self):
        idx = pd.date_range("2026-01-01", periods=3 * 288, freq="5min", tz="UTC")
        rng = np.random.default_rng(0)
        base = baseline.circadian_baseline(
            pd.Series(98 + rng.normal(0, 0.3, len(idx)), index=idx)
        )
        df, at = _frame(
            {**NORMAL, "spo2": 95.5}
        )  # in range but far below this person's norm
        res = by_key(systems.score_systems(df, at, {"spo2": base}))
        self.assertEqual(res["cardiovascular"]["status"], "observation")

    def test_overall_status(self):
        def sys(*statuses):
            return [{"status": s} for s in statuses]

        self.assertEqual(
            systems.overall_status(sys("stable", "stable"), "nominal"), "stable"
        )
        self.assertEqual(
            systems.overall_status(sys("critical", "stable"), "high"), "observation"
        )
        self.assertEqual(
            systems.overall_status(sys("critical", "critical"), "nominal"), "critical"
        )
        self.assertEqual(systems.overall_status(sys("stable"), "critical"), "critical")

    def test_current_issue_and_daily(self):
        df, at = _frame({**NORMAL, "body_temp": 39.8}, n=7 * 24, freq="1h")
        res = systems.score_systems(df, at)
        issue = systems.current_issue(res["systems"])
        self.assertEqual(issue["system"], "immune")
        daily = systems.daily_scores(df, at, 7)
        self.assertEqual(len(daily), 7)
        self.assertEqual(daily[-1]["date"], at.date().isoformat())
