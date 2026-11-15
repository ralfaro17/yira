from datetime import timedelta

import numpy as np
import pandas as pd
from django.test import SimpleTestCase

from health.analysis import (
    anomaly,
    baseline,
    derived,
    frames,
    risk,
    summary,
    thresholds,
    trends,
)
from health.services import parse_csv


def _series(values, start="2026-01-01", freq="5min"):
    idx = pd.date_range(start, periods=len(values), freq=freq, tz="UTC")
    return pd.Series(np.asarray(values, dtype=float), index=idx)


class ThresholdTests(SimpleTestCase):
    def test_within_limits(self):
        self.assertIsNone(thresholds.evaluate("spo2", 97))

    def test_warning_and_critical(self):
        self.assertEqual(thresholds.evaluate("spo2", 93).severity, "warning")
        self.assertEqual(thresholds.evaluate("spo2", 89).severity, "critical")
        self.assertEqual(thresholds.evaluate("body_temp", 38.2).severity, "warning")
        self.assertEqual(thresholds.evaluate("body_temp", 39.6).direction, "high")

    def test_unknown_metric(self):
        with self.assertRaises(ValueError):
            thresholds.evaluate("mood", 1)

    def test_normalized_deviation(self):
        self.assertEqual(thresholds.normalized_deviation("spo2", 97), 0.0)
        self.assertAlmostEqual(thresholds.normalized_deviation("spo2", 90), 1.0)
        self.assertAlmostEqual(thresholds.normalized_deviation("spo2", 92.5), 0.5)


class BaselineTests(SimpleTestCase):
    def test_robust_z(self):
        b = baseline.from_values(_series([10, 11, 9, 10, 10, 11, 9, 10, 12, 8, 10, 10]))
        self.assertEqual(b.median, 10)
        self.assertAlmostEqual(float(b.robust_z(10)), 0.0)
        self.assertGreater(float(b.robust_z(20)), 3.5)

    def test_too_few_points(self):
        self.assertIsNone(baseline.from_values(_series([1, 2, 3])))

    def test_zero_mad_does_not_divide_by_zero(self):
        b = baseline.from_values(_series([5.0] * 20))
        self.assertTrue(np.isfinite(b.robust_z(6.0)))

    def test_circadian_buckets_use_time_of_day(self):
        # 3 days at 5 min: 50 at night (00-06h), 80 otherwise.
        idx = pd.date_range("2026-01-01", periods=3 * 288, freq="5min", tz="UTC")
        values = np.where(idx.hour < 6, 50.0, 80.0) + np.random.default_rng(0).normal(
            0, 1, len(idx)
        )
        b = baseline.circadian_baseline(pd.Series(values, index=idx), days=3)
        night = pd.DatetimeIndex([pd.Timestamp("2026-01-05 03:00", tz="UTC")])
        day = pd.DatetimeIndex([pd.Timestamp("2026-01-05 15:00", tz="UTC")])
        self.assertLess(abs(b.robust_z([50], night)[0]), 3)
        self.assertGreater(abs(b.robust_z([50], day)[0]), 10)


class AnomalyTests(SimpleTestCase):
    def setUp(self):
        rng = np.random.default_rng(1)
        self.values = 60 + rng.normal(0, 1, 500)
        self.base = baseline.from_values(_series(self.values[:200]))

    def test_detects_injected_spike(self):
        vals = self.values.copy()
        vals[300] = 90
        found = anomaly.baseline_anomalies(_series(vals), self.base)
        self.assertIn(
            300,
            [
                int((t - _series(vals).index[0]) / pd.Timedelta("5min"))
                for t in found.recorded_at
            ],
        )

    def test_persistence_suppresses_single_spike(self):
        vals = self.values.copy()
        vals[300] = 90
        self.assertTrue(
            anomaly.baseline_anomalies(_series(vals), self.base, persistence=3).empty
        )
        vals[300:305] = 90
        self.assertEqual(
            len(anomaly.baseline_anomalies(_series(vals), self.base, persistence=3)), 3
        )

    def test_rolling_detects_step(self):
        vals = self.values.copy()
        vals[400] = 85
        found = anomaly.rolling_anomalies(_series(vals))
        self.assertIn(_series(vals).index[400], set(found.recorded_at))


class TrendTests(SimpleTestCase):
    def test_declining_sleep_is_concerning(self):
        s = _series([8.0 - 0.3 * d for d in range(10)], freq="1D")
        t = trends.linear_trend(s, "sleep_duration")
        self.assertLess(t.slope_per_day, 0)
        self.assertTrue(t.significant and t.concerning)

    def test_rising_sleep_not_concerning(self):
        s = _series([6.0 + 0.3 * d for d in range(10)], freq="1D")
        self.assertFalse(trends.linear_trend(s, "sleep_duration").concerning)

    def test_flat_noise_not_significant(self):
        rng = np.random.default_rng(3)
        s = _series(60 + rng.normal(0, 0.5, 14 * 288))
        self.assertFalse(trends.linear_trend(s, "heart_rate").significant)

    def test_needs_minimum_days(self):
        self.assertIsNone(
            trends.linear_trend(_series([7, 7, 6], freq="1D"), "sleep_duration")
        )


class RiskTests(SimpleTestCase):
    def test_nominal_is_zero(self):
        r = risk.compute_risk({"heart_rate": 60, "spo2": 98})
        self.assertEqual(r["score"], 0)
        self.assertEqual(r["level"], "nominal")

    def test_bounded_and_monotonic(self):
        mild = risk.compute_risk({"spo2": 93})["score"]
        severe = risk.compute_risk({"spo2": 88})["score"]
        worst = risk.compute_risk(
            {"spo2": 70, "heart_rate": 200, "body_temp": 42, "systolic_bp": 220},
            {"critical": 50},
            5.0,
        )
        self.assertLess(mild, severe)
        self.assertLessEqual(worst["score"], 100)
        self.assertEqual(worst["level"], "critical")

    def test_factors_explain_score(self):
        r = risk.compute_risk({"spo2": 92}, {"warning": 1}, 0.5)
        self.assertEqual(
            {f["factor"] for f in r["factors"]},
            {"vital_out_of_range", "open_alerts", "radiation_budget"},
        )


class DerivedAndSummaryTests(SimpleTestCase):
    def test_mean_arterial_pressure(self):
        m = derived.mean_arterial_pressure(
            _series([120], freq="1h"), _series([80], freq="1h")
        )
        self.assertAlmostEqual(float(m.iloc[0]), (120 + 160) / 3)

    def test_radiation_status(self):
        dose = _series([1.0] * 48, freq="1h")
        status = derived.radiation_status(dose)
        self.assertAlmostEqual(status["totals"]["24h"], 24.0)
        self.assertAlmostEqual(status["totals"]["career"], 48.0)
        self.assertAlmostEqual(status["fraction_of_limit"]["career"], 48 / 600)

    def test_metric_stats_and_timeseries(self):
        s = _series(range(24), freq="1h")
        stats = summary.metric_stats(s, "heart_rate")
        self.assertEqual(stats["count"], 24)
        self.assertEqual(stats["latest"]["value"], 23)
        pts = summary.timeseries(s, "heart_rate", "6h")
        self.assertEqual(len(pts), 4)
        self.assertEqual(pts[0]["count"], 6)

    def test_empty_series(self):
        self.assertEqual(
            summary.metric_stats(pd.Series(dtype=float), "spo2")["count"], 0
        )
        self.assertEqual(summary.timeseries(pd.Series(dtype=float), "spo2"), [])


class ParsingTests(SimpleTestCase):
    def test_parse_duration(self):
        self.assertEqual(frames.parse_duration("7d"), timedelta(days=7))
        self.assertEqual(frames.parse_duration("30m"), timedelta(minutes=30))
        with self.assertRaises(ValueError):
            frames.parse_duration("week")

    def test_parse_csv_long(self):
        rows = parse_csv("metric,value,recorded_at\nspo2,97,2026-01-01T00:00:00Z\n")
        self.assertEqual(rows[0]["metric"], "spo2")
        self.assertEqual(rows[0]["value"], 97.0)

    def test_parse_csv_wide(self):
        rows = parse_csv(
            "recorded_at,heart_rate,spo2\n2026-01-01T00:00:00Z,60,\n2026-01-01T00:05:00Z,61,97\n"
        )
        self.assertEqual(len(rows), 3)

    def test_parse_csv_errors(self):
        with self.assertRaises(ValueError):
            parse_csv("recorded_at,mood\n2026-01-01,5\n")
        with self.assertRaises(ValueError):
            parse_csv("metric,value,recorded_at\nspo2,abc,2026-01-01T00:00:00Z\n")
