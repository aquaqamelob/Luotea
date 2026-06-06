import { writeOutputFiles } from '../src/lib/analytics'

const result = writeOutputFiles()
console.log('=== OUTPUT GENERATED ===')
console.log(`killer_cases.csv: ${result.killerCases.length} rows`)
console.log(`case_studies.md: ${result.caseStudies.length} cases`)
console.log(`recommendations.csv: ${result.recommendations.length} rows`)
console.log('calendar_waste_stats:', result.calendarWaste)
