'use client'
import { useState, useCallback } from 'react'
import { SectionHeader, SubSection } from '@/components/shared/section-header'
import { EmptyState } from '@/components/shared/empty-state'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import {
  FileBarChart, FileText, Calendar, CalendarDays, CalendarRange, Users,
  Package, DollarSign, ShieldAlert, FolderKanban, TrendingUp,
  Printer, Download, Loader2, History, RotateCw,
} from 'lucide-react'
import { APP_NAME } from '@/lib/constants'
import type { SectionKey } from '@/lib/design-system'
import { getSectionTheme } from '@/lib/design-system'
import { cn } from '@/lib/utils'

type ReportType =
  | 'daily' | 'weekly' | 'monthly' | 'manpower' | 'material'
  | 'expense' | 'safety' | 'project-summary' | 'planned-vs-actual'

interface ReportCardConfig {
  type: ReportType
  title: string
  description: string
  icon: React.ReactNode
  section: SectionKey
}

// Color-coded report cards per spec — each card uses the section color matching its content type.
const REPORT_CARDS: ReportCardConfig[] = [
  {
    type: 'daily',
    title: 'Daily Progress Report',
    description: "Today's site progress entries across all active projects.",
    icon: <Calendar className="h-6 w-6" />,
    section: 'overview',
  },
  {
    type: 'weekly',
    title: 'Weekly Progress Report',
    description: 'Last 7 days of installations, manpower, and site status.',
    icon: <CalendarDays className="h-6 w-6" />,
    section: 'overview',
  },
  {
    type: 'monthly',
    title: 'Monthly Progress Report',
    description: '30-day rollup with totals, man-hours, and status.',
    icon: <CalendarRange className="h-6 w-6" />,
    section: 'overview',
  },
  {
    type: 'manpower',
    title: 'Manpower Report',
    description: 'Workforce roster, teams, roles, skill levels, and status.',
    icon: <Users className="h-6 w-6" />,
    section: 'manpower',
  },
  {
    type: 'material',
    title: 'Material Usage Report',
    description: 'Stock levels, valuations, and low-stock flags by category.',
    icon: <Package className="h-6 w-6" />,
    section: 'materials',
  },
  {
    type: 'expense',
    title: 'Expense Report',
    description: 'All recorded expenses with approval status and totals.',
    icon: <DollarSign className="h-6 w-6" />,
    section: 'expenses',
  },
  {
    type: 'safety',
    title: 'Safety Report',
    description: 'Incidents, near misses, and PPE compliance summary.',
    icon: <ShieldAlert className="h-6 w-6" />,
    section: 'safety',
  },
  {
    type: 'project-summary',
    title: 'Project Summary',
    description: 'All projects with progress, panels, budget, and status.',
    icon: <FolderKanban className="h-6 w-6" />,
    section: 'projects',
  },
  {
    type: 'planned-vs-actual',
    title: 'Planned vs Actual Report',
    description: 'Schedule variance and budget burn per project.',
    icon: <TrendingUp className="h-6 w-6" />,
    section: 'progress',
  },
]

// Section-keyed button color — used for the "Generate" button on each card.
const SECTION_BUTTON: Record<SectionKey, string> = {
  overview: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  projects: 'bg-sky-600 hover:bg-sky-700 text-white',
  progress: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  tasks: 'bg-amber-600 hover:bg-amber-700 text-white',
  manpower: 'bg-cyan-600 hover:bg-cyan-700 text-white',
  materials: 'bg-violet-600 hover:bg-violet-700 text-white',
  expenses: 'bg-pink-600 hover:bg-pink-700 text-white',
  safety: 'bg-red-600 hover:bg-red-700 text-white',
  documents: 'bg-teal-600 hover:bg-teal-700 text-white',
  reports: 'bg-slate-600 hover:bg-slate-700 text-white',
  settings: 'bg-stone-600 hover:bg-stone-700 text-white',
  guide: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  mobile: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  dailyEntry: 'bg-amber-600 hover:bg-amber-700 text-white',
}

interface ReportResponse {
  type: string
  title: string
  html: string
  generatedAt: string
  data?: any
}

interface RecentReport {
  type: ReportType
  title: string
  generatedAt: string
}

function printReport(html: string, title: string) {
  const win = window.open('', '_blank', 'width=1024,height=768')
  if (!win) {
    toast.error('Pop-up blocked. Please allow pop-ups to print reports.')
    return
  }
  win.document.open()
  win.document.write(`
    <!doctype html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>${APP_NAME} — ${title}</title>
      <style>
        @page { margin: 14mm; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; padding: 8px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; border: 1px solid #e2e8f0; font-size: 12px; }
        thead tr { background: #f1f5f9; }
        h3 { font-size: 14px; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>${html}</body>
    </html>
  `)
  win.document.close()
  // give the browser a tick to render before printing
  setTimeout(() => {
    try {
      win.focus()
      win.print()
    } catch {
      /* noop */
    }
  }, 350)
}

function downloadHtml(html: string, type: ReportType, title: string) {
  const date = new Date().toISOString().slice(0, 10)
  const full = `<!doctype html><html><head><meta charset="utf-8"><title>${APP_NAME} — ${title}</title><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a;padding:24px;}table{width:100%;border-collapse:collapse;}th,td{padding:8px;border:1px solid #e2e8f0;font-size:12px;}thead tr{background:#f1f5f9;}h3{font-size:14px;}</style></head><body>${html}</body></html>`
  const blob = new Blob([full], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `AYK-${type}-${date}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  toast.success('Report downloaded')
}

function formatGeneratedAt(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleString('en-SG', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function ReportsPage() {
  const [loadingType, setLoadingType] = useState<ReportType | null>(null)
  const [activeReport, setActiveReport] = useState<ReportResponse | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [recent, setRecent] = useState<RecentReport[]>([])

  const handleGenerate = useCallback(async (type: ReportType) => {
    setLoadingType(type)
    try {
      const res = await fetch(`/api/reports/${type}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Request failed (${res.status})`)
      }
      const json: ReportResponse = await res.json()
      setActiveReport(json)
      setDialogOpen(true)
      setRecent((prev) => {
        const existing = prev.filter((p) => p.type !== type)
        return [{ type, title: json.title, generatedAt: json.generatedAt }, ...existing].slice(0, 6)
      })
    } catch (e: any) {
      toast.error(e.message || 'Failed to generate report')
    } finally {
      setLoadingType(null)
    }
  }, [])

  return (
    <div className="space-y-6">
      <SectionHeader
        section="reports"
        title="Reports"
        description="Generate professional project reports"
        icon={<FileBarChart className="h-6 w-6" />}
      />

      {/* Report cards grid */}
      <div>
        <SubSection
          section="reports"
          title="Available Reports"
          description="Click Generate to preview a report, then print or download it"
          icon={<FileText className="h-4 w-4" />}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {REPORT_CARDS.map((r) => {
            const theme = getSectionTheme(r.section)
            const isLoading = loadingType === r.type
            return (
              <Card
                key={r.type}
                className="overflow-hidden border-border/60 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col"
              >
                {/* Color-coded top accent strip */}
                <div className={cn('h-1.5 w-full bg-gradient-to-r', theme.gradient)} />
                <CardContent className="p-5 flex flex-col gap-3 h-full">
                  <div className="flex items-start gap-3">
                    <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', theme.iconBg, theme.iconFg)}>
                      {r.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-foreground leading-tight">{r.title}</h3>
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{r.description}</p>
                    </div>
                  </div>
                  <div className="mt-auto flex items-center gap-2 pt-2">
                    <Button
                      onClick={() => handleGenerate(r.type)}
                      disabled={isLoading}
                      className={cn('flex-1 gap-2', SECTION_BUTTON[r.section])}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Generating…
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4" /> Generate
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleGenerate(r.type)}
                      disabled={isLoading}
                      aria-label={`Print ${r.title}`}
                      title="Print"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Recent reports */}
      <div>
        <SubSection
          section="reports"
          title="Recent Reports"
          description="Reports generated in this session — click to re-generate"
          icon={<History className="h-4 w-4" />}
        />
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-5">
            {recent.length === 0 ? (
              <EmptyState
                icon={<History className="h-6 w-6" />}
                title="No reports generated yet"
                description="Click Generate on any report above to start. Generated reports will appear here for quick re-runs."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {recent.map((r) => {
                  const cfg = REPORT_CARDS.find((c) => c.type === r.type)
                  const theme = cfg ? getSectionTheme(cfg.section) : getSectionTheme('reports')
                  return (
                    <button
                      key={r.type + r.generatedAt}
                      onClick={() => handleGenerate(r.type)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg border bg-white hover:bg-slate-50 transition-colors px-3 py-2.5 text-left',
                        theme.border,
                      )}
                    >
                      <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', theme.iconBg, theme.iconFg)}>
                        {cfg?.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-foreground truncate">{r.title}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {formatGeneratedAt(r.generatedAt)}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn('shrink-0 hidden sm:inline-flex items-center gap-1', theme.bg, theme.fg, theme.border)}
                      >
                        <RotateCw className="h-3 w-3" /> Re-run
                      </Badge>
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Report preview dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl w-[96vw] sm:w-[96vw] max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-3 border-b border-border/60 shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base">
              <FileBarChart className="h-4 w-4 text-slate-600" />
              {activeReport?.title || 'Report'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Generated {activeReport ? formatGeneratedAt(activeReport.generatedAt) : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-hidden">
            <ScrollArea className="h-full max-h-[60vh] ayk-scrollbar">
              <div
                className="px-6 py-4 text-slate-900 [&_table]:w-full [&_table]:border-collapse [&_th]:px-2 [&_th]:py-1.5 [&_th]:text-left [&_th]:border [&_th]:border-slate-200 [&_th]:text-[11px] [&_th]:font-semibold [&_th]:bg-slate-50 [&_td]:px-2 [&_td]:py-1.5 [&_td]:border [&_td]:border-slate-200 [&_td]:text-[11px]"
                dangerouslySetInnerHTML={{ __html: activeReport?.html || '<p>No data</p>' }}
              />
            </ScrollArea>
          </div>
          <DialogFooter className="px-6 py-4 border-t border-border/60 shrink-0 gap-2 flex-col sm:flex-row">
            <Button
              variant="outline"
              onClick={() => activeReport && downloadHtml(activeReport.html, activeReport.type as ReportType, activeReport.title)}
              className="gap-2 w-full sm:w-auto"
            >
              <Download className="h-4 w-4" /> Download HTML
            </Button>
            <Button
              onClick={() => activeReport && printReport(activeReport.html, activeReport.title)}
              className="bg-slate-600 hover:bg-slate-700 text-white gap-2 w-full sm:w-auto"
            >
              <Printer className="h-4 w-4" /> Print
            </Button>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="w-full sm:w-auto">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
