'use client'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const map: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; cls: string; label: string }> = {
    Active: { variant: 'default', cls: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200', label: 'Active' },
    Completed: { variant: 'default', cls: 'bg-sky-100 text-sky-700 hover:bg-sky-100 border-sky-200', label: 'Completed' },
    Delayed: { variant: 'destructive', cls: 'bg-red-100 text-red-700 hover:bg-red-100 border-red-200', label: 'Delayed' },
    OnHold: { variant: 'secondary', cls: 'bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200', label: 'On Hold' },
    Todo: { variant: 'secondary', cls: 'bg-slate-100 text-slate-700 hover:bg-slate-100', label: 'To Do' },
    InProgress: { variant: 'default', cls: 'bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200', label: 'In Progress' },
    NotStarted: { variant: 'outline', cls: 'bg-slate-50 text-slate-600', label: 'Not Started' },
    Open: { variant: 'destructive', cls: 'bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200', label: 'Open' },
    Investigating: { variant: 'default', cls: 'bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200', label: 'Investigating' },
    Closed: { variant: 'default', cls: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200', label: 'Closed' },
    Pending: { variant: 'secondary', cls: 'bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200', label: 'Pending' },
    Approved: { variant: 'default', cls: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200', label: 'Approved' },
    Rejected: { variant: 'destructive', cls: 'bg-red-100 text-red-700 hover:bg-red-100 border-red-200', label: 'Rejected' },
    Present: { variant: 'default', cls: 'bg-emerald-100 text-emerald-700', label: 'Present' },
    Absent: { variant: 'destructive', cls: 'bg-red-100 text-red-700', label: 'Absent' },
    Leave: { variant: 'secondary', cls: 'bg-amber-100 text-amber-700', label: 'On Leave' },
    Low: { variant: 'secondary', cls: 'bg-slate-100 text-slate-700', label: 'Low' },
    Medium: { variant: 'default', cls: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Medium' },
    High: { variant: 'default', cls: 'bg-orange-100 text-orange-700 border-orange-200', label: 'High' },
    Critical: { variant: 'destructive', cls: 'bg-red-100 text-red-700 border-red-200', label: 'Critical' },
    Normal: { variant: 'default', cls: 'bg-emerald-100 text-emerald-700', label: 'Normal' },
    Delay: { variant: 'destructive', cls: 'bg-amber-100 text-amber-700', label: 'Delay' },
    Issue: { variant: 'destructive', cls: 'bg-orange-100 text-orange-700', label: 'Issue' },
    Halt: { variant: 'destructive', cls: 'bg-red-100 text-red-700', label: 'Halt' },
  }
  const conf = map[status] || { variant: 'outline' as const, cls: 'bg-slate-100 text-slate-700', label: status }
  return (
    <Badge variant={conf.variant} className={cn('font-medium border', conf.cls, className)}>
      {conf.label}
    </Badge>
  )
}

export function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    Low: 'bg-slate-100 text-slate-700 border-slate-200',
    Medium: 'bg-blue-100 text-blue-700 border-blue-200',
    High: 'bg-orange-100 text-orange-700 border-orange-200',
    Critical: 'bg-red-100 text-red-700 border-red-200',
  }
  return <Badge variant="outline" className={cn('font-medium', map[priority] || map.Low)}>{priority}</Badge>
}
