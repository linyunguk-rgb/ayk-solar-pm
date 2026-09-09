// AYK PTE LTD - Design System
// Section-based color coding so users understand what each area is for.
// Inspired by Material Design / Google Workspace color semantics.

export type SectionKey =
  | 'overview'    // Dashboard overview
  | 'projects'    // Project management
  | 'progress'    // Progress tracking
  | 'tasks'       // Task management
  | 'manpower'    // Workforce
  | 'materials'   // Inventory
  | 'expenses'    // Financial
  | 'safety'      // Safety
  | 'documents'   // Documents
  | 'reports'     // Reports
  | 'settings'    // Settings
  | 'guide'       // User guide
  | 'mobile'      // Mobile site view
  | 'dailyEntry'  // Daily entry

export interface SectionTheme {
  key: SectionKey
  label: string
  description: string
  // Tailwind-ish color tokens
  color: string        // hex base color
  fg: string           // foreground text color (on light bg)
  bg: string           // background tint
  bgStrong: string     // stronger background
  border: string       // border color
  ring: string         // focus ring
  gradient: string     // gradient for hero areas
  iconBg: string       // icon container bg
  iconFg: string       // icon color
}

// Curated palette — emerald primary, with distinct section accents.
// Semantic: green=good/progress, blue=info/action, amber=warning, red=critical,
// purple=financial, sky=documents, rose=safety.
export const SECTION_THEMES: Record<SectionKey, SectionTheme> = {
  overview: {
    key: 'overview', label: 'Dashboard', description: 'High-level overview of all projects and operations',
    color: '#10b981', fg: 'text-emerald-700', bg: 'bg-emerald-50', bgStrong: 'bg-emerald-100',
    border: 'border-emerald-200', ring: 'ring-emerald-500',
    gradient: 'from-emerald-500 to-teal-600',
    iconBg: 'bg-emerald-100', iconFg: 'text-emerald-700',
  },
  projects: {
    key: 'projects', label: 'Projects', description: 'Manage solar installation projects end to end',
    color: '#0ea5e9', fg: 'text-sky-700', bg: 'bg-sky-50', bgStrong: 'bg-sky-100',
    border: 'border-sky-200', ring: 'ring-sky-500',
    gradient: 'from-sky-500 to-blue-600',
    iconBg: 'bg-sky-100', iconFg: 'text-sky-700',
  },
  progress: {
    key: 'progress', label: 'Progress', description: 'Planned vs actual progress, S-curves and daily entries',
    color: '#6366f1', fg: 'text-indigo-700', bg: 'bg-indigo-50', bgStrong: 'bg-indigo-100',
    border: 'border-indigo-200', ring: 'ring-indigo-500',
    gradient: 'from-indigo-500 to-violet-600',
    iconBg: 'bg-indigo-100', iconFg: 'text-indigo-700',
  },
  tasks: {
    key: 'tasks', label: 'Tasks', description: 'Track tasks, assignments and deadlines',
    color: '#f59e0b', fg: 'text-amber-700', bg: 'bg-amber-50', bgStrong: 'bg-amber-100',
    border: 'border-amber-200', ring: 'ring-amber-500',
    gradient: 'from-amber-500 to-orange-600',
    iconBg: 'bg-amber-100', iconFg: 'text-amber-700',
  },
  manpower: {
    key: 'manpower', label: 'Manpower', description: 'Workers, attendance and team productivity',
    color: '#06b6d4', fg: 'text-cyan-700', bg: 'bg-cyan-50', bgStrong: 'bg-cyan-100',
    border: 'border-cyan-200', ring: 'ring-cyan-500',
    gradient: 'from-cyan-500 to-teal-600',
    iconBg: 'bg-cyan-100', iconFg: 'text-cyan-700',
  },
  materials: {
    key: 'materials', label: 'Materials', description: 'Inventory, stock levels and material transactions',
    color: '#8b5cf6', fg: 'text-violet-700', bg: 'bg-violet-50', bgStrong: 'bg-violet-100',
    border: 'border-violet-200', ring: 'ring-violet-500',
    gradient: 'from-violet-500 to-purple-600',
    iconBg: 'bg-violet-100', iconFg: 'text-violet-700',
  },
  expenses: {
    key: 'expenses', label: 'Expenses', description: 'Project spending, approvals and budget tracking',
    color: '#ec4899', fg: 'text-pink-700', bg: 'bg-pink-50', bgStrong: 'bg-pink-100',
    border: 'border-pink-200', ring: 'ring-pink-500',
    gradient: 'from-pink-500 to-rose-600',
    iconBg: 'bg-pink-100', iconFg: 'text-pink-700',
  },
  safety: {
    key: 'safety', label: 'Safety', description: 'PPE checklists, incidents and compliance',
    color: '#ef4444', fg: 'text-red-700', bg: 'bg-red-50', bgStrong: 'bg-red-100',
    border: 'border-red-200', ring: 'ring-red-500',
    gradient: 'from-red-500 to-rose-600',
    iconBg: 'bg-red-100', iconFg: 'text-red-700',
  },
  documents: {
    key: 'documents', label: 'Documents', description: 'Drawings, permits, certificates and project photos',
    color: '#14b8a6', fg: 'text-teal-700', bg: 'bg-teal-50', bgStrong: 'bg-teal-100',
    border: 'border-teal-200', ring: 'ring-teal-500',
    gradient: 'from-teal-500 to-emerald-600',
    iconBg: 'bg-teal-100', iconFg: 'text-teal-700',
  },
  reports: {
    key: 'reports', label: 'Reports', description: 'Generate PDF/printable project reports',
    color: '#64748b', fg: 'text-slate-700', bg: 'bg-slate-50', bgStrong: 'bg-slate-100',
    border: 'border-slate-200', ring: 'ring-slate-500',
    gradient: 'from-slate-500 to-slate-700',
    iconBg: 'bg-slate-100', iconFg: 'text-slate-700',
  },
  settings: {
    key: 'settings', label: 'Settings', description: 'Account, users and company preferences',
    color: '#78716c', fg: 'text-stone-700', bg: 'bg-stone-50', bgStrong: 'bg-stone-100',
    border: 'border-stone-200', ring: 'ring-stone-500',
    gradient: 'from-stone-500 to-stone-700',
    iconBg: 'bg-stone-100', iconFg: 'text-stone-700',
  },
  guide: {
    key: 'guide', label: 'User Guide', description: 'Interactive walkthroughs and onboarding',
    color: '#10b981', fg: 'text-emerald-700', bg: 'bg-emerald-50', bgStrong: 'bg-emerald-100',
    border: 'border-emerald-200', ring: 'ring-emerald-500',
    gradient: 'from-emerald-500 to-green-600',
    iconBg: 'bg-emerald-100', iconFg: 'text-emerald-700',
  },
  mobile: {
    key: 'mobile', label: 'Mobile Site View', description: 'Phone interface for site supervisors',
    color: '#10b981', fg: 'text-emerald-700', bg: 'bg-emerald-50', bgStrong: 'bg-emerald-100',
    border: 'border-emerald-200', ring: 'ring-emerald-500',
    gradient: 'from-emerald-500 to-teal-600',
    iconBg: 'bg-emerald-100', iconFg: 'text-emerald-700',
  },
  dailyEntry: {
    key: 'dailyEntry', label: 'Daily Entry', description: 'Submit today site progress from the field',
    color: '#f59e0b', fg: 'text-amber-700', bg: 'bg-amber-50', bgStrong: 'bg-amber-100',
    border: 'border-amber-200', ring: 'ring-amber-500',
    gradient: 'from-amber-500 to-orange-600',
    iconBg: 'bg-amber-100', iconFg: 'text-amber-700',
  },
}

export function getSectionTheme(key: SectionKey): SectionTheme {
  return SECTION_THEMES[key] || SECTION_THEMES.overview
}

// KPI metric categories for dashboard grouping (Google-like card grouping)
export type MetricCategory = 'operations' | 'financial' | 'workforce' | 'safety'

export interface MetricCategoryMeta {
  key: MetricCategory
  label: string
  description: string
  accent: SectionKey
}

export const METRIC_CATEGORIES: Record<MetricCategory, MetricCategoryMeta> = {
  operations: { key: 'operations', label: 'Operations', description: 'Project and task status', accent: 'overview' },
  financial: { key: 'financial', label: 'Financial', description: 'Budget and expenses', accent: 'expenses' },
  workforce: { key: 'workforce', label: 'Workforce', description: 'Manpower and attendance', accent: 'manpower' },
  safety: { key: 'safety', label: 'Safety & Materials', description: 'Safety incidents and stock alerts', accent: 'safety' },
}
