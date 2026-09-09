'use client'

import { useMemo, useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { useFetch, apiPost, apiPut, apiDelete } from '@/hooks/use-fetch'
import { SectionHeader, SubSection } from '@/components/shared/section-header'
import { StatCard } from '@/components/shared/stat-card'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import {
  DollarSign, Plus, Check, X, Pencil, Trash2, Upload, TrendingUp,
  TrendingDown, Wallet, CheckCircle2, Clock, XCircle, FileText,
  BarChart3, PieChart as PieChartIcon,
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, Legend, PieChart, Pie, Cell,
} from 'recharts'
import {
  EXPENSE_CATEGORIES, formatCurrency, formatDate,
} from '@/lib/constants'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Category badge colors — each category gets a distinct color
// Tools=slate, Transport=sky, Accommodation=violet, Fuel=amber,
// Materials=pink, Labour=cyan, Miscellaneous=stone
const EXPENSE_CATEGORY_BADGE: Record<string, string> = {
  'Tools & Equipment': 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-100',
  'Transport': 'bg-sky-100 text-sky-700 border-sky-200 hover:bg-sky-100',
  'Accommodation': 'bg-violet-100 text-violet-700 border-violet-200 hover:bg-violet-100',
  'Fuel': 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100',
  'Materials': 'bg-pink-100 text-pink-700 border-pink-200 hover:bg-pink-100',
  'Labour': 'bg-cyan-100 text-cyan-700 border-cyan-200 hover:bg-cyan-100',
  'Miscellaneous': 'bg-stone-100 text-stone-700 border-stone-300 hover:bg-stone-100',
}

const PIE_COLORS = ['#64748b', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#78716c']

function ExpenseCategoryBadge({ category }: { category: string }) {
  return (
    <Badge
      variant="outline"
      className={cn('font-medium', EXPENSE_CATEGORY_BADGE[category] || EXPENSE_CATEGORY_BADGE.Miscellaneous)}
    >
      {category}
    </Badge>
  )
}

function ApprovalBadge({ status }: { status: string }) {
  const cls =
    status === 'Approved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
      : status === 'Pending' ? 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100'
        : status === 'Rejected' ? 'bg-red-100 text-red-700 border-red-200 hover:bg-red-100'
          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100'
  return <Badge variant="outline" className={cn('font-medium', cls)}>{status}</Badge>
}

function todayISO(): string {
  const d = new Date()
  const tz = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - tz).toISOString().slice(0, 10)
}

interface ExpenseFormState {
  date: string
  projectId: string
  category: string
  description: string
  amount: number
  paidBy: string
  approvalStatus: 'Pending' | 'Approved' | 'Rejected'
  receiptUrl: string
}

const EMPTY_EXPENSE_FORM: ExpenseFormState = {
  date: todayISO(),
  projectId: 'none',
  category: 'Tools & Equipment',
  description: '',
  amount: 0,
  paidBy: '',
  approvalStatus: 'Pending',
  receiptUrl: '',
}

export function ExpensesPage() {
  const { user } = useAppStore()

  // Filters
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [approvalFilter, setApprovalFilter] = useState<string>('all')

  // Dialog state
  const [expenseDialog, setExpenseDialog] = useState<{ open: boolean; mode: 'add' | 'edit'; expense?: any }>({
    open: false, mode: 'add',
  })
  const [eForm, setEForm] = useState<ExpenseFormState>(EMPTY_EXPENSE_FORM)
  const [saving, setSaving] = useState(false)

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Fetches
  const { data: expensesData, loading: loadingExpenses, refetch: refetchExpenses } = useFetch<any>('/api/expenses')
  const { data: projectsData, loading: loadingProjects } = useFetch<any>('/api/projects')

  const expenses = (expensesData?.expenses || []) as any[]
  const projects = (projectsData?.projects || []) as any[]

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    let arr = [...expenses]
    if (projectFilter !== 'all') arr = arr.filter((e) => e.projectId === projectFilter)
    if (categoryFilter !== 'all') arr = arr.filter((e) => e.category === categoryFilter)
    if (approvalFilter !== 'all') arr = arr.filter((e) => e.approvalStatus === approvalFilter)
    return arr
  }, [expenses, projectFilter, categoryFilter, approvalFilter])

  // Stats
  const stats = useMemo(() => {
    const total = expenses.reduce((s, e) => s + Number(e.amount ?? 0), 0)
    const approved = expenses.filter((e) => e.approvalStatus === 'Approved')
    const pending = expenses.filter((e) => e.approvalStatus === 'Pending')
    const rejected = expenses.filter((e) => e.approvalStatus === 'Rejected')
    return {
      total,
      approvedSum: approved.reduce((s, e) => s + Number(e.amount ?? 0), 0),
      approvedCount: approved.length,
      pendingSum: pending.reduce((s, e) => s + Number(e.amount ?? 0), 0),
      pendingCount: pending.length,
      rejectedSum: rejected.reduce((s, e) => s + Number(e.amount ?? 0), 0),
      rejectedCount: rejected.length,
    }
  }, [expenses])

  // Approved expense sums per project
  const approvedByProject = useMemo(() => {
    const map: Record<string, number> = {}
    for (const e of expenses) {
      if (e.approvalStatus !== 'Approved') continue
      if (!e.projectId) continue
      map[e.projectId] = (map[e.projectId] || 0) + Number(e.amount ?? 0)
    }
    return map
  }, [expenses])

  // Budget vs Actual chart data
  const budgetChart = useMemo(() => {
    return projects.map((p) => ({
      name: p.name?.length > 14 ? p.name.slice(0, 14) + '…' : (p.name || 'Untitled'),
      budget: Number(p.budget) || 0,
      actual: (Number(p.actualCost) || 0) + (approvedByProject[p.id] || 0),
    }))
  }, [projects, approvedByProject])

  // Expense by category
  const categoryChart = useMemo(() => {
    const map: Record<string, number> = {}
    for (const e of expenses) {
      if (e.approvalStatus === 'Rejected') continue
      map[e.category] = (map[e.category] || 0) + Number(e.amount ?? 0)
    }
    return EXPENSE_CATEGORIES.filter((c) => (map[c] || 0) > 0).map((c) => ({
      name: c,
      value: map[c] || 0,
    }))
  }, [expenses])

  // Project profitability
  const profitability = useMemo(() => {
    return projects.map((p) => {
      const budget = Number(p.budget) || 0
      const actualCost = Number(p.actualCost) || 0
      const expensesApproved = approvedByProject[p.id] || 0
      const totalSpent = actualCost + expensesApproved
      const profit = budget - totalSpent
      const marginPct = budget > 0 ? Math.round((profit / budget) * 1000) / 10 : 0
      const usedPct = budget > 0 ? Math.min(100, Math.round((totalSpent / budget) * 1000) / 10) : 0
      return {
        id: p.id,
        name: p.name,
        budget,
        actualCost,
        expensesApproved,
        totalSpent,
        profit,
        marginPct,
        usedPct,
        overBudget: totalSpent > budget,
      }
    })
  }, [projects, approvedByProject])

  // ---------- Handlers ----------
  const openAddExpense = () => {
    setEForm(EMPTY_EXPENSE_FORM)
    setExpenseDialog({ open: true, mode: 'add' })
  }

  const openEditExpense = (e: any) => {
    const d = e.date ? new Date(e.date) : new Date()
    const tz = d.getTimezoneOffset() * 60000
    setEForm({
      date: new Date(d.getTime() - tz).toISOString().slice(0, 10),
      projectId: e.projectId || 'none',
      category: e.category || 'Tools & Equipment',
      description: e.description || '',
      amount: Number(e.amount) || 0,
      paidBy: e.paidBy || '',
      approvalStatus: e.approvalStatus || 'Pending',
      receiptUrl: e.receiptUrl || '',
    })
    setExpenseDialog({ open: true, mode: 'edit', expense: e })
  }

  const submitExpense = async () => {
    if (!eForm.description.trim()) {
      toast.error('Description is required')
      return
    }
    if (!eForm.amount || Number(eForm.amount) <= 0) {
      toast.error('Amount must be greater than 0')
      return
    }
    setSaving(true)
    try {
      const body = {
        date: eForm.date ? new Date(eForm.date).toISOString() : new Date().toISOString(),
        projectId: eForm.projectId && eForm.projectId !== 'none' ? eForm.projectId : null,
        category: eForm.category,
        description: eForm.description.trim(),
        amount: Number(eForm.amount),
        paidBy: eForm.paidBy?.trim() || null,
        approvalStatus: eForm.approvalStatus,
        receiptUrl: eForm.receiptUrl?.trim() || null,
      }
      if (expenseDialog.mode === 'add') {
        await apiPost('/api/expenses', body)
        toast.success('Expense recorded')
      } else if (expenseDialog.mode === 'edit' && expenseDialog.expense?.id) {
        await apiPut(`/api/expenses/${expenseDialog.expense.id}`, body)
        toast.success('Expense updated')
      }
      setExpenseDialog({ open: false, mode: 'add' })
      refetchExpenses()
    } catch (e: any) {
      toast.error(e.message || 'Failed to save expense')
    } finally {
      setSaving(false)
    }
  }

  const setApproval = async (id: string, status: 'Approved' | 'Rejected') => {
    try {
      await apiPut(`/api/expenses/${id}`, { approvalStatus: status })
      toast.success(`Expense ${status.toLowerCase()}`)
      refetchExpenses()
    } catch (e: any) {
      toast.error(e.message || `Failed to ${status.toLowerCase()} expense`)
    }
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    try {
      await apiDelete(`/api/expenses/${deleteId}`)
      toast.success('Expense deleted')
      refetchExpenses()
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete expense')
    } finally {
      setDeleteId(null)
    }
  }

  const onReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setEForm((s) => ({ ...s, receiptUrl: file.name }))
      toast.success(`Receipt "${file.name}" attached`)
    }
  }

  // ---------- Render: Loading ----------
  if (loadingExpenses && !expensesData) {
    return (
      <div className="space-y-6">
        <SectionHeader
          section="expenses"
          title="Expense Management"
          description="Track project expenses and approvals"
          icon={<DollarSign className="h-6 w-6" />}
        />
        <div>
          <SubSection section="expenses" title="Spending Summary" icon={<BarChart3 className="h-4 w-4" />} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="overflow-hidden border-border/60">
                <CardContent className="p-4 h-28">
                  <Skeleton className="h-full w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="overflow-hidden border-border/60"><CardContent className="p-4"><Skeleton className="h-72 w-full" /></CardContent></Card>
          <Card className="overflow-hidden border-border/60"><CardContent className="p-4"><Skeleton className="h-72 w-full" /></CardContent></Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        section="expenses"
        title="Expense Management"
        description="Track project expenses and approvals"
        icon={<DollarSign className="h-6 w-6" />}
        actions={
          <Button onClick={openAddExpense} className="bg-pink-600 hover:bg-pink-700 text-white">
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Add Expense</span><span className="sm:hidden">Add</span>
          </Button>
        }
      />

      {/* Stat cards — Spending Summary */}
      <div>
        <SubSection
          section="expenses"
          title="Spending Summary"
          description="Total spend, approvals and outstanding amounts"
          icon={<BarChart3 className="h-4 w-4" />}
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            section="expenses"
            title="Total Expenses"
            value={formatCurrency(stats.total)}
            subtitle={`${expenses.length} entries`}
            icon={<Wallet className="h-5 w-5" />}
          />
          <StatCard
            section="expenses"
            title="Approved"
            value={formatCurrency(stats.approvedSum)}
            subtitle={`${stats.approvedCount} entries`}
            icon={<CheckCircle2 className="h-5 w-5" />}
          />
          <StatCard
            section="tasks"
            title="Pending"
            value={formatCurrency(stats.pendingSum)}
            subtitle={`${stats.pendingCount} awaiting review`}
            icon={<Clock className="h-5 w-5" />}
          />
          <StatCard
            section="safety"
            title="Rejected"
            value={formatCurrency(stats.rejectedSum)}
            subtitle={`${stats.rejectedCount} entries`}
            icon={<XCircle className="h-5 w-5" />}
          />
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 shadow-sm border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-100 text-pink-700">
                <BarChart3 className="h-4 w-4" />
              </span>
              Budget vs Actual
            </CardTitle>
            <CardDescription className="text-xs pl-9">
              Project budget vs (actual cost + approved expenses) in S$
            </CardDescription>
          </CardHeader>
          <CardContent>
            {budgetChart.length === 0 ? (
              <EmptyState
                icon={<BarChart3 className="h-6 w-6" />}
                title="No projects yet"
                description="Once projects exist, you can compare budget vs actual here."
                className="h-[260px]"
              />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={budgetChart} margin={{ top: 8, right: 8, left: 8, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickFormatter={(v) => formatCurrency(v)}
                    label={{ value: 'S$', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#94a3b8' } }}
                  />
                  <RTooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                    formatter={(v: any) => formatCurrency(v)}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="budget" name="Budget" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actual" name="Actual + Expenses" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-100 text-pink-700">
                <PieChartIcon className="h-4 w-4" />
              </span>
              Expense by Category
            </CardTitle>
            <CardDescription className="text-xs pl-9">
              Total amount per category (excludes rejected)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {categoryChart.length === 0 ? (
              <EmptyState
                icon={<PieChartIcon className="h-6 w-6" />}
                title="No expenses yet"
                description="Add some expenses to see the breakdown by category."
                className="h-[260px]"
              />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={categoryChart}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {categoryChart.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RTooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                    formatter={(v: any) => formatCurrency(v)}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Project profitability */}
      <Card className="shadow-sm border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-100 text-pink-700">
              <TrendingUp className="h-4 w-4" />
            </span>
            Project Profitability
          </CardTitle>
          <CardDescription className="text-xs pl-9">
            Budget, total spent and profit margin per project
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profitability.length === 0 ? (
            <EmptyState
              icon={<TrendingUp className="h-6 w-6" />}
              title="No projects yet"
              description="Project profitability will appear once projects are created."
              className="py-6"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {profitability.map((p) => {
                const positive = p.profit >= 0
                return (
                  <div
                    key={p.id}
                    className={cn(
                      'rounded-xl border p-4 transition-colors',
                      p.overBudget
                        ? 'border-red-200 bg-red-50/40'
                        : 'border-slate-200 bg-slate-50/40',
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h4 className="font-semibold text-slate-900 text-sm truncate">{p.name || 'Untitled'}</h4>
                      {p.overBudget ? (
                        <Badge className="bg-red-100 text-red-700 border-red-200 shrink-0">Over Budget</Badge>
                      ) : (
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 shrink-0">On Track</Badge>
                      )}
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Budget</span>
                        <span className="font-semibold text-slate-900 tabular-nums">{formatCurrency(p.budget)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Actual Cost</span>
                        <span className="font-medium text-slate-700 tabular-nums">{formatCurrency(p.actualCost)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Approved Expenses</span>
                        <span className="font-medium text-slate-700 tabular-nums">{formatCurrency(p.expensesApproved)}</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-200 pt-2 mt-1">
                        <span className="text-slate-700 font-medium">Total Spent</span>
                        <span className="font-semibold text-slate-900 tabular-nums">{formatCurrency(p.totalSpent)}</span>
                      </div>
                      <Progress value={p.usedPct} className="h-1.5" />
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Used</span>
                        <span className={cn(
                          'font-medium tabular-nums',
                          p.usedPct > 100 ? 'text-red-600' : 'text-slate-700',
                        )}>
                          {p.usedPct}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-200 pt-2 mt-1">
                        <span className={cn('flex items-center gap-1 font-medium', positive ? 'text-emerald-700' : 'text-red-700')}>
                          {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          Profit
                        </span>
                        <span className={cn(
                          'font-bold tabular-nums',
                          positive ? 'text-emerald-700' : 'text-red-700',
                        )}>
                          {formatCurrency(p.profit)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Margin</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'font-semibold tabular-nums',
                            p.budget > 0
                              ? (positive
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                : 'bg-red-100 text-red-700 border-red-200')
                              : 'bg-slate-100 text-slate-700 border-slate-200',
                          )}
                        >
                          {p.budget > 0 ? `${p.marginPct}%` : '—'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filter bar */}
      <Card className="shadow-sm border-border/60">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="mb-1.5 text-xs text-muted-foreground uppercase tracking-wide">Project</Label>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 text-xs text-muted-foreground uppercase tracking-wide">Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 text-xs text-muted-foreground uppercase tracking-wide">Approval Status</Label>
              <Select value={approvalFilter} onValueChange={setApprovalFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses table */}
      <Card className="shadow-sm border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-100 text-pink-700">
              <FileText className="h-4 w-4" />
            </span>
            Expense Records
          </CardTitle>
          <CardDescription className="text-xs pl-9">
            {filteredExpenses.length} of {expenses.length} entries · Approve or reject pending expenses
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <ScrollArea className="max-h-[560px] w-full">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead className="min-w-[110px]">Date</TableHead>
                  <TableHead className="min-w-[160px]">Project</TableHead>
                  <TableHead className="min-w-[150px]">Category</TableHead>
                  <TableHead className="min-w-[200px]">Description</TableHead>
                  <TableHead className="text-right min-w-[100px]">Amount</TableHead>
                  <TableHead className="min-w-[120px]">Paid By</TableHead>
                  <TableHead className="min-w-[100px]">Approval</TableHead>
                  <TableHead className="text-right min-w-[180px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="p-0">
                      <EmptyState
                        icon={<FileText className="h-6 w-6" />}
                        title="No expenses match the current filters"
                        description="Try clearing filters or record a new expense."
                        action={
                          <Button size="sm" onClick={openAddExpense} className="bg-pink-600 hover:bg-pink-700 text-white">
                            <Plus className="h-4 w-4" /> Add Expense
                          </Button>
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExpenses.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="text-slate-700 whitespace-nowrap">{formatDate(e.date)}</TableCell>
                      <TableCell className="text-slate-700 text-sm">{e.project?.name || '—'}</TableCell>
                      <TableCell><ExpenseCategoryBadge category={e.category} /></TableCell>
                      <TableCell className="text-slate-700 text-sm max-w-xs truncate">
                        <div className="flex items-center gap-1.5">
                          {e.receiptUrl && <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                          <span className="truncate">{e.description}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-semibold text-slate-900">
                        {formatCurrency(Number(e.amount ?? 0))}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">{e.paidBy || '—'}</TableCell>
                      <TableCell><ApprovalBadge status={e.approvalStatus} /></TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {e.approvalStatus === 'Pending' && (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 md:h-8 md:px-2 md:w-auto"
                                onClick={() => setApproval(e.id, 'Approved')}
                                title="Approve"
                              >
                                <Check className="h-4 w-4" />
                                <span className="hidden md:inline text-xs">Approve</span>
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-red-600 hover:bg-red-50 md:h-8 md:px-2 md:w-auto"
                                onClick={() => setApproval(e.id, 'Rejected')}
                                title="Reject"
                              >
                                <X className="h-4 w-4" />
                                <span className="hidden md:inline text-xs">Reject</span>
                              </Button>
                            </>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 hover:bg-slate-100"
                            onClick={() => openEditExpense(e)}
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-600 hover:bg-red-50"
                            onClick={() => setDeleteId(e.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Add/Edit Expense Dialog */}
      <Dialog
        open={expenseDialog.open}
        onOpenChange={(o) => setExpenseDialog((s) => ({ ...s, open: o }))}
      >
        <DialogContent className="w-full sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {expenseDialog.mode === 'add' ? 'Add New Expense' : 'Edit Expense'}
            </DialogTitle>
            <DialogDescription>
              {expenseDialog.mode === 'add'
                ? 'Record a new project expense with approval tracking.'
                : 'Update the expense details below.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="e-date">Date</Label>
              <Input
                id="e-date"
                type="date"
                value={eForm.date}
                onChange={(e) => setEForm((s) => ({ ...s, date: e.target.value }))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="e-project">Project</Label>
              <Select
                value={eForm.projectId}
                onValueChange={(v) => setEForm((s) => ({ ...s, projectId: v }))}
              >
                <SelectTrigger className="w-full mt-1.5">
                  <SelectValue placeholder="No project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Project</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="e-category">Category</Label>
              <Select
                value={eForm.category}
                onValueChange={(v) => setEForm((s) => ({ ...s, category: v }))}
              >
                <SelectTrigger className="w-full mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="e-amount">Amount (S$) *</Label>
              <Input
                id="e-amount"
                type="number"
                min={0}
                step={0.01}
                value={eForm.amount || ''}
                onChange={(e) => setEForm((s) => ({ ...s, amount: Number(e.target.value) }))}
                className="mt-1.5"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="e-description">Description *</Label>
              <Input
                id="e-description"
                value={eForm.description}
                onChange={(e) => setEForm((s) => ({ ...s, description: e.target.value }))}
                placeholder="e.g. Pickup truck rental for site visit"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="e-paid-by">Paid By</Label>
              <Input
                id="e-paid-by"
                value={eForm.paidBy}
                onChange={(e) => setEForm((s) => ({ ...s, paidBy: e.target.value }))}
                placeholder="Name of payee"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="e-status">Approval Status</Label>
              <Select
                value={eForm.approvalStatus}
                onValueChange={(v) => setEForm((s) => ({ ...s, approvalStatus: v as any }))}
              >
                <SelectTrigger className="w-full mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="e-receipt">Receipt URL</Label>
              <div className="flex gap-2 mt-1.5">
                <Input
                  id="e-receipt"
                  value={eForm.receiptUrl}
                  onChange={(e) => setEForm((s) => ({ ...s, receiptUrl: e.target.value }))}
                  placeholder="Filename or URL of receipt"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('e-receipt-file')?.click()}
                  className="shrink-0"
                >
                  <Upload className="h-4 w-4" /> <span className="hidden sm:inline">Upload</span>
                </Button>
                <input
                  id="e-receipt-file"
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={onReceiptUpload}
                />
              </div>
              {eForm.receiptUrl && (
                <p className="mt-1 text-xs text-emerald-700 flex items-center gap-1">
                  <FileText className="h-3 w-3" /> Attached: {eForm.receiptUrl}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpenseDialog({ open: false, mode: 'add' })}>
              Cancel
            </Button>
            <Button
              onClick={submitExpense}
              disabled={saving}
              className="bg-pink-600 hover:bg-pink-700 text-white"
            >
              {saving ? 'Saving…' : expenseDialog.mode === 'add' ? 'Add Expense' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the expense record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
