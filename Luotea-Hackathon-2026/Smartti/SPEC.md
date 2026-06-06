# Smartti Pulse – Hackathon Data Specification v1.0

## Overview

This dataset contains building energy and indoor climate data from three NovaProp properties, collected by the Smartti Pulse platform. Data includes energy consumption readings, indoor climate measurements, and maintenance incidents.

## Files

| File | Property | Size | Readings | Incidents |
|------|----------|------|----------|-----------|
| `aurora_house.json` | Aurora House, Innovation Drive 14, Northville | 28 MB | 179,216 | 90 |
| `meridian_tower.json` | Meridian Tower, Solar Avenue 3, Coastview | 72 MB | 422,983 | 231 |
| `horizon_plaza.json` | Horizon Plaza, Central Square 26, Lakeside | 29 MB | 190,307 | 153 |
| `metadata.json` | Index file with summary of all properties | <1 KB | — | — |

## JSON Structure

```jsonc
{
  "metadata": {
    "version": "1.0",            // Spec version
    "exported_at": "ISO 8601",   // Export timestamp (UTC)
    "source": "Smartti Pulse (pulsedb)"
  },
  "customer": { ... },           // NovaProp customer record
  "property": {                  // Main property object
    "id": "string",
    "name": "string",
    "address": "string",
    "city": "string",
    "zip_code": "string",
    "region_code": "FI",
    "timezone": "Europe/Helsinki",
    "gross_area_m2": number | null,
    "smartti_commissioned_at": "ISO 8601" | null,
    "smartti_automation_id": "string" | null,
    "pricing": { ... },
    "nodes": [ ... ],
    "readings": { ... },
    "incidents": [ ... ],
    "children": [ ... ]          // Only in meridian_tower.json
  }
}
```

## Field Reference

### customer

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique customer identifier |
| `name` | string | Customer name ("NovaProp") |
| `region_code` | string | Country code (ISO 3166-1 alpha-2) |
| `currency` | string | Currency code (ISO 4217) |
| `timezone` | string | IANA timezone |
| `default_pricing` | object | Default energy prices (see Pricing) |

### property

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique property identifier |
| `name` | string | Property display name |
| `address` | string | Street address |
| `city` | string | City |
| `zip_code` | string | Postal code |
| `region_code` | string | Country code |
| `timezone` | string | IANA timezone, all timestamps in readings are UTC |
| `gross_area_m2` | number \| null | Gross floor area in m² |
| `smartti_commissioned_at` | string \| null | ISO 8601 date when Smartti was activated |
| `smartti_automation_id` | string \| null | Automation system identifier |
| `pricing` | object | Property-level energy pricing (overrides customer defaults) |
| `nodes` | array | Devices and systems in the property |
| `readings` | object | Measurement data grouped by metric |
| `incidents` | array | Maintenance events and fault reports |
| `children` | array \| undefined | Sub-properties (only Meridian Tower has buildings 1, 2, 3) |

### pricing

Energy prices. Property-level values override customer defaults. If null, use customer default.

| Field | Type | Unit | Description |
|-------|------|------|-------------|
| `electricity_eur_per_MWh` | number \| null | €/MWh | Electricity price |
| `district_heating_eur_per_MWh` | number \| null | €/MWh | District heating price |
| `district_cooling_eur_per_MWh` | number \| null | €/MWh | District cooling price |
| `water_eur_per_m3` | number \| null | €/m³ | Water price |

### nodes

Nodes represent physical devices, systems, or buildings within a property.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique node identifier |
| `name` | string | Display name (e.g., "TK01 Toimisto", "Rakennus 1") |
| `type` | enum | `device` \| `system` \| `building` |
| `tags` | string | Comma-separated tags |
| `ekohuolto_id` | string | External system ID |

### readings

Readings are grouped by metric. Each metric contains a summary and a data array.

```jsonc
"readings": {
  "electricity_kWh": {
    "count": 45453,
    "earliest": "2021-02-10T12:00:00+00",
    "latest": "2026-05-21T20:00:00+00",
    "data": [
      { "t": "2021-02-10T12:00:00+00", "v": 123.45, "key": "28337/1", "src": "enerkey" },
      ...
    ]
  }
}
```

#### Reading data point

| Field | Type | Description |
|-------|------|-------------|
| `t` | string | ISO 8601 timestamp (UTC) |
| `v` | number | Measured value |
| `key` | string | Sensor/meter key (identifies the physical meter) |
| `src` | enum | Data source: `enerkey` \| `smartti_automation` |

#### Available metrics

| Metric | Unit | Source | Description |
|--------|------|--------|-------------|
| `electricity_kWh` | kWh | enerkey | Electricity consumption (hourly) |
| `district_heating_MWh` | MWh | enerkey | District heating consumption (hourly) |
| `district_cooling_MWh` | MWh | enerkey | District cooling consumption (hourly) |
| `water_m3` | m³ | enerkey | Water consumption (hourly) |
| `interior_temperature_C` | °C | smartti_automation | Indoor temperature |
| `interior_temperature_target_C` | °C | smartti_automation | Temperature setpoint |
| `interior_temperature_tolerance_C` | °C | smartti_automation | Allowed deviation from setpoint |
| `interior_co2_ppm` | ppm | smartti_automation | Indoor CO₂ concentration |

#### Data sources

| Source | Description | Typical interval |
|--------|-------------|------------------|
| `enerkey` | Energy metering system (electricity, heating, cooling, water) | 1 hour |
| `smartti_automation` | Building automation system (temperature, CO₂) | ~5–15 minutes |

### incidents

Maintenance events, fault reports, and energy optimization actions.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique incident identifier |
| `node_id` | string \| null | Related node (device/system) |
| `created_at` | string | ISO 8601 timestamp (UTC) |
| `updated_at` | string | ISO 8601 timestamp (UTC) |
| `event_type` | string | Type: "Vikailmoitus", "Energiansäästötoimenpide", "Muu huomio", etc. |
| `priority` | enum | `immediate` \| `significant` \| `according_to_agreement` |
| `status` | enum | `pending` \| `in_progress` \| `awaiting_review` \| `resolved` |
| `category` | enum | `fault` \| `optimization` \| `administrative` |
| `points` | number | Scoring value (positive = resolved, negative = open/stuck) |
| `description` | string | Free-text description (Finnish) |
| `internal` | boolean | If true, internal note (not shown to customer) |
| `include_in_report` | boolean | If true, included in customer reports |
| `comments` | array | Thread of comments on this incident |

#### incident.comments[]

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Comment identifier |
| `created_at` | string | ISO 8601 timestamp |
| `modified_at` | string \| null | Last modification timestamp |
| `comment` | string | Comment text (Finnish) |
| `status` | string | Status at time of comment |
| `commenter_name` | string \| null | Name of commenter |

### children (Meridian Tower only)

Meridian Tower has three sub-buildings as child properties. Each child has the same structure as a property (nodes, readings, incidents). The parent property (`meridian_tower.json`) contains the building-level data (indoor climate from automation) while children contain per-building energy metering.

## Notes for Hackathon Teams

1. **All timestamps are UTC.** Properties are in Finland (Europe/Helsinki = UTC+2 / UTC+3 DST).
2. **Energy data is hourly** (enerkey source). Indoor climate data has irregular intervals (~5-15 min).
3. **Readings key** identifies the physical meter — multiple keys per metric means multiple meters in the same property.
4. **Pricing** can be used to calculate energy costs: `reading_value × price`. Note: electricity_kWh readings are in kWh but price is €/MWh, so convert accordingly.
5. **Incidents are in Finnish.** Common types: "Vikailmoitus" = fault report, "Energiansäästötoimenpide" = energy saving action.
6. **Meridian Tower** has a parent-children structure. The parent contains automation data (temperatures), children contain per-building electricity.
