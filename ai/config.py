"""Paths and thresholds for the AI / analytics layer."""

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_ROOT = ROOT / "Luotea-Hackathon-2026"
OUTPUT_DIR = ROOT / "output" / "ai"
TS_RECOMMENDATIONS = ROOT / "output" / "recommendations.csv"

WORK_ORDERS_PATH = DATA_ROOT / "Work orders" / "work_orders_anonymized 1.csv"
ALARMS_PATH = DATA_ROOT / "Alarms" / "alarms.csv"
SCHEDULE_PATH = DATA_ROOT / "Maintenance schedule (EH-työt)" / "Scheduled maitenance plans.csv"

TARGET_SITES = {998389833, 999154922, 999488386}

ALARM_WINDOW_DAYS = 7
ALARM_BASELINE_DAYS = 30
ALARM_SEND_NOW_THRESHOLD = 5
REACTIVE_AFTER_EH_DAYS = 14
DAYS_TO_NEXT_EH_SEND_NOW = 14

EQUIPMENT_CODE_PATTERN = (
    r"\b\d{3}[A-Z]{2}\d{2}(?:\.\d+)?\b|\b\d{3}-[A-Z]{2}\d{2}(?:\.\d+)?\b|\bJJ\d{2}[A-Z]{2}\d{2}\b"
)

# Explainable risk score weights (must sum to 1.0)
RISK_WEIGHTS = {
    "alarm_intensity": 0.40,
    "trend": 0.25,
    "calendar_gap": 0.20,
    "eh_history": 0.15,
}

RISK_TIER_HIGH = 70
RISK_TIER_MEDIUM = 40
