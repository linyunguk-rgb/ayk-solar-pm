'use client'

import { useMemo, useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { useFetch, apiPost, apiPut, apiDelete } from '@/hooks/use-fetch'
import { SectionHeader, SubSection } from '@/components/shared/section-header'
import { StatCard } from '@/components/shared/stat-card'
import { EmptyState } from '@/components/shared/empty-state'
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  Package, Plus, ArrowLeftRight, AlertTriangle, Pencil, Trash2,
  ArrowDownToLine, ArrowUpFromLine, ArrowLeft as ArrowIn, Boxes, Layers,
  DollarSign, PackageX, Warehouse, BarChart3,
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, Legend,
} from 'recharts'
import {
  MATERIAL_CATEGORIES, MATERIAL_CATEGORY_LABELS,
  formatCurrency, formatDate,
} from '@/lib/constants'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Distinct category badge colors (no indigo)
const CATEGORY_BADGE: Record<string, string> = {
  SolarPanels: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100',
  DCCables: 'bg-sky-100 text-sky-700 border-sky-200 hover:bg-sky-100',
  ACCables: 'bg-teal-100 text-teal-700 border-teal-200 hover:bg-teal-100',
  MountingRails: 'bg-slate-200 text-slate-700 border-slate-300 hover:bg-slate-200',
  Inverters: 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
  MC4Connectors: 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100',
  Bolts: 'bg-violet-100 text-violet-700 border-violet-200 hover:bg-violet-100',
  Other: 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100',
}

function CategoryBadge({ category }: { category: string }) {
  return (
    <Badge variant="outline" className={cn('font-medium', CATEGORY_BADGE[category] || CATEGORY_BADGE.Other)}>
      {MATERIAL_CATEGORY_LABELS[category] || category}
    </Badge>
  )
}

function TransactionTypeBadge({ type }: { type: string }) {
  const cls =
    type === 'Add' ? 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
      : type === 'Issue' ? 'bg-sky-100 text-sky-700 border-sky-200 hover:bg-sky-100'
        : 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100'
  return <Badge variant="outline" className={cn('font-medium', cls)}>{type}</Badge>
}

function formatQty(n: number | null | undefined): string {
  const v = Number(n ?? 0)
  if (!isFinite(v)) return '0'
  return Number.isInteger(v) ? String(v) : String(v)
}

interface MaterialFormState {
  name: string
  category: string
  unit: string
  stockQty: number
  minStockLevel: number
  unitPrice: number
  supplier: string
}

const EMPTY_MATERIAL_FORM: MaterialFormState = {
  name: '',
  category: 'SolarPanels',
  unit: 'pcs',
  stockQty: 0,
  minStockLevel: 0,
  unitPrice: 0,
  supplier: '',
}

interface TxnFormState {
  materialId: string
  projectId: string
  type: 'Add' | 'Issue' | 'Return'
  qty: number
  remarks: string
}

const EMPTY_TXN_FORM: TxnFormState = {
  materialId: '',
  projectId: 'none',
  type: 'Add',
  qty: 0,
  remarks: '',
}

export function MaterialsPage() {
  const { user } = useAppStore()

  const [activeTab, setActiveTab] = useState<'inventory' | 'transactions'>('inventory')

  // Inventory filters
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [lowStockOnly, setLowStockOnly] = useState(false)

  // Transaction filters
  const [txnMaterialFilter, setTxnMaterialFilter] = useState<string>('all')
  const [txnProjectFilter, setTxnProjectFilter] = useState<string>('all')
  const [txnTypeFilter, setTxnTypeFilter] = useState<string>('all')

  // Material dialog state (add/edit)
  const [materialDialog, setMaterialDialog] = useState<{ open: boolean; mode: 'add' | 'edit'; material?: any }>({
    open: false, mode: 'add',
  })
  const [mForm, setMForm] = useState<MaterialFormState>(EMPTY_MATERIAL_FORM)
  const [savingMaterial, setSavingMaterial] = useState(false)

  // Transaction dialog state
  const [txnDialog, setTxnDialog] = useState<{ open: boolean; material?: any; type?: 'Add' | 'Issue' | 'Return' }>({
    open: false,
  })
  const [tForm, setTForm] = useState<TxnFormState>(EMPTY_TXN_FORM)
  const [savingTxn, setSavingTxn] = useState(false)

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Fetches (single-source-of-truth: no server filter; filter client-side)
  const { data: materialsData, loading: loadingMaterials, refetch: refetchMaterials } = useFetch<any>('/api/materials')
  const { data: txnData, loading: loadingTxns, refetch: refetchTxns } = useFetch<any>('/api/transactions')
  const { data: projectsData } = useFetch<any>('/api/projects')

  const materials = (materialsData?.materials || []) as any[]
  const transactions = (txnData?.transactions || []) as any[]
  const projects = (projectsData?.projects || []) as any[]

  // Filtered inventory
  const filteredMaterials = useMemo(() => {
    let arr = [...materials]
    if (categoryFilter !== 'all') arr = arr.filter((m) => m.category === categoryFilter)
    if (lowStockOnly) arr = arr.filter((m) => Number(m.stockQty ?? 0) <= Number(m.minStockLevel ?? 0))
    return arr
  }, [materials, categoryFilter, lowStockOnly])

  // Filtered transactions
  const filteredTxns = useMemo(() => {
    let arr = [...transactions]
    if (txnMaterialFilter !== 'all') arr = arr.filter((t) => t.materialId === txnMaterialFilter)
    if (txnProjectFilter !== 'all') arr = arr.filter((t) => t.projectId === txnProjectFilter)
    if (txnTypeFilter !== 'all') arr = arr.filter((t) => t.type === txnTypeFilter)
    return arr
  }, [transactions, txnMaterialFilter, txnProjectFilter, txnTypeFilter])

  // Stats
  const stats = useMemo(() => {
    const total = materials.length
    const lowStock = materials.filter((m) => Number(m.stockQty ?? 0) <= Number(m.minStockLevel ?? 0)).length
    const outOfStock = materials.filter((m) => Number(m.stockQty ?? 0) <= 0).length
    const totalStockValue = materials.reduce((s, m) => s + (Number(m.stockQty ?? 0) * Number(m.unitPrice ?? 0)), 0)
    const categories = new Set(materials.map((m) => m.category)).size
    return { total, lowStock, outOfStock, totalStockValue, categories }
  }, [materials])

  // Low stock materials (for alert card)
  const lowStockMaterials = useMemo(
    () => materials.filter((m) => Number(m.stockQty ?? 0) <= Number(m.minStockLevel ?? 0)),
    [materials],
  )

  // Usage chart: total issued qty per material in last 30 days
  const usageChart = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 30)
    const map: Record<string, { name: string; issued: number; added: number; returned: number }> = {}
    for (const t of transactions) {
      const d = new Date(t.date)
      if (d < cutoff) continue
      const key = t.materialId || 'unknown'
      const mname = t.material?.name || 'Unknown'
      if (!map[key]) map[key] = { name: mname, issued: 0, added: 0, returned: 0 }
      if (t.type === 'Issue') map[key].issued += Number(t.qty ?? 0)
      else if (t.type === 'Add') map[key].added += Number(t.qty ?? 0)
      else if (t.type === 'Return') map[key].returned += Number(t.qty ?? 0)
    }
    return Object.values(map).sort((a, b) => b.issued - a.issued).slice(0, 10)
  }, [transactions])

  // ---------- Handlers ----------
  const openAddMaterial = () => {
    setMForm(EMPTY_MATERIAL_FORM)
    setMaterialDialog({ open: true, mode: 'add' })
  }

  const openEditMaterial = (m: any) => {
    setMForm({
      name: m.name || '',
      category: m.category || 'SolarPanels',
      unit: m.unit || 'pcs',
      stockQty: Number(m.stockQty) || 0,
      minStockLevel: Number(m.minStockLevel) || 0,
      unitPrice: Number(m.unitPrice) || 0,
      supplier: m.supplier || '',
    })
    setMaterialDialog({ open: true, mode: 'edit', material: m })
  }

  const submitMaterial = async () => {
    if (!mForm.name.trim()) {
      toast.error('Material name is required')
      return
    }
    if (!mForm.category) {
      toast.error('Material category is required')
      return
    }
    setSavingMaterial(true)
    try {
      const body = {
        name: mForm.name.trim(),
        category: mForm.category,
        unit: mForm.unit || 'pcs',
        stockQty: Number(mForm.stockQty) || 0,
        minStockLevel: Number(mForm.minStockLevel) || 0,
        unitPrice: Number(mForm.unitPrice) || 0,
        supplier: mForm.supplier?.trim() || null,
      }
      if (materialDialog.mode === 'add') {
        await apiPost('/api/materials', body)
        toast.success(`Material "${body.name}" added`)
      } else if (materialDialog.mode === 'edit' && materialDialog.material?.id) {
        await apiPut(`/api/materials/${materialDialog.material.id}`, body)
        toast.success(`Material "${body.name}" updated`)
      }
      setMaterialDialog({ open: false, mode: 'add' })
      refetchMaterials()
    } catch (e: any) {
      toast.error(e.message || 'Failed to save material')
    } finally {
      setSavingMaterial(false)
    }
  }

  const openTxnDialog = (opts?: { material?: any; type?: 'Add' | 'Issue' | 'Return' }) => {
    setTForm({
      materialId: opts?.material?.id || '',
      projectId: 'none',
      type: opts?.type || 'Add',
      qty: 0,
      remarks: '',
    })
    setTxnDialog({ open: true, material: opts?.material, type: opts?.type })
  }

  const submitTxn = async () => {
    if (!tForm.materialId) {
      toast.error('Select a material')
      return
    }
    if (!tForm.qty || Number(tForm.qty) <= 0) {
      toast.error('Quantity must be greater than 0')
      return
    }
    setSavingTxn(true)
    try {
      const body = {
        materialId: tForm.materialId,
        projectId: tForm.projectId && tForm.projectId !== 'none' ? tForm.projectId : null,
        type: tForm.type,
        qty: Number(tForm.qty),
        remarks: tForm.remarks?.trim() || null,
        date: new Date().toISOString(),
      }
      await apiPost<any>('/api/transactions', body)
      toast.success(`${tForm.type} ${body.qty} — stock updated`)
      setTxnDialog({ open: false })
      refetchMaterials()
      refetchTxns()
    } catch (e: any) {
      toast.error(e.message || 'Failed to record transaction')
    } finally {
      setSavingTxn(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    try {
      await apiDelete(`/api/materials/${deleteId}`)
      toast.success('Material deleted')
      refetchMaterials()
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete material')
    } finally {
      setDeleteId(null)
    }
  }

  // ---------- Render: Loading ----------
  if (loadingMaterials && !materialsData) {
    return (
      <div className="space-y-6">
        <SectionHeader
          section="materials"
          title="Material Management"
          description="Track solar materials, stock and transactions"
          icon={<Package className="h-6 w-6" />}
        />
        <div>
          <SubSection section="materials" title="Inventory Summary" icon={<BarChart3 className="h-4 w-4" />} />
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
        <Card className="overflow-hidden border-border/60">
          <CardContent className="p-6">
            <Skeleton className="h-72 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        section="materials"
        title="Material Management"
        description="Track solar materials, stock and transactions"
        icon={<Package className="h-6 w-6" />}
        actions={
          <>
            <Button onClick={openAddMaterial} className="bg-violet-600 hover:bg-violet-700 text-white">
              <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Add Material</span><span className="sm:hidden">Add</span>
            </Button>
            <Button variant="outline" onClick={() => openTxnDialog()} className="border-violet-200 text-violet-700 hover:bg-violet-50">
              <ArrowLeftRight className="h-4 w-4" /> <span className="hidden sm:inline">New Transaction</span><span className="sm:hidden">Transaction</span>
            </Button>
          </>
        }
      />

      {/* Stat cards — Inventory Summary */}
      <div>
        <SubSection
          section="materials"
          title="Inventory Summary"
          description="Stock levels and inventory value at a glance"
          icon={<BarChart3 className="h-4 w-4" />}
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            section="materials"
            title="Total Materials"
            value={stats.total ?? 0}
            subtitle={`${stats.categories ?? 0} categories`}
            icon={<Boxes className="h-5 w-5" />}
          />
          <StatCard
            section="safety"
            title="Low Stock Items"
            value={stats.lowStock ?? 0}
            subtitle={`${stats.outOfStock ?? 0} out of stock`}
            icon={<AlertTriangle className="h-5 w-5" />}
          />
          <StatCard
            section="materials"
            title="Total Stock Value"
            value={formatCurrency(stats.totalStockValue)}
            subtitle="Inventory worth"
            icon={<DollarSign className="h-5 w-5" />}
          />
          <StatCard
            section="materials"
            title="Categories"
            value={stats.categories ?? 0}
            subtitle="Distinct types"
            icon={<Layers className="h-5 w-5" />}
          />
        </div>
      </div>

      {/* Low stock alert card */}
      {lowStockMaterials.length > 0 && (
        <Card className="border-amber-300 bg-amber-50/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-amber-800">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-200 text-amber-800">
                <AlertTriangle className="h-4 w-4" />
              </span>
              Low Stock Alert
              <Badge className="bg-amber-200 text-amber-800 border-amber-300 ml-1">{lowStockMaterials.length}</Badge>
            </CardTitle>
            <CardDescription className="text-xs text-amber-800/80 pl-9">
              {lowStockMaterials.length} item(s) at or below minimum stock level — please restock
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-72 overflow-y-auto ayk-scrollbar pr-1">
              {lowStockMaterials.map((m) => {
                const out = Number(m.stockQty ?? 0) <= 0
                return (
                  <div
                    key={m.id}
                    className={cn(
                      'flex items-center justify-between rounded-lg border bg-white px-3 py-2.5',
                      out ? 'border-red-200' : 'border-amber-200',
                    )}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">{m.name || 'Unnamed'}</div>
                      <div className="text-xs text-slate-500">
                        Min: {formatQty(m.minStockLevel)} {m.unit || ''}
                      </div>
                    </div>
                    <Badge
                      className={cn(
                        'shrink-0',
                        out
                          ? 'bg-red-100 text-red-700 border-red-200'
                          : 'bg-amber-100 text-amber-800 border-amber-200',
                      )}
                    >
                      {formatQty(m.stockQty)} {m.unit || ''}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'inventory' | 'transactions')}>
        <TabsList className="bg-violet-50">
          <TabsTrigger value="inventory" className="data-[state=active]:bg-white data-[state=active]:text-violet-700">
            <Package className="h-4 w-4" /> <span className="hidden sm:inline">Inventory</span>
          </TabsTrigger>
          <TabsTrigger value="transactions" className="data-[state=active]:bg-white data-[state=active]:text-violet-700">
            <ArrowLeftRight className="h-4 w-4" /> <span className="hidden sm:inline">Transactions</span>
          </TabsTrigger>
        </TabsList>

        {/* Inventory tab */}
        <TabsContent value="inventory" className="space-y-4">
          {/* Filter bar */}
          <Card className="shadow-sm border-border/60">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                <div className="flex-1 min-w-[180px]">
                  <Label className="mb-1.5 text-xs text-muted-foreground uppercase tracking-wide">Category</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {MATERIAL_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {MATERIAL_CATEGORY_LABELS[c]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 pb-1">
                  <Checkbox
                    id="low-stock-only"
                    checked={lowStockOnly}
                    onCheckedChange={(v) => setLowStockOnly(v === true)}
                  />
                  <Label htmlFor="low-stock-only" className="text-sm cursor-pointer">
                    Low Stock Only
                  </Label>
                </div>
                <div className="text-xs text-muted-foreground sm:ml-auto sm:pb-1">
                  {filteredMaterials.length} of {materials.length} shown
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inventory table */}
          <Card className="shadow-sm border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                  <Warehouse className="h-4 w-4" />
                </span>
                Inventory List
              </CardTitle>
              <CardDescription className="text-xs pl-9">
                Manage stock levels, pricing and supplier details
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <ScrollArea className="max-h-[500px] w-full">
                <Table>
                  <TableHeader className="sticky top-0 bg-card z-10">
                    <TableRow>
                      <TableHead className="min-w-[180px]">Name</TableHead>
                      <TableHead className="min-w-[120px]">Category</TableHead>
                      <TableHead className="text-right min-w-[90px]">Stock Qty</TableHead>
                      <TableHead className="min-w-[70px]">Unit</TableHead>
                      <TableHead className="text-right min-w-[90px]">Min Level</TableHead>
                      <TableHead className="text-right min-w-[100px]">Unit Price</TableHead>
                      <TableHead className="text-right min-w-[110px]">Stock Value</TableHead>
                      <TableHead className="min-w-[140px]">Supplier</TableHead>
                      <TableHead className="text-right min-w-[180px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMaterials.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="p-0">
                          <EmptyState
                            icon={<PackageX className="h-6 w-6" />}
                            title="No materials match the current filters"
                            description="Try clearing filters or add a new material to get started."
                            action={
                              <Button size="sm" onClick={openAddMaterial} className="bg-violet-600 hover:bg-violet-700 text-white">
                                <Plus className="h-4 w-4" /> Add Material
                              </Button>
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredMaterials.map((m) => {
                        const isLow = Number(m.stockQty ?? 0) <= Number(m.minStockLevel ?? 0)
                        const stockValue = (Number(m.stockQty ?? 0)) * (Number(m.unitPrice ?? 0))
                        return (
                          <TableRow key={m.id}>
                            <TableCell className="font-medium text-slate-900">{m.name || 'Unnamed'}</TableCell>
                            <TableCell><CategoryBadge category={m.category} /></TableCell>
                            <TableCell className="text-right">
                              <span
                                className={cn(
                                  'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-semibold tabular-nums',
                                  isLow
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-emerald-100 text-emerald-700',
                                )}
                              >
                                {isLow && <AlertTriangle className="h-3 w-3" />}
                                {formatQty(m.stockQty)}
                              </span>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{m.unit || '—'}</TableCell>
                            <TableCell className="text-right tabular-nums text-slate-600">{formatQty(m.minStockLevel)}</TableCell>
                            <TableCell className="text-right tabular-nums text-slate-700">{formatCurrency(Number(m.unitPrice ?? 0))}</TableCell>
                            <TableCell className="text-right tabular-nums font-medium text-slate-900">{formatCurrency(stockValue)}</TableCell>
                            <TableCell className="text-muted-foreground text-xs">{m.supplier || '—'}</TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-emerald-600 hover:bg-emerald-50"
                                  onClick={() => openTxnDialog({ material: m, type: 'Add' })}
                                  title="Add Stock"
                                >
                                  <ArrowDownToLine className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-sky-600 hover:bg-sky-50"
                                  onClick={() => openTxnDialog({ material: m, type: 'Issue' })}
                                  title="Issue"
                                >
                                  <ArrowUpFromLine className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-amber-600 hover:bg-amber-50"
                                  onClick={() => openTxnDialog({ material: m, type: 'Return' })}
                                  title="Return"
                                >
                                  <ArrowIn className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 hover:bg-slate-100"
                                  onClick={() => openEditMaterial(m)}
                                  title="Edit"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-red-600 hover:bg-red-50"
                                  onClick={() => setDeleteId(m.id)}
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card className="shadow-sm border-border/60">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="mb-1.5 text-xs text-muted-foreground uppercase tracking-wide">Material</Label>
                  <Select value={txnMaterialFilter} onValueChange={setTxnMaterialFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All materials" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Materials</SelectItem>
                      {materials.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-1.5 text-xs text-muted-foreground uppercase tracking-wide">Project</Label>
                  <Select value={txnProjectFilter} onValueChange={setTxnProjectFilter}>
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
                  <Label className="mb-1.5 text-xs text-muted-foreground uppercase tracking-wide">Type</Label>
                  <Select value={txnTypeFilter} onValueChange={setTxnTypeFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Add">Add</SelectItem>
                      <SelectItem value="Issue">Issue</SelectItem>
                      <SelectItem value="Return">Return</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                  <ArrowLeftRight className="h-4 w-4" />
                </span>
                Material Transactions
              </CardTitle>
              <CardDescription className="text-xs pl-9">
                Stock movements — adds, issues and returns
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <ScrollArea className="max-h-[500px] w-full">
                <Table>
                  <TableHeader className="sticky top-0 bg-card z-10">
                    <TableRow>
                      <TableHead className="min-w-[110px]">Date</TableHead>
                      <TableHead className="min-w-[180px]">Material</TableHead>
                      <TableHead className="min-w-[90px]">Type</TableHead>
                      <TableHead className="text-right min-w-[80px]">Qty</TableHead>
                      <TableHead className="min-w-[160px]">Project</TableHead>
                      <TableHead className="min-w-[200px]">Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingTxns && !txnData ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-6">
                          <Skeleton className="h-10 w-full" />
                        </TableCell>
                      </TableRow>
                    ) : filteredTxns.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="p-0">
                          <EmptyState
                            icon={<ArrowLeftRight className="h-6 w-6" />}
                            title="No transactions match the current filters"
                            description="Try clearing filters or record a new stock movement."
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTxns.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="text-slate-700 whitespace-nowrap">{formatDate(t.date)}</TableCell>
                          <TableCell className="font-medium text-slate-900">
                            {t.material?.name || '—'}
                          </TableCell>
                          <TableCell><TransactionTypeBadge type={t.type} /></TableCell>
                          <TableCell className="text-right tabular-nums font-semibold text-slate-900">
                            {formatQty(t.qty)}
                          </TableCell>
                          <TableCell className="text-slate-600 text-sm">{t.project?.name || '—'}</TableCell>
                          <TableCell className="text-muted-foreground text-xs max-w-xs truncate">
                            {t.remarks || '—'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Material usage chart */}
      <Card className="shadow-sm border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
              <BarChart3 className="h-4 w-4" />
            </span>
            Material Usage — Last 30 Days
          </CardTitle>
          <CardDescription className="text-xs pl-9">
            Total quantity added, issued and returned per material (units: qty)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usageChart.length === 0 ? (
            <EmptyState
              icon={<BarChart3 className="h-6 w-6" />}
              title="No material movements in the last 30 days"
              description="Once you record stock transactions, usage trends will appear here."
              className="h-[280px]"
            />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={usageChart} margin={{ top: 8, right: 8, left: 8, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  label={{ value: 'qty', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#94a3b8' } }}
                />
                <RTooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="added" name="Added" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="issued" name="Issued" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                <Bar dataKey="returned" name="Returned" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Material Dialog */}
      <Dialog
        open={materialDialog.open}
        onOpenChange={(o) => setMaterialDialog((s) => ({ ...s, open: o }))}
      >
        <DialogContent className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto ayk-scrollbar">
          <DialogHeader>
            <DialogTitle>
              {materialDialog.mode === 'add' ? 'Add New Material' : 'Edit Material'}
            </DialogTitle>
            <DialogDescription>
              {materialDialog.mode === 'add'
                ? 'Register a new solar material in the inventory.'
                : 'Update the material details below.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label htmlFor="m-name">Name *</Label>
              <Input
                id="m-name"
                value={mForm.name}
                onChange={(e) => setMForm((s) => ({ ...s, name: e.target.value }))}
                placeholder="e.g. Mono 450W Solar Panel"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="m-category">Category</Label>
              <Select
                value={mForm.category}
                onValueChange={(v) => setMForm((s) => ({ ...s, category: v }))}
              >
                <SelectTrigger className="w-full mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MATERIAL_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{MATERIAL_CATEGORY_LABELS[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="m-unit">Unit</Label>
              <Input
                id="m-unit"
                value={mForm.unit}
                onChange={(e) => setMForm((s) => ({ ...s, unit: e.target.value }))}
                placeholder="pcs / meters / rolls"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="m-stock">Stock Quantity</Label>
              <Input
                id="m-stock"
                type="number"
                min={0}
                value={mForm.stockQty}
                onChange={(e) => setMForm((s) => ({ ...s, stockQty: Number(e.target.value) }))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="m-min">Minimum Stock Level</Label>
              <Input
                id="m-min"
                type="number"
                min={0}
                value={mForm.minStockLevel}
                onChange={(e) => setMForm((s) => ({ ...s, minStockLevel: Number(e.target.value) }))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="m-price">Unit Price (S$)</Label>
              <Input
                id="m-price"
                type="number"
                min={0}
                step={0.01}
                value={mForm.unitPrice}
                onChange={(e) => setMForm((s) => ({ ...s, unitPrice: Number(e.target.value) }))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="m-supplier">Supplier</Label>
              <Input
                id="m-supplier"
                value={mForm.supplier}
                onChange={(e) => setMForm((s) => ({ ...s, supplier: e.target.value }))}
                placeholder="Supplier name"
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMaterialDialog({ open: false, mode: 'add' })}>
              Cancel
            </Button>
            <Button
              onClick={submitMaterial}
              disabled={savingMaterial}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {savingMaterial ? 'Saving…' : materialDialog.mode === 'add' ? 'Add Material' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction Dialog (Add Stock / Issue / Return / New Transaction) */}
      <Dialog
        open={txnDialog.open}
        onOpenChange={(o) => setTxnDialog((s) => ({ ...s, open: o }))}
      >
        <DialogContent className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto ayk-scrollbar">
          <DialogHeader>
            <DialogTitle>
              {txnDialog.material
                ? `${txnDialog.type || 'New'} — ${txnDialog.material.name}`
                : 'New Material Transaction'}
            </DialogTitle>
            <DialogDescription>
              Record a stock movement. Stock levels will update automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!txnDialog.material && (
              <div>
                <Label htmlFor="t-material">Material *</Label>
                <Select
                  value={tForm.materialId}
                  onValueChange={(v) => setTForm((s) => ({ ...s, materialId: v }))}
                >
                  <SelectTrigger className="w-full mt-1.5">
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                  <SelectContent>
                    {materials.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} ({formatQty(m.stockQty)} {m.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label htmlFor="t-type">Transaction Type</Label>
              <Select
                value={tForm.type}
                onValueChange={(v) => setTForm((s) => ({ ...s, type: v as 'Add' | 'Issue' | 'Return' }))}
                disabled={!!txnDialog.material && !!txnDialog.type}
              >
                <SelectTrigger className="w-full mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Add">Add (Stock In)</SelectItem>
                  <SelectItem value="Issue">Issue (Stock Out)</SelectItem>
                  <SelectItem value="Return">Return (Stock Back)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="t-qty">Quantity *</Label>
              <Input
                id="t-qty"
                type="number"
                min={1}
                value={tForm.qty || ''}
                onChange={(e) => setTForm((s) => ({ ...s, qty: Number(e.target.value) }))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="t-project">Project</Label>
              <Select
                value={tForm.projectId}
                onValueChange={(v) => setTForm((s) => ({ ...s, projectId: v }))}
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
              <Label htmlFor="t-remarks">Remarks</Label>
              <Input
                id="t-remarks"
                value={tForm.remarks}
                onChange={(e) => setTForm((s) => ({ ...s, remarks: e.target.value }))}
                placeholder="Optional notes"
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTxnDialog({ open: false })}>
              Cancel
            </Button>
            <Button
              onClick={submitTxn}
              disabled={savingTxn}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {savingTxn ? 'Saving…' : 'Record Transaction'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Material?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the material and all its transaction records. This action cannot be undone.
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
