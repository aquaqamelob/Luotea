# Luotea Hackathon 2026 — Prioritization Engine

Next.js / TypeScript dashboard joining 3 datasets (Work orders, Alarms, Maintenance schedule) with IF/THEN rules.

## Run

```bash
cd typescript
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Generate CSV/MD output

```bash
cd typescript
bun run analyze
```

Output goes to `../output/`:
- `killer_cases.csv`
- `case_studies.md`
- `calendar_waste_stats.csv`
- `recommendations.csv`

## Pages

| Route | Description |
|---|---|
| `/` | Dashboard — metrics + top recommendations |
| `/cases` | 3 case studies + top 5 reactive repairs |
| `/recommendations` | Full prioritization engine table |
| `/pitch` | Jury pitch deck |

## Data layout

```
luotea/
├── Luotea-Hackathon-2026/   ← hackathon data
├── typescript/              ← Next.js app
├── ai/                      ← Python risk score + validation (optional)
└── output/                  ← generated reports
```

## AI layer (Python)

```bash
cd typescript && bun run analyze   # recommendations first
cd ../ai
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python run.py
```

Outputs in `output/ai/` — see [ai/README.md](ai/README.md).

## Architecture

```
typescript/src/lib/
├── config.ts
├── csv.ts
├── data-loader.ts
├── killer-cases.ts
├── calendar-waste.ts
├── prioritization-engine.ts
└── analytics.ts
```
