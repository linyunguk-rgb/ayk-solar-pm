'use client'
import { useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { SectionHeader, SubSection } from '@/components/shared/section-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  HelpCircle, LayoutDashboard, FolderKanban, TrendingUp, ListChecks, Users, Package,
  DollarSign, ShieldAlert, FileText, FileBarChart, Settings, Smartphone, Sun, ChevronRight,
  ChevronLeft, Play, CheckCircle2, BookOpen, Lightbulb, Target, Rocket, MousePointerClick,
  Check, ArrowRight, Zap, UserCheck, AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROLES, type RoleKey, type NavKey } from '@/lib/constants'

// Interactive guide steps
interface GuideStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  section: NavKey
  tips: string[]
  cta: { label: string; nav: NavKey }
}

const GUIDE_STEPS: GuideStep[] = [
  {
    id: 'dashboard',
    title: 'Start at the Dashboard',
    description: 'The Dashboard is your home base. It shows high-level metrics grouped into three categories — Operations, Financial, and Workforce & Safety — so you immediately understand what each number represents.',
    icon: <LayoutDashboard className="h-6 w-6" />,
    section: 'dashboard',
    tips: [
      'Metrics are color-coded: green = progress/ok, amber = warning, red = critical, pink = financial.',
      "Click any \"Active Project\" card to jump straight into that project's details.",
      'The bell icon (top-right) shows your latest notifications — delayed projects, low stock, overdue tasks.',
    ],
    cta: { label: 'Open Dashboard', nav: 'dashboard' },
  },
  {
    id: 'projects',
    title: 'Manage Projects',
    description: 'The Projects module is where you create and track solar installation projects. Each project has 6 stages (Survey → Design → Procurement → Installation → Testing → Handover) with weighted progress calculation.',
    icon: <FolderKanban className="h-6 w-6" />,
    section: 'projects',
    tips: [
      'Use "New Project" (Admin/PM only) to create a project — set panels, budget, dates, manager.',
      'Click a project card to see its detail page: S-curve, stages, daily progress, tasks, expenses, documents.',
      'Edit stage actual % inline on the detail page — overall progress recalculates automatically.',
    ],
    cta: { label: 'Open Projects', nav: 'projects' },
  },
  {
    id: 'progress',
    title: 'Track Progress',
    description: 'The Progress module shows planned vs actual progress, S-curves and aggregated daily entries. Use this to spot schedule slippage early.',
    icon: <TrendingUp className="h-6 w-6" />,
    section: 'progress',
    tips: [
      'The Planned vs Actual bar chart shows which projects are ahead (green) or behind (red) schedule.',
      'The S-Curve visualizes cumulative panels installed vs the planned linear trajectory.',
      'Filter by project and date range, and switch between Daily / Weekly / Monthly aggregation.',
    ],
    cta: { label: 'Open Progress', nav: 'progress' },
  },
  {
    id: 'daily-entry',
    title: 'Submit Daily Site Progress',
    description: 'Site supervisors submit a daily progress entry from the field using the Daily Entry form. It is mobile-friendly and supports photos + GPS.',
    icon: <Sun className="h-6 w-6" />,
    section: 'daily-entry',
    tips: [
      'Pick the project, enter installed panels today — total installed auto-suggests from the last entry.',
      'Use "Get Location" to capture GPS coordinates from your phone.',
      'Tap the photo area to upload from camera or gallery.',
      "Submitting also updates the project's Installation stage % automatically.",
    ],
    cta: { label: 'Open Daily Entry', nav: 'daily-entry' },
  },
  {
    id: 'tasks',
    title: 'Track Tasks',
    description: 'Tasks can be viewed as a Kanban board (To Do / In Progress / Completed / Delayed) or a list. Each task has priority, assignee, due date and progress.',
    icon: <ListChecks className="h-6 w-6" />,
    section: 'tasks',
    tips: [
      'Use the board view for a quick status overview; switch to list view for filtering and editing.',
      'Overdue tasks show a red indicator — the banner at the top warns you about overdue counts.',
      'Filter by project, status, priority or assignee.',
    ],
    cta: { label: 'Open Tasks', nav: 'tasks' },
  },
  {
    id: 'manpower',
    title: 'Manage Manpower',
    description: 'The Manpower module tracks workers, attendance, check-in/out and team productivity.',
    icon: <Users className="h-6 w-6" />,
    section: 'manpower',
    tips: [
      'Stat cards show workers on site today, absent, total and man-hours (last 7 days).',
      'Use Check-in / Check-out buttons per worker to record attendance.',
      'The Team Productivity chart aggregates working hours per team.',
    ],
    cta: { label: 'Open Manpower', nav: 'manpower' },
  },
  {
    id: 'materials',
    title: 'Control Materials',
    description: 'Materials tracks solar panels, cables, rails, inverters, connectors and more. Manage stock, issue/return, and get low-stock alerts.',
    icon: <Package className="h-6 w-6" />,
    section: 'materials',
    tips: [
      'The Inventory tab shows current stock — red text means at/below minimum.',
      'Use "Add Stock", "Issue" or "Return" actions to record transactions — stock updates automatically.',
      'The Transactions tab gives a full audit trail of every material movement.',
    ],
    cta: { label: 'Open Materials', nav: 'materials' },
  },
  {
    id: 'expenses',
    title: 'Track Expenses',
    description: 'Expenses are categorized (Tools, Transport, Accommodation, Fuel, Materials, Labour, Misc) and require approval.',
    icon: <DollarSign className="h-6 w-6" />,
    section: 'expenses',
    tips: [
      'Pending expenses need Admin/PM approval — use Approve / Reject inline actions.',
      'The Budget vs Actual chart shows per-project spend vs budget.',
      'The Project Profitability card shows margin per project.',
    ],
    cta: { label: 'Open Expenses', nav: 'expenses' },
  },
  {
    id: 'safety',
    title: 'Stay Safe',
    description: 'The Safety module covers PPE checklists, incidents, near misses and unsafe conditions. PPE compliance is tracked over time.',
    icon: <ShieldAlert className="h-6 w-6" />,
    section: 'safety',
    tips: [
      'Submit a daily PPE checklist with 7 items — compliance % auto-calculates.',
      'Report incidents / near misses / unsafe conditions with severity and follow-up actions.',
      'The PPE Compliance tab shows per-item compliance percentages across all checklists.',
    ],
    cta: { label: 'Open Safety', nav: 'safety' },
  },
  {
    id: 'documents',
    title: 'Organize Documents',
    description: 'Documents are organized by category: Drawings, Permits, Method Statements, Risk Assessments, Certificates, Inspection, Photos, Reports.',
    icon: <FileText className="h-6 w-6" />,
    section: 'documents',
    tips: [
      'Use the 8 category cards at the top to filter by document type.',
      'Upload via the Upload dialog — drag and drop or browse.',
      'Preview images directly; PDFs open in a viewer (demo).',
    ],
    cta: { label: 'Open Documents', nav: 'documents' },
  },
  {
    id: 'reports',
    title: 'Generate Reports',
    description: 'Reports produces print-ready PDF/HTML reports with AYK branding for daily, weekly, monthly progress, manpower, materials, expenses, safety and project summaries.',
    icon: <FileBarChart className="h-6 w-6" />,
    section: 'reports',
    tips: [
      'Click Generate on any report card — it opens in a dialog with AYK header.',
      'Use Print to send to a printer or "Save as PDF".',
      'Use Download HTML to save the report file locally.',
    ],
    cta: { label: 'Open Reports', nav: 'reports' },
  },
  {
    id: 'mobile',
    title: 'Use the Mobile Site View',
    description: 'The Mobile Site View is a phone-style interface optimized for site supervisors in the field — big tap targets, quick stats, single-tap daily entry.',
    icon: <Smartphone className="h-6 w-6" />,
    section: 'mobile',
    tips: [
      'Shows current project with a circular progress ring.',
      "Today's site progress + quick stats (workers, tasks, alerts, compliance).",
      'Big "Update Site Progress" button jumps to the daily entry form.',
    ],
    cta: { label: 'Open Mobile View', nav: 'mobile' },
  },
  {
    id: 'settings',
    title: 'Configure Settings',
    description: 'Admins can manage users and roles here. Everyone can edit their profile and notification preferences.',
    icon: <Settings className="h-6 w-6" />,
    section: 'settings',
    tips: [
      'Admins: use the Users tab to add/edit/deactivate team members.',
      'Update your profile and change password in the Profile tab.',
      'Toggle notification preferences in the Alerts tab.',
    ],
    cta: { label: 'Open Settings', nav: 'settings' },
  },
]

const ROLE_GUIDES: { role: RoleKey; title: string; description: string; tasks: string[]; icon: React.ReactNode; color: string }[] = [
  {
    role: 'Admin',
    title: 'Admin',
    description: 'Full system access — manage users, projects, all modules and settings.',
    tasks: ['Manage users & roles', 'Create / archive projects', 'Approve expenses', 'View all reports', 'Configure company settings'],
    icon: <UserCheck className="h-5 w-5" />,
    color: 'from-emerald-500 to-teal-600',
  },
  {
    role: 'ProjectManager',
    title: 'Project Manager',
    description: 'Plan and oversee projects, tasks, manpower and budget.',
    tasks: ['Create & edit projects', 'Assign tasks & managers', 'Track progress & S-curve', 'Approve expenses', 'Generate reports'],
    icon: <FolderKanban className="h-5 w-5" />,
    color: 'from-sky-500 to-blue-600',
  },
  {
    role: 'SiteSupervisor',
    title: 'Site Supervisor',
    description: 'Run the site day-to-day — submit progress and manage workers.',
    tasks: ['Submit daily progress', 'Check-in/out workers', 'Manage tasks on site', 'PPE checklists', 'Upload site photos'],
    icon: <Sun className="h-5 w-5" />,
    color: 'from-amber-500 to-orange-600',
  },
  {
    role: 'SafetyOfficer',
    title: 'Safety Officer',
    description: 'Owns safety compliance, incidents and PPE checklists.',
    tasks: ['Daily PPE checklists', 'Report incidents & near misses', 'Track compliance %', 'Safety inspections'],
    icon: <ShieldAlert className="h-5 w-5" />,
    color: 'from-red-500 to-rose-600',
  },
  {
    role: 'Engineer',
    title: 'Engineer',
    description: 'Technical oversight — drawings, method statements, progress.',
    tasks: ['View / upload drawings', 'Track project progress', 'Manage technical tasks', 'Access documents'],
    icon: <FileText className="h-5 w-5" />,
    color: 'from-violet-500 to-purple-600',
  },
  {
    role: 'StoreOfficer',
    title: 'Store / Material Officer',
    description: 'Manages inventory, issues and transactions.',
    tasks: ['Manage material stock', 'Issue / return materials', 'Track low-stock alerts', 'Record expenses'],
    icon: <Package className="h-5 w-5" />,
    color: 'from-pink-500 to-rose-600',
  },
  {
    role: 'Worker',
    title: 'Worker',
    description: 'Field worker — view tasks and submit daily progress.',
    tasks: ['View assigned tasks', 'Submit daily progress', 'Use mobile site view'],
    icon: <Users className="h-5 w-5" />,
    color: 'from-cyan-500 to-teal-600',
  },
]

const COLOR_LEGEND = [
  { color: 'bg-emerald-500', label: 'Green', meaning: 'Progress, success, OK status' },
  { color: 'bg-sky-500', label: 'Blue', meaning: 'Info, actions, projects' },
  { color: 'bg-amber-500', label: 'Amber', meaning: 'Warnings, pending, delays' },
  { color: 'bg-red-500', label: 'Red', meaning: 'Critical, alerts, safety' },
  { color: 'bg-pink-500', label: 'Pink', meaning: 'Financial, expenses, budget' },
  { color: 'bg-violet-500', label: 'Violet', meaning: 'Materials, inventory' },
  { color: 'bg-cyan-500', label: 'Cyan', meaning: 'Workforce, manpower' },
  { color: 'bg-teal-500', label: 'Teal', meaning: 'Documents, certificates' },
]

export function GuidePage() {
  const { setNav, user } = useAppStore()
  const [activeStep, setActiveStep] = useState(0)
  const [completed, setCompleted] = useState<Set<string>>(new Set())

  const step = GUIDE_STEPS[activeStep]
  const progress = Math.round((completed.size / GUIDE_STEPS.length) * 100)
  const userRole = user?.role as RoleKey

  function next() {
    setCompleted(prev => new Set(prev).add(step.id))
    if (activeStep < GUIDE_STEPS.length - 1) setActiveStep(activeStep + 1)
  }
  function prev() {
    if (activeStep > 0) setActiveStep(activeStep - 1)
  }
  function jumpTo(idx: number) {
    setActiveStep(idx)
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        section="guide"
        title="User Guide"
        description="Interactive walkthroughs to help you get the most out of AYK PTE LTD Solar PM"
        icon={<HelpCircle className="h-6 w-6" />}
        actions={
          <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200">
            {completed.size} / {GUIDE_STEPS.length} completed
          </Badge>
        }
      />

      {/* Quick start banner */}
      <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shrink-0">
              <Rocket className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-slate-900">New here? Start with the interactive tour below.</h2>
              <p className="text-sm text-slate-700 mt-1">Walk through each module step-by-step. Click "Mark complete & continue" to advance. You can also jump to any section from the sidebar on the right.</p>
              <div className="mt-3 flex items-center gap-2">
                <Progress value={progress} className="h-2 flex-1 max-w-xs" />
                <span className="text-xs font-medium text-slate-700">{progress}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Color legend — helps users understand the visual language */}
      <div>
        <SubSection section="guide" title="Color Language" description="How we use color across the app to convey meaning" icon={<Lightbulb className="h-4 w-4" />} />
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {COLOR_LEGEND.map(c => (
                <div key={c.label} className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-slate-50/50 p-3">
                  <div className={cn('h-6 w-6 rounded-lg shrink-0 mt-0.5', c.color)} />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900">{c.label}</div>
                    <div className="text-[11px] text-slate-600 leading-snug">{c.meaning}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role guide */}
      <div>
        <SubSection section="guide" title="Your Role" description="What you can do based on your role" icon={<Target className="h-4 w-4" />} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ROLE_GUIDES.map(rg => {
            const isCurrent = rg.role === userRole
            return (
              <Card key={rg.role} className={cn('transition-all', isCurrent ? 'border-emerald-300 ring-2 ring-emerald-200 shadow-md' : 'hover:shadow-md')}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow shrink-0', rg.color)}>
                      {rg.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{rg.title}</h3>
                        {isCurrent && <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]">YOU</Badge>}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mb-3">{rg.description}</p>
                  <ul className="space-y-1.5">
                    {rg.tasks.map(t => (
                      <li key={t} className="flex items-start gap-2 text-xs text-slate-700">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Interactive walkthrough */}
      <div>
        <SubSection section="guide" title="Interactive Tour" description="Step-by-step walkthrough of every module" icon={<Play className="h-4 w-4" />} action={
          <Button variant="outline" size="sm" onClick={() => { setCompleted(new Set()); setActiveStep(0) }} className="text-xs">
            Reset tour
          </Button>
        } />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Step list sidebar (desktop) */}
          <Card className="lg:col-span-1 order-2 lg:order-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Modules</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="space-y-1 max-h-[500px] overflow-y-auto ayk-scrollbar">
                {GUIDE_STEPS.map((s, idx) => {
                  const isActive = idx === activeStep
                  const isDone = completed.has(s.id)
                  return (
                    <button
                      key={s.id}
                      onClick={() => jumpTo(idx)}
                      className={cn(
                        'flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-left text-sm transition',
                        isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                      )}
                    >
                      <span className={cn(
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                        isDone ? 'bg-emerald-500 text-white' : isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      )}>
                        {isDone ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                      </span>
                      <span className="truncate text-xs font-medium">{s.title}</span>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Active step content */}
          <Card className="lg:col-span-3 order-1 lg:order-2">
            <CardContent className="p-5 sm:p-7">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
                  {step.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Step {activeStep + 1} of {GUIDE_STEPS.length}</span>
                    {completed.has(step.id) && <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]"><Check className="h-3 w-3 mr-1" /> Done</Badge>}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{step.title}</h2>
                  <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{step.description}</p>
                </div>
              </div>

              {/* Tips */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-amber-600" />
                  <h3 className="text-sm font-semibold text-amber-800">Pro tips</h3>
                </div>
                <ul className="space-y-2">
                  {step.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <MousePointerClick className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-1" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Visual preview placeholder */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 mb-5 text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white border-2 border-emerald-200 shadow-sm">
                    {step.icon}
                  </div>
                  <p className="text-sm text-slate-500">Open the actual module to see it in action</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <Button variant="outline" onClick={prev} disabled={activeStep === 0} className="order-2 sm:order-1">
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <div className="flex items-center gap-2 order-1 sm:order-2">
                  <Button
                    variant="outline"
                    className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    onClick={() => setNav(step.cta.nav)}
                  >
                    {step.cta.label} <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                  <Button onClick={next} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    {activeStep === GUIDE_STEPS.length - 1 ? (
                      <><Check className="h-4 w-4 mr-1" /> Finish</>
                    ) : (
                      <>Mark complete & continue <ChevronRight className="h-4 w-4 ml-1" /></>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick reference — keyboard shortcuts & tips */}
      <div>
        <SubSection section="guide" title="Quick Reference" description="Handy tips for everyday use" icon={<BookOpen className="h-4 w-4" />} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-semibold text-slate-900">Time-savers</h3>
              </div>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex items-start gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /> Use the top search bar to find projects, tasks and workers fast.</li>
                <li className="flex items-start gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /> The bell icon shows pending notifications — click to mark read.</li>
                <li className="flex items-start gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /> On mobile, use the bottom nav for one-tap access to Home, Projects, Tasks, Reports, More.</li>
                <li className="flex items-start gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /> Click any project card on the dashboard to jump to details.</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <ShieldAlert className="h-4 w-4 text-red-500" />
                <h3 className="text-sm font-semibold text-slate-900">What to watch</h3>
              </div>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex items-start gap-2"><AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" /> Red badges on project cards = delayed — needs attention.</li>
                <li className="flex items-start gap-2"><AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" /> Low stock alerts appear on the dashboard and in Materials — restock before it halts work.</li>
                <li className="flex items-start gap-2"><AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" /> Overdue tasks show a red dot in the Tasks board.</li>
                <li className="flex items-start gap-2"><AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" /> Open safety incidents need closure — review the Safety module regularly.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
