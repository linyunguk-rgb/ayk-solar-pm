'use client'
import { useEffect, useState, lazy, Suspense } from 'react'
import { useAppStore } from '@/store/app-store'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'
import { MobileNav } from './mobile-nav'
import { canAccess, type NavKey, ROLES, type RoleKey } from '@/lib/constants'
import { LandingPage } from '@/components/login/landing-page'
import { EnterpriseEntryPage } from '@/components/login/enterprise-entry-page'
import { DailyBackup } from '@/components/shared/daily-backup'

const DashboardPage = lazy(() => import('@/components/pages/dashboard-page').then(m => ({ default: m.DashboardPage })))
const ProjectsPage = lazy(() => import('@/components/pages/projects-page').then(m => ({ default: m.ProjectsPage })))
const ProgressPage = lazy(() => import('@/components/pages/progress-page').then(m => ({ default: m.ProgressPage })))
const TasksPage = lazy(() => import('@/components/pages/tasks-page').then(m => ({ default: m.TasksPage })))
const ManpowerPage = lazy(() => import('@/components/pages/manpower-page').then(m => ({ default: m.ManpowerPage })))
const MaterialsPage = lazy(() => import('@/components/pages/materials-page').then(m => ({ default: m.MaterialsPage })))
const ExpensesPage = lazy(() => import('@/components/pages/expenses-page').then(m => ({ default: m.ExpensesPage })))
const SafetyPage = lazy(() => import('@/components/pages/safety-page').then(m => ({ default: m.SafetyPage })))
const DocumentsPage = lazy(() => import('@/components/pages/documents-page').then(m => ({ default: m.DocumentsPage })))
const ReportsPage = lazy(() => import('@/components/pages/reports-page').then(m => ({ default: m.ReportsPage })))
const SettingsPage = lazy(() => import('@/components/pages/settings-page').then(m => ({ default: m.SettingsPage })))
const MobilePage = lazy(() => import('@/components/pages/mobile-page').then(m => ({ default: m.MobilePage })))
const DailyEntryPage = lazy(() => import('@/components/pages/daily-entry-page').then(m => ({ default: m.DailyEntryPage })))
const GuidePage = lazy(() => import('@/components/pages/guide-page').then(m => ({ default: m.GuidePage })))
const MasterAdminPage = lazy(() => import('@/components/pages/master-admin-page').then(m => ({ default: m.MasterAdminPage })))

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-emerald-200 border-t-emerald-600 animate-spin" />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    </div>
  )
}

export function AppShell() {
  const { user, currentNav, setNav, entryMode } = useAppStore()
  const setUser = useAppStore(s => s.setUser)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (user && !canAccess(user.role as RoleKey, currentNav)) setNav('dashboard')
  }, [user, currentNav, setNav])

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.user) setUser(d.user as any) }).catch(() => {})
  }, [setUser])

  // Scroll to top whenever the page changes
  useEffect(() => {
    if (!mounted) return
    const main = document.querySelector('main')
    if (main) main.scrollTo(0, 0)
    window.scrollTo(0, 0)
  }, [currentNav, mounted])

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-8 w-8 rounded-full border-2 border-emerald-200 border-t-emerald-600 animate-spin" />
      </div>
    )
  }

  if (user?.isMasterAdmin && currentNav === 'dashboard') {
    return (
      <div className="min-h-screen bg-slate-50 flex">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          <Topbar />
          <main className="flex-1 p-4 sm:p-6 pb-24 lg:pb-6 min-w-0 max-w-[1600px] mx-auto w-full">
            <Suspense fallback={<PageLoader />}><MasterAdminPage /></Suspense>
          </main>
        </div>
        <MobileNav />
      </div>
    )
  }

  if (!user) {
    if (entryMode === 'enterprise') return <EnterpriseEntryPage />
    return <LandingPage />
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <DailyBackup />
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Topbar />
        <main className="flex-1 p-4 sm:p-6 pb-24 lg:pb-6 min-w-0 max-w-[1600px] mx-auto w-full">
          <Suspense fallback={<PageLoader />}>
            {currentNav === 'dashboard' && <DashboardPage />}
            {currentNav === 'projects' && <ProjectsPage />}
            {currentNav === 'progress' && <ProgressPage />}
            {currentNav === 'tasks' && <TasksPage />}
            {currentNav === 'manpower' && <ManpowerPage />}
            {currentNav === 'materials' && <MaterialsPage />}
            {currentNav === 'expenses' && <ExpensesPage />}
            {currentNav === 'safety' && <SafetyPage />}
            {currentNav === 'documents' && <DocumentsPage />}
            {currentNav === 'reports' && <ReportsPage />}
            {currentNav === 'settings' && <SettingsPage />}
            {currentNav === 'mobile' && <MobilePage />}
            {currentNav === 'daily-entry' && <DailyEntryPage />}
            {currentNav === 'guide' && <GuidePage />}
          </Suspense>
        </main>
      </div>
      <MobileNav />
    </div>
  )
}

export { ROLES }
export type { NavKey }
