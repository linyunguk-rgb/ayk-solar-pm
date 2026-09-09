'use client'
import { useMemo } from 'react'
import { useAppStore } from '@/store/app-store'
import { useFetch } from '@/hooks/use-fetch'
import { SectionHeader } from '@/components/shared/section-header'
import { EmptyState, CardSkeleton } from '@/components/shared/empty-state'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sun, MapPin, Camera, CheckCircle2, Clock, AlertTriangle,
  ChevronRight, Home as HomeIcon, FolderKanban, ListChecks, MoreHorizontal,
  Users, Package, ShieldAlert, ListTodo, Wifi, BatteryFull, SignalHigh,
  Smartphone,
} from 'lucide-react'
import {
  APP_NAME, APP_TAGLINE, formatDate, formatNumber, SITE_STATUSES,
} from '@/lib/constants'
import { cn } from '@/lib/utils'

// Site status color mapping for pills
const SITE_STATUS_STYLE: Record<string, { pill: string; ring: string; active: string }> = {
  Normal: {
    pill: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    ring: 'text-emerald-600',
    active: 'ring-2 ring-emerald-500 bg-emerald-50',
  },
  Delay: {
    pill: 'bg-amber-100 text-amber-700 border-amber-200',
    ring: 'text-amber-600',
    active: 'ring-2 ring-amber-500 bg-amber-50',
  },
  Issue: {
    pill: 'bg-orange-100 text-orange-700 border-orange-200',
    ring: 'text-orange-600',
    active: 'ring-2 ring-orange-500 bg-orange-50',
  },
  Halt: {
    pill: 'bg-red-100 text-red-700 border-red-200',
    ring: 'text-red-600',
    active: 'ring-2 ring-red-500 bg-red-50',
  },
}

interface DashboardStats {
  stats: {
    workersOnSite?: number
    totalWorkers?: number
    pendingTasks?: number
    overdueTasks?: number
    lowStockCount?: number
    ppeCompliance?: number
  }
}

interface Project {
  id: string
  name: string
  location: string
  capacity?: string | null
  totalPanels: number
  installedPanels: number
  overallProgress: number
  status: string
}

interface ProgressEntry {
  id: string
  date: string
  installedPanels: number
  totalInstalled: number
  manHours: number
  workers: number
  siteStatus: string
  workCompleted?: string | null
}

interface NotificationItem {
  id: string
  type: string
  title: string
  message: string
  severity: string
  createdAt: string
  project?: { name: string } | null
}

interface Checklist {
  id: string
  date: string
  compliancePct: number
  checklistType: string
}

export function MobilePage() {
  const { user, setNav } = useAppStore()

  // Active project for current project card
  const { data: projData, loading: projLoading } = useFetch<{ projects: Project[] }>('/api/projects?status=Active')
  // Latest progress entry
  const { data: progData, loading: progLoading } = useFetch<{ entries: ProgressEntry[] }>('/api/progress?limit=1')
  // Dashboard stats for quick stats row
  const { data: dashData } = useFetch<DashboardStats>('/api/dashboard')
  // Notifications
  const { data: notifData, loading: notifLoading } = useFetch<{ notifications: NotificationItem[] }>('/api/notifications')
  // Today's PPE checklists
  const todayISO = new Date().toISOString().slice(0, 10)
  const { data: checkData } = useFetch<{ checklists: Checklist[] }>('/api/safety/checklists?checklistType=PPE')

  const project = projData?.projects?.[0] || null
  const latestEntry = progData?.entries?.[0] || null

  // Is the latest entry today?
  const isToday = useMemo(() => {
    if (!latestEntry) return false
    const d = new Date(latestEntry.date)
    const t = new Date()
    return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear()
  }, [latestEntry])

  // Today's PPE compliance
  const todayChecklist = useMemo(() => {
    if (!checkData?.checklists?.length) return null
    return checkData.checklists.find((c) => new Date(c.date).toISOString().slice(0, 10) === todayISO) || null
  }, [checkData, todayISO])

  const stats = dashData?.stats
  const notifications = (notifData?.notifications || []).slice(0, 3)

  const firstName = user?.name?.split(' ')[0] || 'Team'
  const todayLabel = formatDate(new Date())
  const nowTime = new Date().toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })

  // Circular progress ring values
  const overallPct = project?.overallProgress ?? 0
  const installPct = project && (project.totalPanels ?? 0) > 0
    ? Math.min(100, Math.round((project.installedPanels / project.totalPanels) * 1000) / 10)
    : 0
  const ringStroke = 8
  const ringRadius = 52
  const ringCircumference = 2 * Math.PI * ringRadius
  const ringOffset = ringCircumference - (overallPct / 100) * ringCircumference

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-100 via-slate-50 to-emerald-50/40 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 -m-4 sm:-m-6 px-4 sm:px-6 py-6 flex flex-col items-center">
      {/* Desktop-only page header (the phone frame has its own header on mobile) */}
      <div className="hidden lg:block w-full max-w-md mb-4">
        <SectionHeader
          section="mobile"
          title="Mobile Site View"
          description="Phone interface for site supervisors"
          icon={<Smartphone className="h-6 w-6" />}
        />
      </div>

      <div className="w-full max-w-md">
        {/* Phone frame — hidden on small screens (full width) */}
        <div className="mx-auto sm:rounded-[2rem] sm:border-4 sm:border-slate-800 dark:sm:border-slate-700 sm:shadow-2xl sm:overflow-hidden bg-white dark:bg-slate-950 min-h-[640px] flex flex-col">
          {/* Status bar */}
          <div className="hidden sm:flex items-center justify-between px-6 py-1.5 bg-slate-800 text-white text-[11px] font-medium">
            <span className="tabular-nums">{nowTime}</span>
            <div className="flex items-center gap-1.5">
              <SignalHigh className="h-3 w-3" />
              <Wifi className="h-3 w-3" />
              <BatteryFull className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* App header */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white px-5 py-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                <Sun className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-base font-bold leading-tight">{APP_NAME}</div>
                <div className="text-[10px] text-emerald-100 tracking-wide">{APP_TAGLINE}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">Hi, {firstName}</div>
                <div className="text-[10px] text-emerald-100">{todayLabel}</div>
              </div>
            </div>
          </div>

          {/* Scrollable app content */}
          <ScrollArea className="flex-1 min-h-0 ayk-scrollbar bg-slate-50 dark:bg-slate-950">
            <div className="px-4 py-4 space-y-4">
              {/* Current Project */}
              <section>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <FolderKanban className="h-4 w-4 text-emerald-600" /> Current Project
                  </h2>
                  <button
                    onClick={() => setNav('projects')}
                    className="text-xs text-emerald-600 font-medium flex items-center gap-0.5 hover:text-emerald-700"
                  >
                    All <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
                <Card className="border-emerald-200/60 shadow-sm overflow-hidden">
                  <CardContent className="p-4">
                    {projLoading && !project ? (
                      <CardSkeleton className="h-32 rounded-lg" />
                    ) : project ? (
                      <div className="flex items-center gap-4">
                        {/* Progress ring */}
                        <div className="relative shrink-0">
                          <svg width="120" height="120" viewBox="0 0 120 120" className="transform -rotate-90">
                            <circle cx="60" cy="60" r={ringRadius} fill="none" stroke="#e2e8f0" strokeWidth={ringStroke} />
                            <circle
                              cx="60"
                              cy="60"
                              r={ringRadius}
                              fill="none"
                              stroke="#10b981"
                              strokeWidth={ringStroke}
                              strokeDasharray={ringCircumference}
                              strokeDashoffset={ringOffset}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums leading-none">{overallPct}%</div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">Progress</div>
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-slate-900 dark:text-white leading-tight truncate">{project.name}</div>
                          <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                            <MapPin className="h-3 w-3" /> <span className="truncate">{project.location}</span>
                          </div>
                          {project.capacity && (
                            <div className="text-xs text-emerald-700 font-medium mt-1">⚡ {project.capacity}</div>
                          )}
                          <div className="mt-2 grid grid-cols-1 gap-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500">Panels installed</span>
                              <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                                {formatNumber(project.installedPanels)} / {formatNumber(project.totalPanels)}
                              </span>
                            </div>
                            <Progress value={installPct} className="h-1.5" />
                          </div>
                          <div className="mt-2">
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 border text-[10px]">
                              {project.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <EmptyState
                        icon={<FolderKanban className="h-6 w-6" />}
                        title="No active projects assigned"
                        description="Projects you supervise will appear here."
                        className="py-6"
                      />
                    )}
                  </CardContent>
                </Card>
              </section>

              {/* Today's Site Progress */}
              <section>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-emerald-600" /> Today&apos;s Site Progress
                </h2>
                <Card className="border-border/60 shadow-sm">
                  <CardContent className="p-4">
                    {progLoading && !latestEntry ? (
                      <CardSkeleton className="h-32 rounded-lg" />
                    ) : isToday && latestEntry ? (
                      <>
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-xs text-muted-foreground">Latest entry · {formatDate(latestEntry.date)}</div>
                          <Badge className={`border text-[10px] ${SITE_STATUS_STYLE[latestEntry.siteStatus]?.pill || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                            {latestEntry.siteStatus}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <MiniStat label="Installed today" value={formatNumber(latestEntry.installedPanels ?? 0)} accent="text-emerald-600" icon={<Sun className="h-3.5 w-3.5" />} />
                          <MiniStat label="Total installed" value={formatNumber(latestEntry.totalInstalled ?? 0)} accent="text-sky-600" icon={<Package className="h-3.5 w-3.5" />} />
                          <MiniStat label="Man-hours" value={(latestEntry.manHours ?? 0).toFixed(1)} accent="text-violet-600" icon={<Clock className="h-3.5 w-3.5" />} />
                          <MiniStat label="Workers" value={formatNumber(latestEntry.workers ?? 0)} accent="text-amber-600" icon={<Users className="h-3.5 w-3.5" />} />
                        </div>
                      </>
                    ) : (
                      <EmptyState
                        icon={<AlertTriangle className="h-6 w-6" />}
                        title="No entry submitted yet"
                        description="Tap below to log today's site progress"
                        action={
                          <Button
                            onClick={() => setNav('daily-entry')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 w-full"
                            size="sm"
                          >
                            <Sun className="h-4 w-4" /> Update Progress
                          </Button>
                        }
                        className="py-4"
                      />
                    )}
                  </CardContent>
                </Card>
              </section>

              {/* Quick Stats row */}
              <section>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Quick Stats</h2>
                <div className="grid grid-cols-2 gap-2">
                  <QuickStatCard
                    title="Workers on site"
                    value={formatNumber(stats?.workersOnSite ?? 0)}
                    subtitle={`of ${formatNumber(stats?.totalWorkers ?? 0)} total`}
                    icon={<Users className="h-4 w-4" />}
                    accent="bg-emerald-50 text-emerald-600"
                    onClick={() => setNav('manpower')}
                  />
                  <QuickStatCard
                    title="Pending tasks"
                    value={formatNumber(stats?.pendingTasks ?? 0)}
                    subtitle={`${formatNumber(stats?.overdueTasks ?? 0)} overdue`}
                    icon={<ListTodo className="h-4 w-4" />}
                    accent="bg-amber-50 text-amber-600"
                    onClick={() => setNav('tasks')}
                  />
                  <QuickStatCard
                    title="Material alerts"
                    value={formatNumber(stats?.lowStockCount ?? 0)}
                    subtitle="Low stock items"
                    icon={<Package className="h-4 w-4" />}
                    accent="bg-red-50 text-red-600"
                    onClick={() => setNav('materials')}
                  />
                  <QuickStatCard
                    title="PPE compliance"
                    value={`${stats?.ppeCompliance ?? 0}%`}
                    subtitle="Average"
                    icon={<ShieldAlert className="h-4 w-4" />}
                    accent="bg-sky-50 text-sky-600"
                    onClick={() => setNav('safety')}
                  />
                </div>
              </section>

              {/* Big Update Progress button */}
              <Button
                onClick={() => setNav('daily-entry')}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white text-base font-semibold gap-2 shadow-md"
              >
                <Sun className="h-5 w-5" /> Update Site Progress
              </Button>

              {/* PPE Checklist + Upload photos */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setNav('safety')}
                  className="text-left rounded-xl border border-border/60 bg-white dark:bg-slate-900 p-3 hover:shadow-md hover:border-red-300 transition-all"
                  aria-label="Open PPE checklist"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600">
                      <ShieldAlert className="h-4 w-4" />
                    </div>
                    {todayChecklist && (
                      <Badge className={`text-[9px] ${todayChecklist.compliancePct >= 100 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'} border`}>
                        {todayChecklist.compliancePct}%
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">PPE Checklist</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {todayChecklist ? `Today: ${todayChecklist.compliancePct}% compliance` : 'Tap to fill today'}
                  </div>
                </button>

                <button
                  onClick={() => setNav('daily-entry')}
                  className="text-left rounded-xl border border-border/60 bg-white dark:bg-slate-900 p-3 hover:shadow-md hover:border-sky-300 transition-all"
                  aria-label="Upload site photos"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                      <Camera className="h-4 w-4" />
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">Upload Photos</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Site progress &amp; evidence</div>
                </button>
              </div>

              {/* Site Status pills */}
              <section>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Site Status</h2>
                <div className="grid grid-cols-4 gap-2">
                  {SITE_STATUSES.map((s) => {
                    const active = latestEntry?.siteStatus === s
                    const style = SITE_STATUS_STYLE[s] || SITE_STATUS_STYLE.Normal
                    return (
                      <button
                        key={s}
                        onClick={() => setNav('daily-entry')}
                        className={cn(
                          'rounded-lg border py-2 text-center transition-all',
                          style.pill,
                          active ? style.active : 'opacity-80 hover:opacity-100'
                        )}
                      >
                        <div className="text-[11px] font-semibold">{s}</div>
                      </button>
                    )
                  })}
                </div>
              </section>

              {/* Recent activity */}
              <section>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-emerald-600" /> Recent Activity
                  </h2>
                  <button onClick={() => setNav('dashboard')} className="text-xs text-emerald-600 font-medium hover:text-emerald-700">
                    View all
                  </button>
                </div>
                <Card className="border-border/60 shadow-sm">
                  <CardContent className="p-0">
                    {notifLoading && notifications.length === 0 ? (
                      <div className="p-3 space-y-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <CardSkeleton key={i} className="h-10 rounded-md" />
                        ))}
                      </div>
                    ) : notifications.length === 0 ? (
                      <EmptyState
                        icon={<Clock className="h-6 w-6" />}
                        title="No recent notifications"
                        description="You're all caught up!"
                        className="py-6"
                      />
                    ) : (
                      <ul className="divide-y divide-border/60">
                        {notifications.map((n) => (
                          <li key={n.id} className="px-4 py-2.5 flex items-start gap-2.5">
                            <div className={cn(
                              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                              n.severity === 'critical' ? 'bg-red-50 text-red-600' :
                              n.severity === 'warning' ? 'bg-amber-50 text-amber-600' :
                              'bg-emerald-50 text-emerald-600'
                            )}>
                              <NotifIcon type={n.type} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-medium text-slate-900 dark:text-white leading-tight truncate">{n.title}</div>
                              <div className="text-[10px] text-muted-foreground truncate">{n.message}</div>
                              <div className="text-[9px] text-muted-foreground mt-0.5">
                                {timeAgo(n.createdAt)}{n.project?.name ? ` · ${n.project.name}` : ''}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </section>

              <div className="h-2" />
            </div>
          </ScrollArea>

          {/* Bottom nav */}
          <nav className="border-t border-border/60 bg-white dark:bg-slate-900 px-2 py-2 grid grid-cols-4 gap-1 shrink-0">
            <BottomNav icon={<HomeIcon className="h-5 w-5" />} label="Home" onClick={() => setNav('dashboard')} />
            <BottomNav icon={<FolderKanban className="h-5 w-5" />} label="Projects" onClick={() => setNav('projects')} />
            <BottomNav icon={<ListChecks className="h-5 w-5" />} label="Tasks" onClick={() => setNav('tasks')} />
            <BottomNav icon={<MoreHorizontal className="h-5 w-5" />} label="More" onClick={() => setNav('reports')} />
          </nav>
        </div>

        {/* Desktop-only hint */}
        <p className="hidden lg:block text-center text-xs text-muted-foreground mt-4">
          AYK site-progress companion — tap any quick action to switch to the full desktop view
        </p>
      </div>
    </div>
  )
}

// ============================================================
// Sub-components
// ============================================================
function MiniStat({ label, value, accent, icon }: { label: string; value: string; accent: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border/60 bg-slate-50 dark:bg-slate-900 px-3 py-2">
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wide">
        <span className={accent}>{icon}</span> {label}
      </div>
      <div className="text-base font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">{value}</div>
    </div>
  )
}

function QuickStatCard({
  title, value, subtitle, icon, accent, onClick,
}: {
  title: string; value: string | number; subtitle?: string; icon: React.ReactNode; accent: string; onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="text-left rounded-xl border border-border/60 bg-white dark:bg-slate-900 p-3 hover:shadow-md hover:border-emerald-300 transition-all"
    >
      <div className="flex items-center gap-2">
        <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', accent)}>{icon}</div>
        <div className="min-w-0">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide truncate">{title}</div>
          <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums leading-none">{value}</div>
        </div>
      </div>
      {subtitle && <div className="text-[10px] text-muted-foreground mt-1 truncate">{subtitle}</div>}
    </button>
  )
}

function BottomNav({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  )
}

function NotifIcon({ type }: { type: string }) {
  const map: Record<string, React.ReactNode> = {
    DelayedProject: <Clock className="h-3.5 w-3.5" />,
    LowStock: <Package className="h-3.5 w-3.5" />,
    OverdueTask: <ListTodo className="h-3.5 w-3.5" />,
    SafetyIncident: <ShieldAlert className="h-3.5 w-3.5" />,
    PendingApproval: <AlertTriangle className="h-3.5 w-3.5" />,
    DailyProgress: <CheckCircle2 className="h-3.5 w-3.5" />,
  }
  return <>{map[type] || <Clock className="h-3.5 w-3.5" />}</>
}

function timeAgo(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d) : d
  if (!(date instanceof Date) || isNaN(date.getTime())) return '—'
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(date)
}
