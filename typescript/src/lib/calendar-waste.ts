import { ALARM_WINDOW_DAYS, REACTIVE_AFTER_EH_DAYS } from './config'
import { addDays, countAlarmsBefore, daysBetween, loadAllData } from './data-loader'

export type CalendarWasteStats = {
  totalEhTyot: number
  ehWithReactiveWithin14d: number
  pctEhFollowedByReactive: number
  totalReactiveRepairs: number
  reactiveWith5plusAlarms: number
  pctReactiveWithAlarms: number
  avgDaysAlarmToFailure: number
}

export function analyzeCalendarWaste(): CalendarWasteStats {
  const { reactive, scheduled, alarms } = loadAllData()
  const ehSince2025 = scheduled.filter((eh) => eh.started && eh.started >= new Date('2025-01-20'))

  let ehWithFollowup = 0
  for (const ehRow of ehSince2025) {
    if (!ehRow.started) continue
    const followup = reactive.filter(
      (r) =>
        r.CUSTOMER_SITE_NO === ehRow.CUSTOMER_SITE_NO &&
        r.started &&
        r.started > ehRow.started! &&
        r.started <= addDays(ehRow.started!, REACTIVE_AFTER_EH_DAYS),
    )
    if (followup.length > 0) ehWithFollowup++
  }

  let reactiveWithAlarms = 0
  const alarmToFailureDays: number[] = []

  for (const r of reactive) {
    if (!r.started) continue
    const { unique, first } = countAlarmsBefore(
      alarms,
      r.CUSTOMER_NO,
      r.CUSTOMER_SITE_NO,
      r.started,
      ALARM_WINDOW_DAYS,
    )
    if (unique >= 5) reactiveWithAlarms++
    if (first) alarmToFailureDays.push(daysBetween(first, r.started))
  }

  const totalEh = ehSince2025.length
  const totalReactive = reactive.length

  return {
    totalEhTyot: totalEh,
    ehWithReactiveWithin14d: ehWithFollowup,
    pctEhFollowedByReactive: totalEh ? Math.round((100 * ehWithFollowup) / totalEh * 10) / 10 : 0,
    totalReactiveRepairs: totalReactive,
    reactiveWith5plusAlarms: reactiveWithAlarms,
    pctReactiveWithAlarms: totalReactive
      ? Math.round((100 * reactiveWithAlarms) / totalReactive * 10) / 10
      : 0,
    avgDaysAlarmToFailure: alarmToFailureDays.length
      ? Math.round(
          (alarmToFailureDays.reduce((a, b) => a + b, 0) / alarmToFailureDays.length) * 10,
        ) / 10
      : 0,
  }
}

export function calendarWasteToCsv(stats: CalendarWasteStats): string {
  const headers = Object.keys(stats).join(',')
  const values = Object.values(stats).join(',')
  return `${headers}\n${values}`
}
