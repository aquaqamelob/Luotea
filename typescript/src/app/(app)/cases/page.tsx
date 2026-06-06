import { Badge } from '@/components/badge'
import { Heading, Subheading } from '@/components/heading'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/table'
import { getDashboardData } from '@/lib/analytics'

export default async function CasesPage() {
  const { caseStudies, killerCases } = getDashboardData()

  return (
    <>
      <Heading>Case Studies</Heading>
      <p className="mt-2 text-sm text-brand-muted">
        Proof of calendar pathology — 3 verified alarm-to-failure trails
      </p>

      <div className="mt-10 space-y-8">
        {caseStudies.map((c) => (
          <div key={c.woNo} className="app-card rounded-lg p-6">
            <div className="flex items-center gap-3">
              <Badge color="pink">Case {c.id}</Badge>
              <Subheading>{c.title}</Subheading>
              <span className="text-sm text-brand-muted">WO {c.woNo}</span>
            </div>
            <p className="mt-4 text-sm/6 text-brand-text">{c.narrative}</p>
            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-brand-muted">Alarms (7d)</dt>
                <dd className="font-semibold text-brand-text">{c.verifiedAlarms7d} unique</dd>
              </div>
              <div>
                <dt className="text-brand-muted">First alarm</dt>
                <dd className="font-semibold text-brand-text">{c.firstAlarm ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-brand-muted">Prior EH-työ (14d)</dt>
                <dd className="font-semibold text-brand-text">{c.priorEh14d}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>

      <Subheading className="mt-14">Top 5 reactive repairs (by hours)</Subheading>
      <Table className="mt-4 [--gutter:--spacing(6)] lg:[--gutter:--spacing(10)]">
        <TableHead>
          <TableRow>
            <TableHeader>WO</TableHeader>
            <TableHeader>Date</TableHeader>
            <TableHeader>Site</TableHeader>
            <TableHeader>Hours</TableHeader>
            <TableHeader>Alarms (7d)</TableHeader>
            <TableHeader>EH prior 14d</TableHeader>
            <TableHeader>Next EH</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {killerCases.map((k) => (
            <TableRow key={k.woNo}>
              <TableCell className="text-brand-text">{k.woNo}</TableCell>
              <TableCell className="text-brand-muted">{k.started}</TableCell>
              <TableCell className="text-brand-text">{k.site}</TableCell>
              <TableCell className="text-brand-text">{k.hours.toFixed(1)}h</TableCell>
              <TableCell className="text-brand-text">
                {k.alarms7dUnique}
                {k.firstAlarm && (
                  <span className="ml-1 text-xs text-brand-muted">from {k.firstAlarm}</span>
                )}
              </TableCell>
              <TableCell className="text-brand-text">{k.priorEh14d}</TableCell>
              <TableCell className="text-brand-muted">
                {k.daysToNextEh != null ? `+${k.daysToNextEh}d` : '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  )
}
