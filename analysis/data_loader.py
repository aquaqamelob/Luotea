"""Shared ETL: load and normalize the three hackathon datasets."""

from __future__ import annotations

import re
from datetime import timedelta

import pandas as pd

from config import (
    ALARMS_PATH,
    EQUIPMENT_CODE_PATTERN,
    SCHEDULE_PATH,
    TARGET_SITES,
    WORK_ORDERS_PATH,
)

_EQUIPMENT_RE = re.compile(EQUIPMENT_CODE_PATTERN, re.IGNORECASE)


def extract_equipment_codes(text: str | float | None) -> set[str]:
    if text is None or (isinstance(text, float) and pd.isna(text)):
        return set()
    return {m.upper().split(".")[0] for m in _EQUIPMENT_RE.findall(str(text))}


def parse_fi_datetime(series: pd.Series) -> pd.Series:
    return pd.to_datetime(series, format="%d.%m.%Y %H:%M", errors="coerce")


def load_work_orders() -> pd.DataFrame:
    df = pd.read_csv(WORK_ORDERS_PATH, sep=";", encoding="latin-1", low_memory=False)
    df["started"] = parse_fi_datetime(df["WORK_STARTED_DATETIME"])
    df["finished"] = parse_fi_datetime(df["WORK_FINISHED_DATETIME"])
    df["hours"] = pd.to_numeric(df["WORKTIME_HOURS"], errors="coerce").fillna(0)
    df["days"] = pd.to_numeric(df["WORK_FINISHED_DAYS"], errors="coerce").fillna(0)
    df["CUSTOMER_SITE_NO"] = pd.to_numeric(df["CUSTOMER_SITE_NO"], errors="coerce")
    df["CUSTOMER_NO"] = pd.to_numeric(df["CUSTOMER_NO"], errors="coerce")
    df["equipment_codes"] = (
        df["WORK_DESCRIPTION"].fillna("").astype(str)
        + " "
        + df.get("WORK_ORDER_PERFORMED_ACTION", pd.Series("", index=df.index)).fillna("").astype(str)
    ).apply(extract_equipment_codes)
    return df


def load_alarms() -> pd.DataFrame:
    df = pd.read_csv(ALARMS_PATH, encoding="utf-8-sig", low_memory=False)
    df["EVENT_TIME"] = pd.to_datetime(df["EVENT_TIME"], errors="coerce")
    df["CUSTOMER_SITE_NO"] = pd.to_numeric(df["CUSTOMER_SITE_NO"], errors="coerce")
    df["CUSTOMER_NO"] = pd.to_numeric(df["CUSTOMER_NO"], errors="coerce")
    df["equipment_codes"] = df["EVENT_DESCRIPTION"].apply(extract_equipment_codes)
    df["is_actionable"] = df["LOG_ONLY"].isna() & (df["ALERT_TYPE"] != "INFO")
    return df


def load_schedule() -> pd.DataFrame:
    df = pd.read_csv(SCHEDULE_PATH, encoding="utf-8-sig", low_memory=False)
    df["CUSTOMER_SITE_NO"] = pd.to_numeric(df["CUSTOMER_SITE_NO"], errors="coerce")
    df["PM_NO"] = pd.to_numeric(df["PM_NO"], errors="coerce")
    df["INTERVAL"] = pd.to_numeric(df["INTERVAL"], errors="coerce")
    df["PLAN_HRS"] = pd.to_numeric(df["PLAN_HRS"], errors="coerce").fillna(0)
    df["START_DATE"] = pd.to_datetime(df["START_DATE"], errors="coerce")
    # Deduplicate: same PM_NO appears ~3x in export
    df = df.sort_values("LAST_UPDATED").drop_duplicates(subset=["PM_NO"], keep="last")
    df = df[df["CUSTOMER_SITE_NO"].isin(TARGET_SITES)]
    return df


def filter_target_sites(df: pd.DataFrame) -> pd.DataFrame:
    return df[df["CUSTOMER_SITE_NO"].isin(TARGET_SITES)].copy()


def get_reactive_repairs(wo: pd.DataFrame, since: str = "2025-01-20") -> pd.DataFrame:
    mask = (
        (wo["WORK_ORDER_TYPE_ENG"] == "On-demand work")
        & (wo["WORK_TYPE_DESCRIPTION_ENG"].str.contains("Repairs", na=False))
        & (wo["CONTRACT"].isin(["KH", "KT"]))
        & (wo["started"] >= pd.Timestamp(since))
    )
    return wo.loc[mask].copy()


def get_scheduled_work(wo: pd.DataFrame) -> pd.DataFrame:
    return wo.loc[wo["WORK_ORDER_TYPE_ENG"] == "Scheduled work"].copy()


def count_alarms_before(
    alarms: pd.DataFrame,
    customer_no: int,
    site_no: int,
    end: pd.Timestamp,
    window_days: int = 7,
    equipment_codes: set[str] | None = None,
    actionable_only: bool = True,
) -> tuple[int, int, pd.Timestamp | None]:
    """Return (unique_alert_count, row_count, first_alarm_time)."""
    start = end - timedelta(days=window_days)
    mask = (
        (alarms["CUSTOMER_NO"] == customer_no)
        & (alarms["CUSTOMER_SITE_NO"] == site_no)
        & (alarms["EVENT_TIME"] >= start)
        & (alarms["EVENT_TIME"] < end)
    )
    if actionable_only:
        mask &= alarms["is_actionable"]
    subset = alarms.loc[mask]
    if equipment_codes:
        subset = subset[subset["equipment_codes"].apply(lambda c: bool(c & equipment_codes))]
    if subset.empty:
        return 0, 0, None
    return subset["ALERT_ID"].nunique(), len(subset), subset["EVENT_TIME"].min()


def interval_to_timedelta(interval: float, unit: str) -> timedelta | None:
    if pd.isna(interval) or not unit:
        return None
    unit = unit.strip().lower()
    n = int(interval)
    if unit == "day":
        return timedelta(days=n)
    if unit == "week":
        return timedelta(weeks=n)
    if unit == "month":
        return timedelta(days=n * 30)
    if unit == "year":
        return timedelta(days=n * 365)
    return None


def compute_next_inspection(
    pm_no: int,
    schedule: pd.DataFrame,
    eh_work: pd.DataFrame,
    reference_date: pd.Timestamp | None = None,
) -> pd.Timestamp | None:
    """Compute next planned inspection date for a PM_NO."""
    ref = reference_date or pd.Timestamp.now()
    plan_rows = schedule.loc[schedule["PM_NO"] == pm_no]
    if plan_rows.empty:
        return None
    plan = plan_rows.iloc[0]
    if plan.get("OBJSTATE") == "Obsolete":
        return None
    delta = interval_to_timedelta(plan["INTERVAL"], plan.get("PM_INTERVAL_UNIT", ""))
    if delta is None:
        return None

    pm_eh = eh_work.loc[eh_work["PM_NO"].astype(str) == str(pm_no)]
    if not pm_eh.empty and pm_eh["finished"].notna().any():
        last = pm_eh["finished"].max()
        return last + delta

    start = plan["START_DATE"]
    if pd.isna(start):
        return None
    next_date = start
    while next_date <= ref:
        next_date = next_date + delta
    return next_date
