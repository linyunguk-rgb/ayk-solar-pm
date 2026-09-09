'use client'
import { useState, useCallback } from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import {
  FileBarChart, FileText, Calendar, CalendarDays, CalendarRange, Users,
  Package, DollarSign, ShieldAlert, FolderKanban, TrendingUp,
  Printer, Download, Loader2, History,
} from 'lucide-react'
import { APP_NAME } from '@/lib/constants'

type ReportType =
  | 'daily' | 'weekly' | 'monthly' | 'manpower' | 'material'
  | 'expense' | 'safety' | 'project-summary' | 'planned-vs-actual'

interface ReportCardConfig {
  type: ReportType
  title: string
  description: string
  icon: React.ReactNode
  accent: string
}

const REPORT_CARDS: ReportCardConfig[] = [
  {
    type: 'daily',
    title: 'Daily Progress Report',
    description: 'Today\'s site progress entries across all active projects.',
    icon: <Calendar className="h-6 w-6" />,
    accent: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
  },
  {
    type: 'weekly',
    title: 'Weekly Progress Report',
    description: 'Last 7 days of installations, manpower, and site status.',
    icon: <CalendarDays className="h-6 w-6" />,
    accent: 'bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400',
  },
  {
    type: 'monthly',
    title: 'Monthly Progress Report',
    description: '30-day rollup with totals, man-hours, and status.',
    icon: <CalendarRange className="h-6 w-6" />,
    accent: 'bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400',
  },
  {
    type: 'manpower',
    title: 'Manpower Report',
    description: 'Workforce roster, teams, roles, skill levels, and status.',
    icon: <Users className="h-6 w-6" />,
    accent: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
  },
  {
    type: 'material',
    title: 'Material Usage Report',
    description: 'Stock levels, valuations, and low-stock flags by category.',
    icon: <Package className="h-6 w-6" />,
    accent: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
  },
  {
    type: 'expense',
    title: 'Expense Report',
    description: 'All recorded expenses with approval status and totals.',
    icon: <DollarSign className="h-6 w-6" />,
    accent: 'bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400',
  },
  {
    type: 'safety',
    title: 'Safety Report',
    description: 'Incidents, near misses, and PPE compliance summary.',
    icon: <ShieldAlert className="h-6 w-6" />,
    accent: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
  },
  {
    type: 'project-summary',
    title: 'Project Summary',
    description: 'All projects with progress, panels, budget, and status.',
    icon: <FolderKanban className="h-6 w-6" />,
    accent: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
  },
  {
    type: 'planned-vs-actual',
    title: 'Planned vs Actual Report',
    description: 'Schedule variance and budget burn per project.',
    icon: <TrendingUp className="h-6 w-6" />,
    accent: 'bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400',
  },
]

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
      <PageHeader
        title="Reports"
        description="Generate professional project reports"
        icon={<FileBarChart className="h-5 w-5" />}
      />

      {/* Report cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORT_CARDS.map((r) => (
          <Card key={r.type} className="overflow-hidden border-border/60 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex flex-col gap-3 h-full">
              <div className="flex items-start gap-3">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${r.accent}`}>
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
                  disabled={loadingType === r.type}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {loadingType === r.type ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating…
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" /> Generate
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleGenerate(r.type)}
                  disabled={loadingType === r.type}
                  aria-label={`Print ${r.title}`}
                  title="Print"
                >
                  <Printer className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent reports */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <History className="h-4 w-4 text-emerald-600" />
            <h3 className="text-base font-semibold text-foreground">Recent Reports</h3>
          </div>
          {recent.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">
              No reports generated in this session yet. Click <span className="font-medium text-emerald-600">Generate</span> on any report above.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recent.map((r) => {
                const cfg = REPORT_CARDS.find((c) => c.type === r.type)
                return (
                  <button
                    key={r.type + r.generatedAt}
                    onClick={() => handleGenerate(r.type)}
                    className="flex items-center gap-3 rounded-lg border border-border/60 bg-white hover:border-emerald-300 hover:bg-emerald-50/40 dark:bg-transparent transition-colors px-3 py-2.5 text-left"
                  >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${cfg?.accent || 'bg-slate-100 text-slate-600'}`}>
                      {cfg?.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-foreground truncate">{r.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(r.generatedAt).toLocaleString('en-SG', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 hidden sm:inline-flex">View</Badge>
                  </button>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report preview dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl w-[96vw] sm:w-[96vw] max-h-[88vh] flex flex-col gap-0 p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-3 border-b border-border/60 shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base">
              <FileBarChart className="h-4 w-4 text-emerald-600" />
              {activeReport?.title || 'Report'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Generated {activeReport ? new Date(activeReport.generatedAt).toLocaleString('en-SG') : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-hidden">
            <ScrollArea className="h-full max-h-[62vh] ayk-scrollbar">
              <div
                className="px-6 py-4 text-slate-900 [&_table]:w-full [&_table]:border-collapse [&_th]:px-2 [&_th]:py-1.5 [&_th]:text-left [&_th]:border [&_th]:border-slate-200 [&_th]:text-[11px] [&_th]:font-semibold [&_th]:bg-slate-50 [&_td]:px-2 [&_td]:py-1.5 [&_td]:border [&_td]:border-slate-200 [&_td]:text-[11px]"
                dangerouslySetInnerHTML={{ __html: activeReport?.html || '<p>No data</p>' }}
              />
            </ScrollArea>
          </div>
          <DialogFooter className="px-6 py-4 border-t border-border/60 shrink-0 gap-2">
            <Button
              variant="outline"
              onClick={() => activeReport && downloadHtml(activeReport.html, activeReport.type as ReportType, activeReport.title)}
              className="gap-2"
            >
              <Download className="h-4 w-4" /> Download HTML
            </Button>
            <Button
              onClick={() => activeReport && printReport(activeReport.html, activeReport.title)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              <Printer className="h-4 w-4" /> Print
            </Button>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
