import { Divider } from '@/components/divider'
import clsx from 'clsx'

const dotColors = {
  red: 'bg-red-500',
  amber: 'bg-amber-400',
  yellow: 'bg-yellow-400',
  pink: 'bg-brand-pink',
  green: 'bg-emerald-400',
} as const

export type StatCardRow = {
  label: string
  value: string
}

export type StatCardProps = {
  label: string
  value: string
  status: string
  statusDot?: keyof typeof dotColors
  rows: StatCardRow[]
  summary?: StatCardRow
  footer?: string
}

export function StatCard({
  label,
  value,
  status,
  statusDot = 'amber',
  rows,
  summary,
  footer,
}: StatCardProps) {
  return (
    <div className="app-card flex flex-col rounded-xl">
      <div className="flex flex-col gap-3 p-6">
        <p className="text-sm text-brand-muted">{label}</p>
        <p className="text-5xl font-bold tabular-nums tracking-tight text-brand-text">{value}</p>
        <span className="inline-flex w-fit items-center gap-2 rounded-md border border-brand-border/35 bg-brand-surface/40 px-2.5 py-1 text-xs font-medium text-brand-text">
          <span className={clsx('size-2 shrink-0 rounded-full', dotColors[statusDot])} />
          {status}
        </span>
      </div>

      <div className="flex flex-1 flex-col justify-end px-6 pb-6">
        <div className="panel-highlight space-y-3 rounded-lg p-4">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-4">
              <span className="text-sm text-brand-muted">{row.label}</span>
              <span className="text-sm font-medium tabular-nums text-brand-text">{row.value}</span>
            </div>
          ))}

          {summary && (
            <>
              <Divider soft className="border-brand-border/25" />
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-brand-muted">{summary.label}</span>
                <span className="text-sm font-semibold tabular-nums text-brand-text">{summary.value}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {footer && (
        <div className="border-t border-brand-border/20 px-6 py-4">
          <p className="text-sm text-brand-muted">{footer}</p>
        </div>
      )}
    </div>
  )
}
