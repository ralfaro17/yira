"""Static threshold checks against the metric catalog."""

from __future__ import annotations

from dataclasses import dataclass

from .reference import get


@dataclass(frozen=True)
class ThresholdBreach:
    severity: str  # "warning" | "critical"
    direction: str  # "low" | "high"
    bound: float

    def describe(self, label: str, value: float, unit: str) -> str:
        cmp = "≤" if self.direction == "low" else "≥"
        return f"{label} {value:g} {unit} {cmp} {self.severity} limit {self.bound:g} {unit}"


def evaluate(metric: str, value: float) -> ThresholdBreach | None:
    """Return the most severe breach for ``value``, or ``None`` if within limits."""
    spec = get(metric)
    if spec.crit_low is not None and value <= spec.crit_low:
        return ThresholdBreach("critical", "low", spec.crit_low)
    if spec.crit_high is not None and value >= spec.crit_high:
        return ThresholdBreach("critical", "high", spec.crit_high)
    if spec.warn_low is not None and value <= spec.warn_low:
        return ThresholdBreach("warning", "low", spec.warn_low)
    if spec.warn_high is not None and value >= spec.warn_high:
        return ThresholdBreach("warning", "high", spec.warn_high)
    return None


def normalized_deviation(metric: str, value: float) -> float:
    """How far ``value`` sits outside the normal range.

    0 inside the normal range, 1.0 at the critical bound, linear in between,
    and beyond 1.0 past the critical bound.
    """
    spec = get(metric)
    if spec.normal_low is not None and value < spec.normal_low:
        floor = spec.crit_low if spec.crit_low is not None else spec.warn_low
        if floor is None or floor >= spec.normal_low:
            return 0.0
        return (spec.normal_low - value) / (spec.normal_low - floor)
    if spec.normal_high is not None and value > spec.normal_high:
        ceil = spec.crit_high if spec.crit_high is not None else spec.warn_high
        if ceil is None or ceil <= spec.normal_high:
            return 0.0
        return (value - spec.normal_high) / (ceil - spec.normal_high)
    return 0.0
