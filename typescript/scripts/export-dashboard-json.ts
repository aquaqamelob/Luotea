#!/usr/bin/env bun
/** Regenerate src/generated/dashboard.json from CSV (run locally before deploy). */
import { writeOutputFiles } from '../src/lib/analytics'

const data = writeOutputFiles()
console.log('=== DASHBOARD SNAPSHOT ===')
console.log(`Written src/generated/dashboard.json`)
console.log(`  killer cases: ${data.killerCases.length}`)
console.log(`  case studies: ${data.caseStudies.length}`)
console.log(`  recommendations: ${data.recommendations.length}`)
