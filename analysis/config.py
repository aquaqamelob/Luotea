"""Configuration for the Prioritization Engine."""

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_ROOT = ROOT / "Luotea-Hackathon-2026"
OUTPUT_DIR = ROOT / "output"

WORK_ORDERS_PATH = DATA_ROOT / "Work orders" / "work_orders_anonymized 1.csv"
ALARMS_PATH = DATA_ROOT / "Alarms" / "alarms.csv"
SCHEDULE_PATH = DATA_ROOT / "Maintenance schedule (EH-työt)" / "Scheduled maitenance plans.csv"

# Valmet sites with all three datasets
TARGET_SITES = {
    998389833,  # Lentokentänkatu 11
    999154922,  # Venttiilitehdas
    999488386,  # Toimistotalo
}

ALARM_START_DATE = "2025-01-20"

# Cost assumptions (EUR) — disclosed in pitch as assumptions
HOURLY_RATE_EUR = 80
AVOIDED_DOWNTIME_EUR = 10_000

# Engine thresholds
ALARM_WINDOW_DAYS = 7
ALARM_SEND_NOW_THRESHOLD = 5
ALARM_CANCEL_THRESHOLD = 0
DAYS_TO_NEXT_EH_SEND_NOW = 14
DAYS_TO_NEXT_EH_CANCEL = 3
REACTIVE_AFTER_EH_DAYS = 14
ALARM_BASELINE_DAYS = 30

# Equipment code patterns from BMS/Neles alarm descriptions
EQUIPMENT_CODE_PATTERN = r"\b\d{3}[A-Z]{2}\d{2}(?:\.\d+)?\b|\b\d{3}-[A-Z]{2}\d{2}(?:\.\d+)?\b|\bJJ\d{2}[A-Z]{2}\d{2}\b"
