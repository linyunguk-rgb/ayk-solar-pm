'use client'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-12 px-4', className)}>
      {icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-1 text-sm text-muted-foreground max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function LoadingState({ label = 'Loading…', className }: { label?: string; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12', className)}>
      <div className="h-8 w-8 rounded-full border-2 border-emerald-200 border-t-emerald-600 animate-spin" />
      <p className="mt-3 text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

export function CardSkeleton({ className }: { className?: string }) {
  return <div className={cn('rounded-xl border border-border/60 bg-card shadow-sm animate-pulse', className)} />
}
