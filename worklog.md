# AYK PTE LTD – Solar Project Management System – Worklog

This is the shared worklog for the AYK PTE LTD Solar PM build. Each agent appends its own section below using `---` as separator.

## Foundation (built by main agent)

### Tech Stack
- Next.js 16 App Router + TypeScript + Tailwind CSS 4 + shadcn/ui (New York)
- Prisma ORM + SQLite (`@/lib/db` exports `db`)
- Zustand store at `src/store/app-store.ts`
- recharts for charts, framer-motion for animations
- All client-side view switching via Zustand `currentNav` (no Next.js routing for pages — only `/` is user-visible)
- API routes under `src/app/api/*`

### Branding
- App name: `AYK PTE LTD`, tagline: `Solar Energy • Build a Brighter Future`
- Primary color: emerald-600 (green) — for success/progress/primary actions
- Secondary: sky/blue for charts and info
- Warning: amber/orange
- Critical: red
- Sidebar: dark slate-900 (navy)
- Main bg: slate-50
- Cards: white, rounded-xl, border-slate-200

### Database Schema (prisma/schema.prisma)
Models: User, Project, ProjectStage, DailyProgress, Task, Worker, Attendance, Material, MaterialTransaction, Expense, SafetyChecklist, SafetyIncident, Document, Notification.
Database is seeded with realistic AYK data (5 projects, 24 workers, 12 tasks, 10 materials, etc.).

### Auth
- Demo auth via cookie `ayk_session` = userId.
- `/api/auth/login` (POST {email, password}) → sets cookie, returns user
- `/api/auth/me` (GET) → returns {user} (user null if not logged in)
- `/api/auth/demo-users` (GET) → returns users with demo passwords
- Passwords stored as `demo$<plain>`. Demo accounts:
  - admin@ayk.com.sg / admin123 (Admin)
  - pm@ayk.com.sg / pm123 (Project Manager)
  - supervisor@ayk.com.sg / super123 (Site Supervisor)
  - safety@ayk.com.sg / safety123 (Safety Officer)
  - engineer@ayk.com.sg / eng123 (Engineer)
  - store@ayk.com.sg / store123 (Store Officer)

### API Routes (all return JSON, all under /api)
- GET `/api/dashboard` → { stats, projects, charts, notifications, lowStockMaterials }
- GET `/api/projects` (optional ?status=, ?managerId=) → { projects[] } (each project includes stages[], manager, overallProgress, plannedProgress, installationPct, _count)
- POST `/api/projects` (body: {name, location, client, totalPanels, capacity, status, startDate, endDate, budget, managerId, description}) → { project }
- GET `/api/projects/[id]` → { project } (includes stages, dailyProgress, tasks, expenses, documents, sCurve)
- PUT `/api/projects/[id]` → { project }
- DELETE `/api/projects/[id]` (admin only)
- GET/PUT `/api/projects/[id]/stages` → { stages[] }; PUT body: { stages: [{id, name, plannedPct, actualPct, weight, status, startDate, endDate}] }
- GET `/api/progress` (optional ?projectId=, ?from=, ?to=, ?limit=) → { entries[] }
- POST `/api/progress` (body: {projectId, date, installedPanels, totalInstalled, manHours, workers, materialsUsed, equipmentUsed, workCompleted, workPending, siteStatus, remarks, photoUrls, gpsLocation}) → { entry }
- DELETE `/api/progress/[id]`
- GET `/api/tasks` (optional ?projectId=, ?status=, ?assignedToId=) → { tasks[] } (includes project, assignedTo, isOverdue)
- POST `/api/tasks` (body: {title, description, projectId, assignedToId, assignedToName, team, priority, status, progress, startDate, dueDate, remarks}) → { task }
- PUT `/api/tasks/[id]` → { task }
- DELETE `/api/tasks/[id]`
- GET `/api/workers` (optional ?projectId=, ?team=, ?status=) → { workers[] } (includes project, attendance[last 7])
- POST `/api/workers` (body: {name, employeeId, role, team, projectId, phone, skillLevel, status}) → { worker }
- PUT `/api/workers/[id]` → { worker }; POST `/api/workers/[id]` (body: {action: 'checkin'|'checkout'}) → { attendance }
- DELETE `/api/workers/[id]`
- GET `/api/attendance` (optional ?from=, ?to=, ?workerId=) → { records[] }
- GET `/api/materials` (optional ?category=, ?lowStock=) → { materials[] } (includes transactions[last 5])
- POST `/api/materials` (body: {name, category, unit, stockQty, minStockLevel, unitPrice, supplier}) → { material }
- PUT/DELETE `/api/materials/[id]`
- GET `/api/transactions` (optional ?materialId=, ?projectId=, ?type=) → { transactions[] }
- POST `/api/transactions` (body: {materialId, projectId, type: 'Add'|'Issue'|'Return', qty, remarks, date}) → { transaction, newStock } (auto-updates stock)
- GET `/api/expenses` (optional ?projectId=, ?category=, ?approvalStatus=) → { expenses[] }
- POST `/api/expenses` (body: {date, projectId, category, description, amount, paidBy, approvalStatus, receiptUrl}) → { expense }
- PUT/DELETE `/api/expenses/[id]`
- GET `/api/safety/checklists` (optional ?projectId=, ?checklistType=) → { checklists[] }
- POST `/api/safety/checklists` (body: {date, projectId, checklistType, helmet, safetyShoes, gloves, harness, workAreaClean, equipmentCondition, electricalSafety, location, remarks}) → { checklist } (auto-calculates compliancePct)
- GET `/api/safety/incidents` (optional ?projectId=, ?type=, ?status=) → { incidents[] }
- POST `/api/safety/incidents` (body: {date, projectId, type, severity, description, location, status, actionTaken}) → { incident }
- PUT `/api/safety/incidents/[id]`
- GET `/api/documents` (optional ?projectId=, ?category=) → { documents[] }
- POST `/api/documents` (body: {name, category, projectId, fileUrl, fileType, fileSize, description}) → { document }
- DELETE `/api/documents/[id]`
- GET `/api/notifications` → { notifications[] }
- PUT `/api/notifications/[id]` (body: {isRead}) → { notification }
- GET `/api/users` → { users[] }; POST `/api/users` (body: {email, name, password, role, phone})
- PUT/DELETE `/api/users/[id]`
- GET `/api/reports/[type]` → { type, title, html, data } where type is one of: daily, weekly, monthly, manpower, material, expense, safety, project-summary, planned-vs-actual

### Zustand Store (`src/store/app-store.ts`)
```
useAppStore() → { user, currentNav, selectedProjectId, detailProjectId, sidebarOpen, notifOpen, searchOpen, setUser, logout, setNav, setSelectedProjectId, openProject, closeProject, setSidebarOpen, setNotifOpen, setSearchOpen }
```
- `currentNav` is NavKey: 'dashboard' | 'projects' | 'progress' | 'tasks' | 'manpower' | 'materials' | 'expenses' | 'safety' | 'documents' | 'reports' | 'settings' | 'mobile' | 'daily-entry'
- `openProject(id)` sets detailProjectId and switches to 'projects'

### Shared Components (in src/components/shared/)
- `StatCard` — props: { title, value, subtitle, icon, accent: 'green'|'blue'|'orange'|'red'|'purple'|'slate', className }
- `PageHeader` — props: { title, description, icon, actions, className }
- `StatusBadge` — props: { status } — renders colored badge for project/task/incident/expense statuses
- `PriorityBadge` — props: { priority }

### Hooks (src/hooks/)
- `useFetch<T>(url, options?)` → { data, loading, error, refetch }
- `apiPost<T>(url, body)`, `apiPut<T>(url, body)`, `apiDelete<T>(url)`

### lib/constants.ts exports
- ROLES (role key → label), PROJECT_STAGES, PROJECT_STATUSES, TASK_STATUSES, TASK_PRIORITIES, EXPENSE_CATEGORIES, MATERIAL_CATEGORIES + MATERIAL_CATEGORY_LABELS, DOCUMENT_CATEGORIES, SAFETY_INCIDENT_TYPES + SAFETY_INCIDENT_LABELS, SITE_STATUSES, NOTIFICATION_TYPES, APP_NAME, APP_TAGLINE, PERMISSIONS (role → nav[]), canAccess(role, nav), formatCurrency(n), formatNumber(n), formatDate(d), formatDateTime(d), daysBetween, calcOverallProgress(stages), calcPlannedProgress(stages)

### Established Design Pattern (FOLLOW THIS)
- Page wrapper: `<div className="space-y-6">` then `<PageHeader title=... description=... icon=... actions=... />`
- Stat cards: grid `grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4`
- Cards: `border-border/60 shadow-sm hover:shadow-md transition-shadow`
- Charts: recharts ResponsiveContainer with height 260-320
- Forms: use Dialog for create/edit, react-hook-form not required (useState is fine)
- Tables: use the shadcn Table component for data tables
- Loading: skeleton cards with `animate-pulse`
- Toasts: `import { toast } from 'sonner'` then `toast.success(...)` / `toast.error(...)`
- Modals: shadcn Dialog with DialogContent/DialogHeader/DialogTitle/DialogFooter
- Confirmation: shadcn AlertDialog
- Use `formatCurrency`, `formatNumber`, `formatDate` from `@/lib/constants`
- Long lists: `max-h-96 overflow-y-auto ayk-scrollbar`
- Icons: lucide-react

### App Shell
`src/components/layout/app-shell.tsx` renders sidebar + topbar + main + mobile nav, switching pages by `currentNav`.
Pages are imported from `src/components/pages/<name>-page.tsx`.

---
Task ID: 9
Agent: Materials + Expenses Pages Builder
Task: Build Materials page (stock + transactions) and Expenses page (tracking + categories)

Work Log:
- Read worklog.md to understand the foundation (API routes, shared components, design pattern, Zustand store, constants).
- Inspected existing `dashboard-page.tsx`, shared `PageHeader`/`StatCard`/`StatusBadge`, `useFetch`/`apiPost`/`apiPut`/`apiDelete` hooks, shadcn UI primitives (table, dialog, alert-dialog, scroll-area, tabs, select, checkbox, input, label, card, button, badge, skeleton, progress, textarea), and the API route implementations for `/api/materials`, `/api/transactions`, `/api/expenses`, and `/api/projects`.
- Confirmed Prisma schema for Material / MaterialTransaction / Expense / Project (budget, actualCost) to wire chart calculations.
- Built `src/components/pages/materials-page.tsx`:
  - PageHeader with `Package` icon, emerald "Add Material" (Plus) + outline "New Transaction" (ArrowLeftRight) actions.
  - 5 stat cards: Total Materials (green), Low Stock Items (red), Total Stock Value (purple, sum stockQty*unitPrice), Categories (blue), Out of Stock (orange).
  - Amber Low Stock Alert card (only when lowStockMaterials.length > 0), scrollable grid of items with min level + current stock badge.
  - Tabs: Inventory / Transactions.
  - Inventory tab: Category Select + Low Stock Only Checkbox filter bar; table with Name, Category badge (MATERIAL_CATEGORY_LABELS), Stock Qty (red if <= minLevel else emerald), Unit, Min Level, Unit Price (formatCurrency), Stock Value, Supplier, Actions (Add Stock / Issue / Return / Edit / Delete). Edit opens Dialog with name/category/unit/stockQty/minStockLevel/unitPrice/supplier — POST/PUT to `/api/materials` or `/api/materials/[id]`. Add Stock / Issue / Return opens Dialog with material (pre-selected from row), project select, qty, remarks → POST `/api/transactions` (auto-updates stock). Delete via AlertDialog → DELETE `/api/materials/[id]`.
  - Transactions tab: Material Select + Project Select (from `/api/projects`) + Type Select (All/Add/Issue/Return) filter bar; table with Date, Material, Type badge (Add=emerald, Issue=sky, Return=amber), Qty, Project, Remarks. All filtered client-side from `/api/transactions`.
  - Optional material usage BarChart (last 30 days) with added / issued / returned bars per material.
- Built `src/components/pages/expenses-page.tsx`:
  - PageHeader with `DollarSign` icon, emerald "Add Expense" (Plus) action.
  - 4 stat cards: Total Expenses (green, sum amount), Approved (blue, sum + count), Pending (orange, sum + count), Rejected (red, sum + count).
  - Budget vs Actual recharts BarChart per project: budget vs (actualCost + sum of approved expenses), pulled from `/api/projects` + `/api/expenses`.
  - Expense by Category recharts PieChart (excluding rejected).
  - Filter bar: Project Select + Category Select (EXPENSE_CATEGORIES) + Approval Status Select.
  - Expenses table (shadcn Table inside ScrollArea max-h-[560px]) with Date, Project, Category badge (distinct colors, no indigo), Description (with receipt icon if receiptUrl), Amount (formatCurrency), Paid By, Approval (StatusBadge), Actions (Approve/Reject only for Pending + Edit + Delete).
  - Add/Edit Expense dialog with date (default today), project Select (incl. "No Project"), category Select, description, amount, paidBy, approvalStatus Select (Pending/Approved/Rejected), receiptUrl Input + Upload button (records filename via hidden file input). POST `/api/expenses` for new, PUT `/api/expenses/[id]` for edit.
  - Approve/Reject inline buttons call PUT `/api/expenses/[id]` with `{ approvalStatus }` and toast on success/failure.
  - Delete via AlertDialog → DELETE `/api/expenses/[id]`.
  - Project Profitability card: per-project card with budget, actual cost, approved expenses, total spent, used % progress bar (red if over), profit (emerald/red), margin % (emerald/red), and an "Over Budget" / "On Track" badge.
- Verified with `bun run lint` — both new files pass with 0 errors and 0 warnings (only a stray unused-disable warning in another agent's `daily-entry-page.tsx` remains).
- Dev server log shows the only remaining module-not-found is for `mobile-page` (another agent's task); materials-page and expenses-page imports resolve cleanly.

Stage Summary:
- Files created (ONLY these two — no other files modified):
  - `src/components/pages/materials-page.tsx` — exported `MaterialsPage` ('use client')
  - `src/components/pages/expenses-page.tsx` — exported `ExpensesPage` ('use client')
- Decisions:
  - Single source of truth: fetch `/api/materials`, `/api/transactions`, `/api/expenses`, `/api/projects` once each and filter client-side, so stats / charts / low-stock alerts always reflect the full dataset regardless of selected filters.
  - Used `MATERIAL_CATEGORY_LABELS` for display (SolarPanels → "Solar Panels" etc.) with distinct badge colors per category (amber/sky/teal/slate/emerald/orange/violet — no indigo per design rule).
  - All transactions auto-update stock via existing `/api/transactions` POST; no duplicate stock mutation on the client.
  - Emerald primary buttons use `bg-emerald-600 hover:bg-emerald-700 text-white` matching the dashboard style; cards use white, rounded-xl, border-slate-200, shadow-sm; tables use ScrollArea max-h-[500px] / max-h-[560px] with sticky headers.
  - Receipt "upload" simply records the chosen filename into `receiptUrl` (no server-side file storage) as instructed.
  - Profitability usedPct capped at 100 for the progress bar visual while the actual numeric still shows the real figure when over budget (in red).

---
Task ID: 7-a
Agent: Projects Page Builder
Task: Build the Projects page (list + detail view + create/edit dialog + delete) for AYK PTE LTD

Work Log:
- Read worklog.md foundation, explored src/ (constants.ts, app-store.ts, use-fetch.ts, shared components, dashboard-page.tsx for design pattern, projects API routes, users API route, shadcn ui primitives Dialog/Select/AlertDialog/Tabs/Table/ScrollArea/Button/Input/Textarea/Progress).
- Created /home/z/my-project/src/components/pages/projects-page.tsx as a single 'use client' file exporting ProjectsPage.
- Implemented root ProjectsPage component that switches between ProjectsList (when detailProjectId === null) and ProjectDetail (when set) using useAppStore.
- LIST MODE:
  * PageHeader with FolderKanban icon, emerald "New Project" button gated by canEdit (Admin or ProjectManager).
  * Filter bar Card with: search input (filter by name/location/code), status Select (All/Active/Completed/Delayed/OnHold via PROJECT_STATUSES), Cards/Table view toggle (emerald when active).
  * Loading: 6 skeleton cards with animate-pulse. Empty state: centered muted block with FolderKanban icon + "New Project" CTA when canEdit.
  * Cards view: responsive grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4, each card shows code, name (hover emerald), location, status badge, overall progress bar, panels installed/total with mini progress, budget actual/total with mini progress, start→end dates. Click opens detail via openProject(id).
  * Table view: shadcn Table inside ScrollArea (max-h-[600px]) with columns Code, Name, Location, Status, Progress (mini bar), Panels, Budget, Manager, End Date, Actions. Row click opens detail; action buttons (View/Edit/Delete) use stopPropagation. Edit gated by canEdit, Delete gated by Admin only.
  * Create/Edit Dialog (sm:max-w-[640px], overflow-y-auto ayk-scrollbar) with shared ProjectFormFields component: name*, location*, client, capacity, totalPanels, budget, status Select, project manager Select (fetched from /api/users, filtered to PM/Admin/Engineer; uses 'unassigned' sentinel value to satisfy radix Select), startDate*, endDate*, description Textarea. Submit validates required fields, POST or PUT based on editId, then refetch + toast.
  * Delete: AlertDialog confirmation, red destructive action button, calls apiDelete + refetch + toast.success/error.
- DETAIL MODE:
  * PageHeader with project name as title, description = "code · location · client", status badge + Back (ArrowLeft) + Edit (Pencil, emerald) in actions; Edit gated by canEdit.
  * Optional description Card (whitespace-pre-line) when project.description present.
  * Stat cards grid (2/3/4 cols) using StatCard: Total Panels, Installed, Installation %, Overall Progress, Planned Progress, Variance (+/-), Budget, Actual Cost, Remaining — Variance/Remaining accents flip green/red based on sign.
  * S-Curve Card: recharts AreaChart (height 300) of project.sCurve with two gradient-filled areas (sky/blue planned, emerald actual), formatted XAxis (d/m), YAxis via formatNumber, Tooltip label formatted via formatDate, Legend.
  * StagesCard: shadcn Table of 6 stages with name, planned %, actual % (inline Input when canEdit), Progress bar, weight, status (inline Select when canEdit with NotStarted/InProgress/Completed/Delayed), start/end dates. Save Stages button (emerald) PUTs to /api/projects/[id]/stages with array payload, then refetch + toast. Local state syncs from project.stages via useEffect.
  * Tabs: Daily Progress | Tasks | Expenses | Documents | Material Transactions. TabsList className="flex w-full overflow-x-auto" so all 5 triggers share width on mobile and scroll if needed.
    - Daily Progress: ScrollArea max-h-96 with Table of date, installed, total, manHours, workers, site StatusBadge, submittedBy name, remarks (truncated).
    - Tasks: Table of title, PriorityBadge, StatusBadge, progress bar, dueDate, assignedTo name. "Open Tasks" button calls setNav('tasks').
    - Expenses: Table of date, category, description, amount (currency, right-aligned), approvalStatus badge, paidBy. "Open Expenses" calls setNav('expenses').
    - Documents: Table of name (with FileText icon), category, fileType Badge, uploadedByName, createdAt. "Open Documents" calls setNav('documents').
    - Material Transactions: Table of material.name, type Badge (color-coded Add/Issue/Return), qty, date, remarks. Empty states per tab use shared EmptyState component.
  * Edit Dialog in detail mode reuses ProjectFormFields, pre-fills editForm from project, PUT then refetch + toast.
  * Loading skeleton for detail view: 9 stat-card skeletons + chart-card skeleton.
- Shared helpers: ProjectFormFields, Field wrapper (Label + control), ProjectCard, StagesCard, EmptyState, toInputDate.
- All dates via formatDate, currency via formatCurrency, numbers via formatNumber.
- Verified: bun run lint passes with zero errors. Dev log shows only unrelated module-not-found errors for mobile-page and daily-entry-page (other agents' tasks); projects-page module now resolves.

Stage Summary:
- File created: /home/z/my-project/src/components/pages/projects-page.tsx (~700 lines, single 'use client' component exported as ProjectsPage).
- Key decisions:
  * Two top-level subcomponents (ProjectsList / ProjectDetail) selected by detailProjectId from Zustand store.
  * Shared ProjectFormFields component reused by both create and edit dialogs to avoid duplication.
  * Users fetched via /api/users and filtered to PM/Admin/Engineer for the manager Select; sentinel value 'unassigned' used because radix Select cannot accept empty string.
  * Inline stage editing (actualPct Input + status Select) with a single Save Stages button that batch PUTs all 6 stages to /api/projects/[id]/stages.
  * Tabs use w-full flex so all 5 triggers share width on mobile (triggers have flex-1 from shadcn default).
  * Role gating: canEdit = Admin or ProjectManager (create/edit/stage edit), canDelete = Admin only.
  * S-curve uses two Area series with gradient fills — emerald (#10b981) for actual, sky (#0ea5e9) for planned, matching established brand palette.
  * Variance and Remaining stat cards flip accent (green/red) based on sign.
Task ID: 10-a
Agent: Safety + Documents Pages Builder
Task: Build Safety page (checklists + incidents) and Documents page (upload + organize)

Work Log:
- Read worklog.md to understand foundation (API routes, shared components, hooks, Zustand store, constants).
- Inspected shared components (PageHeader, StatCard, StatusBadge) and shadcn UI primitives (Checkbox, AlertDialog, ScrollArea, Select).
- Verified existing API routes for safety/checklists, safety/incidents (+[id] PUT), documents (+[id] DELETE) to match response shapes exactly.
- Built `src/components/pages/safety-page.tsx`:
  - PageHeader with emerald "New Checklist" + red-outline "Report Incident" actions.
  - 5 stat cards: Total / Open / Closed / Near Miss / PPE Compliance % (avg last 30 checklists).
  - recharts LineChart showing daily compliance % for last 14 days (filled with 0 when no checklist that day).
  - Tabs: Checklists / Incidents / PPE Compliance.
  - Checklists tab: project + type filter, shadcn Table inside ScrollArea (28rem), type badge, compliance progress bar.
  - New-checklist dialog: date, project, type, 7 shadcn Checkboxes (Helmet/Safety Shoes/Gloves/Harness/Work Area Clean/Equipment Condition/Electrical Safety), live compliance badge, location, remarks. POSTs to /api/safety/checklists.
  - Incidents tab: project + type + status filter, card grid (1/2/3 cols) with type-specific icon (AlertCircle red / TriangleAlert amber / HardHat sky), severity badge, action-taken panel, edit button.
  - Report-incident dialog + edit-incident dialog (PUT /api/safety/incidents/[id]).
  - PPE Compliance tab: summary card + per-item Progress bars color-coded (>=90 emerald / >=70 amber / else red).
  - Used SAFETY_INCIDENT_LABELS so NearMiss → "Near Miss" etc.
- Built `src/components/pages/documents-page.tsx`:
  - PageHeader with emerald Upload button.
  - 4 stat cards: Total / Top Category / Photos / Reports (computed from /api/documents).
  - Filter bar: project, category, search-by-name input.
  - 8 category cards row with icon + count; click filters by that category (click again clears).
  - Documents grid (1/2/3/4 cols) with file-type-aware icon (image→sky, pdf→red, sheet→emerald, word→blue, zip→amber), category badge, project, uploader, fileSize (KB/MB), createdAt, Preview/Download/Delete actions.
  - Upload dialog: drag-drop area + click-to-browse, auto-fill name from filename, FileReader API to read file metadata, simulated progress bar, POST /api/documents with fileUrl fallback `/documents/\${name}`. Object URL kept for image preview.
  - Preview dialog: real image preview when object URL is available; PDFs show "Open in viewer" button (toast-only demo); other types show "Preview not available".
  - Download button: toast.info("Download started (demo)").
  - Delete: AlertDialog confirm → DELETE /api/documents/[id] → refetch + toast.
  - Human-readable category labels (MethodStatements → "Method Statements", RiskAssessments → "Risk Assessments").
- Avoided empty-string SelectItem value (Radix warning) by using "__none__" sentinel for optional project in upload dialog.
- Switched sync-from-prop logic in IncidentDialog from useMemo (side-effect anti-pattern) to useEffect.
- Ran `bun run lint` — 0 errors / 0 warnings on my two files (one remaining warning is in `daily-entry-page.tsx` belonging to another agent).

Stage Summary:
- Files created:
  - /home/z/my-project/src/components/pages/safety-page.tsx (783 lines, exports `SafetyPage`)
  - /home/z/my-project/src/components/pages/documents-page.tsx (603 lines, exports `DocumentsPage`)
- Both files are `'use client'` and self-contained (no new shared deps, no test files, no other files modified).
- No new API routes, no schema changes — used existing endpoints as documented.
- Design pattern matches dashboard: white cards with `border-border/60 shadow-sm hover:shadow-md`, emerald-600 primary, sky/amber/red accents, responsive grids (1→2→3→4/5), skeleton/loading states, sonner toasts, AlertDialog for destructive actions.
- Custom small helpers: PPE_ITEMS / CATEGORY_META / CATEGORY_LABELS maps kept local to each file for self-containment; `formatFileSize` helper lives only in documents-page (not promoted to constants since not requested).
---
Task ID: 7-b
Agent: Progress + Daily Entry Pages Builder
Task: Build Progress page and Daily Progress Entry page

Work Log:
- Read worklog.md to understand the foundation: API routes (`/api/projects`, `/api/progress`), shared components (`PageHeader`, `StatCard`, `StatusBadge`), hooks (`useFetch`, `apiPost`), Zustand store (`useAppStore`), and constants (`SITE_STATUSES`, `formatNumber`, `formatDate`, `daysBetween`).
- Inspected existing `dashboard-page.tsx` to match the established design pattern (PageHeader + StatCard grid + recharts ResponsiveContainer in Cards with `border-border/60 shadow-sm hover:shadow-md`, `ayk-scrollbar` for long lists).
- Inspected `prisma/schema.prisma` to confirm `DailyProgress` fields and the JSON-string conventions for `materialsUsed`, `equipmentUsed`, `photoUrls`.
- Inspected `/api/projects/route.ts` (each project carries `plannedProgress`, `overallProgress`, `startDate`, `endDate`, `totalPanels`) and `/api/progress/route.ts` (GET supports `?projectId=`, `?from=`, `?to=`, `?limit=`; POST writes back to project `installedPanels` and the Installation stage).
- Created `src/components/pages/progress-page.tsx`:
  - Filter bar wired to `useAppStore.selectedProjectId` (Project select with "All Projects" option), `from`/`to` date inputs, and a Daily/Weekly/Monthly `ToggleGroup` (granularity).
  - Stat cards row: Overall Planned %, Overall Actual %, Variance % (green/red accent based on sign), Schedule Delay (days) computed from `daysBetween(start, today)` vs `overallProgress`.
  - Planned vs Actual `BarChart` (sky = planned, emerald = actual) — one bar pair per project; X axis truncates names > 14 chars.
  - S-Curve `AreaChart` with two stacked areas over time — planned is a linear interpolation `elapsed/total * totalPanels` per project, actual is the max `totalInstalled` observed on or before each sampled day. Sums across all scoped projects when "All Projects" is selected. Sampled to ~150 points max to keep rendering fast.
  - Progress entries table inside `ScrollArea` (`max-h-[500px] ayk-scrollbar`); columns: Date, Project, Installed, Total, Man-hrs, Workers, Site Status (StatusBadge), Submitted By. Aggregation by ISO week or month groups rows by (period + projectId) and sums `installedPanels`/`manHours`/`workers`, takes the max `totalInstalled`, and forwards the latest entry's `siteStatus` and submitter name.
  - "New Entry" emerald button calls `setNav('daily-entry')`.
- Created `src/components/pages/daily-entry-page.tsx`:
  - PageHeader with `<Sun>` icon and a "Back to Progress" outline button calling `setNav('progress')`.
  - Mobile-first centered form Card (`max-w-2xl mx-auto`) with sections for Project, Date, Installed/Total, Man-hours/Workers, Materials (multi-row with Add/Remove), Equipment (checkbox group: Crane, Drill Rig, Torque Wrench, Lift, Scaffold, Generator, Other), Work Completed, Work Pending, Site Status (Select from `SITE_STATUSES`), Remarks, Photos (file input with `capture="environment"`, thumbnail grid using object URLs), and GPS Location (text input + "Get Location" button using `navigator.geolocation.getCurrentPosition`).
  - Total Installed auto-suggestion: fetches `/api/progress?projectId=X&limit=1` and prefills `totalInstalled = last.totalInstalled + installedPanels`. Resumes auto-suggest when project changes; stops overwriting once the user manually edits the field (tracked via a `totalEdited` flag).
  - Submit handler POSTs to `/api/progress`, converting materials rows to a `Record<string,string>` object and equipment/photos to arrays (photos stored as filename strings since there is no real storage). On success: `toast.success`, shows an emerald success banner, resets the form, and refetches recent submissions.
  - Recent submissions card below the form: fetches `/api/progress?limit=5` and renders rows with project name, `StatusBadge`, date, panels installed, submitter, and running total.
- Ran `bun run lint` — fixed one unused `eslint-disable` directive; final result is clean (0 errors, 0 warnings).
- Did NOT touch any other files (app-shell.tsx, other page components, API routes, schema, etc.) — they remain for parallel agents to complete.

Stage Summary:
- Files created:
  - `src/components/pages/progress-page.tsx` — Progress tracking page (`ProgressPage`): filter bar, 4 stat cards, Planned vs Actual BarChart, S-Curve AreaChart, daily/weekly/monthly aggregated table, "New Entry" CTA.
  - `src/components/pages/daily-entry-page.tsx` — Daily site progress submission form (`DailyEntryPage`): mobile-first Card with all required fields, auto-suggested running total, photo thumbnails with `capture="environment"`, GPS capture, recent submissions list.
- Decisions:
  - S-Curve uses linear interpolation for planned (start → end × totalPanels) and a step-wise max-of-running-total for actual; sampled to ≤150 points to keep recharts fast.
  - Table aggregation groups by (period + projectId) so each aggregated row still identifies a single project; `totalInstalled` is max (cumulative), other numerics are summed.
  - Photos are tracked in client state as `{ name, url }` pairs and stored on the server as a JSON-stringified array of filenames only (no real file storage available in this sandbox).
  - Equipment uses a checkbox group instead of comma-separated tags for a touch-friendly mobile UX (works well on phones).
  - Auto-suggest for `totalInstalled` is overridden when the user manually edits the field, but re-engages when project changes.
- Both files are `'use client'`, match the dashboard's visual style (white Cards, emerald-600 primary, slate text, rounded-xl borders), and are responsive (mobile-first; grids collapse 2-col → 1-col on small screens).
- Lint: clean (0 errors, 0 warnings).

---
Task ID: 8
Agent: Tasks + Manpower Pages Builder
Task: Build Tasks page (kanban + table) and Manpower page (workers + attendance)

Work Log:
- Read worklog.md foundation: API routes, shared components (PageHeader, StatCard, StatusBadge, PriorityBadge), useFetch/apiPost/apiPut/apiDelete hooks, Zustand store, constants (TASK_STATUSES, TASK_PRIORITIES, formatNumber, formatDate, formatDateTime), brand colors (emerald-600 primary), card/table/dialog patterns from dashboard-page.
- Created `src/components/pages/tasks-page.tsx` exporting `TasksPage` ('use client'):
  - PageHeader with emerald-600 "New Task" button (Plus icon, ListChecks header icon)
  - Overdue banner (red-50) when overdueCount > 0 with "Filter Delayed" button
  - Filter bar: Project Select, Status Select (Todo/InProgress/Completed/Delayed), Priority Select (Low/Medium/High/Critical), Assignee Select (from `/api/users`) + Clear + Board/List toggle
  - Board view: 4 columns (Todo/InProgress/Completed/Delayed), each Card with status dot, label and count badge; each task is a small card with overdue red dot, title, project, priority dot + PriorityBadge, assignee avatar, due date, progress bar; hover-reveal edit/delete buttons
  - List view: shadcn Table with sticky header; columns Title/Project/Assigned To/Priority/Status/Progress (bar+%)/Due Date/Actions; overdue rows highlighted red-50
  - New/Edit Dialog: title (Input), description (Textarea), project (Select), assignedTo (Select of users — resolves assignedToName), team (Input), priority (Select), status (Select), progress (Slider 0-100 step 5), startDate (date), dueDate (date, required), remarks (Textarea); POST `/api/tasks` or PUT `/api/tasks/[id]`
  - Delete: AlertDialog confirm → DELETE `/api/tasks/[id]` → refetch + sonner toast
  - Loading skeleton cards; empty state card
- Created `src/components/pages/manpower-page.tsx` exporting `ManpowerPage` ('use client'):
  - PageHeader with emerald "Add Worker" button visible only for Admin/ProjectManager (Plus icon, Users header icon)
  - 4 StatCards: Workers On Site (today present), Workers Absent (Active, not present), Total Workers, Total Man-hours (sum of last-7-day attendance)
  - Team Productivity card: recharts BarChart of workingHours per team for last 7 days (top 10)
  - Filter bar: Project, Team (derived from workers), Status (Active/OnLeave/Inactive) + Clear
  - Tabs (Workers | Attendance Log)
  - Workers table inside ScrollArea max-h-96 with sticky header; columns Emp ID, Name, Role, Team, Project, Skill (badge), Status (StatusBadge), Phone, Today's hours, Actions (Check-in / Check-out + edit + delete). Check-in/out buttons gated by today's attendance state and `canManage`.
  - Check-in/out: POST `/api/workers/[id]` body `{action}` → toast + refetch; buttons disabled appropriately
  - Add/Edit Worker Dialog: name, employeeId, role (Select 6 options), team (Select existing or none), project, phone, skillLevel (Junior/Intermediate/Senior), status; POST `/api/workers` or PUT `/api/workers/[id]`
  - Attendance Log tab: Table inside ScrollArea max-h-96 from `/api/attendance?from=&to=` records — Date, Worker, Team, Check-in (formatDateTime), Check-out, Working Hours, Overtime badge, Status badge
  - Delete: AlertDialog confirm → DELETE `/api/workers/[id]` → refetch + toast
- Ran `bun run lint`: 0 errors in new files (only 1 pre-existing warning in daily-entry-page.tsx)
- Confirmed dev log: tasks-page and manpower-page module-not-found errors are no longer in latest entries; remaining errors are for other agents' pages (projects/progress/materials/expenses/safety/documents/reports/settings/mobile/daily-entry).
- Wrote per-agent work record at `/agent-ctx/8-tasks-manpower-pages-builder.md`.

Stage Summary:
- Files created (2): `src/components/pages/tasks-page.tsx`, `src/components/pages/manpower-page.tsx`
- No other files modified.
- Both files are `'use client'` and follow the established AYK design pattern (white cards, emerald-600 primary, sticky table headers, ScrollArea max-h-96 for long lists, sonner toasts, AlertDialog confirmations, shadcn/ui controls, responsive grid).
- All required APIs (`/api/tasks`, `/api/tasks/[id]`, `/api/workers`, `/api/workers/[id]` with checkin/checkout action, `/api/attendance`, `/api/projects`, `/api/users`) consumed as specified.
- Task is complete and ready for integration with the rest of the app once sibling pages land.

---
Task ID: 10-b
Agent: Reports + Settings + Mobile Pages Builder
Task: Build Reports page, Settings page, and Mobile site-progress interface

Work Log:
- Read /home/z/my-project/worklog.md to understand the foundation: API routes, shared components (PageHeader, StatCard, StatusBadge), Zustand store (useAppStore), constants (ROLES, APP_NAME, APP_TAGLINE, NOTIFICATION_TYPES, formatDate, etc.), use-fetch hook, design pattern.
- Reviewed existing dashboard-page.tsx, shared components, shadcn/ui primitives (Dialog, Tabs, Select, Table, AlertDialog, ScrollArea, Switch, etc.) to match the established design system.
- Reviewed /api/reports/[type], /api/users, /api/users/[id], /api/projects, /api/progress, /api/dashboard, /api/notifications, /api/safety/checklists route handlers to align data shapes and endpoint usage.
- Created src/components/pages/reports-page.tsx ('use client', exported as ReportsPage):
  * 9 report cards in a 1/2/3-column responsive grid, each with type-specific lucide icon, title, description, emerald Generate button (spinner during fetch), and an outline Print icon button.
  * On Generate: GET /api/reports/[type] → stores ReportResponse in state, opens Dialog (max-w-4xl, max-h-[88vh]) with ScrollArea rendering the HTML via dangerouslySetInnerHTML and a few global table styles applied via [&] selectors.
  * Dialog footer has Download HTML (Blob → AYK-<type>-<date>.html) and Print buttons; Print uses printReport(html, title) helper that opens a new window, writes a fully-styled HTML document, and calls window.print().
  * Recent Reports section below the grid tracks last 6 generated reports in component state with quick regen buttons.
- Created src/components/pages/settings-page.tsx ('use client', exported as SettingsPage):
  * PageHeader with Settings icon. Tabs (Profile | Users | Company | Alerts | Security) in 2/5-column responsive grid.
  * Profile tab: avatar (first-letter circle), Account Overview card (name, email, role badge, phone, status), Edit Profile form (name, phone, optional password) — PUT /api/users/[currentUserId] then updates Zustand user.
  * Users tab (Admin-only — non-admins see lock message): table with Name/Email/Role badge/Phone/Status/Created/Actions. Add User dialog (email, name, password, role Select of ROLES, phone) → POST /api/users. Edit dialog (name, role, phone, isActive Switch, optional password) → PUT /api/users/[id]. Deactivate AlertDialog → DELETE /api/users/[id] (soft delete).
  * Company tab (local-only): name (default APP_NAME), tagline (default APP_TAGLINE), address, UEN, logo upload (file input → FileReader → data URL preview), save to localStorage. Save button → toast.success("Company settings saved").
  * Notifications tab (local-only): Switch toggles for each NOTIFICATION_TYPES entry, persisted to localStorage, toast on toggle.
  * Security tab: change password form (current/new/confirm) PUT /api/users/[id] { password }, 2FA Switch (UI only), session info card.
- Created src/components/pages/mobile-page.tsx ('use client', exported as MobilePage):
  * Outer wrapper: full-bleed gradient background, centered max-w-md container.
  * Phone frame: sm:rounded-[2rem] sm:border-4 sm:border-slate-800 sm:shadow-2xl overflow-hidden, min-h-[640px]. On mobile: border rounded-none (full width). Status bar with time, signal/wifi/battery icons (sm+ only).
  * Emerald app header with AYK logo, name, tagline, greeting "Hi, {firstName}", current date.
  * Current Project card: fetches /api/projects?status=Active, shows first project with circular SVG progress ring (overall %), location, capacity, installed/total panels with Progress bar, status badge. Empty state for no projects.
  * Today's Site Progress card: fetches /api/progress?limit=1, detects if entry is today; shows 2x2 mini stat grid (installed today, total installed, man-hours, workers) with site status badge, or "No entry submitted yet" empty state with Update Progress button.
  * Quick Stats 2x2 grid: workers on site, pending tasks, material alerts, PPE compliance — sourced from /api/dashboard stats; each navigates to the relevant desktop page on tap.
  * Big emerald "Update Site Progress" button → setNav('daily-entry').
  * Safety Checklist & Upload Photos quick-action cards (2-col). Safety card shows today's PPE compliance % if /api/safety/checklists contains an entry for today, navigates to safety page. Upload navigates to daily-entry (photo upload lives there).
  * Site Status pills: Normal/Delay/Issue/Halt (SITE_STATUSES), highlights current entry's status, tap navigates to daily-entry.
  * Recent Activity list: last 3 notifications from /api/notifications with severity-colored icon and timeAgo label.
  * Bottom nav (4 quick actions): Home → dashboard, Projects → projects, Tasks → tasks, More → reports.
  * Helper utilities: NotifIcon, timeAgo, MiniStat, QuickStatCard, BottomNav sub-components.
- Ran `bun run lint` — clean (no errors). Ran `bunx tsc --noEmit --skipLibCheck` — no errors in my three files (other agents' files have unrelated Prisma include warnings).
- Triggered `curl localhost:3000` to force Next.js dev recompile — "GET / 200 in 2.4s (compile: 2.0s)" confirms successful compilation.

Stage Summary:
- Files created (only these three, no other files modified):
  1. src/components/pages/reports-page.tsx — ReportsPage component with 9 report cards, preview Dialog (max-w-4xl), Print (window.open+document.write+print), Download HTML (Blob), Recent Reports.
  2. src/components/pages/settings-page.tsx — SettingsPage with 5 Tabs (Profile, Users, Company, Notifications, Security), Admin-only user table with Add/Edit/Deactivate dialogs, localStorage-backed Company + Notifications, password change, 2FA toggle.
  3. src/components/pages/mobile-page.tsx — MobilePage phone-frame UI (max-w-md, sm:border-4 sm:rounded-3xl) with status bar, AYK header, current project (SVG ring), today's site progress, quick stats from /api/dashboard, big Update Progress button, PPE checklist quick card, Upload Photos, Site Status pills, recent activity, bottom nav.
- Design: white cards, emerald-600 primary, responsive (mobile-first), matches dashboard visual style; uses shared PageHeader/StatCard/StatusBadge components, shadcn/ui (Tabs, Dialog, AlertDialog, Table, Select, Switch, ScrollArea, Progress, Badge, Avatar), useFetch/apiPost/apiPut/apiDelete hooks, useAppStore (user, setNav), and lib/constants (ROLES, APP_NAME, APP_TAGLINE, NOTIFICATION_TYPES, formatDate, formatNumber, SITE_STATUSES).
- All three files are 'use client' as required. App-shell already imports them — verified GET / 200 OK after creation.

---
Task ID: 12 (Verification)
Agent: Main Agent
Task: Final verification of AYK PTE LTD Solar PM System

Work Log:
- Fixed missing /api/auth/login/route.ts (file had not persisted; recreated)
- Fixed Prisma schema: added `project` relation to SafetyChecklist and SafetyIncident (were missing, causing 500 on safety APIs + reports)
- Ran db:push (non-destructive, data preserved)
- Restarted dev server to pick up regenerated Prisma client
- Verified all 26 API routes return HTTP 200 with real seeded data
- Verified login flow: POST /api/auth/login returns {name:"Alex Tan", role:"Admin"} + sets session cookie
- Verified session restore: GET /api/auth/me returns logged-in user
- Verified dashboard stats: activeProjects:2, completedProjects:1, delayedProjects:1, totalBudget:$24.5M, budgetUsed:$14.3M, totalWorkers:24, workersOnSite:24, pendingTasks:9, lowStockCount:2, totalIncidents:5, openIncidents:2, ppeCompliance:86%
- Verified projects list returns 5 seeded projects (Tuas, Jurong, Sembcorp, Woodlands, Choa Chu Kang)
- Verified reports generation works for all 9 report types
- Ran `bun run lint` → 0 errors, 0 warnings
- Attempted browser verification via agent-browser, but sandbox OOM (4GB) cannot hold Next.js dev server (1.3GB) + Chromium simultaneously; server is killed on browser launch. Verified full stack via comprehensive API testing instead.

Stage Summary:
- All 13 page components built and exported correctly
- All 26 API routes functional with realistic seeded data
- Auth (login/logout/session) working
- CRUD operations wired for projects, tasks, workers, materials, expenses, safety, documents, users
- Charts, reports, role-based permissions, mobile interface all implemented
- Lint clean, TypeScript correct
- Dev server running on port 3000 for user preview
- Browser visual verification limited by sandbox memory (4GB); full-stack functionality confirmed via API-level testing
