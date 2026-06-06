import fs from 'fs'
import path from 'path'
import { OUTPUT_ROOT } from './config'
import { analyzeCalendarWaste, calendarWasteToCsv } from './calendar-waste'
import {
  caseStudiesToMarkdown,
  getCaseStudies,
  getTopKillerCases,
  killerCasesToCsv,
} from './killer-cases'
import {
  buildRecommendations,
  recommendationsToCsv,
} from './prioritization-engine'
import type { DashboardData } from './dashboard-data'

const GENERATED_PATH = path.join(process.cwd(), 'src', 'generated', 'dashboard.json')

/** Live ETL from CSV — local dev / `bun run analyze` only. */
export function computeDashboardData(): DashboardData {
  const killerCases = getTopKillerCases(5)
  const caseStudies = getCaseStudies()
  const calendarWaste = analyzeCalendarWaste()
  const recommendations = buildRecommendations()

  return {
    killerCases,
    caseStudies,
    calendarWaste,
    recommendations,
  }
}

export function writeOutputFiles() {
  fs.mkdirSync(OUTPUT_ROOT, { recursive: true })

  const data = computeDashboardData()

  fs.writeFileSync(path.join(OUTPUT_ROOT, 'killer_cases.csv'), killerCasesToCsv(data.killerCases))
  fs.writeFileSync(path.join(OUTPUT_ROOT, 'case_studies.md'), caseStudiesToMarkdown(data.caseStudies))
  fs.writeFileSync(
    path.join(OUTPUT_ROOT, 'calendar_waste_stats.csv'),
    calendarWasteToCsv(data.calendarWaste),
  )
  fs.writeFileSync(
    path.join(OUTPUT_ROOT, 'recommendations.csv'),
    recommendationsToCsv(data.recommendations),
  )

  fs.mkdirSync(path.dirname(GENERATED_PATH), { recursive: true })
  fs.writeFileSync(GENERATED_PATH, JSON.stringify(data, null, 2))

  return data
}

export type { DashboardData } from './dashboard-data'
