# Luotea AI layer

Explainable analytics in Python — **separate from the TypeScript IF/THEN engine**.

## What it does

| Output | Description |
|--------|-------------|
| `output/ai/risk_recommendations.csv` | Each recommendation + **Risk Score 0–100** with component breakdown |
| `output/ai/validation_report.json` | Correlation, lift, SEND_NOW rule backtest, logistic regression AUC |
| `output/ai/validation_report.md` | Human-readable report for pitch |
| `output/ai/technician_summaries.md` | One-line summaries for top 10 risky assets |

## Setup

```bash
cd ai
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Generate TypeScript recommendations first:

```bash
cd ../typescript && bun run analyze
```

## Run

```bash
cd ai
python run.py
```

Optional LLM summaries (needs `OPENAI_API_KEY`):

```bash
export OPENAI_API_KEY=sk-...
python run.py --llm
```

Without the key, summaries use deterministic templates.

## Risk score formula

```
Risk = 100 × (
  40% × min(alarms_7d / 5, 1)           # alarm intensity
+ 25% × trend vs 30d baseline
+ 20% × calendar gap (alarms + far inspection)
+ 15% × EH-työ → failure history
)
```

Fully explainable — every score has `risk_explanation` and component columns in CSV.

## Structure

```
ai/
├── config.py          # paths + weights
├── data_loader.py     # CSV ETL
├── risk_score.py      # 0–100 score
├── validation.py      # stats + logistic regression
├── summaries.py       # template / optional LLM
├── run.py             # entry point
└── requirements.txt
```

## Pitch line

> Production uses transparent IF/THEN rules. The Python AI layer **validates** those rules with lift, recall, and an explainable logistic model — not a black-box replacement.
