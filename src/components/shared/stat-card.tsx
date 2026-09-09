'use client'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  trend?: { value: number; positive: boolean } | null
  accent?: 'green' | 'blue' | 'orange' | 'red' | 'purple' | 'slate'
  className?: string
}

const accentClasses = {
  green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
  blue: 'bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400',
  orange: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
  red: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
  purple: 'bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400',
  slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
}

export function StatCard({ title, value, subtitle, icon, trend, accent = 'slate', className }: StatCardProps) {
  return (
    <Card className={cn('overflow-hidden border-border/60 shadow-sm hover:shadow-md transition-shadow', className)}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">{title}</p>
            <p className="mt-2 text-2xl font-bold text-foreground tabular-nums">{value}</p>
            {subtitle && <p className="mt-1 text-xs text-muted-foreground truncate">{subtitle}</p>}
            {trend && (
              <div className={cn('mt-2 inline-flex items-center gap-1 text-xs font-medium', trend.positive ? 'text-emerald-600' : 'text-red-600')}>
                <span>{trend.positive ? '↑' : '↓'}</span>
                <span>{Math.abs(trend.value)}%</span>
                <span className="text-muted-foreground font-normal">vs last period</span>
              </div>
            )}
          </div>
          <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', accentClasses[accent])}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
