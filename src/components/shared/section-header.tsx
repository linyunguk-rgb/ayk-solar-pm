'use client'
import { cn } from '@/lib/utils'
import type { SectionKey } from '@/lib/design-system'
import { getSectionTheme } from '@/lib/design-system'

interface SectionHeaderProps {
  section: SectionKey
  title: string
  description?: string
  icon?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

// Page-level header with color-coded accent strip so users instantly know which area they're in.
export function SectionHeader({ section, title, description, icon, actions, className }: SectionHeaderProps) {
  const theme = getSectionTheme(section)
  return (
    <div className={cn('relative overflow-hidden rounded-2xl bg-white border border-border/60 shadow-sm', className)}>
      {/* Top accent strip */}
      <div className={cn('h-1.5 w-full bg-gradient-to-r', theme.gradient)} />
      <div className="p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 min-w-0">
            {icon && (
              <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md', theme.gradient)}>
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">{title}</h1>
                <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider', theme.bg, theme.fg)}>
                  {theme.label}
                </span>
              </div>
              {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2 flex-wrap shrink-0">{actions}</div>}
        </div>
      </div>
    </div>
  )
}

// Compact sub-section header for grouping cards/sections within a page
interface SubSectionProps {
  title: string
  description?: string
  icon?: React.ReactNode
  section?: SectionKey
  action?: React.ReactNode
  className?: string
}

export function SubSection({ title, description, icon, section = 'overview', action, className }: SubSectionProps) {
  const theme = getSectionTheme(section)
  return (
    <div className={cn('flex items-center justify-between gap-3 mb-3', className)}>
      <div className="flex items-center gap-2.5 min-w-0">
        {icon && (
          <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', theme.iconBg, theme.iconFg)}>
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-semibold text-foreground truncate">{title}</h2>
          {description && <p className="text-xs text-muted-foreground truncate">{description}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
