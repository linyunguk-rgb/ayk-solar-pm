'use client'
import { useState, useMemo, useEffect } from 'react'
import { useAppStore } from '@/store/app-store'
import { useFetch, apiPost, apiPut } from '@/hooks/use-fetch'
import { SectionHeader, SubSection } from '@/components/shared/section-header'
import { StatCard } from '@/components/shared/stat-card'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  ShieldAlert, ShieldCheck, AlertCircle, TriangleAlert, HardHat, Plus, FileText,
  MapPin, Calendar, User as UserIcon, ClipboardList, TrendingUp, BarChart3,
  Footprints, Hand, Link2, Sparkles, Wrench, Zap,
} from 'lucide-react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
} from 'recharts'
import {
  SAFETY_INCIDENT_LABELS, formatDate,
} from '@/lib/constants'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

/* ---- PPE checklist items with icons ---- */
const PPE_ITEMS: { key: string; label: string; icon: any }[] = [
  { key: 'helmet', label: 'Helmet', icon: HardHat },
  { key: 'safetyShoes', label: 'Safety Shoes', icon: Footprints },
  { key: 'gloves', label: 'Gloves', icon: Hand },
  { key: 'harness', label: 'Harness', icon: Link2 },
  { key: 'workAreaClean', label: 'Work Area Clean', icon: Sparkles },
  { key: 'equipmentCondition', label: 'Equipment Condition', icon: Wrench },
  { key: 'electricalSafety', label: 'Electrical Safety', icon: Zap },
]

const CHECKLIST_TYPES = ['PPE', 'Toolbox', 'Inspection'] as const
const INCIDENT_TYPES_LIST = ['Incident', 'NearMiss', 'UnsafeCondition'] as const
const INCIDENT_SEVERITIES = ['Low', 'Medium', 'High', 'Critical'] as const
const INCIDENT_STATUSES = ['Open', 'Investigating', 'Closed'] as const

const CHECKLIST_TYPE_BADGE: Record<string, string> = {
  PPE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Toolbox: 'bg-sky-100 text-sky-700 border-sky-200',
  Inspection: 'bg-violet-100 text-violet-700 border-violet-200',
}

/* Incident type → colored left border + icon styling */
const INCIDENT_TYPE_STYLE: Record<string, { border: string; iconBg: string; iconFg: string; Icon: any }> = {
  Incident: { border: 'border-l-red-500', iconBg: 'bg-red-50', iconFg: 'text-red-600', Icon: AlertCircle },
  NearMiss: { border: 'border-l-amber-500', iconBg: 'bg-amber-50', iconFg: 'text-amber-600', Icon: TriangleAlert },
  UnsafeCondition: { border: 'border-l-sky-500', iconBg: 'bg-sky-50', iconFg: 'text-sky-600', Icon: HardHat },
}

/* Compliance % color helper (>=90 green, 70-89 amber, <70 red) */
function complianceColor(pct: number): string {
  if (pct >= 90) return '[&_>div]:bg-emerald-500'
  if (pct >= 70) return '[&_>div]:bg-amber-500'
  return '[&_>div]:bg-red-500'
}
function complianceText(pct: number): string {
  if (pct >= 90) return 'text-emerald-700'
  if (pct >= 70) return 'text-amber-700'
  return 'text-red-700'
}

export function SafetyPage() {
  const { user } = useAppStore()

  const [tab, setTab] = useState<'checklists' | 'incidents' | 'ppe'>('checklists')

  // Filters
  const [projFilter, setProjFilter] = useState<string>('all')
  const [clTypeFilter, setClTypeFilter] = useState<string>('all')
  const [incTypeFilter, setIncTypeFilter] = useState<string>('all')
  const [incStatusFilter, setIncStatusFilter] = useState<string>('all')

  // Dialogs
  const [clDialogOpen, setClDialogOpen] = useState(false)
  const [incDialogOpen, setIncDialogOpen] = useState(false)
  const [editIncident, setEditIncident] = useState<any | null>(null)

  const { data: projData } = useFetch<any>('/api/projects')
  const projects = projData?.projects || []

  const clUrl = `/api/safety/checklists?projectId=${projFilter}&checklistType=${clTypeFilter}`
  const incUrl = `/api/safety/incidents?projectId=${projFilter}&type=${incTypeFilter}&status=${incStatusFilter}`
  const { data: clData, loading: clLoading, refetch: refetchCl } = useFetch<any>(clUrl)
  const { data: incData, loading: incLoading, refetch: refetchInc } = useFetch<any>(incUrl)

  const checklists: any[] = clData?.checklists || []
  const incidents: any[] = incData?.incidents || []

  // ----- Stats -----
  const stats = useMemo(() => {
    const totalIncidents = (incidents?.length ?? 0)
    const openIncidents = incidents.filter(i => i.status === 'Open').length
    const closedIncidents = incidents.filter(i => i.status === 'Closed').length
    const nearMisses = incidents.filter(i => i.type === 'NearMiss').length
    const last30 = (checklists || []).slice(0, 30)
    const ppeAvg = last30.length > 0
      ? Math.round(last30.reduce((s, c) => s + (c.compliancePct || 0), 0) / last30.length)
      : 0
    return { totalIncidents, openIncidents, closedIncidents, nearMisses, ppeAvg }
  }, [incidents, checklists])

  // ----- PPE Compliance trend (last 14 days) -----
  const trendData = useMemo(() => {
    const byDay = new Map<string, { sum: number; count: number }>()
    for (const c of checklists || []) {
      const d = new Date(c.date)
      const key = d.toISOString().slice(0, 10)
      const cur = byDay.get(key) || { sum: 0, count: 0 }
      cur.sum += c.compliancePct || 0
      cur.count += 1
      byDay.set(key, cur)
    }
    const days: { date: string; label: string; compliance: number }[] = []
    const today = new Date()
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      const entry = byDay.get(key)
      days.push({
        date: key,
        label: `${d.getDate()}/${d.getMonth() + 1}`,
        compliance: entry ? Math.round(entry.sum / entry.count) : 0,
      })
    }
    return days
  }, [checklists])

  // ----- PPE per-item compliance -----
  const ppePerItem = useMemo(() => {
    const total = checklists?.length ?? 0
    return PPE_ITEMS.map(item => {
      const checked = (checklists || []).filter(c => c[item.key] === true).length
      const pct = total > 0 ? Math.round((checked / total) * 100) : 0
      return { ...item, pct, checked, total }
    })
  }, [checklists])

  return (
    <div className="space-y-6">
      <SectionHeader
        section="safety"
        title="Safety Management"
        description="PPE checklists, incidents and compliance"
        icon={<ShieldAlert className="h-6 w-6" />}
        actions={
          <>
            <Button onClick={() => setClDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="h-4 w-4 mr-2" /> New Checklist
            </Button>
            <Button onClick={() => setIncDialogOpen(true)} variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
              <AlertCircle className="h-4 w-4 mr-2" /> Report Incident
            </Button>
          </>
        }
      />

      {/* Safety Overview — KPI grid */}
      <div>
        <SubSection
          section="safety"
          title="Safety Overview"
          description="Key safety metrics across all projects"
          icon={<BarChart3 className="h-4 w-4" />}
        />
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          <StatCard
            title="Total Incidents"
            value={stats.totalIncidents ?? 0}
            subtitle="All time"
            icon={<ShieldAlert className="h-5 w-5" />}
            section="safety"
          />
          <StatCard
            title="Open Incidents"
            value={stats.openIncidents ?? 0}
            subtitle="Need attention"
            icon={<AlertCircle className="h-5 w-5" />}
            section="safety"
          />
          <StatCard
            title="Closed Incidents"
            value={stats.closedIncidents ?? 0}
            subtitle="Resolved"
            icon={<ShieldCheck className="h-5 w-5" />}
            section="safety"
          />
          <StatCard
            title="Near Misses"
            value={stats.nearMisses ?? 0}
            subtitle="Reported"
            icon={<TriangleAlert className="h-5 w-5" />}
            section="safety"
          />
          <StatCard
            title="PPE Compliance"
            value={`${stats.ppeAvg ?? 0}%`}
            subtitle="Avg last 30 checklists"
            icon={<ShieldCheck className="h-5 w-5" />}
            section="safety"
          />
        </div>
      </div>

      {/* PPE Compliance Trend Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-red-600" />
            PPE Compliance Trend — Last 14 Days
          </CardTitle>
          <CardDescription className="text-xs">Daily average compliance score from checklists</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendData} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
              <RTooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                formatter={(v: any) => [`${v}%`, 'Compliance']}
                labelFormatter={(l) => `Date ${l}`}
              />
              <Line type="monotone" dataKey="compliance" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4, fill: '#ef4444' }} name="Compliance" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="checklists">Checklists</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="ppe">PPE Compliance</TabsTrigger>
        </TabsList>

        {/* ============== CHECKLISTS TAB ============== */}
        <TabsContent value="checklists" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs">Project</Label>
                  <Select value={projFilter} onValueChange={setProjFilter}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="All projects" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Projects</SelectItem>
                      {projects.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs">Checklist Type</Label>
                  <Select value={clTypeFilter} onValueChange={setClTypeFilter}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="All types" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {CHECKLIST_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => setClDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white sm:w-auto w-full">
                  <Plus className="h-4 w-4 mr-2" /> New Checklist
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-red-600" /> Safety Checklists
              </CardTitle>
              <CardDescription className="text-xs">{checklists?.length ?? 0} checklist(s) found</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {clLoading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-12 rounded bg-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : (checklists?.length ?? 0) === 0 ? (
                <EmptyState
                  icon={<ShieldCheck className="h-6 w-6" />}
                  title="No checklists found"
                  description="Create a safety checklist to start tracking PPE compliance."
                  action={
                    <Button onClick={() => setClDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                      <Plus className="h-4 w-4 mr-2" /> New Checklist
                    </Button>
                  }
                />
              ) : (
                <ScrollArea className="max-h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Compliance</TableHead>
                        <TableHead>Conducted By</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {checklists.map((c: any) => {
                        const pct = c.compliancePct || 0
                        return (
                          <TableRow key={c.id}>
                            <TableCell className="whitespace-nowrap text-sm">{formatDate(c.date)}</TableCell>
                            <TableCell className="text-sm max-w-[160px] truncate">{c.project?.name || '—'}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn('font-medium', CHECKLIST_TYPE_BADGE[c.checklistType] || 'bg-slate-100 text-slate-700 border-slate-200')}>
                                {c.checklistType}
                              </Badge>
                            </TableCell>
                            <TableCell className="w-40">
                              <div className="flex items-center gap-2">
                                <Progress value={pct} className={cn('h-1.5 flex-1', complianceColor(pct))} />
                                <span className={cn('text-xs font-semibold tabular-nums w-9 text-right', complianceText(pct))}>{pct}%</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{c.conductedByName || '—'}</TableCell>
                            <TableCell className="text-sm max-w-[140px] truncate">{c.location || '—'}</TableCell>
                            <TableCell className="text-sm max-w-[200px] truncate text-muted-foreground">{c.remarks || '—'}</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============== INCIDENTS TAB ============== */}
        <TabsContent value="incidents" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs">Project</Label>
                  <Select value={projFilter} onValueChange={setProjFilter}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Projects</SelectItem>
                      {projects.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs">Type</Label>
                  <Select value={incTypeFilter} onValueChange={setIncTypeFilter}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {INCIDENT_TYPES_LIST.map(t => <SelectItem key={t} value={t}>{SAFETY_INCIDENT_LABELS[t]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs">Status</Label>
                  <Select value={incStatusFilter} onValueChange={setIncStatusFilter}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {INCIDENT_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => setIncDialogOpen(true)} variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 sm:w-auto w-full">
                  <AlertCircle className="h-4 w-4 mr-2" /> Report Incident
                </Button>
              </div>
            </CardContent>
          </Card>

          {incLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse"><CardContent className="p-5 h-44" /></Card>
              ))}
            </div>
          ) : (incidents?.length ?? 0) === 0 ? (
            <Card>
              <CardContent className="p-0">
                <EmptyState
                  icon={<ShieldCheck className="h-6 w-6" />}
                  title="No incidents reported"
                  description="Stay safe out there! Report a new incident using the button above."
                  action={
                    <Button onClick={() => setIncDialogOpen(true)} variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
                      <AlertCircle className="h-4 w-4 mr-2" /> Report Incident
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {incidents.map((inc: any) => (
                <IncidentCard key={inc.id} incident={inc} onEdit={() => setEditIncident(inc)} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ============== PPE COMPLIANCE TAB ============== */}
        <TabsContent value="ppe" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-1 bg-red-50/40 border-red-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-red-700">
                  <ShieldCheck className="h-4 w-4" /> Overall Compliance
                </CardTitle>
                <CardDescription className="text-xs">Average across all checklists</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className={cn('text-4xl font-bold tabular-nums', complianceText(stats.ppeAvg))}>{stats.ppeAvg ?? 0}%</span>
                  <span className="text-sm text-red-600">/ 100%</span>
                </div>
                <Progress value={stats.ppeAvg ?? 0} className={cn('h-2.5 mt-3', complianceColor(stats.ppeAvg ?? 0))} />
                <p className="text-xs text-muted-foreground mt-3">
                  Based on {checklists?.length ?? 0} checklist{(checklists?.length ?? 0) === 1 ? '' : 's'} submitted.
                </p>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-red-600" /> PPE Item Compliance
                </CardTitle>
                <CardDescription className="text-xs">Percentage of checklists where each item was checked</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {ppePerItem.map(item => {
                  const ItemIcon = item.icon
                  return (
                    <div key={item.key} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700 flex items-center gap-2">
                          <ItemIcon className="h-4 w-4 text-slate-500" />
                          {item.label}
                        </span>
                        <span className={cn('tabular-nums font-semibold', complianceText(item.pct))}>{item.pct}%</span>
                      </div>
                      <Progress
                        value={item.pct}
                        className={cn('h-2', complianceColor(item.pct))}
                      />
                      <p className="text-[11px] text-muted-foreground">{item.checked} of {item.total} checklists passed</p>
                    </div>
                  )
                })}
                {(checklists?.length ?? 0) === 0 && (
                  <EmptyState
                    icon={<ClipboardList className="h-6 w-6" />}
                    title="No checklists to analyze"
                    description="Submit a checklist to see PPE item compliance."
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ============== NEW CHECKLIST DIALOG ============== */}
      <NewChecklistDialog
        open={clDialogOpen}
        onOpenChange={setClDialogOpen}
        projects={projects}
        onSubmit={async (payload) => {
          try {
            await apiPost('/api/safety/checklists', payload)
            toast.success('Checklist submitted')
            setClDialogOpen(false)
            refetchCl()
          } catch (e: any) {
            toast.error(e.message || 'Failed to submit checklist')
          }
        }}
      />

      {/* ============== NEW INCIDENT DIALOG ============== */}
      <IncidentDialog
        open={incDialogOpen}
        onOpenChange={setIncDialogOpen}
        projects={projects}
        title="Report Incident"
        onSubmit={async (payload) => {
          try {
            await apiPost('/api/safety/incidents', payload)
            toast.success('Incident reported')
            setIncDialogOpen(false)
            refetchInc()
          } catch (e: any) {
            toast.error(e.message || 'Failed to report incident')
          }
        }}
      />

      {/* ============== EDIT INCIDENT DIALOG ============== */}
      <IncidentDialog
        open={!!editIncident}
        onOpenChange={(o) => { if (!o) setEditIncident(null) }}
        projects={projects}
        title="Edit Incident"
        incident={editIncident}
        onSubmit={async (payload) => {
          if (!editIncident) return
          try {
            await apiPut(`/api/safety/incidents/${editIncident.id}`, payload)
            toast.success('Incident updated')
            setEditIncident(null)
            refetchInc()
          } catch (e: any) {
            toast.error(e.message || 'Failed to update incident')
          }
        }}
      />
    </div>
  )
}

/* ----------------------------------------------------------------- */
/* Sub-components                                                     */
/* ----------------------------------------------------------------- */

function IncidentCard({ incident, onEdit }: { incident: any; onEdit: () => void }) {
  const style = INCIDENT_TYPE_STYLE[incident.type] || INCIDENT_TYPE_STYLE.Incident
  const Icon = style.Icon
  const label = SAFETY_INCIDENT_LABELS[incident.type] || incident.type
  return (
    <Card className={cn('overflow-hidden hover:shadow-md transition-shadow border-border/60 flex flex-col border-l-4', style.border)}>
      <CardContent className="p-5 flex-1 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', style.iconBg, style.iconFg)}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900">{label}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {formatDate(incident.date)}
              </div>
            </div>
          </div>
          <StatusBadge status={incident.severity} />
        </div>

        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3 shrink-0" /> {incident.project?.name || 'No project'} {incident.location ? `· ${incident.location}` : ''}
        </div>

        <p className="text-sm text-slate-700 line-clamp-3">{incident.description || '—'}</p>

        {incident.actionTaken && (
          <div className="rounded-md bg-emerald-50 border border-emerald-100 px-3 py-2">
            <div className="text-[11px] uppercase tracking-wide font-semibold text-emerald-700">Action Taken</div>
            <p className="text-xs text-emerald-800 mt-0.5 line-clamp-2">{incident.actionTaken}</p>
          </div>
        )}

        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <UserIcon className="h-3 w-3" /> Reported by {incident.reportedByName || 'Unknown'}
        </div>

        <div className="flex items-center justify-between pt-2 mt-auto border-t border-slate-100">
          <StatusBadge status={incident.status} />
          <Button size="sm" variant="outline" onClick={onEdit} className="h-8 text-xs">
            <FileText className="h-3 w-3 mr-1" /> Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function NewChecklistDialog({
  open, onOpenChange, projects, onSubmit,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  projects: any[]
  onSubmit: (payload: any) => Promise<void>
}) {
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(today)
  const [projectId, setProjectId] = useState<string>('')
  const [checklistType, setChecklistType] = useState<string>('PPE')
  const [location, setLocation] = useState('')
  const [remarks, setRemarks] = useState('')
  const [checks, setChecks] = useState<Record<string, boolean>>({
    helmet: false, safetyShoes: false, gloves: false, harness: false,
    workAreaClean: false, equipmentCondition: false, electricalSafety: false,
  })
  const [saving, setSaving] = useState(false)

  const passedChecks = Object.values(checks).filter(Boolean).length
  const compliancePct = Math.round((passedChecks / 7) * 100)

  const reset = () => {
    setDate(today)
    setProjectId('')
    setChecklistType('PPE')
    setLocation('')
    setRemarks('')
    setChecks({
      helmet: false, safetyShoes: false, gloves: false, harness: false,
      workAreaClean: false, equipmentCondition: false, electricalSafety: false,
    })
  }

  const handleSubmit = async () => {
    if (!projectId) {
      toast.error('Please select a project')
      return
    }
    setSaving(true)
    try {
      await onSubmit({
        date, projectId, checklistType,
        ...checks,
        location, remarks,
      })
      reset()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto ayk-scrollbar">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-red-600" /> New Safety Checklist
          </DialogTitle>
          <DialogDescription>Conduct a PPE / Toolbox / Inspection checklist and record compliance.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Project</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select project" /></SelectTrigger>
              <SelectContent>
                {projects.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Checklist Type</Label>
            <Select value={checklistType} onValueChange={setChecklistType}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CHECKLIST_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Location</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Site / area" />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">PPE / Safety Checks</Label>
            <Badge className={cn(
              'font-medium border',
              compliancePct >= 85 ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                : compliancePct >= 50 ? 'bg-amber-100 text-amber-700 border-amber-200'
                : 'bg-red-100 text-red-700 border-red-200'
            )}>
              {compliancePct}% ({passedChecks}/7)
            </Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {PPE_ITEMS.map(item => {
              const ItemIcon = item.icon
              return (
                <div key={item.key} className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2.5 hover:bg-slate-50 transition">
                  <Checkbox
                    id={`chk-${item.key}`}
                    checked={checks[item.key]}
                    onCheckedChange={(v) => setChecks(prev => ({ ...prev, [item.key]: !!v }))}
                    className="h-5 w-5"
                  />
                  <Label htmlFor={`chk-${item.key}`} className="text-sm cursor-pointer flex-1 flex items-center gap-2">
                    <ItemIcon className="h-4 w-4 text-slate-500 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Label>
                </div>
              )
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Remarks</Label>
          <Textarea rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Additional observations…" />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {saving ? 'Submitting…' : 'Submit Checklist'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function IncidentDialog({
  open, onOpenChange, projects, title, incident, onSubmit,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  projects: any[]
  title: string
  incident?: any | null
  onSubmit: (payload: any) => Promise<void>
}) {
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(today)
  const [projectId, setProjectId] = useState<string>('')
  const [type, setType] = useState<string>('Incident')
  const [severity, setSeverity] = useState<string>('Medium')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [status, setStatus] = useState<string>('Open')
  const [actionTaken, setActionTaken] = useState('')
  const [saving, setSaving] = useState(false)

  // Sync fields when editing existing incident
  useEffect(() => {
    if (incident) {
      setDate(incident.date ? new Date(incident.date).toISOString().slice(0, 10) : today)
      setProjectId(incident.projectId || '')
      setType(incident.type || 'Incident')
      setSeverity(incident.severity || 'Medium')
      setDescription(incident.description || '')
      setLocation(incident.location || '')
      setStatus(incident.status || 'Open')
      setActionTaken(incident.actionTaken || '')
    }
  }, [incident])

  const handleSubmit = async () => {
    if (!description) {
      toast.error('Description is required')
      return
    }
    setSaving(true)
    try {
      await onSubmit({
        date, projectId, type, severity, description, location, status, actionTaken,
      })
      // reset
      setDescription('')
      setLocation('')
      setActionTaken('')
      setProjectId('')
      setType('Incident')
      setSeverity('Medium')
      setStatus('Open')
      setDate(today)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto ayk-scrollbar">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" /> {title}
          </DialogTitle>
          <DialogDescription>Record a safety incident, near-miss or unsafe condition.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Project</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select project (optional)" /></SelectTrigger>
              <SelectContent>
                {projects.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {INCIDENT_TYPES_LIST.map(t => <SelectItem key={t} value={t}>{SAFETY_INCIDENT_LABELS[t]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Severity</Label>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {INCIDENT_SEVERITIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">Description</Label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What happened?" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Location</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Site / area" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {INCIDENT_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">Action Taken</Label>
            <Textarea rows={2} value={actionTaken} onChange={(e) => setActionTaken(e.target.value)} placeholder="Corrective / preventive action" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {saving ? 'Saving…' : title === 'Edit Incident' ? 'Update Incident' : 'Report Incident'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
