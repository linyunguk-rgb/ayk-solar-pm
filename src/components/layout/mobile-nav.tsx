'use client'
import { useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { canAccess, type NavKey, type RoleKey, ROLES, APP_NAME } from '@/lib/constants'
import { Home, FolderKanban, ListChecks, FileBarChart, Menu as MenuIcon, Sun, TrendingUp, Users, Package, DollarSign, ShieldAlert, FileText, Settings, Smartphone, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

const bottomItems: { key: NavKey; label: string; icon: React.ReactNode }[] = [
  { key: 'dashboard', label: 'Home', icon: <Home className="h-5 w-5" /> },
  { key: 'projects', label: 'Projects', icon: <FolderKanban className="h-5 w-5" /> },
  { key: 'tasks', label: 'Tasks', icon: <ListChecks className="h-5 w-5" /> },
  { key: 'reports', label: 'Reports', icon: <FileBarChart className="h-5 w-5" /> },
]

const moreItems: { key: NavKey; label: string; icon: React.ReactNode }[] = [
  { key: 'progress', label: 'Progress', icon: <TrendingUp className="h-5 w-5" /> },
  { key: 'manpower', label: 'Manpower', icon: <Users className="h-5 w-5" /> },
  { key: 'materials', label: 'Materials', icon: <Package className="h-5 w-5" /> },
  { key: 'expenses', label: 'Expenses', icon: <DollarSign className="h-5 w-5" /> },
  { key: 'safety', label: 'Safety', icon: <ShieldAlert className="h-5 w-5" /> },
  { key: 'documents', label: 'Documents', icon: <FileText className="h-5 w-5" /> },
  { key: 'mobile', label: 'Site View', icon: <Smartphone className="h-5 w-5" /> },
  { key: 'daily-entry', label: 'Daily Entry', icon: <FileText className="h-5 w-5" /> },
  { key: 'settings', label: 'Settings', icon: <Settings className="h-5 w-5" /> },
]

export function MobileNav() {
  const { user, currentNav, setNav, logout } = useAppStore()
  const [moreOpen, setMoreOpen] = useState(false)

  if (!user) return null
  const role = user.role as RoleKey

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5 h-16">
          {bottomItems.filter(i => canAccess(role, i.key)).slice(0, 4).map(item => {
            const active = currentNav === item.key
            return (
              <button
                key={item.key}
                onClick={() => setNav(item.key)}
                className={cn('flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition', active ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-700')}
              >
                <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg transition', active && 'bg-emerald-50')}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            )
          })}
          <button
            onClick={() => setMoreOpen(true)}
            className={cn('flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition', moreOpen ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-700')}
          >
            <span className="flex h-7 w-7 items-center justify-center"><MenuIcon className="h-5 w-5" /></span>
            More
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="h-[80vh] p-0">
          <SheetHeader className="px-5 pt-5 pb-3 border-b border-slate-100">
            <SheetTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700">
                <Sun className="h-4 w-4 text-white" />
              </div>
              <span>{APP_NAME}</span>
            </SheetTitle>
          </SheetHeader>
          <div className="px-5 py-4 overflow-y-auto ayk-scrollbar">
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white font-bold">
                {user.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-slate-900 truncate">{user.name}</div>
                <div className="text-xs text-slate-500 truncate">{ROLES[role]}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {moreItems.filter(i => canAccess(role, i.key)).map(item => {
                const active = currentNav === item.key
                return (
                  <button
                    key={item.key}
                    onClick={() => { setNav(item.key); setMoreOpen(false) }}
                    className={cn('flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition', active ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-700 hover:bg-slate-50')}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-sm">{item.icon}</span>
                    <span className="text-xs font-medium">{item.label}</span>
                  </button>
                )
              })}
            </div>
            <Button variant="outline" className="w-full mt-5 text-red-600 border-red-200 hover:bg-red-50" onClick={() => { logout(); setMoreOpen(false) }}>
              <LogOut className="h-4 w-4 mr-2" /> Sign out
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
