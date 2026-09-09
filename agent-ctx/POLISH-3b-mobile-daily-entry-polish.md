# POLISH-3b — Mobile + Daily Entry Polish

Task: Polish Mobile Site View and Daily Entry pages for desktop+mobile consistency.

## Files edited (overwritten in place, same export names)
- `/home/z/my-project/src/components/pages/mobile-page.tsx` — `MobilePage` ('use client')
- `/home/z/my-project/src/components/pages/daily-entry-page.tsx` — `DailyEntryPage` ('use client')

## Approach
- Read worklog + design-system (`SECTION_THEMES`) + shared components (SectionHeader / SubSection / StatCard / EmptyState / CardSkeleton / StatusBadge) + the two existing files end-to-end.
- Replaced old `PageHeader` (daily-entry) with `SectionHeader` using the correct section color codes.
  - Mobile = `section="mobile"` (emerald accent + gradient strip, `Smartphone` icon) — only visible `lg:block` since the phone frame already has its own emerald-gradient header inside.
  - Daily Entry = `section="dailyEntry"` (amber accent + gradient strip, `Sun` icon) with a "Back to Progress" outline action.
- Grouped form sections under `SubSection` so the daily-entry form is no longer a flat list.

## Mobile page key changes
- Added `hidden lg:block` desktop-only `SectionHeader` (section="mobile", Smartphone icon) constrained to `max-w-md` so it lines up with the phone frame below.
- Phone-frame container kept on `sm:` breakpoint (rounded-[2rem], border-4 border-slate-800, shadow-2xl); full-width no border on mobile < 640px.
- App header inside phone upgraded to `bg-gradient-to-br from-emerald-500 to-teal-600` (was flat emerald-600) — matches the `mobile` section gradient.
- Status bar (time + SignalHigh/Wifi/BatteryFull icons) kept `hidden sm:flex`.
- Current Project card: kept SVG circular progress ring (radius 52, stroke 8) + project name + location + capacity + installed/total with `Progress` bar + emerald status badge; now uses `CardSkeleton` (`h-32 rounded-lg`) while loading and `EmptyState` (FolderKanban icon) when no active project.
- Today's Site Progress card: kept 2×2 mini-stat grid (Installed today / Total installed / Man-hours / Workers) with site-status badge; replaced inline "no entry submitted yet" block with shared `EmptyState` (AlertTriangle icon, "Update Progress" emerald button → `setNav('daily-entry')`); added `CardSkeleton` for the loading state.
- Quick Stats row: 2×2 grid of QuickStatCard (Workers on site / Pending tasks / Material alerts / PPE compliance) — each navigates via `setNav('manpower' | 'tasks' | 'materials' | 'safety')`. Defensive `formatNumber(stats?.workersOnSite ?? 0)` etc.
- Big "Update Site Progress" emerald button (h-12, full-width) → `setNav('daily-entry')`.
- PPE Checklist quick card + Upload Photos quick card kept as 2-col grid; hover-border recolored to section color (red / sky).
- Site Status pills (Normal/Delay/Issue/Halt) — kept `SITE_STATUS_STYLE` map, highlight active ring for `latestEntry.siteStatus`, all pills → `setNav('daily-entry')`.
- Recent Activity: kept severity-colored icon container + time-ago + project name. Replaced inline "no recent notifications" with shared `EmptyState`; added 3× `CardSkeleton` for the loading state.
- Bottom nav uses `Home`, `FolderKanban`, `ListChecks`, `More` (lucide-react) — calls `setNav('dashboard' | 'projects' | 'tasks' | 'reports')`. Changed from `MoreHorizontal` to `More` per spec.
- Defensive coding: `(latestEntry.manHours ?? 0).toFixed(1)`, `(project.totalPanels ?? 0) > 0`, all `formatNumber`/`formatDate` calls already handle undefined via `?? 0` and `formatDate` guards. `timeAgo` now validates the Date with `isNaN` and returns `'—'` for bad input.
- All existing functionality preserved (project fetch, latest progress fetch, dashboard stats, notifications, PPE checklists, setNav navigation, photo upload button → daily-entry).

## Daily Entry page key changes
- Replaced `PageHeader` with `SectionHeader` (section="dailyEntry", amber gradient strip, `Sun` icon, "Back to Progress" outline action with ArrowLeft).
- Form Card: `max-w-2xl mx-auto` with `border-amber-200/60` accent + `CardContent` padding `p-4 sm:p-6`.
- Form sections grouped under amber-themed `SubSection`:
  1. **Project & Date** (FolderKanban) — Select + date input, 2-col on `sm:`.
  2. **Production** (Sun) — installed panels + total installed (with amber auto-suggest helper pill) + man-hours + workers; 2×2 on `sm:`.
  3. **Materials & Equipment** (Package) — multi-row materials (add/remove with amber "Add row" button) + 7 equipment checkboxes in `grid-cols-2 sm:grid-cols-3` with amber-tinted selected state.
  4. **Work Details** (FileText) — Work Completed + Work Pending textareas + Site Status Select.
  5. **Site Info** (MapPin) — Remarks textarea + GPS input with amber "Get Location" button + Photos upload.
- All inputs use `h-11` for touch-friendly targets (defined as `INPUT_CLS` constant); Selects and material-row remove buttons also `h-11`.
- **Photo upload** upgraded to a large dashed-border drag-drop zone (`border-2 border-dashed border-amber-200 bg-amber-50/40`), with `UploadCloud + Camera` icon, "Tap to take a photo or drag & drop" text, and `capture="environment"` so mobile opens the rear camera. Implements `onDragOver`/`onDragLeave`/`onDrop` handlers (filters `image/*` mime). Thumbnail grid (`grid-cols-3 sm:grid-cols-4`) with hover-remove button and filename overlay (kept `<img>` for object URLs — Next Image not needed for blob URLs).
- Submit button: `bg-amber-600 hover:bg-amber-700 text-white h-12 text-base` with CheckCircle2 (or Loader2 spinner while submitting). Shows amber "Please select a project to enable submit" hint when no project selected.
- Success banner (emerald, `border-emerald-200 bg-emerald-50`, CheckCircle2) above the form; "Submit Another" outline button resets `submitted` state.
- Auto-suggest for totalInstalled preserved (last entry + today's installed), with amber pill helper when `lastEntry` exists.
- GPS `getLocation` preserved with `enableHighAccuracy: true, timeout: 10000` and success/error toasts. Shows amber "Captured: lat,lng" hint with monospace font.
- Recent submissions card below form (`max-w-2xl mx-auto`): SubSection header with `ClipboardList` icon; recent entries list with project name + StatusBadge + formatDate + panels installed + submitter + total. Uses `CardSkeleton` for loading state and `EmptyState` (ClipboardList) when no entries.
- All existing functionality preserved (apiPost to /api/progress, refetch recent after submit, materials → object, equipment → array, photos → name array, GPS capture, project prefill).

## Lint
- `bun run lint` — 0 errors, 0 warnings after removing an unused `eslint-disable-next-line` directive on the photo `<img>` tag.

## Note on dev server
- The auto-run dev server hit an unrelated OOM crash from `src/components/pages/dashboard-page.tsx` (a barrel-optimizer quirk on `PieChart as PieChartIcon` from lucide-react conflicting with `PieChart` from recharts). The dashboard source is correctly aliased but the optimized barrel output drops the alias. This is a pre-existing issue introduced by an earlier agent's refactor and is **outside** the files I'm allowed to edit per task instructions. Lint confirms my two files are syntactically and semantically valid; the dashboard issue will need a separate fix.
