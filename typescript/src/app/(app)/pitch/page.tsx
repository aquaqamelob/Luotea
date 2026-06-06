import { Heading, Subheading } from '@/components/heading'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/table'
import { getDashboardData } from '@/lib/get-dashboard-data'
import { recommendationBadgeColor } from '@/lib/action-utils'
import { Badge } from '@/components/badge'

const JURY_CRITERIA = [
  {
    criterion: 'Impact on real estate business',
    points: 5,
    how: '3 verified case studies showing calendar failure + actionable recommendations',
  },
  {
    criterion: 'Use of data and analytics',
    points: 5,
    how: '3 CSV datasets joined with transparent IF/THEN rules — no black-box ML',
  },
  {
    criterion: 'Feasibility and scalability',
    points: 5,
    how: 'Deploy tomorrow on existing ERP exports (work orders + alarms + PM schedule)',
  },
  {
    criterion: 'Innovation and distinctiveness',
    points: 5,
    how: 'Flip the calendar: cancel safe visits, accelerate risky ones',
  },
  {
    criterion: 'User, customer and operations perspective',
    points: 5,
    how: 'Technicians get a priority list, not another PDF report',
  },
]

export default async function PitchPage() {
  const { caseStudies, calendarWaste, recommendations } = getDashboardData()
  const sendNow = recommendations.filter((r) => r.action === 'SEND_NOW').slice(0, 2)
  const cancel = recommendations.filter((r) => r.action === 'CANCEL_INSPECTION').slice(0, 2)

  return (
    <>
      <Heading>Pitch — Luotea Jury 2026</Heading>
      <p className="mt-2 text-sm text-brand-muted">
        5 minutes · Predictive Maintenance → Prioritization Engine
      </p>

      <Subheading className="mt-10">1. Problem (30s)</Subheading>
      <blockquote className="accent-bar panel-highlight mt-3 rounded-r-lg py-3 pl-4 text-sm/6 italic text-brand-text">
        The calendar sends a technician every week. The failure still happens 6 days later — because
        the system reads dates, not signals.
      </blockquote>

      <Subheading className="mt-10">2. Proof (90s) — 3 case studies</Subheading>
      <div className="mt-4 space-y-4">
        {caseStudies.map((c) => (
          <div key={c.woNo} className="app-card rounded-lg p-4 text-sm/6 text-brand-text">
            <strong className="text-brand-pink">Case {c.id}:</strong> {c.narrative}
          </div>
        ))}
      </div>

      <Subheading className="mt-10">3. Calendar metrics</Subheading>
      <Table className="mt-4 max-w-2xl">
        <TableBody>
          <TableRow>
            <TableCell className="text-brand-text">EH-työ followed by reactive failure within 14 days</TableCell>
            <TableCell className="text-right font-semibold text-brand-pink">
              {calendarWaste.pctEhFollowedByReactive}% ({calendarWaste.ehWithReactiveWithin14d}/
              {calendarWaste.totalEhTyot})
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-brand-text">Reactive WO with 5+ pre-failure alarms</TableCell>
            <TableCell className="text-right font-semibold text-brand-pink">
              {calendarWaste.pctReactiveWithAlarms}% ({calendarWaste.reactiveWith5plusAlarms}/
              {calendarWaste.totalReactiveRepairs})
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-brand-text">Average alarm → failure lead time</TableCell>
            <TableCell className="text-right font-semibold text-brand-pink">
              {calendarWaste.avgDaysAlarmToFailure} days
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <Subheading className="mt-10">4. Product — sample recommendations</Subheading>
      <Table className="mt-4">
        <TableHead>
          <TableRow>
            <TableHeader>Equipment</TableHeader>
            <TableHeader>Alarms (7d)</TableHeader>
            <TableHeader>Recommendation</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {[...sendNow, ...cancel].map((r) => (
            <TableRow key={r.entityId}>
              <TableCell className="text-brand-text">{r.entityLabel}</TableCell>
              <TableCell className="text-brand-text">{r.alarms7d}</TableCell>
              <TableCell>
                <Badge color={recommendationBadgeColor(r.action)}>{r.actionLabel}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Subheading className="mt-10">5. Jury criteria mapping</Subheading>
      <Table className="mt-4">
        <TableHead>
          <TableRow>
            <TableHeader>Criterion</TableHeader>
            <TableHeader>Pts</TableHeader>
            <TableHeader>Argument</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {JURY_CRITERIA.map((j) => (
            <TableRow key={j.criterion}>
              <TableCell className="text-brand-text">{j.criterion}</TableCell>
              <TableCell className="text-brand-text">{j.points}</TableCell>
              <TableCell className="text-brand-muted">{j.how}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Subheading className="mt-10">6. Ask (30s)</Subheading>
      <p className="mt-3 text-sm/6 text-brand-muted">
        Pilot at Venttiilitehdas — integrate with existing ERP exports (3 CSV files, IF/THEN rules,
        zero new infrastructure). Technicians get a priority list instead of a blind calendar.
      </p>
    </>
  )
}
