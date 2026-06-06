import {
  ALARM_WINDOW_DAYS,
  FEATURED_CASES,
  HOURLY_RATE_EUR,
  REACTIVE_AFTER_EH_DAYS,
} from './config'
import {
  addDays,
  countAlarmsBefore,
  daysBetween,
  loadAllData,
  type WorkOrder,
} from './data-loader'

export type KillerCase = {
  woNo: string
  site: string
  started: string
  hours: number
  costEur: number
  workType: string
  description: string
  alarms7dUnique: number
  alarms7dRows: number
  firstAlarm: string | null
  daysAlarmToFailure: number | null
  priorEh14d: number
  lastPriorEh: string | null
  daysToNextEh: number | null
}

export type CaseStudy = {
  id: number
  woNo: string
  title: string
  narrative: string
  verifiedAlarms7d: number
  firstAlarm: string | null
  priorEh14d: number
  hours: number
  costEur: number
}

const NARRATIVES: Record<string, { title: string; narrative: string }> = {
  '54960238': {
    title: 'Module M100 — Lentokentänkatu 11',
    narrative:
      'Module M100 (Lentokentänkatu 11) reported a reactive heating failure on 25 Sep 2025 (WO 54960238: "kylmä modulissa, 19–21 astetta"). From 19 Sep 2025 it generated 66 unique alarms (Kylmä huone, temperature drop) that were ignored — even though 11 scheduled EH-työ visits were completed in the prior 14 days (including Viikkokierros on 11 Sep and fire alarm maintenance on 16 Sep). The calendar sent a technician for routine work, not for rising risk.',
  },
  '54716854': {
    title: '401PE02 — dispatch office HVAC',
    narrative:
      'Dispatch office HVAC unit (401PE02) failed on 24 Jul 2025 (WO 54716854: "ilmastointilaite vuotaa nestettä"). From 21 Jul 2025 it generated 5 IV circuit pressure alarms (401PE02 IV PKN-PIIRIN PAINE) that were ignored because the annual IV inspection (PM 462825, 1-year interval) was not due until spring — and daily EH-työ "Käyttöhuolto" visits did not respond to the alarms.',
  },
  '54882174': {
    title: 'ILP dispatch — air-to-water heat pump',
    narrative:
      'Dispatch air-to-water heat pump failed on 03 Sep 2025 (WO 54882174: shifted drain line). From 27 Aug 2025 it generated 13 unique alarms (701DP01 "PUMPPU EI AUTOMAATILLA", valves 700GSA), ignored despite daily EH-työ Käyttöhuolto visits at the same site.',
  },
}

function analyzeRepair(
  row: WorkOrder,
  scheduled: WorkOrder[],
  alarms: ReturnType<typeof loadAllData>['alarms'],
): KillerCase | null {
  if (!row.started) return null
  const start = row.started
  const siteNo = row.CUSTOMER_SITE_NO
  const cust = row.CUSTOMER_NO

  let { unique, rows, first } = countAlarmsBefore(
    alarms,
    cust,
    siteNo,
    start,
    ALARM_WINDOW_DAYS,
    row.equipmentCodes.size > 0 ? row.equipmentCodes : undefined,
  )
  if (unique === 0) {
    ;({ unique, rows, first } = countAlarmsBefore(alarms, cust, siteNo, start, ALARM_WINDOW_DAYS))
  }

  const priorEh = scheduled.filter(
    (eh) =>
      eh.CUSTOMER_SITE_NO === siteNo &&
      eh.started &&
      eh.started >= addDays(start, -REACTIVE_AFTER_EH_DAYS) &&
      eh.started < start,
  )
  const nextEh = scheduled
    .filter((eh) => eh.CUSTOMER_SITE_NO === siteNo && eh.started && eh.started > start)
    .sort((a, b) => a.started!.getTime() - b.started!.getTime())
  const nextEhDate = nextEh[0]?.started ?? null

  return {
    woNo: row.WO_NO,
    site: row.customer_site_name,
    started: start.toISOString().slice(0, 10),
    hours: row.hours,
    costEur: Math.round(row.hours * HOURLY_RATE_EUR),
    workType: row.WORK_TYPE_DESCRIPTION_ENG,
    description: row.WORK_DESCRIPTION.slice(0, 120),
    alarms7dUnique: unique,
    alarms7dRows: rows,
    firstAlarm: first?.toISOString().slice(0, 10) ?? null,
    daysAlarmToFailure: first ? daysBetween(first, start) : null,
    priorEh14d: priorEh.length,
    lastPriorEh: priorEh.length
      ? priorEh.reduce((max, eh) => (eh.started! > max ? eh.started! : max), priorEh[0].started!)
          .toISOString()
          .slice(0, 10)
      : null,
    daysToNextEh: nextEhDate ? daysBetween(start, nextEhDate) : null,
  }
}

export function getTopKillerCases(topN = 5): KillerCase[] {
  const { reactive, scheduled, alarms } = loadAllData()
  const sorted = [...reactive].sort((a, b) => b.hours - a.hours).slice(0, topN * 3)

  return sorted
    .map((row) => analyzeRepair(row, scheduled, alarms))
    .filter((c): c is KillerCase => c !== null)
    .sort((a, b) => b.hours - a.hours)
    .slice(0, topN)
}

export function getCaseStudies(): CaseStudy[] {
  const { reactive, scheduled, alarms } = loadAllData()

  return FEATURED_CASES.map((woNo, idx) => {
    const meta = NARRATIVES[woNo]
    const row = reactive.find((r) => r.WO_NO === woNo)
    if (!row?.started) {
      return {
        id: idx + 1,
        woNo,
        title: meta.title,
        narrative: meta.narrative,
        verifiedAlarms7d: 0,
        firstAlarm: null,
        priorEh14d: 0,
        hours: 0,
        costEur: 0,
      }
    }

    const { unique, first } = countAlarmsBefore(
      alarms,
      row.CUSTOMER_NO,
      row.CUSTOMER_SITE_NO,
      row.started,
    )
    const priorEh = scheduled.filter(
      (eh) =>
        eh.CUSTOMER_SITE_NO === row.CUSTOMER_SITE_NO &&
        eh.started &&
        eh.started >= addDays(row.started!, -REACTIVE_AFTER_EH_DAYS) &&
        eh.started < row.started!,
    )

    return {
      id: idx + 1,
      woNo,
      title: meta.title,
      narrative: meta.narrative,
      verifiedAlarms7d: unique,
      firstAlarm: first?.toISOString().slice(0, 10) ?? null,
      priorEh14d: priorEh.length,
      hours: row.hours,
      costEur: Math.round(row.hours * HOURLY_RATE_EUR),
    }
  })
}

export function killerCasesToCsv(cases: KillerCase[]): string {
  const headers = [
    'WO_NO',
    'site',
    'started',
    'hours',
    'cost_eur',
    'work_type',
    'description',
    'alarms_7d_unique',
    'alarms_7d_rows',
    'first_alarm',
    'days_alarm_to_failure',
    'prior_eh_14d',
    'last_prior_eh',
    'days_to_next_eh',
  ]
  const lines = [headers.join(',')]
  for (const c of cases) {
    lines.push(
      [
        c.woNo,
        `"${c.site}"`,
        c.started,
        c.hours,
        c.costEur,
        `"${c.workType}"`,
        `"${c.description.replace(/"/g, '""')}"`,
        c.alarms7dUnique,
        c.alarms7dRows,
        c.firstAlarm ?? '',
        c.daysAlarmToFailure ?? '',
        c.priorEh14d,
        c.lastPriorEh ?? '',
        c.daysToNextEh ?? '',
      ].join(','),
    )
  }
  return lines.join('\n')
}

export function caseStudiesToMarkdown(studies: CaseStudy[]): string {
  const lines = ['# Case Studies — Calendar Pathology Proof\n']
  for (const s of studies) {
    lines.push(`## Case ${s.id} — WO ${s.woNo}\n`)
    lines.push(`${s.narrative}\n`)
    lines.push(`- **Verified alarms 7d:** ${s.verifiedAlarms7d} unique`)
    if (s.firstAlarm) lines.push(`- **First alarm:** ${s.firstAlarm}`)
    lines.push(`- **Prior EH-työ in 14d:** ${s.priorEh14d}`)
    lines.push(`- **Repair hours:** ${s.hours.toFixed(1)}h\n`)
  }
  return lines.join('\n')
}
