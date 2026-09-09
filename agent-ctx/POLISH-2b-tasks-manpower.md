# Task ID: POLISH-2b — Tasks + Manpower Polish Agent

## Files Edited
- `/home/z/my-project/src/components/pages/tasks-page.tsx`
- `/home/z/my-project/src/components/pages/manpower-page.tsx`

## Notes
- Both files kept `'use client'` and original export names (`TasksPage`, `ManpowerPage`).
- Replaced old `PageHeader` with `SectionHeader` (imported from `@/components/shared/section-header`).
- Used `SubSection` from the same module for grouping KPI / chart / table sections.
- Color-coded StatCards: `section="tasks"` (amber) for Tasks page, `section="manpower"` (cyan) for Manpower page, `section="safety"` (red) for overdue/absent metrics.
- Used shared `EmptyState` component (from `@/components/shared/empty-state`) instead of local `EmptyState` definitions.
- All existing functionality (filters, CRUD dialogs, board/list toggle, check-in/out buttons, productivity chart, AlertDialog delete) preserved.

## Summary of Changes

### tasks-page.tsx
- New header: `SectionHeader section="tasks"` with amber accent strip, label badge, gradient icon container.
- Replaced inline KPI with new 2x2 / 4-col `StatCard` grid grouped by `SubSection section="tasks" title="Task Overview"`.
  - Total Tasks (tasks / amber), In Progress (tasks / amber), Completed (tasks / amber), Overdue (safety / red).
- Filter bar: stacked on mobile (`flex flex-col sm:flex-row`), selects grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`, view toggle auto-aligns to the right on desktop, full-row on mobile.
- Board view (`grid-cols-1 md:grid-cols-2 xl:grid-cols-4`), each column header color-coded (slate / sky / emerald / red), with colored dot + label + count badge. Card body in a flex `Card` so columns scroll independently (`max-h-[600px] overflow-y-auto ayk-scrollbar flex-1`).
- TaskCard: amber-themed hover (border / avatar / button accent), added a small `Clock` icon next to the due date, `?? 0` defensive coding on `task.progress`.
- List view: wrapped in `ScrollArea max-h-[500px]` with a `min-w-[900px]` inner div for horizontal scroll on mobile.
- Loading skeletons: animated `pulse` placeholders matching the board / list card shapes.
- Empty states: use shared `EmptyState` component (no longer a local function).
- Dialog: `w-full sm:max-w-2xl`, footer buttons stacked full-width on mobile via `flex-col sm:flex-row gap-2`.
- Primary buttons recolored amber-600 / hover amber-700 to match section theme.
- New icons imported: `CheckCircle2`, `Clock`, `Loader2`, `Flag` (Flag unused after revision — removed before final save to keep imports clean). Final imported icon list is minimal and used.

### manpower-page.tsx
- New header: `SectionHeader section="manpower"` with cyan accent strip and gradient icon.
- KPI grid grouped under `SubSection section="manpower" title="Workforce Today"`.
  - Workers On Site (manpower / cyan), Workers Absent (safety / red), Total Workers (manpower / cyan), Total Man-hours (manpower / cyan). Removed old `accent="..."` prop since StatCard now uses `section`.
- Productivity chart moved under a `SubSection section="manpower" title="Team Productivity"` with a `BarChart3` icon; chart bar fill switched to cyan `#06b6d4` to match the section. Empty state uses shared `EmptyState`.
- Filter bar reflow: `flex-col sm:flex-row sm:flex-wrap` so selects stack on mobile, wrap inline on desktop. Each select becomes full-width on mobile via `w-full sm:w-[150px]`.
- Workers table wrapped in `ScrollArea max-h-[500px]` with `min-w-[1000px]` inner wrapper for horizontal scroll on mobile.
- Added a deterministic team-color dot (10-color palette hashed from team string) shown before the team name in the Workers table and the Attendance Log table.
- Skill badges preserved (Junior=slate, Intermediate=sky, Senior=emerald) via existing local `SKILL_BADGE` map.
- "Today (h)" column now shows a `Progress` bar (cyan up to 8 h, amber when overtime) plus a small "OT" badge when hours > 8.
- Check-in / Check-out buttons: full-width on mobile (`w-full sm:w-auto`) with text labels "In"/"Out" visible only on mobile (`sm:hidden`), compact on desktop.
- Dialog resized to `w-full sm:max-w-lg` with stacked footer buttons on mobile.
- Loading skeleton replaced with 6 animated `bg-slate-100` rows; empty states use shared `EmptyState`.
- Primary buttons recolored cyan-600 / hover cyan-700 to match the section theme.

## Lint / Type check
- `bun run lint` → exit 0, no errors, no warnings on these two files.
- Pre-existing errors in other agents' files (dashboard-page.tsx duplicate `PieChart` identifier; projects-page.tsx using removed `accent` prop; safety-page.tsx missing `Mitten` icon; next/types validator complaints about safety incidents route) are NOT introduced by this task — they predate it.

## Defensive coding
- Added `?? 0` to every numeric prop passed into StatCards and Progress components (`metrics.total ?? 0`, `task.progress ?? 0`, `stats.onSite ?? 0`, `stats.manHours ?? 0`, `todayHoursByWorker[w.id] || 0`).
- `formatNumber` / `formatDate` / `formatDateTime` already handle undefined; no extra defensive code needed.
