import type { CalendarWasteStats } from './calendar-waste'
import type { CaseStudy, KillerCase } from './killer-cases'
import type { Recommendation } from './prioritization-engine'

export type DashboardData = {
  killerCases: KillerCase[]
  caseStudies: CaseStudy[]
  calendarWaste: CalendarWasteStats
  recommendations: Recommendation[]
}
