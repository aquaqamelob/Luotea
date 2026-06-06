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

export function writeOutputFiles() {
  fs.mkdirSync(OUTPUT_ROOT, { recursive: true })

  const killerCases = getTopKillerCases(5)
  const caseStudies = getCaseStudies()
  const calendarWaste = analyzeCalendarWaste()
  const recommendations = buildRecommendations()

  fs.writeFileSync(path.join(OUTPUT_ROOT, 'killer_cases.csv'), killerCasesToCsv(killerCases))
  fs.writeFileSync(path.join(OUTPUT_ROOT, 'case_studies.md'), caseStudiesToMarkdown(caseStudies))
  fs.writeFileSync(
    path.join(OUTPUT_ROOT, 'calendar_waste_stats.csv'),
    calendarWasteToCsv(calendarWaste),
  )
  fs.writeFileSync(
    path.join(OUTPUT_ROOT, 'recommendations.csv'),
    recommendationsToCsv(recommendations),
  )

  return { killerCases, caseStudies, calendarWaste, recommendations }
}

export function getDashboardData() {
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

export type DashboardData = ReturnType<typeof getDashboardData>
