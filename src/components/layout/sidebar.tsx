'use client'
import { useAppStore } from '@/store/app-store'
import { canAccess, type NavKey, type RoleKey, ROLES, APP_NAME, APP_TAGLINE } from '@/lib/constants'
import { Sun, LayoutDashboard, FolderKanban, TrendingUp, ListChecks, Users, Package, DollarSign, ShieldAlert, FileText, FileBarChart, Settings, Smartphone, X, LogOut, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const NAV_ITEMS: { key: NavKey; label: string; icon: React.ReactNode }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { key: 'projects', label: 'Projects', icon: <FolderKanban className="h-5 w-5" /> },
  { key: 'progress', label: 'Progress', icon: <TrendingUp className="h-5 w-5" /> },
  { key: 'tasks', label: 'Tasks', icon: <ListChecks className="h-5 w-5" /> },
  { key: 'manpower', label: 'Manpower', icon: <Users className="h-5 w-5" /> },
  { key: 'materials', label: 'Materials', icon: <Package className="h-5 w-5" /> },
  { key: 'expenses', label: 'Expenses', icon: <DollarSign className="h-5 w-5" /> },
  { key: 'safety', label: 'Safety', icon: <ShieldAlert className="h-5 w-5" /> },
  { key: 'documents', label: 'Documents', icon: <FileText className="h-5 w-5" /> },
  { key: 'reports', label: 'Reports', icon: <FileBarChart className="h-5 w-5" /> },
  { key: 'settings', label: 'Settings', icon: <Settings className="h-5 w-5" /> },
]

export function Sidebar() {
  const { user, currentNav, setNav, sidebarOpen, setSidebarOpen, logout } = useAppStore()
  if (!user) return null
  const role = user.role as RoleKey

  const visibleItems = NAV_ITEMS.filter(i => canAccess(role, i.key))
  const showMobile = canAccess(role, 'mobile')

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
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
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow shrink-0">
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
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 ayk-scrollbar">
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Main</p>
          {visibleItems.map(item => {
            const active = currentNav === item.key
            return (
              <button
                key={item.key}
                onClick={() => { setNav(item.key); setSidebarOpen(false) }}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                  active
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )}
              >
                <span className={cn('shrink-0', active ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400')}>{item.icon}</span>
                <span className="flex-1 text-left truncate">{item.label}</span>
                {active && <ChevronRight className="h-4 w-4 text-white/70" />}
              </button>
            )
          })}

          {showMobile && (
            <>
              <p className="px-3 mb-2 mt-6 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Field</p>
              <button
                onClick={() => { setNav('mobile'); setSidebarOpen(false) }}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                  currentNav === 'mobile' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )}
              >
                <Smartphone className={cn('h-5 w-5 shrink-0', currentNav === 'mobile' ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400')} />
                <span className="flex-1 text-left">Mobile Site View</span>
              </button>
            </>
          )}
        </nav>

        {/* User panel */}
        <div className="border-t border-slate-800 p-3 shrink-0">
          <div className="flex items-center gap-3 rounded-lg bg-slate-800/50 px-3 py-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white text-sm font-bold shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{user.name}</div>
              <div className="text-[11px] text-slate-400 truncate">{ROLES[role]}</div>
            </div>
            <button onClick={logout} title="Sign out" className="text-slate-400 hover:text-red-400 transition shrink-0">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
