'use client'
import { useState, useMemo, useEffect } from 'react'
import { useAppStore } from '@/store/app-store'
import { useFetch } from '@/hooks/use-fetch'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { StatusBadge } from '@/components/shared/status-badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { TrendingUp, Target, Calendar, Plus, AlertTriangle, Gauge, Activity, BarChart3, LineChart } from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  BarChart, Bar, Legend,
} from 'recharts'
import { formatNumber, formatDate, daysBetween } from '@/lib/constants'

type Granularity = 'daily' | 'weekly' | 'monthly'

export function ProgressPage() {
  const { setNav, selectedProjectId, setSelectedProjectId } = useAppStore()
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [granularity, setGranularity] = useState<Granularity>('daily')

  // Fetch all projects (gives plannedProgress, overallProgress, startDate, endDate, totalPanels)
  const { data: projectsData, loading: projectsLoading } = useFetch<{ projects: any[] }>('/api/projects')
  const projects = projectsData?.projects || []

  // Build progress query URL — depends on selectedProjectId + date filters
  const progressUrl = useMemo(() => {
    const params = new URLSearchParams()
    params.set('limit', '400')
    if (selectedProjectId !== 'all') params.set('projectId', selectedProjectId)
    if (filterFrom) params.set('from', filterFrom)
    if (filterTo) params.set('to', filterTo)
    return `/api/progress?${params.toString()}`
  }, [selectedProjectId, filterFrom, filterTo])

  const { data: progressData, loading: progressLoading } = useFetch<{ entries: any[] }>(progressUrl)
  const entries = progressData?.entries || []

  // Filter projects to selected scope
  const scopedProjects = useMemo(
    () => (selectedProjectId === 'all' ? projects : projects.filter(p => p.id === selectedProjectId)),
    [projects, selectedProjectId],
  )

  // Compute stat cards
  const stats = useMemo(() => {
    if (!scopedProjects.length) return { planned: 0, actual: 0, variance: 0, delay: 0 }
    const planned = scopedProjects.reduce((s, p) => s + (p.plannedProgress || 0), 0) / scopedProjects.length
    const actual = scopedProjects.reduce((s, p) => s + (p.overallProgress || 0), 0) / scopedProjects.length
    const variance = actual - planned
    // Delay estimate: how many days behind the linear plan, on average
    let delaySum = 0
    const today = new Date()
    scopedProjects.forEach(p => {
      const start = new Date(p.startDate)
      const end = new Date(p.endDate)
      const total = Math.max(1, daysBetween(start, end))
      const elapsed = daysBetween(start, today)
      const expectedPct = Math.min(100, Math.max(0, (elapsed / total) * 100))
      if (expectedPct > (p.overallProgress || 0)) {
        delaySum += ((expectedPct - (p.overallProgress || 0)) / 100) * total
      }
    })
    const delay = Math.round(delaySum / scopedProjects.length)
    return {
      planned: Math.round(planned * 10) / 10,
      actual: Math.round(actual * 10) / 10,
      variance: Math.round(variance * 10) / 10,
      delay,
    }
  }, [scopedProjects])

  // Bar chart data: planned vs actual by project
  const barData = useMemo(() => {
    return scopedProjects.map(p => ({
      name: p.name.length > 14 ? p.name.slice(0, 13) + '…' : p.name,
      fullName: p.name,
      planned: p.plannedProgress || 0,
      actual: p.overallProgress || 0,
    }))
  }, [scopedProjects])

  // S-curve data: cumulative planned vs actual over time
  const sCurveData = useMemo(
    () => buildSCurve(scopedProjects, entries, filterFrom, filterTo),
    [scopedProjects, entries, filterFrom, filterTo],
  )

  // Table data: aggregated by granularity
  const tableData = useMemo(() => aggregateEntries(entries, granularity), [entries, granularity])

  if (projectsLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Progress Tracking" description="Planned vs Actual progress across projects" icon={<TrendingUp className="h-5 w-5" />} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse"><CardContent className="p-4 h-28" /></Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="animate-pulse"><CardContent className="p-4 h-72" /></Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Progress Tracking"
        description="Planned vs Actual progress across projects"
        icon={<TrendingUp className="h-5 w-5" />}
        actions={
          <Button onClick={() => setNav('daily-entry')} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="h-4 w-4 mr-1" /> New Entry
          </Button>
        }
      />

      {/* Filter bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-end gap-3">
            <div className="flex-1 min-w-[180px]">
              <Label className="text-xs text-muted-foreground">Project</Label>
              <Select value={selectedProjectId} onValueChange={(v) => setSelectedProjectId(v as any)}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[140px]">
              <Label className="text-xs text-muted-foreground">From</Label>
              <Input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} className="mt-1" />
            </div>
            <div className="min-w-[140px]">
              <Label className="text-xs text-muted-foreground">To</Label>
              <Input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Granularity</Label>
              <ToggleGroup
                type="single"
                value={granularity}
                onValueChange={(v) => v && setGranularity(v as Granularity)}
                variant="outline"
                className="mt-1 w-full"
              >
                <ToggleGroupItem value="daily" className="text-xs px-3">Daily</ToggleGroupItem>
                <ToggleGroupItem value="weekly" className="text-xs px-3">Weekly</ToggleGroupItem>
                <ToggleGroupItem value="monthly" className="text-xs px-3">Monthly</ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Overall Planned"
          value={`${stats.planned}%`}
          subtitle="Avg across projects"
          icon={<Target className="h-5 w-5" />}
          accent="blue"
        />
        <StatCard
          title="Overall Actual"
          value={`${stats.actual}%`}
          subtitle="Avg across projects"
          icon={<Gauge className="h-5 w-5" />}
          accent="green"
        />
        <StatCard
          title="Variance"
          value={`${stats.variance > 0 ? '+' : ''}${stats.variance}%`}
          subtitle={stats.variance >= 0 ? 'Ahead of schedule' : 'Behind schedule'}
          icon={stats.variance >= 0 ? <TrendingUp className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
          accent={stats.variance >= 0 ? 'green' : 'red'}
        />
        <StatCard
          title="Schedule Delay"
          value={stats.delay > 0 ? `${stats.delay} d` : 'On track'}
          subtitle={stats.delay > 0 ? 'Days behind plan' : 'No delay detected'}
          icon={<Calendar className="h-5 w-5" />}
          accent={stats.delay > 0 ? 'red' : 'green'}
        />
      </div>

      {/* Charts: Planned vs Actual bar + S-Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-600" /> Planned vs Actual
            </CardTitle>
            <CardDescription className="text-xs">Progress % by project</CardDescription>
          </CardHeader>
          <CardContent>
            {barData.length === 0 ? (
              <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">No projects available</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <RTooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                    formatter={(v: any) => `${v}%`}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="planned" fill="#0ea5e9" name="Planned" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actual" fill="#10b981" name="Actual" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <LineChart className="h-4 w-4 text-emerald-600" /> S-Curve — Cumulative Panels
            </CardTitle>
            <CardDescription className="text-xs">Planned vs actual installation over time</CardDescription>
          </CardHeader>
          <CardContent>
            {sCurveData.length === 0 ? (
              <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={sCurveData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gPlanned" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => {
                      const dt = new Date(d)
                      return `${dt.getDate()}/${dt.getMonth() + 1}`
                    }}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => formatNumber(v)} />
                  <RTooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                    labelFormatter={(l) => formatDate(l as string)}
                    formatter={(v: any, name: any) => [formatNumber(Number(v)), name]}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="planned" stroke="#0ea5e9" strokeWidth={2} fill="url(#gPlanned)" name="Planned Cumulative" />
                  <Area type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2} fill="url(#gActual)" name="Actual Cumulative" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Progress table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-600" />
            {granularity === 'daily' ? 'Daily Progress Entries' : granularity === 'weekly' ? 'Weekly Aggregated Progress' : 'Monthly Aggregated Progress'}
          </CardTitle>
          <CardDescription className="text-xs">{tableData.length} {granularity === 'daily' ? 'entries' : 'groups'} shown</CardDescription>
        </CardHeader>
        <CardContent>
          {progressLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
              ))}
            </div>
          ) : tableData.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">No progress entries found</div>
          ) : (
            <ScrollArea className="max-h-[500px] ayk-scrollbar">
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Project</TableHead>
                    <TableHead className="text-xs text-right">Installed</TableHead>
                    <TableHead className="text-xs text-right">Total</TableHead>
                    <TableHead className="text-xs text-right">Man-hrs</TableHead>
                    <TableHead className="text-xs text-right">Workers</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Submitted By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableData.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs font-medium whitespace-nowrap">{formatDate(row.date)}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap max-w-[160px] truncate" title={row.projectName}>{row.projectName}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums">{formatNumber(row.installedPanels)}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums">{formatNumber(row.totalInstalled)}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums">{row.manHours.toFixed(1)}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums">{row.workers}</TableCell>
                      <TableCell><StatusBadge status={row.siteStatus} /></TableCell>
                      <TableCell className="text-xs">{row.submittedBy || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/* ---------- helpers ---------- */

function buildSCurve(projects: any[], entries: any[], from?: string, to?: string) {
  if (!projects.length) return []

  // Determine overall date window
  const minStart = new Date(Math.min(...projects.map(p => new Date(p.startDate).getTime())))
  const maxEnd = new Date(Math.max(...projects.map(p => new Date(p.endDate).getTime())))
  const today = new Date()
  let end = today < maxEnd ? today : maxEnd
  if (to) {
    const t = new Date(to)
    if (!isNaN(t.getTime()) && t < end) end = t
  }
  let start = minStart
  if (from) {
    const f = new Date(from)
    if (!isNaN(f.getTime()) && f > start) start = f
  }
  if (end < start) return []

  // Pre-sort each project's entries by date asc to allow fast cumulative lookup
  const projectData = projects.map(p => {
    const pEntries = entries
      .filter(e => e.projectId === p.id)
      .map(e => ({ date: new Date(e.date), total: Number(e.totalInstalled) || 0 }))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
    return { project: p, entries: pEntries }
  })

  const dayMs = 86400000
  const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / dayMs))
  // Cap to ~150 points to keep charts fast
  const step = totalDays > 150 ? Math.ceil(totalDays / 150) : 1

  const data: { date: string; planned: number; actual: number }[] = []
  for (let i = 0; i <= totalDays; i += step) {
    const d = new Date(start.getTime() + i * dayMs)
    let plannedSum = 0
    let actualSum = 0
    for (const { project, entries: pEntries } of projectData) {
      const pStart = new Date(project.startDate)
      const pEnd = new Date(project.endDate)
      if (d < pStart) continue
      const pTotalDays = Math.max(1, (pEnd.getTime() - pStart.getTime()) / dayMs)
      const elapsed = (d.getTime() - pStart.getTime()) / dayMs
      // Linear planned = elapsed/total * totalPanels, clamped to totalPanels
      const planned = Math.min(project.totalPanels || 0, (elapsed / pTotalDays) * (project.totalPanels || 0))
      plannedSum += planned
      // Find latest entry with date <= d
      let latest = 0
      for (const e of pEntries) {
        if (e.date <= d) latest = e.total
        else break
      }
      actualSum += latest
    }
    data.push({
      date: d.toISOString().split('T')[0],
      planned: Math.round(plannedSum),
      actual: actualSum,
    })
  }
  return data
}

function aggregateEntries(entries: any[], granularity: Granularity) {
  if (granularity === 'daily') {
    return entries.map(e => ({
      date: e.date,
      projectName: e.project?.name || '—',
      installedPanels: e.installedPanels || 0,
      totalInstalled: e.totalInstalled || 0,
      manHours: Number(e.manHours) || 0,
      workers: e.workers || 0,
      siteStatus: e.siteStatus || 'Normal',
      submittedBy: e.submittedBy?.name || null,
    }))
  }

  // Group by (period + projectId) so each row represents one project's aggregated activity
  const groups = new Map<string, any>()
  for (const e of entries) {
    const date = new Date(e.date)
    let key: string
    let periodDate: Date

    if (granularity === 'weekly') {
      // ISO week starts Monday
      const day = (date.getDay() + 6) % 7
      const monday = new Date(date)
      monday.setDate(date.getDate() - day)
      monday.setHours(0, 0, 0, 0)
      key = `${monday.toISOString().split('T')[0]}-${e.projectId}`
      periodDate = monday
    } else {
      // Monthly — first day of month
      const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
      key = `${firstOfMonth.toISOString().split('T')[0]}-${e.projectId}`
      periodDate = firstOfMonth
    }

    const existing = groups.get(key) || {
      date: periodDate.toISOString(),
      projectName: e.project?.name || '—',
      installedPanels: 0,
      totalInstalled: 0,
      manHours: 0,
      workers: 0,
      siteStatus: 'Normal',
      submittedBy: null,
      _latestDate: new Date(0),
    }
    existing.installedPanels += e.installedPanels || 0
    existing.totalInstalled = Math.max(existing.totalInstalled, e.totalInstalled || 0)
    existing.manHours += Number(e.manHours) || 0
    existing.workers += e.workers || 0
    if (new Date(e.date) > existing._latestDate) {
      existing._latestDate = new Date(e.date)
      existing.siteStatus = e.siteStatus || 'Normal'
      existing.submittedBy = e.submittedBy?.name || null
    }
    groups.set(key, existing)
  }

  const arr = Array.from(groups.values())
  arr.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  // Strip internal _latestDate before returning
  return arr.map(({ _latestDate, ...rest }) => rest)
}
