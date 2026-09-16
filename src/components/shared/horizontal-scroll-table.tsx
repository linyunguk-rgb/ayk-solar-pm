'use client'
import { cn } from '@/lib/utils'

interface HorizontalScrollTableProps {
  children: React.ReactNode
  className?: string
  minWidth?: string
  maxHeight?: string
}

export function HorizontalScrollTable({
  children,
  className,
  minWidth = '900px',
  maxHeight = '500px',
}: HorizontalScrollTableProps) {
  return (
    <div
      className={cn(
        'relative w-full overflow-x-auto overflow-y-auto ayk-scrollbar rounded-lg border border-border/40',
        className
      )}
      style={{ maxHeight }}
    >
      <div style={{ minWidth }} className="min-w-full">
        {children}
      </div>
    </div>
  )
}
