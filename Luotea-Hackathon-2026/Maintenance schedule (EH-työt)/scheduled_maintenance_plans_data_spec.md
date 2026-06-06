# Scheduled Maintenance Plans Dataset — Data Specification

**Dataset:** `Scheduled maitenance plans.csv`
**Last updated:** 2026-06-03

---

## Overview

This dataset contains **316 scheduled maintenance plan entries** defining recurring maintenance activities at Valmet industrial sites. Each row represents a maintenance plan linked to a specific site and contract, specifying what activity is performed, how often, and how many hours are planned.

This is the **reference dataset for scheduled work** — the `PM_NO` field links to `PM_NO` in the work orders dataset, connecting individual work order executions to their parent maintenance plan.

**Language:** Descriptions are bilingual (Finnish + English).

**No anonymization was required.**

---

## File Details

| Property | Value |
|---|---|
| Format | CSV (UTF-8 with BOM) |
| Rows | 316 (excluding header) |
| Columns | 22 |
| Delimiter | Comma (`,`) |
| Text qualifier | Double quote (`"`) |

---

## Sites & Contracts

| Customer | Site | Contract | Count |
|---|---|---|---|
| Valmet Technologies Oy | Lentokentänkatu 11, Tampere | KH + KT | 177 |
| Valmet Flow Control Oy | Venttiilitehdas, Vantaa | KH + KT | 138 |
| Valmet Flow Control Oy | STD tehdas, Vantaa | KH | 1 |

Only **KH** (Property maintenance) and **KT** (Technical services) contracts have scheduled maintenance plans. Cleaning services (SP) and Facility services (KIPA) are not represented.

---

## Column Reference

### Identifiers & Location

| Column | Type | Nullable | Description |
|---|---|---|---|
| `PM_NO` | Integer | No | **Maintenance plan number.** Links to `PM_NO` in the work orders dataset. 106 unique plans. |
| `MCH_CODE_CONTRACT` | Categorical | No | Contract type: `KH` (Property maintenance, 162 rows) or `KT` (Technical services, 154 rows) |
| `CUSTOMER_WORKSITE_NO` | Text | No | Worksite identifier. Shared key with work orders. |
| `CUSTOMER_NO` | Integer | No | Customer number in Luotea's ERP |
| `customer_name` | Text | No | Customer company name |
| `CUSTOMER_SITE_NO` | Integer | No | Site identifier |
| `customer_site_name` | Text | No | Human-readable site name |
| `site_address` | Text | No | Physical address |

### Activity Definition

| Column | Type | Nullable | Description |
|---|---|---|---|
| `ACTION_DESCR` | Text | No | Maintenance activity name in Finnish. 50 unique activities. |
| `ACTION_DESCR_ENG` | Text | No | Maintenance activity name in English. 50 unique activities. |
| `DESCRIPTION` | Text | Yes (17% null) | Detailed description of the maintenance task in Finnish. 82 unique. |
| `DESCRIPTION_ENG` | Text | Yes (17% null) | Detailed description in English. 81 unique. |
| `PLAN_HRS` | Decimal | Yes (13% null) | Planned hours for the maintenance activity. Range: 0.08–160.00. |

### Scheduling

| Column | Type | Nullable | Description |
|---|---|---|---|
| `INTERVAL` | Integer | Yes (28% null) | Numeric interval value. Combined with `PM_INTERVAL_UNIT`. |
| `PM_INTERVAL_UNIT` | Categorical | Yes (28% null) | Interval unit: `Day` (24), `Week` (12), `Month` (30), `Year` (163). NULL = no fixed schedule. |
| `PRIORITY_ID` | Integer | No | Priority: `2` (18 rows), `3` (144 rows), `5` (154 rows) |
| `START_DATE` | Datetime | Yes (28% null) | First scheduled execution date |

### Status & Timestamps

| Column | Type | Nullable | Description |
|---|---|---|---|
| `OBJSTATE` | Categorical | No | `Active` (198 rows) or `Obsolete` (118 rows). Obsolete plans are no longer generating work orders. |
| `VALID_FROM` | Datetime | Yes (1% null) | Date from which the plan is/was valid |
| `REV_CRE_DATE` | Datetime | No | Revision creation date |
| `LAST_CHANGED` | Datetime | No | Last modification timestamp |
| `LAST_UPDATED` | Datetime | No | Last data export/sync timestamp |

---

## Planned Hours Distribution

| Hours | Plans | Description |
|---|---|---|
| 0.08–0.66 | 39 | Quick tasks (flag raising, meter reading) |
| 1.00–2.00 | 111 | Standard maintenance tasks |
| 3.00–5.00 | 24 | Medium tasks |
| 8.00–10.00 | 12 | Half-day to full-day tasks |
| 21.00 | 3 | Multi-day tasks |
| 104.50–160.00 | 36 | Dedicated facility technician assignments |

---

## Key Relationships

- **To Work Orders:** `PM_NO` → `PM_NO` in `work_orders_anonymized.csv`. Each active plan generates recurring work orders (`WORK_ORDER_TYPE = 'EH-työ'`).
- **To Sites:** `CUSTOMER_NO` + `CUSTOMER_SITE_NO` + `CUSTOMER_WORKSITE_NO` shared with work orders and alarms datasets.

---

## Notes for Participants

1. **Duplicate rows exist.** The same `PM_NO` appears multiple times (typically 3×). This appears to be a data export artifact — deduplicate by `PM_NO` for unique plans.
2. **OBJSTATE matters.** Only `Active` plans (198 rows, 63%) are currently generating work orders. `Obsolete` plans are historical.
3. **NULL intervals** mean the activity has no fixed recurrence schedule (e.g., snow removal, on-demand seasonal work).
4. **PLAN_HRS** is the budgeted time per execution, not total annual hours. Multiply by frequency for annual planning.
5. **Encoding:** UTF-8 with BOM.
6. **Filename** contains a typo (`maitenance` instead of `maintenance`) — this is intentional to match the source file.
