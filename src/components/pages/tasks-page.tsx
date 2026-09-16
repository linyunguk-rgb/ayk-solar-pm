'use client'
import { useState, useMemo, useCallback } from 'react'
import { useAppStore } from '@/store/app-store'
import { useFetch, apiPost, apiPut, apiDelete } from '@/hooks/use-fetch'
import { SectionHeader, SubSection } from '@/components/shared/section-header'
import { StatCard } from '@/components/shared/stat-card'
import { StatusBadge, PriorityBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
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
import { HorizontalScrollTable } from '@/components/shared/horizontal-scroll-table'
import {
  ListChecks, Plus, LayoutGrid, List, Filter, Pencil, Trash2, AlertTriangle, Search, X,
  CheckCircle2, Clock, Loader2, Flag,
} from 'lucide-react'
import { TASK_STATUSES, TASK_STATUS_LABELS, TASK_PRIORITIES, formatDate } from '@/lib/constants'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface TaskItem {
  id: string
  title: string
  description?: string | null
  projectId?: string | null
  project?: { id: string; name: string } | null
  assignedToId?: string | null
  assignedTo?: { id: string; name: string } | null
  assignedToName?: string | null
  team?: string | null
  priority: string
  status: string
  progress: number
  startDate: string
  dueDate: string
  completedAt?: string | null
  remarks?: string | null
  isOverdue: boolean
}

interface ProjectOption { id: string; name: string }
interface UserOption { id: string; name: string; role: string }

// Column color coding per status — slate / sky / emerald / red
const COLUMN_DEFS: { key: string; label: string; accent: string; dot: string; headBg: string }[] = [
  { key: 'Todo',       label: 'To Do',       accent: 'text-slate-700',   dot: 'bg-slate-400',   headBg: 'bg-slate-100/60' },
  { key: 'InProgress', label: 'In Progress', accent: 'text-sky-700',     dot: 'bg-sky-500',     headBg: 'bg-sky-100/60' },
  { key: 'Completed',  label: 'Completed',   accent: 'text-emerald-700', dot: 'bg-emerald-500', headBg: 'bg-emerald-100/60' },
  { key: 'Delayed',    label: 'Delayed',      accent: 'text-red-700',     dot: 'bg-red-500',     headBg: 'bg-red-100/60' },
]

const PRIORITY_DOT: Record<string, string> = {
  Low: 'bg-slate-400',
  Medium: 'bg-blue-500',
  High: 'bg-orange-500',
  Critical: 'bg-red-500',
}

function emptyForm(): TaskFormState {
  return {
    title: '', description: '', projectId: '', assignedToId: '', assignedToName: '',
    team: '', priority: 'Medium', status: 'Todo', progress: 0,
    startDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    remarks: '',
  }
}

interface TaskFormState {
  title: string
  description: string
  projectId: string
  assignedToId: string
  assignedToName: string
  team: string
  priority: string
  status: string
  progress: number
  startDate: string
  dueDate: string
  remarks: string
}

export function TasksPage() {
  const { user } = useAppStore()

  // Filters
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all')

  const [view, setView] = useState<'board' | 'list'>('board')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<TaskItem | null>(null)
  const [form, setForm] = useState<TaskFormState>(emptyForm())
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const tasksUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (projectFilter !== 'all') params.set('projectId', projectFilter)
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (assigneeFilter !== 'all') params.set('assignedToId', assigneeFilter)
    const q = params.toString()
    return `/api/tasks${q ? `?${q}` : ''}`
  }, [projectFilter, statusFilter, assigneeFilter])

  const { data, loading, refetch } = useFetch<{ tasks: TaskItem[] }>(tasksUrl)
  const { data: projData } = useFetch<{ projects: ProjectOption[] }>('/api/projects')
  const { data: usersData } = useFetch<{ users: UserOption[] }>('/api/users')

  const tasks = data?.tasks ?? []
  const projects = projData?.projects ?? []
  const users = usersData?.users ?? []

  // KPI metrics — color-coded by section: tasks (amber) default, safety (red) for overdue
  const metrics = useMemo(() => {
    const overdue = tasks.filter((t) => t.isOverdue).length
    const completed = tasks.filter((t) => t.status === 'Completed').length
    const inProgress = tasks.filter((t) => t.status === 'InProgress').length
    const todo = tasks.filter((t) => t.status === 'Todo').length
    const delayed = tasks.filter((t) => t.status === 'Delayed').length
    const completionRate = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0
    return { total: tasks.length, overdue, completed, inProgress, todo, delayed, completionRate }
  }, [tasks])

  const openNew = useCallback(() => {
    setEditing(null)
    setForm(emptyForm())
    setDialogOpen(true)
  }, [])

  const openEdit = useCallback((task: TaskItem) => {
    setEditing(task)
    setForm({
      title: task.title || '',
      description: task.description || '',
      projectId: task.projectId || '',
      assignedToId: task.assignedToId || '',
      assignedToName: task.assignedToName || task.assignedTo?.name || '',
      team: task.team || '',
      priority: task.priority || 'Medium',
      status: task.status || 'Todo',
      progress: Number(task.progress) || 0,
      startDate: task.startDate ? new Date(task.startDate).toISOString().slice(0, 10) : '',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '',
      remarks: task.remarks || '',
    })
    setDialogOpen(true)
  }, [])

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.dueDate) {
      toast.error('Title and due date are required')
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        projectId: form.projectId || undefined,
        assignedToId: form.assignedToId || undefined,
        assignedToName: form.assignedToName || undefined,
        team: form.team.trim() || undefined,
        priority: form.priority,
        status: form.status,
        progress: Number(form.progress) || 0,
        startDate: form.startDate,
        dueDate: form.dueDate,
        remarks: form.remarks.trim() || undefined,
      }
      if (editing) {
        await apiPut(`/api/tasks/${editing.id}`, payload)
        toast.success('Task updated')
      } else {
        await apiPost('/api/tasks', payload)
        toast.success('Task created')
      }
      setDialogOpen(false)
      await refetch()
    } catch (e: any) {
      toast.error(e.message || 'Failed to save task')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await apiDelete(`/api/tasks/${deleteId}`)
      toast.success('Task deleted')
      setDeleteId(null)
      await refetch()
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete task')
    }
  }

  const onAssigneeChange = (val: string) => {
    const u = users.find((x) => x.id === val)
    setForm((f) => ({ ...f, assignedToId: val, assignedToName: u?.name || '' }))
  }

  const clearFilters = () => {
    setProjectFilter('all'); setStatusFilter('all'); setPriorityFilter('all'); setAssigneeFilter('all')
  }

  const hasFilters = projectFilter !== 'all' || statusFilter !== 'all' || priorityFilter !== 'all' || assigneeFilter !== 'all'

  return (
    <div className="space-y-6">
      <SectionHeader
        section="tasks"
        title="Task Management"
        description="Track tasks, assignments and deadlines"
        icon={<ListChecks className="h-6 w-6" />}
        actions={
          <Button onClick={openNew} className="bg-amber-600 hover:bg-amber-700 text-white">
            <Plus className="h-4 w-4 mr-2" /> New Task
          </Button>
        }
      />

      {/* KPI grid — section-themed (amber) with overdue/delayed in safety red */}
      <div>
        <SubSection
          section="tasks"
          title="Task Overview"
          description="Live status across all selected filters"
          icon={<ListChecks className="h-4 w-4" />}
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            title="Total Tasks"
            value={metrics.total ?? 0}
            subtitle="In current view"
            icon={<ListChecks className="h-5 w-5" />}
            section="tasks"
          />
          <StatCard
            title="In Progress"
            value={metrics.inProgress ?? 0}
            subtitle="Being worked on"
            icon={<Loader2 className="h-5 w-5" />}
            section="tasks"
          />
          <StatCard
            title="Completed"
            value={metrics.completed ?? 0}
            subtitle={`${metrics.completionRate ?? 0}% completion rate`}
            icon={<CheckCircle2 className="h-5 w-5" />}
            section="tasks"
          />
          <StatCard
            title="Overdue"
            value={metrics.overdue ?? 0}
            subtitle="Past due date"
            icon={<AlertTriangle className="h-5 w-5" />}
            section="safety"
          />
        </div>
      </div>

      {/* Overdue banner */}
      {metrics.overdue > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <div className="flex items-center gap-3 text-red-700 min-w-0">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold">{metrics.overdue} {metrics.overdue === 1 ? 'task is' : 'tasks are'} overdue</p>
              <p className="text-xs text-red-600/80">Review and update the status to keep your project on track.</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-red-200 bg-white text-red-700 hover:bg-red-50 w-full sm:w-auto"
            onClick={() => setStatusFilter('Delayed')}
          >
            <Filter className="h-4 w-4 mr-1" /> Filter Delayed
          </Button>
        </div>
      )}

      {/* Filter bar */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                <Filter className="h-4 w-4" /> Filters
              </div>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500 hover:text-slate-700 self-start sm:self-auto">
                  <X className="h-3.5 w-3.5 mr-1" /> Clear
                </Button>
              )}
              <div className="sm:ml-auto inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 self-start sm:self-auto">
                <button
                  onClick={() => setView('board')}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition',
                    view === 'board' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  <LayoutGrid className="h-3.5 w-3.5" /> Board
                </button>
                <button
                  onClick={() => setView('list')}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition',
                    view === 'list' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  <List className="h-3.5 w-3.5" /> List
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {TASK_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{TASK_STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  {TASK_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="All Assignees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading skeleton */}
      {loading ? (
        view === 'board' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-border/60 shadow-sm">
                <CardHeader className={cn('pb-3 pt-4 px-4', COLUMN_DEFS[i % 4].headBg)}>
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-24 rounded bg-slate-200 animate-pulse" />
                    <div className="h-5 w-8 rounded-full bg-slate-200 animate-pulse" />
                  </div>
                </CardHeader>
                <CardContent className="px-3 pb-3 space-y-2.5">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="rounded-lg border border-slate-200 bg-white p-3 h-32 animate-pulse">
                      <div className="h-3 w-3/4 rounded bg-slate-200 mb-2" />
                      <div className="h-3 w-1/2 rounded bg-slate-100" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-0">
              <div className="space-y-2 p-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-12 rounded-lg bg-slate-100 animate-pulse" />
                ))}
              </div>
            </CardContent>
          </Card>
        )
      ) : view === 'board' ? (
        <BoardView tasks={tasks} priorityFilter={priorityFilter} onEdit={openEdit} onDelete={setDeleteId} />
      ) : (
        <ListView tasks={tasks} priorityFilter={priorityFilter} onEdit={openEdit} onDelete={setDeleteId} />
      )}

      {/* New/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto ayk-scrollbar">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Task' : 'New Task'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Update the task details below.' : 'Fill in the details below to create a new task.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="t-title">Title <span className="text-red-500">*</span></Label>
              <Input id="t-title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Install mounting rails" />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="t-desc">Description</Label>
              <Textarea id="t-desc" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Brief description of the task" />
            </div>

            <div className="space-y-1.5">
              <Label>Project</Label>
              <Select value={form.projectId || 'none'} onValueChange={(v) => setForm((f) => ({ ...f, projectId: v === 'none' ? '' : v }))}>
                <SelectTrigger className="w-full bg-white"><SelectValue placeholder="No project" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No project</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Assigned To</Label>
              <Select value={form.assignedToId || 'none'} onValueChange={onAssigneeChange}>
                <SelectTrigger className="w-full bg-white"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name} · {u.role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="t-team">Team</Label>
              <Input id="t-team" value={form.team} onChange={(e) => setForm((f) => ({ ...f, team: e.target.value }))} placeholder="e.g. Installation Team A" />
            </div>

            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}>
                <SelectTrigger className="w-full bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger className="w-full bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{TASK_STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="t-start">Start Date</Label>
              <Input id="t-start" type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="t-due">Due Date <span className="text-red-500">*</span></Label>
              <Input id="t-due" type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
            </div>

            <div className="sm:col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <Label>Progress</Label>
                <span className="text-sm font-semibold text-amber-700">{form.progress}%</span>
              </div>
              <Slider
                value={[form.progress]}
                min={0}
                max={100}
                step={5}
                onValueChange={(v) => setForm((f) => ({ ...f, progress: v[0] ?? 0 }))}
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="t-remarks">Remarks</Label>
              <Textarea id="t-remarks" rows={2} value={form.remarks} onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))} placeholder="Any additional notes" />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="w-full sm:w-auto">Cancel</Button>
            <Button disabled={submitting} onClick={handleSubmit} className="bg-amber-600 hover:bg-amber-700 text-white w-full sm:w-auto">
              {submitting ? 'Saving…' : editing ? 'Update Task' : 'Create Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The task and its history will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

/* ------------------------------ Board View ------------------------------ */

function BoardView({
  tasks, priorityFilter, onEdit, onDelete,
}: {
  tasks: TaskItem[]
  priorityFilter: string
  onEdit: (t: TaskItem) => void
  onDelete: (id: string) => void
}) {
  const filtered = useMemo(() => {
    if (priorityFilter === 'all') return tasks
    return tasks.filter((t) => t.priority === priorityFilter)
  }, [tasks, priorityFilter])

  const grouped = useMemo(() => {
    const g: Record<string, TaskItem[]> = { Todo: [], InProgress: [], Completed: [], Delayed: [] }
    for (const t of filtered) {
      const key = (t.status in g) ? t.status : 'Todo'
      g[key].push(t)
    }
    return g
  }, [filtered])

  if (filtered.length === 0) {
    return (
      <Card className="border-dashed border-slate-300 bg-slate-50/50">
        <CardContent className="p-0">
          <EmptyState
            icon={<Search className="h-6 w-6" />}
            title="No tasks found"
            description="Try adjusting your filters, or click New Task to create one."
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <div>
      <SubSection
        section="tasks"
        title="Kanban Board"
        description="Drag-equivalent board grouped by status"
        icon={<LayoutGrid className="h-4 w-4" />}
      />
      {/* Mobile: 1 col stack; sm: 2 cols; xl: 4 cols (full board) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMN_DEFS.map((col) => (
          <Card key={col.key} className="border-border/60 shadow-sm bg-slate-50/40 flex flex-col">
            <CardHeader className={cn('pb-3 pt-4 px-4 rounded-t-xl', col.headBg)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={cn('h-2.5 w-2.5 rounded-full shrink-0', col.dot)} />
                  <CardTitle className={cn('text-sm font-semibold truncate', col.accent)}>{col.label}</CardTitle>
                </div>
                <Badge variant="secondary" className="bg-white text-slate-600 border border-slate-200 tabular-nums">
                  {grouped[col.key].length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-3 pb-3 space-y-2.5 max-h-[600px] overflow-y-auto ayk-scrollbar flex-1">
              {grouped[col.key].length === 0 ? (
                <div className="text-center text-xs text-slate-400 py-8">No tasks</div>
              ) : (
                grouped[col.key].map((t) => (
                  <TaskCard key={t.id} task={t} onEdit={onEdit} onDelete={onDelete} />
                ))
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function TaskCard({ task, onEdit, onDelete }: { task: TaskItem; onEdit: (t: TaskItem) => void; onDelete: (id: string) => void }) {
  const projectName = task.project?.name || '—'
  const assignee = task.assignedToName || task.assignedTo?.name || 'Unassigned'
  return (
    <div
      onClick={() => onEdit(task)}
      className="group rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:shadow-md hover:border-amber-300 transition cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {task.isOverdue && <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" title="Overdue" />}
            <h4 className="text-sm font-semibold text-slate-900 truncate group-hover:text-amber-700 transition">{task.title}</h4>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 truncate">{projectName}</p>
        </div>
        <span className={cn('h-2 w-2 rounded-full shrink-0 mt-1', PRIORITY_DOT[task.priority] || 'bg-slate-400')} title={`Priority: ${task.priority}`} />
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <PriorityBadge priority={task.priority} />
      </div>

      <div className="mt-2.5 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1 truncate min-w-0">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-50 text-amber-700 text-[10px] font-semibold shrink-0">
              {assignee.charAt(0).toUpperCase()}
            </span>
            <span className="truncate">{assignee}</span>
          </span>
          <span className={cn('shrink-0 flex items-center gap-1', task.isOverdue ? 'text-red-600 font-medium' : 'text-slate-500')}>
            <Clock className="h-3 w-3" />
            {formatDate(task.dueDate)}
          </span>
        </div>
        <div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
            <span>Progress</span><span className="font-medium text-slate-700">{task.progress ?? 0}%</span>
          </div>
          <Progress value={task.progress ?? 0} className="h-1.5" />
        </div>
      </div>

      <div className="mt-2 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
        <Button size="sm" variant="ghost" className="h-7 px-2 text-slate-500 hover:text-amber-600" onClick={(e) => { e.stopPropagation(); onEdit(task) }}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" variant="ghost" className="h-7 px-2 text-slate-500 hover:text-red-600" onClick={(e) => { e.stopPropagation(); onDelete(task.id) }}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

/* ------------------------------ List View ------------------------------ */

function ListView({
  tasks, priorityFilter, onEdit, onDelete,
}: {
  tasks: TaskItem[]
  priorityFilter: string
  onEdit: (t: TaskItem) => void
  onDelete: (id: string) => void
}) {
  const filtered = useMemo(() => {
    if (priorityFilter === 'all') return tasks
    return tasks.filter((t) => t.priority === priorityFilter)
  }, [tasks, priorityFilter])

  if (filtered.length === 0) {
    return (
      <Card className="border-dashed border-slate-300 bg-slate-50/50">
        <CardContent className="p-0">
          <EmptyState
            icon={<Search className="h-6 w-6" />}
            title="No tasks found"
            description="Try adjusting your filters, or click New Task to create one."
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <div>
      <SubSection
        section="tasks"
        title="Task List"
        description="Tabular view of all tasks"
        icon={<List className="h-4 w-4" />}
      />
      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-0">
          <HorizontalScrollTable minWidth="1000px" maxHeight="500px">
            <div className="min-w-[900px]">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="min-w-[200px]">Title</TableHead>
                    <TableHead className="min-w-[140px]">Project</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="min-w-[120px]">Progress</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((t) => (
                    <TableRow key={t.id} className={cn(t.isOverdue && 'bg-red-50/60 hover:bg-red-50')}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {t.isOverdue && <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" title="Overdue" />}
                          <button onClick={() => onEdit(t)} className="text-left font-medium text-slate-900 hover:text-amber-700 truncate">
                            {t.title}
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600 text-xs">{t.project?.name || '—'}</TableCell>
                      <TableCell className="text-slate-700 text-xs">
                        {t.assignedToName || t.assignedTo?.name || 'Unassigned'}
                      </TableCell>
                      <TableCell><PriorityBadge priority={t.priority} /></TableCell>
                      <TableCell><StatusBadge status={t.status} /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <Progress value={t.progress ?? 0} className="h-1.5 flex-1" />
                          <span className="text-xs font-medium text-slate-600 tabular-nums w-9 text-right">{t.progress ?? 0}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={cn('text-xs flex items-center gap-1', t.isOverdue ? 'text-red-600 font-medium' : 'text-slate-600')}>
                          <Clock className="h-3 w-3" />
                          {formatDate(t.dueDate)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-500 hover:text-amber-600" onClick={() => onEdit(t)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-500 hover:text-red-600" onClick={() => onDelete(t.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </HorizontalScrollTable>
        </CardContent>
      </Card>
    </div>
  )
}
