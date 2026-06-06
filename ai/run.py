#!/usr/bin/env python3
"""Run the AI analytics layer: risk scores, validation stats, technician summaries."""

from __future__ import annotations

import argparse
import csv
from pathlib import Path

import pandas as pd

from config import OUTPUT_DIR, TS_RECOMMENDATIONS
from risk_score import compute_risk_score, explain_score, risk_tier
from summaries import build_summaries, save_summaries
from validation import build_validation_report, save_validation_report


def _parse_days(val) -> int | None:
    if val is None or (isinstance(val, float) and pd.isna(val)) or val == "":
        return None
    try:
        return int(float(val))
    except (TypeError, ValueError):
        return None


def _had_eh_history(recommendation: str) -> bool:
    return "AUDIT" in recommendation.upper()


def enrich_recommendations(use_llm: bool = False) -> pd.DataFrame:
    if not TS_RECOMMENDATIONS.exists():
        raise FileNotFoundError(
            f"Missing {TS_RECOMMENDATIONS}. Run `cd typescript && bun run analyze` first."
        )

    df = pd.read_csv(TS_RECOMMENDATIONS)
    rows: list[dict] = []

    for _, r in df.iterrows():
        alarms_7d = int(r.get("alarms_7d", 0) or 0)
        alarms_30d = int(r.get("alarms_30d", 0) or 0)
        days = _parse_days(r.get("days_to_next"))
        rec_label = str(r.get("recommendation", ""))
        had_eh = _had_eh_history(rec_label)

        score, breakdown = compute_risk_score(alarms_7d, alarms_30d, days, had_eh)

        row = {
            "entity_id": r.get("entity_id"),
            "entity_label": r.get("entity_label"),
            "site": r.get("site"),
            "alarms_7d": alarms_7d,
            "alarms_30d": alarms_30d,
            "days_to_next": days if days is not None else "",
            "recommendation": rec_label,
            "risk_score": score,
            "risk_tier": risk_tier(score),
            **breakdown.as_pct,
            "risk_explanation": explain_score(score, breakdown).replace("\n", " | "),
        }
        rows.append(row)

    out = pd.DataFrame(rows).sort_values("risk_score", ascending=False)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    out.to_csv(OUTPUT_DIR / "risk_recommendations.csv", index=False, quoting=csv.QUOTE_MINIMAL)

    summaries = build_summaries(rows, use_llm=use_llm)
    save_summaries(summaries, OUTPUT_DIR)

    return out


def main() -> None:
    parser = argparse.ArgumentParser(description="Luotea AI analytics layer")
    parser.add_argument("--llm", action="store_true", help="Use OpenAI for top summaries (needs OPENAI_API_KEY)")
    args = parser.parse_args()

    print("Computing risk scores…")
    df = enrich_recommendations(use_llm=args.llm)
    print(f"  → {OUTPUT_DIR / 'risk_recommendations.csv'} ({len(df)} rows)")

    print("Running statistical validation…")
    report = build_validation_report()
    save_validation_report(report, OUTPUT_DIR)
    print(f"  → {OUTPUT_DIR / 'validation_report.json'}")
    print(f"  → {OUTPUT_DIR / 'validation_report.md'}")

    print(f"  → {OUTPUT_DIR / 'technician_summaries.md'}")
    print()
    print("Top 5 by risk score:")
    for _, row in df.head(5).iterrows():
        print(f"  [{row['risk_score']:3d}] {row['entity_label'][:50]} — {row['recommendation']}")


if __name__ == "__main__":
    main()
