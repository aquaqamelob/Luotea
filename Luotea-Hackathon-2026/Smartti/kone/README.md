# Occupancy Data

Pre-exported occupancy profiles from three office buildings, produced by the KONE Occupancy API (`api/occupancy/floors`). Building names have been anonymized. Each building has two variants of the same dataset: **normalized** (values 0–10) and **raw** (absolute counts).

## Files

| File | Building | Variant | Floors | Rows |
|------|----------|---------|--------|------|
| `Aurora_House_…-normalized.json` | Aurora House | Normalized 0–10 | 7 (P, 1–6) | 294 |
| `Aurora_House_….json` | Aurora House | Raw counts | 7 (P, 1–6) | 294 |
| `Meridian_Tower_…-normalized.json` | Meridian Tower | Normalized 0–10 | 10 (K1, K2, 1–8) | 420 |
| `Meridian_Tower_….json` | Meridian Tower | Raw counts | 10 (K1, K2, 1–8) | 420 |
| `Horizon_Plaza_…-normalized.json` | Horizon Plaza | Normalized 0–10 | 13 (P1, -1, 0–10) | 546 |
| `Horizon_Plaza_….json` | Horizon Plaza | Raw counts | 13 (P1, -1, 0–10) | 546 |

## Export parameters

- **Period**: December 2025 – May 2026 (6 months)
- **Resolution**: 60 minutes (24 values per row, one per hour starting at 00:00)
- **Weekends**: included
- **Export date**: 2026-05-27

## Data format

Each file is a JSON array. Every element represents one floor on one weekday in one month:

```json
{
  "month": 3,
  "weekday": 1,
  "site_connection_ok": true,
  "floor": "2",
  "floor_id": 4,
  "occupancy": [0, 0, 0, 0, 0, 1, 3, 7, 8, 9, 10, 9, 6, 8, 9, 8, 5, 2, 1, 0, 0, 0, 0, 0]
}
```

### Field reference

| Field | Type | Description |
|-------|------|-------------|
| `month` | int 1–12 | 1 = January, 2 = February, … |
| `weekday` | int 1–7 | 1 = Monday, 2 = Tuesday, … 7 = Sunday |
| `site_connection_ok` | bool / null | `false` = connection issue during period; `null` = no data (historical) |
| `floor` | string | Floor label (e.g. "P", "K1", "1", "10") |
| `floor_id` | int | Abstract floor ID — lower value = lower floor |
| `occupancy` | int[] | Hourly occupancy values. **Normalized**: 0–10 scale (10 = peak). **Raw**: absolute sensor counts. |

### Row count formula

`rows = months × weekdays × floors` — one row per unique (month, weekday, floor) combination.

## API specification

See `Occupancy-API.pdf` for the full API documentation including additional endpoints (`api/occupancy/building`) and optional query parameters (`remove_residual_occupancy`, `weekends`, `normalize`, `resolution`).
