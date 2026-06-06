import { Badge } from '@/components/badge'
import { Divider } from '@/components/divider'

export function Stat({
  title,
  value,
  change,
  changeColor = 'zinc',
}: {
  title: string
  value: string
  change: string
  changeColor?: 'zinc' | 'pink' | 'amber' | 'red'
}) {
  return (
    <div className="app-card rounded-xl p-1 pb-4">
      <Divider soft className="border-brand-border/25" />
      <div className="mt-6 text-lg/6 font-semibold text-brand-muted sm:text-sm/6">{title}</div>
      <div className="mt-3 text-3xl/8 font-bold text-brand-text sm:text-2xl/8">{value}</div>
      <div className="mt-3">
        <Badge color={changeColor}>{change}</Badge>
      </div>
    </div>
  )
}
