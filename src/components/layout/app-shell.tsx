'use client'
import { useEffect, lazy, Suspense } from 'react'
import { useAppStore } from '@/store/app-store'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'
import { MobileNav } from './mobile-nav'
import { canAccess, type NavKey, ROLES, type RoleKey } from '@/lib/constants'
import { LoginGate } from '@/components/login/login-gate'

// Lazy-load ALL pages so only the active page compiles at a time.
// This drastically reduces the initial compilation memory spike in the dev server.
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
  const { user, currentNav, setNav } = useAppStore()

  // Redirect nav if user lacks permission
  useEffect(() => {
    if (user && !canAccess(user.role as RoleKey, currentNav)) {
      setNav('dashboard')
    }
  }, [user, currentNav, setNav])

  if (!user) return <LoginGate />

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Topbar />
        <main className="flex-1 p-4 sm:p-6 pb-24 lg:pb-6 min-w-0">
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
          </Suspense>
        </main>
      </div>
      <MobileNav />
    </div>
  )
}

export { ROLES }
export type { NavKey }
