'use client'
import { useEffect } from 'react'
import { useAppStore } from '@/store/app-store'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'
import { MobileNav } from './mobile-nav'
import { DashboardPage } from '@/components/pages/dashboard-page'
import { ProjectsPage } from '@/components/pages/projects-page'
import { ProgressPage } from '@/components/pages/progress-page'
import { TasksPage } from '@/components/pages/tasks-page'
import { ManpowerPage } from '@/components/pages/manpower-page'
import { MaterialsPage } from '@/components/pages/materials-page'
import { ExpensesPage } from '@/components/pages/expenses-page'
import { SafetyPage } from '@/components/pages/safety-page'
import { DocumentsPage } from '@/components/pages/documents-page'
import { ReportsPage } from '@/components/pages/reports-page'
import { SettingsPage } from '@/components/pages/settings-page'
import { MobilePage } from '@/components/pages/mobile-page'
import { DailyEntryPage } from '@/components/pages/daily-entry-page'
import { canAccess, type NavKey, ROLES, type RoleKey } from '@/lib/constants'
import { LoginGate } from '@/components/login/login-gate'

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
        </main>
      </div>
      <MobileNav />
    </div>
  )
}

// expose ROLES for convenience
export { ROLES }
export type { NavKey }
