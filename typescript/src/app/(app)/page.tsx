import { Badge } from '@/components/badge'
import { Heading, Subheading } from '@/components/heading'
import { StatCard } from '@/components/stat-card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/table'
import { TextLink } from '@/components/text'
import { getDashboardData } from '@/lib/analytics'
import { formatDaysUntil, recommendationBadgeColor } from '@/lib/action-utils'

export default async function Home() {
  const data = getDashboardData()
  const featured = data.caseStudies[0]
  const { calendarWaste: cw, recommendations } = data

  const sendNow = recommendations.filter((r) => r.action === 'SEND_NOW').length
  const cancel = recommendations.filter((r) => r.action === 'CANCEL_INSPECTION').length

  const topRecs = [...recommendations]
    .sort((a, b) => {
      const priority = { SEND_NOW: 0, ACCELERATE_INSPECTION: 1, AUDIT_PLAN: 2, CANCEL_INSPECTION: 3, MONITOR: 4 }
      return (priority[a.action] ?? 9) - (priority[b.action] ?? 9) || b.alarms7d - a.alarms7d
    })
    .slice(0, 10)

  return (
    <>
      <Heading>Prioritization Engine</Heading>
      <p className="mt-2 text-sm text-brand-muted">
        Calendar vs signals — what to send, cancel, or accelerate today.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <StatCard
          label="EH-työ → reactive failure"
          value={`${cw.pctEhFollowedByReactive}%`}
          status="Calendar waste"
          statusDot="red"
          rows={[
            { label: 'Scheduled EH-työ (2025+)', value: String(cw.totalEhTyot) },
            { label: 'Reactive WO within 14 days', value: String(cw.ehWithReactiveWithin14d) },
          ]}
          summary={{ label: 'Wasted visit rate', value: `${cw.pctEhFollowedByReactive}%` }}
          footer="Routine visits that did not prevent a breakdown within two weeks."
        />
        <StatCard
          label="Pre-failure alarm signal"
          value={`${cw.pctReactiveWithAlarms}%`}
          status="Ignored signals"
          statusDot="amber"
          rows={[
            { label: 'Reactive repairs (2025+)', value: String(cw.totalReactiveRepairs) },
            { label: 'With 5+ alarms in prior 7d', value: String(cw.reactiveWith5plusAlarms) },
          ]}
          summary={{ label: 'Missed early warning rate', value: `${cw.pctReactiveWithAlarms}%` }}
          footer="Failures where alarms fired repeatedly before the reactive work order."
        />
        <StatCard
          label="Alarm → failure lead time"
          value={`${cw.avgDaysAlarmToFailure} days`}
          status="Action window"
          statusDot="pink"
          rows={[
            { label: 'Engine recommendations', value: String(recommendations.length) },
            { label: 'Send technician now', value: String(sendNow) },
            { label: 'Cancel inspection', value: String(cancel) },
          ]}
          summary={{ label: 'Avg. days to act', value: `${cw.avgDaysAlarmToFailure} days` }}
          footer="Average lead time between first alarm cluster and reactive failure."
        />
      </div>

      {featured && (
        <div className="accent-bar panel-highlight mt-10 rounded-lg p-6">
          <Subheading>{featured.title}</Subheading>
          <p className="mt-3 text-sm/6 text-brand-text">{featured.narrative}</p>
          <p className="mt-3 text-xs text-brand-muted">
            {featured.verifiedAlarms7d} alarms in 7 days · {featured.priorEh14d} EH-työ visits in prior 14 days
          </p>
        </div>
      )}

      <Subheading className="mt-10">Today&apos;s priorities</Subheading>
      <Table className="mt-4 [--gutter:--spacing(6)] lg:[--gutter:--spacing(10)]">
        <TableHead>
          <TableRow>
            <TableHeader>Equipment</TableHeader>
            <TableHeader>Site</TableHeader>
            <TableHeader>Alarms (7d)</TableHeader>
            <TableHeader>Next inspection</TableHeader>
            <TableHeader>Action</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {topRecs.map((r) => (
            <TableRow key={`${r.entityId}-${r.site}`}>
              <TableCell className="font-medium text-brand-text">{r.entityLabel}</TableCell>
              <TableCell className="text-brand-muted">{r.site}</TableCell>
              <TableCell className="text-brand-text">
                {r.alarms7d}
                {r.alarmTrend === 'rising' && <span className="ml-1 text-xs text-brand-pink">↑</span>}
              </TableCell>
              <TableCell className="text-brand-muted">{formatDaysUntil(r.daysToNextInspection)}</TableCell>
              <TableCell>
                <Badge color={recommendationBadgeColor(r.action)}>{r.actionLabel}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <p className="mt-6 text-sm">
        <TextLink href="/recommendations" className="text-brand-pink decoration-brand-pink/50">
          All {recommendations.length} recommendations →
        </TextLink>
      </p>
    </>
  )
}
