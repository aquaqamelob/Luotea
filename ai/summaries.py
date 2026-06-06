"""Technician-facing summaries — template-based with optional OpenAI LLM."""

from __future__ import annotations

import json
import os
from typing import Any

from risk_score import risk_tier


def template_summary(row: dict[str, Any]) -> str:
    score = int(row.get("risk_score", 0))
    tier = risk_tier(score)
    entity = row.get("entity_label", row.get("entity_id", "Unknown"))
    site = row.get("site", "")
    alarms = row.get("alarms_7d", 0)
    action = row.get("recommendation", row.get("action_label", "MONITOR"))
    days = row.get("days_to_next", row.get("days_to_next_inspection"))

    if tier == "high":
        urgency = "Act today"
    elif tier == "medium":
        urgency = "Review this week"
    else:
        urgency = "Monitor"

    parts = [f"{urgency} — {entity} @ {site}."]
    parts.append(f"Risk {score}/100 ({tier}).")

    if alarms >= 5:
        parts.append(f"{alarms} alarms in the last 7 days — signals ignored by the calendar.")
    elif alarms > 0:
        parts.append(f"{alarms} alarm(s) in 7 days — trend worth watching.")
    else:
        parts.append("No recent alarms.")

    if days is not None and str(days) not in ("", "nan"):
        try:
            d = int(float(days))
            if d <= 3:
                parts.append(f"Inspection due in {d} day(s) — calendar says go, signals say check first.")
            elif d > 14 and alarms > 0:
                parts.append(f"Next inspection in {d} days but alarms are active — don't wait.")
        except (TypeError, ValueError):
            pass

    parts.append(f"Engine action: {action}.")
    return " ".join(parts)


def llm_summary(row: dict[str, Any]) -> str | None:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        return None

    try:
        from openai import OpenAI
    except ImportError:
        return None

    client = OpenAI(api_key=api_key)
    prompt = (
        "Write one concise sentence for a facility technician. "
        "Plain English, no jargon. Include risk score and recommended action.\n\n"
        f"Data: {json.dumps(row, default=str)}"
    )
    try:
        resp = client.chat.completions.create(
            model=os.environ.get("OPENAI_MODEL", "gpt-4o-mini"),
            messages=[
                {"role": "system", "content": "You summarize maintenance prioritization for technicians."},
                {"role": "user", "content": prompt},
            ],
            max_tokens=120,
            temperature=0.3,
        )
        return (resp.choices[0].message.content or "").strip()
    except Exception:
        return None


def build_summaries(rows: list[dict[str, Any]], use_llm: bool = False, top_n: int = 10) -> list[dict[str, str]]:
    sorted_rows = sorted(rows, key=lambda r: int(r.get("risk_score", 0)), reverse=True)[:top_n]
    out: list[dict[str, str]] = []

    for row in sorted_rows:
        summary = template_summary(row)
        source = "template"
        if use_llm:
            llm = llm_summary(row)
            if llm:
                summary = llm
                source = "llm"
        out.append(
            {
                "entity_id": str(row.get("entity_id", "")),
                "entity_label": str(row.get("entity_label", "")),
                "risk_score": str(row.get("risk_score", "")),
                "summary": summary,
                "source": source,
            }
        )
    return out


def save_summaries(summaries: list[dict[str, str]], out_dir) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "technician_summaries.json").write_text(json.dumps(summaries, indent=2), encoding="utf-8")
    md_lines = ["# Technician summaries (top risk)", ""]
    for s in summaries:
        md_lines.append(f"## {s['entity_label']} — Risk {s['risk_score']}")
        md_lines.append("")
        md_lines.append(s["summary"])
        md_lines.append("")
    (out_dir / "technician_summaries.md").write_text("\n".join(md_lines), encoding="utf-8")
