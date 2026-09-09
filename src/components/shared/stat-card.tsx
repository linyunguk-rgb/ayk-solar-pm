'use client'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import type { SectionKey } from '@/lib/design-system'
import { getSectionTheme } from '@/lib/design-system'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  section?: SectionKey
  trend?: { value: number; positive: boolean } | null
  className?: string
  compact?: boolean
}

export function StatCard({ title, value, subtitle, icon, section = 'overview', trend, className, compact }: StatCardProps) {
  const theme = getSectionTheme(section)
  return (
    <Card className={cn('overflow-hidden border-border/60 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5', className)}>
      <CardContent className={cn(compact ? 'p-3 sm:p-4' : 'p-4 sm:p-5')}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide truncate leading-tight">{title}</p>
            <p className="mt-1.5 text-xl sm:text-2xl font-bold text-foreground tabular-nums leading-tight">{value}</p>
            {subtitle && <p className="mt-0.5 text-[11px] text-muted-foreground truncate leading-tight">{subtitle}</p>}
            {trend && (
              <div className={cn('mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold', trend.positive ? 'text-emerald-600' : 'text-red-600')}>
                <span>{trend.positive ? '↑' : '↓'}</span>
                <span>{Math.abs(trend.value)}%</span>
                <span className="text-muted-foreground font-normal">vs last period</span>
              </div>
            )}
          </div>
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', theme.iconBg, theme.iconFg)}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
