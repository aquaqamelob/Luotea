"""Explainable 0–100 risk score from alarm + calendar signals."""

from __future__ import annotations

from dataclasses import dataclass

from config import (
    ALARM_SEND_NOW_THRESHOLD,
    DAYS_TO_NEXT_EH_SEND_NOW,
    RISK_TIER_HIGH,
    RISK_TIER_MEDIUM,
    RISK_WEIGHTS,
)


@dataclass
class RiskBreakdown:
    alarm_intensity: float
    trend: float
    calendar_gap: float
    eh_history: float

    @property
    def as_pct(self) -> dict[str, int]:
        return {
            "alarm_intensity_pct": round(self.alarm_intensity * 100),
            "trend_pct": round(self.trend * 100),
            "calendar_gap_pct": round(self.calendar_gap * 100),
            "eh_history_pct": round(self.eh_history * 100),
        }


def _alarm_intensity(alarms_7d: int) -> float:
    return min(alarms_7d / ALARM_SEND_NOW_THRESHOLD, 1.0)


def _trend(alarms_7d: int, alarms_30d: int) -> float:
    if alarms_7d <= 0:
        return 0.0
    baseline_weekly = max(alarms_30d / 4.0, 0.25)
    return min(alarms_7d / baseline_weekly, 1.0)


def _calendar_gap(alarms_7d: int, days_to_next: int | float | None) -> float:
    if alarms_7d <= 0 or days_to_next is None or pd_is_na(days_to_next):
        return 0.0
    days = float(days_to_next)
    if days > DAYS_TO_NEXT_EH_SEND_NOW:
        return 1.0
    if days > 7:
        return 0.5
    return 0.0


def pd_is_na(v: object) -> bool:
    try:
        import math

        if v is None:
            return True
        if isinstance(v, float) and math.isnan(v):
            return True
    except Exception:
        pass
    return False


def compute_risk_score(
    alarms_7d: int,
    alarms_30d: int,
    days_to_next: int | float | None = None,
    had_reactive_after_eh: bool = False,
) -> tuple[int, RiskBreakdown]:
    breakdown = RiskBreakdown(
        alarm_intensity=_alarm_intensity(alarms_7d),
        trend=_trend(alarms_7d, alarms_30d),
        calendar_gap=_calendar_gap(alarms_7d, days_to_next),
        eh_history=1.0 if had_reactive_after_eh else 0.0,
    )

    raw = (
        RISK_WEIGHTS["alarm_intensity"] * breakdown.alarm_intensity
        + RISK_WEIGHTS["trend"] * breakdown.trend
        + RISK_WEIGHTS["calendar_gap"] * breakdown.calendar_gap
        + RISK_WEIGHTS["eh_history"] * breakdown.eh_history
    )
    return round(raw * 100), breakdown


def risk_tier(score: int) -> str:
    if score >= RISK_TIER_HIGH:
        return "high"
    if score >= RISK_TIER_MEDIUM:
        return "medium"
    return "low"


def explain_score(score: int, breakdown: RiskBreakdown) -> str:
    parts = breakdown.as_pct
    lines = [
        f"Risk {score}/100 ({risk_tier(score)}):",
        f"  • Alarm intensity ({RISK_WEIGHTS['alarm_intensity']:.0%} weight): {parts['alarm_intensity_pct']}%",
        f"  • Trend vs 30d baseline ({RISK_WEIGHTS['trend']:.0%}): {parts['trend_pct']}%",
        f"  • Calendar gap — alarms but far inspection ({RISK_WEIGHTS['calendar_gap']:.0%}): {parts['calendar_gap_pct']}%",
        f"  • EH-työ → failure history ({RISK_WEIGHTS['eh_history']:.0%}): {parts['eh_history_pct']}%",
    ]
    return "\n".join(lines)
