'use client'
import { useAppStore } from '@/store/app-store'
import { canAccess, type NavKey, type RoleKey, ROLES, APP_NAME, APP_TAGLINE } from '@/lib/constants'
import { Sun, LayoutDashboard, FolderKanban, TrendingUp, ListChecks, Users, Package, DollarSign, ShieldAlert, FileText, FileBarChart, Settings, Smartphone, X, LogOut, ChevronRight, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SectionKey } from '@/lib/design-system'

interface NavEntry {
  key: NavKey
  label: string
  icon: React.ReactNode
  section: SectionKey
  group: 'main' | 'field' | 'system'
}

const NAV_ITEMS: NavEntry[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" />, section: 'overview', group: 'main' },
  { key: 'projects', label: 'Projects', icon: <FolderKanban className="h-5 w-5" />, section: 'projects', group: 'main' },
  { key: 'progress', label: 'Progress', icon: <TrendingUp className="h-5 w-5" />, section: 'progress', group: 'main' },
  { key: 'tasks', label: 'Tasks', icon: <ListChecks className="h-5 w-5" />, section: 'tasks', group: 'main' },
  { key: 'manpower', label: 'Manpower', icon: <Users className="h-5 w-5" />, section: 'manpower', group: 'main' },
  { key: 'materials', label: 'Materials', icon: <Package className="h-5 w-5" />, section: 'materials', group: 'main' },
  { key: 'expenses', label: 'Expenses', icon: <DollarSign className="h-5 w-5" />, section: 'expenses', group: 'main' },
  { key: 'safety', label: 'Safety', icon: <ShieldAlert className="h-5 w-5" />, section: 'safety', group: 'main' },
  { key: 'documents', label: 'Documents', icon: <FileText className="h-5 w-5" />, section: 'documents', group: 'main' },
  { key: 'reports', label: 'Reports', icon: <FileBarChart className="h-5 w-5" />, section: 'reports', group: 'main' },
  { key: 'mobile', label: 'Mobile Site View', icon: <Smartphone className="h-5 w-5" />, section: 'mobile', group: 'field' },
  { key: 'guide', label: 'User Guide', icon: <HelpCircle className="h-5 w-5" />, section: 'guide', group: 'system' },
  { key: 'settings', label: 'Settings', icon: <Settings className="h-5 w-5" />, section: 'settings', group: 'system' },
]

const GROUP_LABELS: Record<string, { title: string; hint: string }> = {
  main: { title: 'MAIN', hint: 'Core modules' },
  field: { title: 'FIELD', hint: 'Site operations' },
  system: { title: 'SYSTEM', hint: 'Help & config' },
}

export function Sidebar() {
  const { user, currentNav, setNav, sidebarOpen, setSidebarOpen, logout } = useAppStore()
  if (!user) return null
  const role = user.role as RoleKey

  const visibleItems = NAV_ITEMS.filter(i => canAccess(role, i.key))
  const mainItems = visibleItems.filter(i => i.group === 'main')
  const fieldItems = visibleItems.filter(i => i.group === 'field')
  const systemItems = visibleItems.filter(i => i.group === 'system')

  const renderGroup = (items: NavEntry[], groupKey: string) => {
    if (items.length === 0) return null
    const g = GROUP_LABELS[groupKey]
    return (
      <div className="mb-4">
        <div className="px-3 mb-2 flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{g.title}</span>
          <span className="text-[9px] text-slate-600 font-normal">· {g.hint}</span>
        </div>
        <div className="space-y-0.5">
          {items.map(item => {
            const active = currentNav === item.key
            return (
              <button
                key={item.key}
                onClick={() => { setNav(item.key); setSidebarOpen(false) }}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition relative',
                  active
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )}
              >
                {/* Color accent strip on left for active */}
                {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-emerald-300" />}
                <span className={cn('shrink-0 transition', active ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400')}>{item.icon}</span>
                <span className="flex-1 text-left truncate">{item.label}</span>
                {active && <ChevronRight className="h-4 w-4 text-white/70" />}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-slate-900 text-slate-200 transition-transform lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand */}
        <div className="flex items-center justify-between gap-2 px-5 h-16 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shrink-0">
              <Sun className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-white tracking-tight truncate">{APP_NAME}</div>
              <div className="text-[10px] text-emerald-400 truncate">{APP_TAGLINE}</div>
            </div>
          </div>
          <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 ayk-scrollbar">
          {renderGroup(mainItems, 'main')}
          {renderGroup(fieldItems, 'field')}
          {renderGroup(systemItems, 'system')}
        </nav>

        {/* User panel */}
        <div className="border-t border-slate-800 p-3 shrink-0">
          <div className="flex items-center gap-3 rounded-lg bg-slate-800/60 px-3 py-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white text-sm font-bold shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{user.name}</div>
              <div className="text-[11px] text-slate-400 truncate">{ROLES[role]}</div>
            </div>
            <button onClick={logout} title="Sign out" className="text-slate-400 hover:text-red-400 transition shrink-0 p-1">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
