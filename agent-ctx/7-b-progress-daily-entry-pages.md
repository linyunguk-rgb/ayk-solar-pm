# Task 7-b — Progress + Daily Entry Pages Builder

## Files Created
- `src/components/pages/progress-page.tsx` — exports `ProgressPage` ('use client')
- `src/components/pages/daily-entry-page.tsx` — exports `DailyEntryPage` ('use client')

## What's in `ProgressPage`
- PageHeader with `<TrendingUp>` icon, "Progress Tracking" title, "Planned vs Actual progress across projects" description, and an emerald "New Entry" button (calls `setNav('daily-entry')`).
- Filter bar (Card): Project Select wired to `useAppStore.selectedProjectId` with "All Projects" + project options from `/api/projects`, `from`/`to` date inputs, and a Daily/Weekly/Monthly `ToggleGroup` for granularity.
- Stat cards: Overall Planned %, Overall Actual %, Variance % (green if ≥ 0 else red), Schedule Delay (days behind linear plan).
- Planned vs Actual `BarChart` (sky + emerald bars) — one pair per project.
- S-Curve `AreaChart` with two areas — planned cumulative (linear from project.startDate → project.endDate × totalPanels) and actual cumulative (max totalInstalled observed on or before each day). Summed across all scoped projects when "All Projects" is selected; sampled to ≤150 points.
- Daily/Weekly/Monthly progress table inside `ScrollArea max-h-[500px] ayk-scrollbar`. Columns: Date, Project, Installed, Total, Man-hrs, Workers, StatusBadge, Submitted By. Daily = raw entries; Weekly = grouped by ISO week + projectId; Monthly = grouped by month + projectId. Aggregation sums `installedPanels`, `manHours`, `workers`, takes max of `totalInstalled`, and forwards latest entry's status/submitter.

## What's in `DailyEntryPage`
- PageHeader with `<Sun>` icon and a "Back to Progress" outline button (calls `setNav('progress')`).
- Mobile-first centered form Card (`max-w-2xl mx-auto`) with:
  - Project Select (required), Date (default today).
  - Installed Panels Today + Total Installed Quantity (auto-suggested from `/api/progress?projectId=X&limit=1` → `last.totalInstalled + installedPanels`).
  - Man-hours, Number of Workers.
  - Materials Used (multi-row name/qty with Add/Remove buttons; stored as object).
  - Equipment Used (checkbox group: Crane, Drill Rig, Torque Wrench, Lift, Scaffold, Generator, Other).
  - Work Completed, Work Pending Textareas.
  - Site Status Select (from `SITE_STATUSES` constant).
  - Remarks Textarea.
  - Photos: file input multiple with `accept="image/*"` and `capture="environment"` for camera; thumbnail previews using `URL.createObjectURL`; stored as JSON string of filenames.
  - GPS / Site Location: text input + "Get Location" button using `navigator.geolocation.getCurrentPosition` → fills "lat,lng".
- Full-width emerald Submit button — POSTs to `/api/progress`; on success: `toast.success`, shows emerald success banner, resets form, refetches recent entries; on error: `toast.error`.
- Recent submissions card below the form: fetches `/api/progress?limit=5` and shows project name, StatusBadge, date, panels installed, submitter, running total.

## APIs Used
- `GET /api/projects` → `{ projects }` (each has `plannedProgress`, `overallProgress`, `startDate`, `endDate`, `totalPanels`)
- `GET /api/progress?projectId=X&limit=1` → `{ entries }` (latest entry for prefill)
- `GET /api/progress?limit=5` → `{ entries }` (recent submissions list)
- `GET /api/progress?limit=400` → `{ entries }` (for S-curve + table)
- `POST /api/progress` body matches the schema in the spec.

## Shared Building Blocks
- `PageHeader`, `StatCard`, `StatusBadge` from `@/components/shared/*`
- `useFetch`, `apiPost` from `@/hooks/use-fetch`
- `useAppStore` from `@/store/app-store`
- `SITE_STATUSES`, `formatNumber`, `formatDate`, `daysBetween` from `@/lib/constants`
- `toast` from `sonner`
- shadcn/ui: `Card`, `Select`, `Input`, `Label`, `Textarea`, `Button`, `Checkbox`, `ScrollArea`, `Table`, `ToggleGroup`
- recharts: `BarChart` + `AreaChart`
- lucide-react icons

## Design Decisions
- S-Curve uses linear interpolation for planned, step-wise max-of-running-total for actual.
- Table aggregation groups by (period + projectId) so each row still identifies a single project; `totalInstalled` is max (cumulative), other numerics are summed.
- Photos are tracked in client state as `{ name, url }` pairs and stored on the server as a JSON-stringified array of filenames only (no real file storage in this sandbox).
- Equipment uses a checkbox group for touch-friendly mobile UX.
- Auto-suggest for `totalInstalled` stops overwriting once the user manually edits the field, but re-engages when project changes.

## Lint
`bun run lint` → clean (0 errors, 0 warnings) after removing one unused eslint-disable directive.

## Out of Scope (handled by other parallel agents)
- `app-shell.tsx` already imports `ProgressPage` and `DailyEntryPage` — both exports exist and resolve correctly.
- Other pages (`projects-page`, `tasks-page`, `manpower-page`, etc.) and the `mobile-page` are owned by sibling task IDs. I did NOT modify any files outside my two deliverables.
