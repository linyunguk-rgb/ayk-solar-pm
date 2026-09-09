'use client'
import { useAppStore } from '@/store/app-store'
import { useFetch } from '@/hooks/use-fetch'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { StatusBadge } from '@/components/shared/status-badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LayoutDashboard, FolderKanban, TrendingUp, AlertTriangle, DollarSign, Wallet, Users, ListChecks, Package, ShieldAlert, ArrowRight, MapPin, Calendar, Sun } from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts'
import { formatCurrency, formatNumber, formatDate } from '@/lib/constants'
import { cn } from '@/lib/utils'

const PIE_COLORS = ['#10b981', '#0ea5e9', '#f59e0b', '#ef4444', '#a78bfa']

export function DashboardPage() {
  const { data, loading } = useFetch<any>('/api/dashboard')
  const { openProject, setNav, user } = useAppStore()

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Solar project overview" icon={<LayoutDashboard className="h-5 w-5" />} />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Card key={i} className="animate-pulse"><CardContent className="p-4 h-28" /></Card>
          ))}
        </div>
      </div>
    )
  }

  const s = data.stats
  const charts = data.charts
  const first = user?.name?.split(' ')[0]

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${first || 'Team'} 👋`}
        description="Here's what's happening across your solar projects today"
        icon={<LayoutDashboard className="h-5 w-5" />}
        actions={
          <Button onClick={() => setNav('daily-entry')} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Sun className="h-4 w-4 mr-2" /> Update Progress
          </Button>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCard title="Active Projects" value={s.activeProjects ?? 0} subtitle={`${s.totalProjects ?? 0} total · ${s.completedProjects ?? 0} completed`} icon={<FolderKanban className="h-5 w-5" />} accent="green" />
        <StatCard title="Overall Progress" value={`${s.overallProgress ?? 0}%`} subtitle="Across all projects" icon={<TrendingUp className="h-5 w-5" />} accent="blue" />
        <StatCard title="Delayed Projects" value={s.delayedProjects ?? 0} subtitle="Need attention" icon={<AlertTriangle className="h-5 w-5" />} accent="red" />
        <StatCard title="Total Budget" value={formatCurrency(s.totalBudget)} subtitle="All projects" icon={<DollarSign className="h-5 w-5" />} accent="purple" />
        <StatCard title="Budget Used" value={formatCurrency(s.budgetUsed)} subtitle={`${formatCurrency(s.remainingBudget)} remaining`} icon={<Wallet className="h-5 w-5" />} accent="orange" />
        <StatCard title="Total Workers" value={s.totalWorkers ?? 0} subtitle={`${s.workersOnSite ?? 0} on site today`} icon={<Users className="h-5 w-5" />} accent="blue" />
        <StatCard title="Pending Tasks" value={s.pendingTasks ?? 0} subtitle={`${s.overdueTasks ?? 0} overdue`} icon={<ListChecks className="h-5 w-5" />} accent="orange" />
        <StatCard title="Material Alerts" value={s.lowStockCount ?? 0} subtitle="Low stock items" icon={<Package className="h-5 w-5" />} accent="red" />
        <StatCard title="Safety Incidents" value={s.totalIncidents ?? 0} subtitle={`${s.openIncidents ?? 0} open · ${s.nearMisses ?? 0} near miss`} icon={<ShieldAlert className="h-5 w-5" />} accent="orange" />
        <StatCard title="PPE Compliance" value={`${s.ppeCompliance ?? 0}%`} subtitle="Average this month" icon={<ShieldAlert className="h-5 w-5" />} accent="green" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Installation Progress — Last 14 Days</CardTitle>
            <CardDescription className="text-xs">Daily panels installed and cumulative trend</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={(charts?.installationTrend) || []} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gInstalled" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" tickFormatter={(d) => { try { const dt = new Date(d); return isNaN(dt.getTime()) ? '' : dt.getDate() + '/' + (dt.getMonth() + 1) } catch { return '' } }} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <RTooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                  labelFormatter={(l) => formatDate(l as string)}
                />
                <Area type="monotone" dataKey="installed" stroke="#10b981" strokeWidth={2} fill="url(#gInstalled)" name="Installed" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Project Status</CardTitle>
            <CardDescription className="text-xs">Distribution across all projects</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Active', value: (charts?.statusDistribution?.Active) ?? 0 },
                    { name: 'Completed', value: (charts?.statusDistribution?.Completed) ?? 0 },
                    { name: 'Delayed', value: (charts?.statusDistribution?.Delayed) ?? 0 },
                    { name: 'On Hold', value: (charts?.statusDistribution?.OnHold) ?? 0 },
                  ]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                >
                  {[0,1,2,3].map(i => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <RTooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Budget vs Actual</CardTitle>
            <CardDescription className="text-xs">By project (S$)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={(charts?.budgetChart) || []} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => formatCurrency(v)} />
                <RTooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} formatter={(v: any) => formatCurrency(v)} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="budget" fill="#0ea5e9" name="Budget" radius={[4,4,0,0]} />
                <Bar dataKey="actual" fill="#f59e0b" name="Actual" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Manpower on Site — Last 7 Days</CardTitle>
            <CardDescription className="text-xs">Daily worker count present on site</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={(charts?.manpowerTrend) || []} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" tickFormatter={(d) => { try { const dt = new Date(d); return isNaN(dt.getTime()) ? '' : dt.getDate() + '/' + (dt.getMonth() + 1) } catch { return '' } }} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <RTooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} labelFormatter={(l) => formatDate(l as string)} />
                <Line type="monotone" dataKey="workers" stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 4, fill: '#0ea5e9' }} name="Workers" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Low stock alerts */}
      {data.lowStockMaterials && data.lowStockMaterials.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-amber-700">
              <AlertTriangle className="h-4 w-4" /> Material Stock Alerts
            </CardTitle>
            <CardDescription className="text-xs">{data.lowStockMaterials.length} item(s) below minimum stock level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.lowStockMaterials.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between rounded-lg border border-amber-200 bg-white px-3 py-2.5">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">{m.name}</div>
                    <div className="text-xs text-slate-500">Min: {m.minStockLevel} {m.unit}</div>
                  </div>
                  <Badge className="bg-red-100 text-red-700 border-red-200 shrink-0">
                    {m.stockQty} {m.unit}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Projects */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-900">Active Projects</h2>
          <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700" onClick={() => setNav('projects')}>
            View all <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(data.projects || []).filter((p: any) => p.status !== 'Completed').slice(0, 6).map((p: any) => (
            <ProjectCard key={p.id} project={p} onOpen={() => openProject(p.id)} />
          ))}
        </div>
      </div>
    </div>
  )
}

function ProjectCard({ project, onOpen }: { project: any; onOpen: () => void }) {
  const pct = Number(project.overall ?? 0)
  const totalPanels = Number(project.totalPanels ?? 0)
  const installedPanels = Number(project.installedPanels ?? 0)
  const budget = Number(project.budget ?? 0)
  const actualCost = Number(project.actualCost ?? 0)
  const installPct = totalPanels > 0 ? Math.round((installedPanels / totalPanels) * 1000) / 10 : 0
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group border-border/60" onClick={onOpen}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-900 truncate group-hover:text-emerald-600 transition">{project.name || 'Untitled'}</h3>
            <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
              <MapPin className="h-3 w-3" /> {project.location || '—'}
            </div>
          </div>
          <StatusBadge status={project.status || 'Active'} />
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-600">Overall Progress</span>
              <span className="font-semibold text-slate-900">{pct}%</span>
            </div>
            <Progress value={pct} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wide">Panels</div>
              <div className="text-sm font-semibold text-slate-900">{formatNumber(installedPanels)} / {formatNumber(totalPanels)}</div>
              <Progress value={installPct} className="h-1.5 mt-1" />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wide">Budget</div>
              <div className="text-sm font-semibold text-slate-900">{formatCurrency(actualCost)} / {formatCurrency(budget)}</div>
              <Progress value={budget > 0 ? Math.min(100, (actualCost / budget) * 100) : 0} className="h-1.5 mt-1" />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {project.startDate ? formatDate(project.startDate) : '—'}</span>
            <span>→</span>
            <span className="flex items-center gap-1">{project.endDate ? formatDate(project.endDate) : '—'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
