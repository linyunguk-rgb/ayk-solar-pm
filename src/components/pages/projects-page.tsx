'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { useFetch, apiPost, apiPut, apiDelete } from '@/hooks/use-fetch'
import { SectionHeader, SubSection } from '@/components/shared/section-header'
import { StatCard } from '@/components/shared/stat-card'
import { StatusBadge, PriorityBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, Legend,
} from 'recharts'
import {
  FolderKanban, MapPin, Calendar, Plus, Pencil, Trash2, ArrowLeft,
  Search, Filter, DollarSign, TrendingUp, FileText, Package, Sun,
  CheckCircle2, Clock, AlertTriangle, ChevronRight, BarChart3, LineChart,
} from 'lucide-react'
import {
  PROJECT_STATUSES, PROJECT_STATUS_LABELS,
  formatCurrency, formatNumber, formatDate,
} from '@/lib/constants'
import { toast } from 'sonner'

// ============================================================
// Root component — switches between list and detail mode
// ============================================================
export function ProjectsPage() {
  const { detailProjectId } = useAppStore()
  if (detailProjectId) return <ProjectDetail />
  return <ProjectsList />
}

// Status → colored top strip on project cards (matches dashboard pattern)
function statusStripClass(status: string): string {
  switch (status) {
    case 'Active': return 'bg-emerald-500'
    case 'Completed': return 'bg-sky-500'
    case 'Delayed': return 'bg-red-500'
    case 'OnHold': return 'bg-amber-500'
    default: return 'bg-slate-300'
  }
}

// ============================================================
// LIST MODE
// ============================================================
const EMPTY_FORM = {
  name: '', location: '', client: '', capacity: '', totalPanels: '',
  budget: '', status: 'Active', startDate: '', endDate: '',
  description: '', managerId: '',
}

function ProjectsList() {
  const { user, openProject } = useAppStore()
  const canEdit = user?.role === 'Admin' || user?.role === 'ProjectManager'
  const canDelete = user?.role === 'Admin'

  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'cards' | 'table'>('cards')

  const listUrl = statusFilter === 'all' ? '/api/projects' : `/api/projects?status=${statusFilter}`
  const { data, loading, refetch } = useFetch<any>(listUrl)

  const { data: usersData } = useFetch<any>('/api/users')
  const users = (usersData?.users || []).filter(
    (u: any) => u.role === 'ProjectManager' || u.role === 'Admin' || u.role === 'Engineer'
  )

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<any>({ ...EMPTY_FORM })
  const [submitting, setSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const projects = (data?.projects || []).filter((p: any) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      p.name?.toLowerCase().includes(q) ||
      p.location?.toLowerCase().includes(q) ||
      p.code?.toLowerCase().includes(q)
    )
  })

  function openCreate() {
    setEditId(null)
    setForm({ ...EMPTY_FORM })
    setDialogOpen(true)
  }

  function openEdit(p: any) {
    setEditId(p.id)
    setForm({
      name: p.name || '',
      location: p.location || '',
      client: p.client || '',
      capacity: p.capacity || '',
      totalPanels: String(p.totalPanels ?? ''),
      budget: String(p.budget ?? ''),
      status: p.status || 'Active',
      startDate: p.startDate ? toInputDate(p.startDate) : '',
      endDate: p.endDate ? toInputDate(p.endDate) : '',
      description: p.description || '',
      managerId: p.managerId || '',
    })
    setDialogOpen(true)
  }

  async function onSubmit() {
    if (!form.name || !form.location || !form.startDate || !form.endDate) {
      toast.error('Please fill in name, location, start date and end date.')
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        ...form,
        totalPanels: Number(form.totalPanels) || 0,
        budget: Number(form.budget) || 0,
      }
      if (editId) {
        await apiPut(`/api/projects/${editId}`, payload)
        toast.success('Project updated')
      } else {
        await apiPost('/api/projects', payload)
        toast.success('Project created')
      }
      setDialogOpen(false)
      refetch()
    } catch (e: any) {
      toast.error(e.message || 'Failed to save project')
    } finally {
      setSubmitting(false)
    }
  }

  async function onDelete() {
    if (!deleteId) return
    try {
      await apiDelete(`/api/projects/${deleteId}`)
      toast.success('Project deleted')
      setDeleteId(null)
      refetch()
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete project')
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        section="projects"
        title="Projects"
        description="Manage solar installation projects end to end"
        icon={<FolderKanban className="h-6 w-6" />}
        actions={
          canEdit ? (
            <Button onClick={openCreate} className="bg-sky-600 hover:bg-sky-700 text-white">
              <Plus className="h-4 w-4" /> New Project
            </Button>
          ) : null
        }
      />

      {/* Filter bar */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, location, code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {PROJECT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{PROJECT_STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex rounded-md border border-border/60 overflow-hidden self-start sm:self-center">
              <Button
                size="sm"
                variant={view === 'cards' ? 'default' : 'ghost'}
                className={`rounded-none ${view === 'cards' ? 'bg-sky-600 text-white hover:bg-sky-700' : ''}`}
                onClick={() => setView('cards')}
              >
                Cards
              </Button>
              <Button
                size="sm"
                variant={view === 'table' ? 'default' : 'ghost'}
                className={`rounded-none ${view === 'table' ? 'bg-sky-600 text-white hover:bg-sky-700' : ''}`}
                onClick={() => setView('table')}
              >
                Table
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-5 h-48" />
            </Card>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-0">
            <EmptyState
              icon={<FolderKanban className="h-5 w-5" />}
              title="No projects found"
              description="Try adjusting your filters or create a new project."
              action={canEdit ? (
                <Button onClick={openCreate} className="bg-sky-600 hover:bg-sky-700 text-white">
                  <Plus className="h-4 w-4" /> New Project
                </Button>
              ) : undefined}
            />
          </CardContent>
        </Card>
      ) : view === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((p: any) => (
            <ProjectCard key={p.id} project={p} onOpen={() => openProject(p.id)} />
          ))}
        </div>
      ) : (
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-0">
            <ScrollArea className="max-h-[600px] ayk-scrollbar">
              <Table className="min-w-[1000px]">
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Panels</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((p: any) => (
                    <TableRow
                      key={p.id}
                      className="cursor-pointer hover:bg-slate-50"
                      onClick={() => openProject(p.id)}
                    >
                      <TableCell className="font-mono text-xs">{p.code}</TableCell>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-muted-foreground">{p.location}</TableCell>
                      <TableCell><StatusBadge status={p.status} /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <Progress value={p.overallProgress || 0} className="h-1.5" />
                          <span className="text-xs font-medium">{p.overallProgress || 0}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {formatNumber(p.installedPanels)} / {formatNumber(p.totalPanels)}
                      </TableCell>
                      <TableCell className="text-xs">{formatCurrency(p.budget)}</TableCell>
                      <TableCell className="text-xs">{p.manager?.name || '—'}</TableCell>
                      <TableCell className="text-xs">{formatDate(p.endDate)}</TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openProject(p.id)} title="View">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                          {canEdit && (
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(p)} title="Edit">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setDeleteId(p.id)}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto ayk-scrollbar">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Project' : 'New Project'}</DialogTitle>
            <DialogDescription>
              {editId ? 'Update the project details below.' : 'Create a new solar construction project.'}
            </DialogDescription>
          </DialogHeader>
          <ProjectFormFields form={form} setForm={setForm} users={users} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={onSubmit}
              disabled={submitting}
              className="bg-sky-600 hover:bg-sky-700 text-white"
            >
              {submitting ? 'Saving...' : editId ? 'Save Changes' : 'Create Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the project and all related stages, progress, tasks,
              expenses and documents. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={onDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function ProjectCard({ project, onOpen }: { project: any; onOpen: () => void }) {
  const installPct =
    project.totalPanels > 0
      ? Math.round((project.installedPanels / project.totalPanels) * 1000) / 10
      : 0
  const budgetPct =
    project.budget > 0 ? Math.min(100, ((project.actualCost || 0) / project.budget) * 100) : 0

  return (
    <Card
      className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer group border-border/60"
      onClick={onOpen}
    >
      <div className={`h-1.5 w-full ${statusStripClass(project.status)}`} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <div className="font-mono text-[10px] text-muted-foreground mb-0.5">{project.code}</div>
            <h3 className="font-semibold text-slate-900 truncate group-hover:text-sky-600 transition">
              {project.name}
            </h3>
            <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
              <MapPin className="h-3 w-3 shrink-0" /> <span className="truncate">{project.location}</span>
            </div>
          </div>
          <StatusBadge status={project.status} />
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-600">Overall Progress</span>
              <span className="font-semibold text-slate-900">{project.overallProgress || 0}%</span>
            </div>
            <Progress value={project.overallProgress || 0} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wide">Panels</div>
              <div className="text-sm font-semibold text-slate-900">
                {formatNumber(project.installedPanels)} / {formatNumber(project.totalPanels)}
              </div>
              <Progress value={installPct} className="h-1.5 mt-1" />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wide">Budget</div>
              <div className="text-sm font-semibold text-slate-900">
                {formatCurrency(project.actualCost)} / {formatCurrency(project.budget)}
              </div>
              <Progress value={budgetPct} className="h-1.5 mt-1" />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3 shrink-0" /> {formatDate(project.startDate)}</span>
            <span>→</span>
            <span className="flex items-center gap-1">{formatDate(project.endDate)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================
// Shared form fields (used by Create + Edit dialogs)
// ============================================================
function ProjectFormFields({
  form, setForm, users,
}: {
  form: any
  setForm: (f: any) => void
  users: any[]
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field className="sm:col-span-2" label="Project Name *">
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Tuas Solar Farm Phase 2"
        />
      </Field>
      <Field label="Location *">
        <Input
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          placeholder="e.g. Tuas, Singapore"
        />
      </Field>
      <Field label="Client">
        <Input
          value={form.client}
          onChange={(e) => setForm({ ...form, client: e.target.value })}
          placeholder="e.g. SPS Group"
        />
      </Field>
      <Field label="Capacity">
        <Input
          value={form.capacity}
          onChange={(e) => setForm({ ...form, capacity: e.target.value })}
          placeholder="e.g. 3.5 MWp"
        />
      </Field>
      <Field label="Total Panels">
        <Input
          type="number"
          value={form.totalPanels}
          onChange={(e) => setForm({ ...form, totalPanels: e.target.value })}
          placeholder="e.g. 6500"
        />
      </Field>
      <Field label="Budget (S$)">
        <Input
          type="number"
          value={form.budget}
          onChange={(e) => setForm({ ...form, budget: e.target.value })}
          placeholder="e.g. 1200000"
        />
      </Field>
      <Field label="Status">
        <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {PROJECT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{PROJECT_STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Project Manager">
        <Select
          value={form.managerId || 'unassigned'}
          onValueChange={(v) => setForm({ ...form, managerId: v === 'unassigned' ? '' : v })}
        >
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned">— Unassigned —</SelectItem>
            {users.map((u: any) => (
              <SelectItem key={u.id} value={u.id}>{u.name} · {u.role}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Start Date *">
        <Input
          type="date"
          value={form.startDate}
          onChange={(e) => setForm({ ...form, startDate: e.target.value })}
        />
      </Field>
      <Field label="End Date *">
        <Input
          type="date"
          value={form.endDate}
          onChange={(e) => setForm({ ...form, endDate: e.target.value })}
        />
      </Field>
      <Field label="Description" className="sm:col-span-2">
        <Textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
          placeholder="Project description, scope, key notes..."
        />
      </Field>
    </div>
  )
}

function Field({
  label, children, className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <Label className="text-xs font-medium mb-1.5 block">{label}</Label>
      {children}
    </div>
  )
}

// ============================================================
// DETAIL MODE
// ============================================================
function ProjectDetail() {
  const { detailProjectId, closeProject, user, setNav } = useAppStore()
  const canEdit = user?.role === 'Admin' || user?.role === 'ProjectManager'

  const { data, loading, refetch } = useFetch<any>(`/api/projects/${detailProjectId}`)
  const project = data?.project

  const { data: usersData } = useFetch<any>('/api/users')
  const users = (usersData?.users || []).filter(
    (u: any) => u.role === 'ProjectManager' || u.role === 'Admin' || u.role === 'Engineer'
  )

  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState<any>(null)
  const [savingEdit, setSavingEdit] = useState(false)

  function openEdit() {
    if (!project) return
    setEditForm({
      name: project.name || '',
      location: project.location || '',
      client: project.client || '',
      capacity: project.capacity || '',
      totalPanels: String(project.totalPanels ?? ''),
      budget: String(project.budget ?? ''),
      status: project.status || 'Active',
      startDate: project.startDate ? toInputDate(project.startDate) : '',
      endDate: project.endDate ? toInputDate(project.endDate) : '',
      description: project.description || '',
      managerId: project.managerId || '',
    })
    setEditOpen(true)
  }

  async function onSaveEdit() {
    if (!detailProjectId || !editForm) return
    setSavingEdit(true)
    try {
      await apiPut(`/api/projects/${detailProjectId}`, {
        ...editForm,
        totalPanels: Number(editForm.totalPanels) || 0,
        budget: Number(editForm.budget) || 0,
      })
      toast.success('Project updated')
      setEditOpen(false)
      refetch()
    } catch (e: any) {
      toast.error(e.message || 'Failed to update project')
    } finally {
      setSavingEdit(false)
    }
  }

  if (loading || !project) {
    return (
      <div className="space-y-6">
        <SectionHeader
          section="projects"
          title="Project"
          description="Loading project details..."
          icon={<FolderKanban className="h-6 w-6" />}
          actions={
            <Button variant="outline" onClick={closeProject}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          }
        />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <Card key={i} className="animate-pulse"><CardContent className="p-4 h-28" /></Card>
          ))}
        </div>
        <Card className="animate-pulse"><CardContent className="p-5 h-72" /></Card>
      </div>
    )
  }

  const variance = ((project.overallProgress || 0) - (project.plannedProgress || 0))
  const remaining = ((project.budget || 0) - (project.actualCost || 0))

  return (
    <div className="space-y-6">
      <SectionHeader
        section="projects"
        title={project.name}
        description={`${project.code} · ${project.location}${project.client ? ' · ' + project.client : ''}`}
        icon={<FolderKanban className="h-6 w-6" />}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={project.status} />
            <Button variant="outline" onClick={closeProject}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            {canEdit && (
              <Button onClick={openEdit} className="bg-sky-600 hover:bg-sky-700 text-white">
                <Pencil className="h-4 w-4" /> Edit
              </Button>
            )}
          </div>
        }
      />

      {/* Description */}
      {project.description && (
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4 text-sm text-muted-foreground whitespace-pre-line">
            {project.description}
          </CardContent>
        </Card>
      )}

      {/* Overview KPIs */}
      <div>
        <SubSection
          section="projects"
          title="Overview"
          description="Key project metrics at a glance"
          icon={<BarChart3 className="h-4 w-4" />}
        />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard title="Total Panels" value={formatNumber(project.totalPanels ?? 0)} subtitle={project.capacity || ''} icon={<Sun className="h-5 w-5" />} section="projects" />
          <StatCard title="Installed" value={formatNumber(project.installedPanels ?? 0)} subtitle={`${project.installationPct || 0}% complete`} icon={<CheckCircle2 className="h-5 w-5" />} section="overview" />
          <StatCard title="Installation %" value={`${project.installationPct || 0}%`} icon={<TrendingUp className="h-5 w-5" />} section="overview" />
          <StatCard title="Overall Progress" value={`${project.overallProgress || 0}%`} subtitle={`Planned ${project.plannedProgress || 0}%`} icon={<TrendingUp className="h-5 w-5" />} section="projects" />
          <StatCard title="Planned Progress" value={`${project.plannedProgress || 0}%`} icon={<Clock className="h-5 w-5" />} section="progress" />
          <StatCard
            title="Variance"
            value={`${variance >= 0 ? '+' : ''}${variance.toFixed(1)}%`}
            subtitle={variance >= 0 ? 'Ahead of schedule' : 'Behind schedule'}
            icon={<AlertTriangle className="h-5 w-5" />}
            section={variance >= 0 ? 'overview' : 'safety'}
          />
          <StatCard title="Budget" value={formatCurrency(project.budget ?? 0)} icon={<DollarSign className="h-5 w-5" />} section="expenses" />
          <StatCard title="Actual Cost" value={formatCurrency(project.actualCost ?? 0)} icon={<DollarSign className="h-5 w-5" />} section="expenses" />
          <StatCard
            title="Remaining"
            value={formatCurrency(remaining)}
            subtitle={remaining >= 0 ? 'Under budget' : 'Over budget'}
            icon={<DollarSign className="h-5 w-5" />}
            section={remaining >= 0 ? 'overview' : 'safety'}
          />
        </div>
      </div>

      {/* S-Curve chart */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <LineChart className="h-4 w-4 text-sky-600" /> S-Curve — Cumulative Panels (Planned vs Actual)
          </CardTitle>
          <CardDescription className="text-xs">
            Daily progress tracked against ideal planned trajectory
          </CardDescription>
        </CardHeader>
        <CardContent>
          {project.sCurve && project.sCurve.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={project.sCurve} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="gActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gPlanned" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => new Date(d).getDate() + '/' + (new Date(d).getMonth() + 1)}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(v: any) => formatNumber(v)}
                  label={{ value: 'Cumulative panels', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#64748b', textAnchor: 'middle' } }}
                />
                <RTooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                  labelFormatter={(l) => formatDate(l as string)}
                  formatter={(v: any) => formatNumber(v)}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="planned" stroke="#0ea5e9" strokeWidth={2} fill="url(#gPlanned)" name="Planned" />
                <Area type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2.5} fill="url(#gActual)" name="Actual" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState
              icon={<TrendingUp className="h-5 w-5" />}
              title="No progress data yet"
              description="Daily progress submissions will populate the S-curve chart."
              className="py-16"
            />
          )}
        </CardContent>
      </Card>

      {/* Stages card */}
      <StagesCard project={project} canEdit={canEdit} onSaved={refetch} />

      {/* Tabbed detail sections */}
      <Tabs defaultValue="progress" className="space-y-0">
        <TabsList className="flex w-full overflow-x-auto">
          <TabsTrigger value="progress">Daily Progress</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="materials">Material Transactions</TabsTrigger>
        </TabsList>

        {/* Daily Progress */}
        <TabsContent value="progress">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Sun className="h-4 w-4 text-sky-600" /> Daily Progress
              </CardTitle>
              <CardDescription className="text-xs">
                Most recent site entries ({project.dailyProgress?.length || 0})
              </CardDescription>
            </CardHeader>
            <CardContent>
              {project.dailyProgress && project.dailyProgress.length > 0 ? (
                <ScrollArea className="max-h-96 ayk-scrollbar">
                  <Table className="min-w-[800px]">
                    <TableHeader className="sticky top-0 bg-card z-10">
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Installed</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Man Hrs</TableHead>
                        <TableHead>Workers</TableHead>
                        <TableHead>Site</TableHead>
                        <TableHead>Submitted By</TableHead>
                        <TableHead>Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {project.dailyProgress.map((d: any) => (
                        <TableRow key={d.id} className="hover:bg-slate-50">
                          <TableCell className="text-xs">{formatDate(d.date)}</TableCell>
                          <TableCell className="text-xs font-medium">{formatNumber(d.installedPanels)}</TableCell>
                          <TableCell className="text-xs">{formatNumber(d.totalInstalled)}</TableCell>
                          <TableCell className="text-xs">{d.manHours ?? '—'}</TableCell>
                          <TableCell className="text-xs">{d.workers ?? '—'}</TableCell>
                          <TableCell><StatusBadge status={d.siteStatus || 'Normal'} /></TableCell>
                          <TableCell className="text-xs">{d.submittedBy?.name || '—'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[220px] truncate">
                            {d.remarks || '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              ) : (
                <EmptyState icon={<Sun className="h-5 w-5" />} title="No progress entries" description="Daily progress submissions will appear here." />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks */}
        <TabsContent value="tasks">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-sky-600" /> Tasks
                </CardTitle>
                <CardDescription className="text-xs">
                  {project.tasks?.length || 0} task(s) for this project
                </CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={() => setNav('tasks')}>
                Open Tasks <ChevronRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {project.tasks && project.tasks.length > 0 ? (
                <ScrollArea className="max-h-96 ayk-scrollbar">
                  <Table className="min-w-[700px]">
                    <TableHeader className="sticky top-0 bg-card z-10">
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Assigned To</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {project.tasks.map((t: any) => (
                        <TableRow key={t.id} className="hover:bg-slate-50">
                          <TableCell className="font-medium text-sm">{t.title}</TableCell>
                          <TableCell><PriorityBadge priority={t.priority} /></TableCell>
                          <TableCell><StatusBadge status={t.status} /></TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 min-w-[100px]">
                              <Progress value={t.progress || 0} className="h-1.5" />
                              <span className="text-xs font-medium">{t.progress || 0}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">{t.dueDate ? formatDate(t.dueDate) : '—'}</TableCell>
                          <TableCell className="text-xs">{t.assignedTo?.name || t.assignedToName || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              ) : (
                <EmptyState icon={<CheckCircle2 className="h-5 w-5" />} title="No tasks" description="Tasks assigned to this project will appear here." />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expenses */}
        <TabsContent value="expenses">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-sky-600" /> Expenses
                </CardTitle>
                <CardDescription className="text-xs">
                  {project.expenses?.length || 0} expense(s)
                </CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={() => setNav('expenses')}>
                Open Expenses <ChevronRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {project.expenses && project.expenses.length > 0 ? (
                <ScrollArea className="max-h-96 ayk-scrollbar">
                  <Table className="min-w-[800px]">
                    <TableHeader className="sticky top-0 bg-card z-10">
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Approval</TableHead>
                        <TableHead>Paid By</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {project.expenses.map((e: any) => (
                        <TableRow key={e.id} className="hover:bg-slate-50">
                          <TableCell className="text-xs">{formatDate(e.date)}</TableCell>
                          <TableCell className="text-xs">{e.category}</TableCell>
                          <TableCell className="text-xs max-w-[240px] truncate">{e.description}</TableCell>
                          <TableCell className="text-xs font-semibold text-right">{formatCurrency(e.amount)}</TableCell>
                          <TableCell><StatusBadge status={e.approvalStatus || 'Pending'} /></TableCell>
                          <TableCell className="text-xs">{e.paidBy || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              ) : (
                <EmptyState icon={<DollarSign className="h-5 w-5" />} title="No expenses" description="Expenses logged to this project will appear here." />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents */}
        <TabsContent value="documents">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-sky-600" /> Documents
                </CardTitle>
                <CardDescription className="text-xs">
                  {project.documents?.length || 0} document(s)
                </CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={() => setNav('documents')}>
                Open Documents <ChevronRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {project.documents && project.documents.length > 0 ? (
                <ScrollArea className="max-h-96 ayk-scrollbar">
                  <Table className="min-w-[700px]">
                    <TableHeader className="sticky top-0 bg-card z-10">
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Uploaded By</TableHead>
                        <TableHead>Uploaded At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {project.documents.map((d: any) => (
                        <TableRow key={d.id} className="hover:bg-slate-50">
                          <TableCell className="text-sm font-medium">
                            <span className="inline-flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" /> {d.name}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs">{d.category}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs uppercase">{d.fileType || 'FILE'}</Badge>
                          </TableCell>
                          <TableCell className="text-xs">{d.uploadedByName || '—'}</TableCell>
                          <TableCell className="text-xs">{d.createdAt ? formatDate(d.createdAt) : '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              ) : (
                <EmptyState icon={<FileText className="h-5 w-5" />} title="No documents" description="Project documents will appear here." />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Material Transactions */}
        <TabsContent value="materials">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Package className="h-4 w-4 text-sky-600" /> Material Transactions
              </CardTitle>
              <CardDescription className="text-xs">
                {project.materialTransactions?.length || 0} transaction(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {project.materialTransactions && project.materialTransactions.length > 0 ? (
                <ScrollArea className="max-h-96 ayk-scrollbar">
                  <Table className="min-w-[700px]">
                    <TableHeader className="sticky top-0 bg-card z-10">
                      <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {project.materialTransactions.map((m: any) => (
                        <TableRow key={m.id} className="hover:bg-slate-50">
                          <TableCell className="text-sm font-medium">{m.material?.name || '—'}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                m.type === 'Add'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : m.type === 'Issue'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-sky-50 text-sky-700 border-sky-200'
                              }
                            >
                              {m.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs font-semibold text-right">{formatNumber(m.qty)}</TableCell>
                          <TableCell className="text-xs">{formatDate(m.date)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[220px] truncate">
                            {m.remarks || '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              ) : (
                <EmptyState icon={<Package className="h-5 w-5" />} title="No material transactions" description="Material issues and receipts will appear here." />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto ayk-scrollbar">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Update the project details below.</DialogDescription>
          </DialogHeader>
          {editForm && (
            <ProjectFormFields form={editForm} setForm={setEditForm} users={users} />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button
              onClick={onSaveEdit}
              disabled={savingEdit}
              className="bg-sky-600 hover:bg-sky-700 text-white"
            >
              {savingEdit ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================================
// STAGES CARD with inline editing
// ============================================================
function StagesCard({
  project, canEdit, onSaved,
}: {
  project: any
  canEdit: boolean
  onSaved: () => void
}) {
  const [stages, setStages] = useState<any[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (project.stages) {
      setStages(project.stages.map((s: any) => ({ ...s })))
    }
  }, [project.stages])

  function updateStage(idx: number, field: string, value: any) {
    setStages((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s))
    )
  }

  async function save() {
    setSaving(true)
    try {
      await apiPut(`/api/projects/${project.id}/stages`, {
        stages: stages.map((s) => ({
          id: s.id,
          name: s.name,
          plannedPct: Number(s.plannedPct) || 0,
          actualPct: Number(s.actualPct) || 0,
          weight: Number(s.weight) || 0,
          status: s.status,
          startDate: s.startDate,
          endDate: s.endDate,
        })),
      })
      toast.success('Stages saved')
      onSaved()
    } catch (e: any) {
      toast.error(e.message || 'Failed to save stages')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FolderKanban className="h-4 w-4 text-sky-600" /> Project Stages
          </CardTitle>
          <CardDescription className="text-xs">Weighted progress across {stages.length || 6} stages</CardDescription>
        </div>
        {canEdit && (
          <Button
            size="sm"
            onClick={save}
            disabled={saving}
            className="bg-sky-600 hover:bg-sky-700 text-white"
          >
            {saving ? 'Saving...' : 'Save Stages'}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {stages.length === 0 ? (
          <EmptyState
            icon={<FolderKanban className="h-5 w-5" />}
            title="No stages defined"
            description="Stages are created when the project is added."
          />
        ) : (
          <ScrollArea className="max-h-[500px] ayk-scrollbar">
            <Table className="min-w-[900px]">
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead>Stage</TableHead>
                  <TableHead>Planned %</TableHead>
                  <TableHead>Actual %</TableHead>
                  <TableHead className="min-w-[140px]">Progress</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stages.map((s, i) => (
                  <TableRow key={s.id} className="hover:bg-slate-50">
                    <TableCell className="font-medium text-sm">{s.name}</TableCell>
                    <TableCell className="text-xs">{s.plannedPct}%</TableCell>
                    <TableCell>
                      {canEdit ? (
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={s.actualPct}
                          onChange={(e) => updateStage(i, 'actualPct', e.target.value)}
                          className="h-8 w-20 text-xs"
                        />
                      ) : (
                        <span className="text-xs">{s.actualPct}%</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Progress value={Number(s.actualPct) || 0} className="h-2" />
                    </TableCell>
                    <TableCell className="text-xs">{s.weight}</TableCell>
                    <TableCell>
                      {canEdit ? (
                        <Select
                          value={s.status}
                          onValueChange={(v) => updateStage(i, 'status', v)}
                        >
                          <SelectTrigger className="h-8 w-[130px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NotStarted">Not Started</SelectItem>
                            <SelectItem value="InProgress">In Progress</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                            <SelectItem value="Delayed">Delayed</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <StatusBadge status={s.status} />
                      )}
                    </TableCell>
                    <TableCell className="text-xs">{s.startDate ? formatDate(s.startDate) : '—'}</TableCell>
                    <TableCell className="text-xs">{s.endDate ? formatDate(s.endDate) : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================
// Helpers
// ============================================================
function toInputDate(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toISOString().slice(0, 10)
}
