// AYK PTE LTD - Shared types and constants

export const ROLES = {
  Admin: 'Admin',
  ProjectManager: 'Project Manager',
  SiteSupervisor: 'Site Supervisor',
  SafetyOfficer: 'Safety Officer',
  Engineer: 'Engineer',
  StoreOfficer: 'Store/Material Officer',
  Worker: 'Worker',
} as const

export type RoleKey = keyof typeof ROLES

export const PROJECT_STAGES = [
  'Survey',
  'Design',
  'Procurement',
  'Installation',
  'Testing',
  'Handover',
] as const

export const PROJECT_STATUSES = ['Active', 'Completed', 'Delayed', 'OnHold'] as const
export const PROJECT_STATUS_LABELS: Record<string, string> = {
  Active: 'Active',
  Completed: 'Completed',
  Delayed: 'Delayed',
  OnHold: 'On Hold',
}

export const TASK_STATUSES = ['Todo', 'InProgress', 'Completed', 'Delayed'] as const
export const TASK_STATUS_LABELS: Record<string, string> = {
  Todo: 'To Do',
  InProgress: 'In Progress',
  Completed: 'Completed',
  Delayed: 'Delayed',
}

export const TASK_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'] as const

export const EXPENSE_CATEGORIES = [
  'Tools & Equipment',
  'Transport',
  'Accommodation',
  'Fuel',
  'Materials',
  'Labour',
  'Miscellaneous',
] as const

export const MATERIAL_CATEGORIES = [
  'SolarPanels',
  'DCCables',
  'ACCables',
  'MountingRails',
  'Inverters',
  'MC4Connectors',
  'Bolts',
  'Other',
] as const

export const MATERIAL_CATEGORY_LABELS: Record<string, string> = {
  SolarPanels: 'Solar Panels',
  DCCables: 'DC Cables',
  ACCables: 'AC Cables',
  MountingRails: 'Mounting Rails',
  Inverters: 'Inverters',
  MC4Connectors: 'MC4 Connectors',
  Bolts: 'Bolts & Nuts',
  Other: 'Other',
}

export const DOCUMENT_CATEGORIES = [
  'Drawings',
  'Permits',
  'MethodStatements',
  'RiskAssessments',
  'Certificates',
  'Inspection',
  'Photos',
  'Reports',
] as const

export const SAFETY_CHECKLIST_TYPES = ['PPE', 'Toolbox', 'Inspection'] as const
export const SAFETY_INCIDENT_TYPES = ['Incident', 'NearMiss', 'UnsafeCondition'] as const
export const SAFETY_INCIDENT_LABELS: Record<string, string> = {
  Incident: 'Incident',
  NearMiss: 'Near Miss',
  UnsafeCondition: 'Unsafe Condition',
}

export const SITE_STATUSES = ['Normal', 'Delay', 'Issue', 'Halt'] as const

export const NOTIFICATION_TYPES = {
  DelayedProject: 'Delayed Project',
  LowStock: 'Low Material Stock',
  OverdueTask: 'Overdue Task',
  SafetyIncident: 'Safety Incident',
  PendingApproval: 'Pending Approval',
  DailyProgress: 'Daily Progress',
} as const

export const APP_NAME = 'AYK PTE LTD'
export const APP_TAGLINE = 'Solar Energy • Build a Brighter Future'

// Navigation items
export type NavKey =
  | 'dashboard'
  | 'projects'
  | 'progress'
  | 'tasks'
  | 'manpower'
  | 'materials'
  | 'expenses'
  | 'safety'
  | 'documents'
  | 'reports'
  | 'settings'
  | 'mobile'
  | 'daily-entry'

export interface NavItem {
  key: NavKey
  label: string
  icon: string
  roles?: RoleKey[] // if undefined, all roles can see
}

// Role-based permissions matrix
export const PERMISSIONS: Record<RoleKey, NavKey[]> = {
  Admin: ['dashboard', 'projects', 'progress', 'tasks', 'manpower', 'materials', 'expenses', 'safety', 'documents', 'reports', 'settings', 'mobile', 'daily-entry'],
  ProjectManager: ['dashboard', 'projects', 'progress', 'tasks', 'manpower', 'materials', 'expenses', 'safety', 'documents', 'reports', 'mobile', 'daily-entry'],
  SiteSupervisor: ['dashboard', 'progress', 'tasks', 'manpower', 'safety', 'documents', 'mobile', 'daily-entry'],
  SafetyOfficer: ['dashboard', 'safety', 'documents', 'mobile', 'daily-entry'],
  Engineer: ['dashboard', 'projects', 'progress', 'tasks', 'documents', 'mobile'],
  StoreOfficer: ['dashboard', 'materials', 'expenses', 'documents', 'mobile'],
  Worker: ['dashboard', 'tasks', 'mobile', 'daily-entry'],
}

export const MOBILE_NAV_KEYS: NavKey[] = ['mobile', 'dashboard', 'projects', 'tasks', 'reports']

export function canAccess(role: RoleKey, nav: NavKey): boolean {
  const allowed = PERMISSIONS[role] || []
  return allowed.includes(nav)
}

export function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `S$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `S$${(n / 1_000).toFixed(1)}K`
  return `S$${n.toFixed(0)}`
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-SG').format(n)
}

export function formatDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleDateString('en-SG', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatDateTime(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleDateString('en-SG', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' ' + date.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })
}

export function daysBetween(start: Date | string, end: Date | string): number {
  const s = typeof start === 'string' ? new Date(start) : start
  const e = typeof end === 'string' ? new Date(end) : end
  return Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24))
}

// Calculate overall project progress from stages
export interface StageProgressInput {
  actualPct: number
  weight: number
}

export function calcOverallProgress(stages: StageProgressInput[]): number {
  const totalWeight = stages.reduce((s, st) => s + st.weight, 0)
  if (totalWeight === 0) return 0
  const weighted = stages.reduce((s, st) => s + (st.actualPct * st.weight), 0)
  return Math.round((weighted / totalWeight) * 10) / 10
}

export function calcPlannedProgress(stages: { plannedPct: number; weight: number }[]): number {
  const totalWeight = stages.reduce((s, st) => s + st.weight, 0)
  if (totalWeight === 0) return 0
  const weighted = stages.reduce((s, st) => s + (st.plannedPct * st.weight), 0)
  return Math.round((weighted / totalWeight) * 10) / 10
}
