import { Badge } from '@/components/badge'
import { Heading } from '@/components/heading'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/table'
import { getDashboardData } from '@/lib/get-dashboard-data'
import { formatDaysUntil, recommendationBadgeColor } from '@/lib/action-utils'

export default async function RecommendationsPage() {
  const { recommendations } = getDashboardData()
  const sites = Array.from(new Set(recommendations.map((r) => r.site)))

  return (
    <>
      <Heading>Engine Recommendations</Heading>
      <p className="mt-2 text-sm text-brand-muted">
        IF/THEN rules on 3 joined datasets — no ML, fully transparent.
      </p>

      <div className="mt-6 flex items-end justify-between">
        <p className="text-sm text-brand-muted">{recommendations.length} recommendations</p>
        <select
          name="site"
          defaultValue="all"
          aria-label="Filter by site"
          className="rounded-lg border border-brand-border/40 bg-brand-card px-3 py-1.5 text-sm text-brand-text"
        >
          <option value="all">All sites</option>
          {sites.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <Table className="mt-4 [--gutter:--spacing(6)] lg:[--gutter:--spacing(10)]">
        <TableHead>
          <TableRow>
            <TableHeader>Equipment ID</TableHeader>
            <TableHeader>Site</TableHeader>
            <TableHeader>Alarms (7d)</TableHeader>
            <TableHeader>Next inspection</TableHeader>
            <TableHeader>Recommendation</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {recommendations.map((r) => (
            <TableRow key={`${r.entityId}-${r.site}`}>
              <TableCell className="max-w-xs truncate font-medium text-brand-text" title={r.entityLabel}>
                {r.entityLabel}
              </TableCell>
              <TableCell className="text-brand-muted">{r.site}</TableCell>
              <TableCell className="text-brand-text">
                {r.alarms7d}
                {r.alarmTrend === 'rising' ? ' (rising)' : ''}
              </TableCell>
              <TableCell className="text-brand-muted">
                {r.nextInspection && r.daysToNextInspection != null && r.daysToNextInspection <= 3
                  ? formatDaysUntil(r.daysToNextInspection)
                  : r.nextInspection ?? '—'}
              </TableCell>
              <TableCell>
                <Badge color={recommendationBadgeColor(r.action)}>{r.actionLabel}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  )
}
