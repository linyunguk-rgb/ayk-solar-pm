'use client'
import { useState, useMemo, useCallback } from 'react'
import { useAppStore } from '@/store/app-store'
import { useFetch, apiPost, apiPut, apiDelete } from '@/hooks/use-fetch'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { StatusBadge } from '@/components/shared/status-badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Users, Plus, Filter, Pencil, Trash2, LogIn, LogOut, Clock, UserCheck, UserX, Briefcase,
  Search, X, BarChart3,
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
} from 'recharts'
import { formatDate, formatDateTime, formatNumber } from '@/lib/constants'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface WorkerItem {
  id: string
  name: string
  employeeId: string
  role: string
  team?: string | null
  projectId?: string | null
  project?: { id: string; name: string } | null
  phone?: string | null
  skillLevel: string
  status: string
  attendance?: AttendanceItem[]
}

interface AttendanceItem {
  id: string
  workerId: string
  worker?: { id: string; name: string; team?: string | null; project?: { name: string } | null }
  date: string
  checkIn?: string | null
  checkOut?: string | null
  workingHours: number
  overtime: number
  status: string
}

interface ProjectOption { id: string; name: string }

const ROLES_OPTIONS = ['Solar Installer', 'Electrician', 'Foreman', 'Technician', 'Helper', 'Crane Operator']
const SKILL_LEVELS = ['Junior', 'Intermediate', 'Senior']
const WORKER_STATUSES = ['Active', 'OnLeave', 'Inactive']
const WORKER_STATUS_LABELS: Record<string, string> = {
  Active: 'Active', OnLeave: 'On Leave', Inactive: 'Inactive',
}

const SKILL_BADGE: Record<string, string> = {
  Junior: 'bg-slate-100 text-slate-700 border-slate-200',
  Intermediate: 'bg-sky-100 text-sky-700 border-sky-200',
  Senior: 'bg-emerald-100 text-emerald-700 border-emerald-200',
}

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

const toISODate = (d: Date) => d.toISOString().slice(0, 10)

function emptyWorkerForm(): WorkerFormState {
  return {
    name: '', employeeId: '', role: 'Solar Installer', team: '',
    projectId: '', phone: '', skillLevel: 'Intermediate', status: 'Active',
  }
}

interface WorkerFormState {
  name: string
  employeeId: string
  role: string
  team: string
  projectId: string
  phone: string
  skillLevel: string
  status: string
}

export function ManpowerPage() {
  const { user } = useAppStore()
  const canManage = user?.role === 'Admin' || user?.role === 'ProjectManager'

  // Filters
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [teamFilter, setTeamFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const [tab, setTab] = useState<string>('workers')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<WorkerItem | null>(null)
  const [form, setForm] = useState<WorkerFormState>(emptyWorkerForm())
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // 7-day window for attendance stats and productivity chart
  const attendanceWindow = useMemo(() => {
    const to = new Date(); to.setHours(23, 59, 59, 999)
    const from = new Date(); from.setDate(from.getDate() - 6); from.setHours(0, 0, 0, 0)
    return { from: from.toISOString(), to: to.toISOString() }
  }, [])

  const workersUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (projectFilter !== 'all') params.set('projectId', projectFilter)
    if (teamFilter !== 'all') params.set('team', teamFilter)
    if (statusFilter !== 'all') params.set('status', statusFilter)
    const q = params.toString()
    return `/api/workers${q ? `?${q}` : ''}`
  }, [projectFilter, teamFilter, statusFilter])

  const { data, loading, refetch } = useFetch<{ workers: WorkerItem[] }>(workersUrl)
  const { data: projData } = useFetch<{ projects: ProjectOption[] }>('/api/projects')
  const { data: attData } = useFetch<{ records: AttendanceItem[] }>(
    `/api/attendance?from=${attendanceWindow.from}&to=${attendanceWindow.to}`
  )

  const workers = data?.workers ?? []
  const projects = projData?.projects ?? []
  const attendanceRecords = attData?.records ?? []

  // Teams derived from workers (unique, non-empty)
  const teams = useMemo(() => {
    const set = new Set<string>()
    for (const w of workers) if (w.team) set.add(w.team)
    return Array.from(set).sort()
  }, [workers])

  // Stats
  const stats = useMemo(() => {
    const today = new Date()
    let onSite = 0
    let absent = 0
    let totalManHours = 0

    for (const w of workers) {
      const todayAtt = (w.attendance || []).find((a) => isSameDay(new Date(a.date), today))
      if (todayAtt && todayAtt.status === 'Present') onSite++
      else if (w.status === 'Active') absent++
    }
    for (const r of attendanceRecords) totalManHours += Number(r.workingHours) || 0
    return {
      onSite,
      absent,
      total: workers.length,
      manHours: Math.round(totalManHours * 10) / 10,
    }
  }, [workers, attendanceRecords])

  // Productivity chart data: man-hours per team over last 7 days
  const productivity = useMemo(() => {
    const teamHours: Record<string, number> = {}
    for (const r of attendanceRecords) {
      const team = r.worker?.team || 'Unassigned'
      teamHours[team] = (teamHours[team] || 0) + (Number(r.workingHours) || 0)
    }
    const entries = Object.entries(teamHours).map(([team, hours]) => ({
      team: team.length > 12 ? team.slice(0, 11) + '…' : team,
      hours: Math.round(hours * 10) / 10,
    }))
    entries.sort((a, b) => b.hours - a.hours)
    return entries.slice(0, 10)
  }, [attendanceRecords])

  // Today's hours per worker (for table column)
  const todayHoursByWorker = useMemo(() => {
    const map: Record<string, number> = {}
    const now = new Date()
    for (const w of workers) {
      const todayAtt = (w.attendance || []).find((a) => isSameDay(new Date(a.date), now))
      if (!todayAtt) { map[w.id] = 0; continue }
      if (todayAtt.workingHours) {
        map[w.id] = Number(todayAtt.workingHours)
      } else if (todayAtt.checkIn) {
        const ms = now.getTime() - new Date(todayAtt.checkIn).getTime()
        map[w.id] = Math.max(0, Math.round((ms / (1000 * 60 * 60)) * 10) / 10)
      } else {
        map[w.id] = 0
      }
    }
    return map
  }, [workers])

  const isWorkerCheckedIn = useCallback((w: WorkerItem) => {
    const today = new Date()
    const att = (w.attendance || []).find((a) => isSameDay(new Date(a.date), today))
    return !!(att && att.status === 'Present' && att.checkIn && !att.checkOut)
  }, [])

  const isWorkerCheckedOut = useCallback((w: WorkerItem) => {
    const today = new Date()
    const att = (w.attendance || []).find((a) => isSameDay(new Date(a.date), today))
    return !!(att && att.checkIn && att.checkOut)
  }, [])

  const handleCheckAction = async (worker: WorkerItem, action: 'checkin' | 'checkout') => {
    setActionLoading(worker.id)
    try {
      await apiPost(`/api/workers/${worker.id}`, { action })
      toast.success(action === 'checkin' ? `${worker.name} checked in` : `${worker.name} checked out`)
      await refetch()
    } catch (e: any) {
      toast.error(e.message || 'Failed to update attendance')
    } finally {
      setActionLoading(null)
    }
  }

  const openNew = useCallback(() => {
    setEditing(null)
    setForm(emptyWorkerForm())
    setDialogOpen(true)
  }, [])

  const openEdit = useCallback((w: WorkerItem) => {
    setEditing(w)
    setForm({
      name: w.name || '',
      employeeId: w.employeeId || '',
      role: w.role || 'Solar Installer',
      team: w.team || '',
      projectId: w.projectId || '',
      phone: w.phone || '',
      skillLevel: w.skillLevel || 'Intermediate',
      status: w.status || 'Active',
    })
    setDialogOpen(true)
  }, [])

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.employeeId.trim()) {
      toast.error('Name and Employee ID are required')
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        name: form.name.trim(),
        employeeId: form.employeeId.trim(),
        role: form.role,
        team: form.team.trim() || undefined,
        projectId: form.projectId || undefined,
        phone: form.phone.trim() || undefined,
        skillLevel: form.skillLevel,
        status: form.status,
      }
      if (editing) {
        await apiPut(`/api/workers/${editing.id}`, payload)
        toast.success('Worker updated')
      } else {
        await apiPost('/api/workers', payload)
        toast.success('Worker added')
      }
      setDialogOpen(false)
      await refetch()
    } catch (e: any) {
      toast.error(e.message || 'Failed to save worker')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await apiDelete(`/api/workers/${deleteId}`)
      toast.success('Worker removed')
      setDeleteId(null)
      await refetch()
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete worker')
    }
  }

  const clearFilters = () => {
    setProjectFilter('all'); setTeamFilter('all'); setStatusFilter('all')
  }
  const hasFilters = projectFilter !== 'all' || teamFilter !== 'all' || statusFilter !== 'all'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manpower Management"
        description="Track workers, teams and attendance"
        icon={<Users className="h-5 w-5" />}
        actions={
          canManage ? (
            <Button onClick={openNew} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="h-4 w-4 mr-2" /> Add Worker
            </Button>
          ) : undefined
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="Workers On Site" value={stats.onSite} subtitle="Checked in today" icon={<UserCheck className="h-5 w-5" />} accent="green" />
        <StatCard title="Workers Absent" value={stats.absent} subtitle="Active, not present" icon={<UserX className="h-5 w-5" />} accent="red" />
        <StatCard title="Total Workers" value={stats.total} subtitle="In roster" icon={<Briefcase className="h-5 w-5" />} accent="blue" />
        <StatCard title="Total Man-hours" value={formatNumber(stats.manHours)} subtitle="Last 7 days" icon={<Clock className="h-5 w-5" />} accent="orange" />
      </div>

      {/* Productivity chart */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald-600" /> Team Productivity
              </CardTitle>
              <CardDescription className="text-xs">Man-hours per team — last 7 days</CardDescription>
            </div>
            <Badge variant="outline" className="border-slate-200 text-slate-600">{productivity.length} teams</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {productivity.length === 0 ? (
            <div className="text-center text-sm text-slate-500 py-10">No attendance data for the past 7 days</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={productivity} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="team" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <RTooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                  formatter={(v: any) => [`${v} h`, 'Man-hours']}
                />
                <Bar dataKey="hours" fill="#10b981" radius={[4, 4, 0, 0]} name="Man-hours" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="workers"><Users className="h-4 w-4 mr-1" /> Workers</TabsTrigger>
            <TabsTrigger value="attendance"><Clock className="h-4 w-4 mr-1" /> Attendance Log</TabsTrigger>
          </TabsList>

          {/* Filter bar (shared) */}
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger size="sm" className="w-[150px] bg-white"><SelectValue placeholder="All Projects" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={teamFilter} onValueChange={setTeamFilter}>
              <SelectTrigger size="sm" className="w-[140px] bg-white"><SelectValue placeholder="All Teams" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {teams.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger size="sm" className="w-[130px] bg-white"><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {WORKER_STATUSES.map((s) => <SelectItem key={s} value={s}>{WORKER_STATUS_LABELS[s]}</SelectItem>)}
              </SelectContent>
            </Select>

            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500">
                <X className="h-3.5 w-3.5 mr-1" /> Clear
              </Button>
            )}
          </div>
        </div>

        {/* Workers tab */}
        <TabsContent value="workers">
          {loading ? (
            <Card className="border-border/60 shadow-sm animate-pulse"><CardContent className="p-0 h-96" /></Card>
          ) : workers.length === 0 ? (
            <EmptyState message="No workers match your filters" />
          ) : (
            <Card className="border-border/60 shadow-sm">
              <CardContent className="p-0">
                <ScrollArea className="max-h-96">
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Emp ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead>Skill</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Today (h)</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {workers.map((w) => {
                        const checkedIn = isWorkerCheckedIn(w)
                        const checkedOut = isWorkerCheckedOut(w)
                        return (
                          <TableRow key={w.id}>
                            <TableCell className="text-xs font-mono text-slate-600">{w.employeeId}</TableCell>
                            <TableCell className="font-medium text-slate-900">{w.name}</TableCell>
                            <TableCell className="text-slate-700 text-xs">{w.role}</TableCell>
                            <TableCell className="text-slate-700 text-xs">{w.team || '—'}</TableCell>
                            <TableCell className="text-slate-600 text-xs truncate max-w-[140px]">{w.project?.name || '—'}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn('font-medium', SKILL_BADGE[w.skillLevel] || SKILL_BADGE.Intermediate)}>
                                {w.skillLevel}
                              </Badge>
                            </TableCell>
                            <TableCell><StatusBadge status={w.status} /></TableCell>
                            <TableCell className="text-xs text-slate-600">{w.phone || '—'}</TableCell>
                            <TableCell>
                              <span className={cn('text-xs font-medium tabular-nums', (todayHoursByWorker[w.id] || 0) > 0 ? 'text-emerald-700' : 'text-slate-400')}>
                                {formatNumber(todayHoursByWorker[w.id] || 0)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  size="sm" variant="outline"
                                  disabled={!canManage || checkedIn || actionLoading === w.id}
                                  onClick={() => handleCheckAction(w, 'checkin')}
                                  className="h-7 px-2 text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
                                  title={checkedIn ? 'Already checked in' : 'Check-in'}
                                >
                                  <LogIn className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="sm" variant="outline"
                                  disabled={!canManage || !checkedIn || checkedOut || actionLoading === w.id}
                                  onClick={() => handleCheckAction(w, 'checkout')}
                                  className="h-7 px-2 text-orange-700 border-orange-200 bg-orange-50 hover:bg-orange-100"
                                  title={!checkedIn ? 'Check-in first' : checkedOut ? 'Already checked out' : 'Check-out'}
                                >
                                  <LogOut className="h-3.5 w-3.5" />
                                </Button>
                                {canManage && (
                                  <>
                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-500 hover:text-emerald-600" onClick={() => openEdit(w)}>
                                      <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-500 hover:text-red-600" onClick={() => setDeleteId(w.id)}>
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Attendance log tab */}
        <TabsContent value="attendance">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Attendance Log</CardTitle>
              <CardDescription className="text-xs">Showing last 7 days of attendance records</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {attendanceRecords.length === 0 ? (
                <div className="text-center text-sm text-slate-500 py-10">No attendance records for the past 7 days</div>
              ) : (
                <ScrollArea className="max-h-96">
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Date</TableHead>
                        <TableHead>Worker</TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead>Check-in</TableHead>
                        <TableHead>Check-out</TableHead>
                        <TableHead>Working Hours</TableHead>
                        <TableHead>Overtime</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceRecords.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="text-xs text-slate-600">{formatDate(r.date)}</TableCell>
                          <TableCell className="font-medium text-slate-900 text-sm">{r.worker?.name || '—'}</TableCell>
                          <TableCell className="text-xs text-slate-600">{r.worker?.team || '—'}</TableCell>
                          <TableCell className="text-xs text-slate-600">{r.checkIn ? formatDateTime(r.checkIn) : '—'}</TableCell>
                          <TableCell className="text-xs text-slate-600">{r.checkOut ? formatDateTime(r.checkOut) : '—'}</TableCell>
                          <TableCell>
                            <span className="text-xs font-semibold text-slate-700 tabular-nums">{formatNumber(Number(r.workingHours) || 0)} h</span>
                          </TableCell>
                          <TableCell>
                            {Number(r.overtime) > 0 ? (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                                +{formatNumber(Number(r.overtime))} h
                              </Badge>
                            ) : <span className="text-xs text-slate-400">—</span>}
                          </TableCell>
                          <TableCell><StatusBadge status={r.status} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit worker dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto ayk-scrollbar">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Worker' : 'Add Worker'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Update the worker details below.' : 'Enter the details of the new team member.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="w-name">Name <span className="text-red-500">*</span></Label>
              <Input id="w-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Ahmad Rahman" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="w-emp">Employee ID <span className="text-red-500">*</span></Label>
              <Input id="w-emp" value={form.employeeId} onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))} placeholder="e.g. AYK-W001" />
            </div>

            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
                <SelectTrigger className="w-full bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES_OPTIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Team</Label>
              <Select value={form.team || 'none'} onValueChange={(v) => setForm((f) => ({ ...f, team: v === 'none' ? '' : v }))}>
                <SelectTrigger className="w-full bg-white"><SelectValue placeholder="Select team" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No team</SelectItem>
                  {teams.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Project</Label>
              <Select value={form.projectId || 'none'} onValueChange={(v) => setForm((f) => ({ ...f, projectId: v === 'none' ? '' : v }))}>
                <SelectTrigger className="w-full bg-white"><SelectValue placeholder="No project" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No project</SelectItem>
                  {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="w-phone">Phone</Label>
              <Input id="w-phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+65 9123 4567" />
            </div>

            <div className="space-y-1.5">
              <Label>Skill Level</Label>
              <Select value={form.skillLevel} onValueChange={(v) => setForm((f) => ({ ...f, skillLevel: v }))}>
                <SelectTrigger className="w-full bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SKILL_LEVELS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger className="w-full bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {WORKER_STATUSES.map((s) => <SelectItem key={s} value={s}>{WORKER_STATUS_LABELS[s]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button disabled={submitting} onClick={handleSubmit} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {submitting ? 'Saving…' : editing ? 'Update Worker' : 'Add Worker'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this worker?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the worker from the roster. Attendance history will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="border-dashed border-slate-300 bg-slate-50/50">
      <CardContent className="py-16 flex flex-col items-center justify-center text-center">
        <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
          <Search className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-800">No results</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">{message}</p>
      </CardContent>
    </Card>
  )
}
