'use client'
import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Menu, Search, Bell, ChevronDown, LogOut, Settings, User as UserIcon, Sun, Check, AlertTriangle, AlertCircle, Info, HelpCircle } from 'lucide-react'
import { useFetch } from '@/hooks/use-fetch'
import { cn } from '@/lib/utils'
import { ROLES, type RoleKey, APP_NAME } from '@/lib/constants'

const notifIcon = (severity: string) => {
  if (severity === 'critical') return <AlertCircle className="h-4 w-4 text-red-500" />
  if (severity === 'warning') return <AlertTriangle className="h-4 w-4 text-amber-500" />
  return <Info className="h-4 w-4 text-sky-500" />
}

export function Topbar() {
  const { user, setSidebarOpen, logout, setNav } = useAppStore()
  const { data: notifData, refetch } = useFetch<any>('/api/notifications')
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [search, setSearch] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  const notifications = notifData?.notifications || []
  const unread = notifications.filter((n: any) => !n.isRead).length

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function markAllRead() {
    await fetch('/api/notifications/all', { method: 'PUT' }).catch(() => {})
    refetch()
  }

  async function markOne(id: string) {
    await fetch(`/api/notifications/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isRead: true }) }).catch(() => {})
    refetch()
  }

  if (!user) return null
  const role = user.role as RoleKey

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur border-b border-slate-200 flex items-center gap-2 px-3 sm:px-6">
      {/* Mobile: hamburger */}
      <button className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition shrink-0" onClick={() => useAppStore.getState().setSidebarOpen(true)}>
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile: compact brand */}
      <div className="lg:hidden flex items-center gap-2 flex-1 min-w-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 shrink-0">
          <Sun className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-bold text-slate-900 truncate">{APP_NAME}</span>
      </div>

      {/* Desktop: search */}
      <div className="relative flex-1 max-w-md hidden lg:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search projects, tasks, workers…"
          className="pl-9 h-9 bg-slate-50 border-slate-200 focus-visible:bg-white"
        />
      </div>

      {/* Desktop: spacer */}
      <div className="hidden lg:block flex-1" />

      {/* Help button (desktop) */}
      <Button variant="ghost" size="icon" className="hidden lg:flex h-9 w-9 text-slate-600" onClick={() => setNav('guide')} title="User Guide">
        <HelpCircle className="h-5 w-5" />
      </Button>

      {/* Notifications */}
      <div className="relative" ref={notifRef}>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
          onClick={() => { setNotifOpen(o => !o); refetch() }}
        >
          <Bell className="h-5 w-5 text-slate-600" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
        {notifOpen && (
          <div className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[480px] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl z-50 ayk-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sticky top-0 bg-white">
              <div>
                <div className="font-semibold text-slate-900">Notifications</div>
                <div className="text-xs text-slate-500">{unread} unread</div>
              </div>
              <Button variant="ghost" size="sm" className="text-xs h-8" onClick={markAllRead}>Mark all read</Button>
            </div>
            <div className="divide-y divide-slate-100">
              {notifications.length === 0 && (
                <div className="px-4 py-10 text-center text-sm text-slate-500">No notifications</div>
              )}
              {notifications.map((n: any) => (
                <button
                  key={n.id}
                  onClick={() => markOne(n.id)}
                  className={cn('flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 w-full transition', !n.isRead && 'bg-emerald-50/40')}
                >
                  <span className="mt-0.5 shrink-0">{notifIcon(n.severity)}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium text-slate-900 truncate">{n.title}</div>
                      {!n.isRead && <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />}
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5 line-clamp-2">{n.message}</div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {new Date(n.createdAt).toLocaleString('en-SG', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* User menu */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(o => !o)}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100 transition"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white text-sm font-bold">
            {user.name.charAt(0)}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-sm font-medium text-slate-900 leading-tight">{user.name.split(' ')[0]}</div>
            <div className="text-[10px] text-slate-500 leading-tight">{ROLES[role] || user.role}</div>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white shadow-2xl z-50 py-1">
            <div className="px-3 py-2 border-b border-slate-100">
              <div className="text-sm font-semibold text-slate-900">{user.name}</div>
              <div className="text-xs text-slate-500 truncate">{user.email}</div>
              <div className="mt-1 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                {ROLES[role] || user.role}
              </div>
            </div>
            <button onClick={() => { setNav('guide'); setMenuOpen(false) }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
              <HelpCircle className="h-4 w-4 text-slate-400" /> User Guide
            </button>
            <button onClick={() => { setNav('settings'); setMenuOpen(false) }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
              <UserIcon className="h-4 w-4 text-slate-400" /> My Profile
            </button>
            <button onClick={() => { setNav('settings'); setMenuOpen(false) }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
              <Settings className="h-4 w-4 text-slate-400" /> Settings
            </button>
            <div className="border-t border-slate-100 my-1" />
            <button onClick={logout} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
