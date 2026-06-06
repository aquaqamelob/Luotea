#!/usr/bin/env python3
"""Find top reactive repairs with alarm context — proof of calendar pathology."""

from __future__ import annotations

import sys
from datetime import timedelta
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent))

from config import ALARM_WINDOW_DAYS, HOURLY_RATE_EUR, OUTPUT_DIR, REACTIVE_AFTER_EH_DAYS
from data_loader import (
    count_alarms_before,
    filter_target_sites,
    get_reactive_repairs,
    get_scheduled_work,
    load_alarms,
    load_work_orders,
)

# Featured case studies (WO_NO -> narrative key)
FEATURED_CASES = {
    "54960238": "case1_m100",
    "54716854": "case2_401pe02",
    "54882174": "case3_ilp",
}


def analyze_top_repairs(wo: pd.DataFrame, alarms: pd.DataFrame, top_n: int = 5) -> pd.DataFrame:
    reactive = get_reactive_repairs(filter_target_sites(wo))
    eh = get_scheduled_work(filter_target_sites(wo))
    rows = []

    for _, row in reactive.nlargest(top_n * 3, "hours").head(top_n * 3).iterrows():
        start = row["started"]
        if pd.isna(start):
            continue
        site_no = int(row["CUSTOMER_SITE_NO"])
        cust = int(row["CUSTOMER_NO"])
        codes = row["equipment_codes"]

        n_unique, n_rows, first_alarm = count_alarms_before(
            alarms, cust, site_no, start, ALARM_WINDOW_DAYS, codes or None
        )
        if n_unique == 0:
            n_unique, n_rows, first_alarm = count_alarms_before(
                alarms, cust, site_no, start, ALARM_WINDOW_DAYS
            )

        prior_eh = eh[
            (eh["CUSTOMER_SITE_NO"] == site_no)
            & (eh["started"] >= start - timedelta(days=REACTIVE_AFTER_EH_DAYS))
            & (eh["started"] < start)
        ]
        next_eh = eh[(eh["CUSTOMER_SITE_NO"] == site_no) & (eh["started"] > start)]
        next_eh_date = next_eh["started"].min() if not next_eh.empty else pd.NaT
        days_to_next = (next_eh_date - start).days if pd.notna(next_eh_date) else None

        rows.append(
            {
                "WO_NO": row["WO_NO"],
                "site": row["customer_site_name"],
                "started": start,
                "hours": row["hours"],
                "cost_eur": round(row["hours"] * HOURLY_RATE_EUR, 0),
                "work_type": row["WORK_TYPE_DESCRIPTION_ENG"],
                "description": str(row["WORK_DESCRIPTION"])[:120],
                "alarms_7d_unique": n_unique,
                "alarms_7d_rows": n_rows,
                "first_alarm": first_alarm,
                "days_alarm_to_failure": (start - first_alarm).days if first_alarm else None,
                "prior_eh_14d": len(prior_eh),
                "last_prior_eh": prior_eh["started"].max() if not prior_eh.empty else pd.NaT,
                "days_to_next_eh": days_to_next,
            }
        )

    df = pd.DataFrame(rows).sort_values("hours", ascending=False).head(top_n)
    return df


def analyze_calendar_waste(wo: pd.DataFrame, alarms: pd.DataFrame) -> dict:
    reactive = get_reactive_repairs(filter_target_sites(wo))
    eh = get_scheduled_work(filter_target_sites(wo))
    eh = eh[eh["started"] >= "2025-01-20"]

    eh_with_followup = 0
    reactive_with_alarms = 0
    alarm_to_failure_days = []

    for _, eh_row in eh.iterrows():
        eh_start = eh_row["started"]
        if pd.isna(eh_start):
            continue
        site_no = eh_row["CUSTOMER_SITE_NO"]
        followup = reactive[
            (reactive["CUSTOMER_SITE_NO"] == site_no)
            & (reactive["started"] > eh_start)
            & (reactive["started"] <= eh_start + timedelta(days=REACTIVE_AFTER_EH_DAYS))
        ]
        if not followup.empty:
            eh_with_followup += 1

    for _, r in reactive.iterrows():
        start = r["started"]
        if pd.isna(start):
            continue
        n, _, first = count_alarms_before(
            alarms, int(r["CUSTOMER_NO"]), int(r["CUSTOMER_SITE_NO"]), start
        )
        if n >= 5:
            reactive_with_alarms += 1
        if first:
            alarm_to_failure_days.append((start - first).days)

    total_eh = len(eh)
    total_reactive = len(reactive)
    pct_eh_failed = round(100 * eh_with_followup / total_eh, 1) if total_eh else 0
    pct_reactive_warned = round(100 * reactive_with_alarms / total_reactive, 1) if total_reactive else 0
    avg_days = round(sum(alarm_to_failure_days) / len(alarm_to_failure_days), 1) if alarm_to_failure_days else 0

    return {
        "total_eh_tyot": total_eh,
        "eh_with_reactive_within_14d": eh_with_followup,
        "pct_eh_followed_by_reactive": pct_eh_failed,
        "total_reactive_repairs": total_reactive,
        "reactive_with_5plus_alarms": reactive_with_alarms,
        "pct_reactive_with_alarms": pct_reactive_warned,
        "avg_days_alarm_to_failure": avg_days,
    }


def build_case_studies(wo: pd.DataFrame, alarms: pd.DataFrame) -> str:
    reactive = get_reactive_repairs(filter_target_sites(wo))
    eh = get_scheduled_work(filter_target_sites(wo))
    lines = ["# Case Studies — Calendar Pathology Proof\n"]

    narratives = {
        "54960238": (
            "Moduł M100 (Lentokentänkatu 11) zgłosił reaktywną awarię grzewczą 25.09.2025 "
            "(WO 54960238: „kylmä modulissa, 19–21 astetta\"), a od 19.09.2025 wygenerował "
            "66 unikalnych alarmów (Kylmä huone, spadek temperatury), które zostały zignorowane — "
            "mimo że w ciągu 14 dni wcześniej wykonano 11 zaplanowanych EH-työ "
            "(w tym Viikkokierros 11.09 i Paloilmoitinjärjestelmien hoito 16.09). "
            "Kalendarz wysłał technika na rutynę, ale nie na rosnące ryzyko."
        ),
        "54716854": (
            "Ilmastointilaite lähettämö (401PE02) zepsuła się 24.07.2025 "
            "(WO 54716854: „ilmastointilaite vuotaa nestettä\"), a od 21.07.2025 wygenerowała "
            "5 alarmów ciśnienia obwodu IV (401PE02 IV PKN-PIIRIN PAINE), które zostały zignorowane, "
            "bo roczny przegląd IV (PM 462825, interwał 1 rok) nie przewidywał wizyty aż do wiosny — "
            "a dzienne EH-työ „Käyttöhuolto\" nie reagowały na alarmy."
        ),
        "54882174": (
            "Ilmalämpöpumppu lähettämö zepsuła się 03.09.2025 "
            "(WO 54882174: przesunięty odpływ wody), a od 27.08.2025 generowała "
            "13 unikalnych alarmów (701DP01 „PUMPPU EI AUTOMAATILLA\", zawory 700GSA), "
            "ignorowanych mimo codziennych EH-työ Käyttöhuolto w tym samym obiekcie."
        ),
    }

    for i, (wo_no, text) in enumerate(narratives.items(), 1):
        row = reactive.loc[reactive["WO_NO"].astype(str) == wo_no]
        if row.empty:
            lines.append(f"## Case {i}\n\n{text}\n")
            continue
        row = row.iloc[0]
        start = row["started"]
        n, _, first = count_alarms_before(
            alarms, int(row["CUSTOMER_NO"]), int(row["CUSTOMER_SITE_NO"]), start
        )
        prior = len(
            eh[
                (eh["CUSTOMER_SITE_NO"] == row["CUSTOMER_SITE_NO"])
                & (eh["started"] >= start - timedelta(days=14))
                & (eh["started"] < start)
            ]
        )
        lines.append(f"## Case {i} — WO {wo_no}\n\n{text}\n")
        lines.append(f"- **Verified alarms 7d:** {n} unique")
        if first:
            lines.append(f"- **First alarm:** {first.date()}")
        lines.append(f"- **Prior EH-työ in 14d:** {prior}")
        lines.append(f"- **Hours:** {row['hours']:.1f}h (~{row['hours'] * HOURLY_RATE_EUR:.0f} EUR)\n")

    return "\n".join(lines)


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    wo = load_work_orders()
    alarms = load_alarms()
    alarms = filter_target_sites(alarms)

    top = analyze_top_repairs(wo, alarms, top_n=5)
    top.to_csv(OUTPUT_DIR / "killer_cases.csv", index=False)

    stats = analyze_calendar_waste(wo, alarms)
    pd.DataFrame([stats]).to_csv(OUTPUT_DIR / "calendar_waste_stats.csv", index=False)

    case_md = build_case_studies(wo, alarms)
    (OUTPUT_DIR / "case_studies.md").write_text(case_md, encoding="utf-8")

    print("=== TOP 5 REACTIVE REPAIRS ===")
    print(top.to_string(index=False))
    print("\n=== CALENDAR WASTE STATS ===")
    for k, v in stats.items():
        print(f"  {k}: {v}")
    print(f"\nOutputs written to {OUTPUT_DIR}/")


if __name__ == "__main__":
    main()
