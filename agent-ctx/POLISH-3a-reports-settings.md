# POLISH-3a — Reports + Settings Polish

Task: Polish Reports and Settings pages for desktop+mobile consistency.

## Files edited (overwritten in place, same export names)
- `/home/z/my-project/src/components/pages/reports-page.tsx` — `ReportsPage` ('use client')
- `/home/z/my-project/src/components/pages/settings-page.tsx` — `SettingsPage` ('use client')

## Approach
- Read worklog + design-system + shared components (SectionHeader / SubSection / StatCard / EmptyState / LoadingState) + the two existing files end-to-end.
- Replaced old `PageHeader` with `SectionHeader`:
  - Reports = `section="reports"` (slate accent strip + gradient FileBarChart icon)
  - Settings = `section="settings"` (stone accent strip + gradient Settings icon)
- Grouped content blocks under `SubSection` so cards no longer float without context.

## Reports page key changes
- 9 report cards color-coded per spec via a `section: SectionKey` field on each card config:
  - Daily/Weekly/Monthly → `overview` (emerald)
  - Manpower → `manpower` (cyan)
  - Material Usage → `materials` (violet)
  - Expense → `expenses` (pink)
  - Safety → `safety` (red)
  - Project Summary → `projects` (sky)
  - Planned vs Actual → `progress` (indigo)
- Each card: colored top accent strip (`bg-gradient-to-r` with the section's gradient) + icon in section-colored container (theme.iconBg / theme.iconFg) + title + description + section-colored Generate button (via SECTION_BUTTON map keyed by SectionKey) + outline Print icon button.
- Loading state in Generate button: `<Loader2 className="animate-spin" />` + "Generating…".
- Recent reports chips: section-colored icon container + title + `formatGeneratedAt()` timestamp + "Re-run" Badge with RotateCw icon (hidden on mobile).
- Empty recent state uses shared `EmptyState` (History icon, "No reports generated yet").
- Generated report dialog: `max-w-4xl`, `max-h-[85vh]` (was 88vh); ScrollArea `max-h-[60vh]`; footer Print button recolored slate-600; footer buttons stack full-width on mobile (`flex-col sm:flex-row` + `w-full sm:w-auto`).
- Defensive `formatGeneratedAt()` helper handles undefined/empty/invalid date strings.
- All functionality preserved: handleGenerate (fetch /api/reports/{type}), recent.unshift with dedup + slice(0,6), printReport (popup window with inline styles), downloadHtml (Blob URL), dialog open/close.

## Settings page key changes
- TabsList restyled to `grid w-full grid-cols-1 sm:grid-cols-5 h-auto gap-1` — stacks vertically full-width on mobile (`grid-cols-1`), becomes 5 equal pills on desktop (`sm:grid-cols-5`).
- Each TabsTrigger has a small colored icon: Profile/UserIcon (stone-600), Users/Users (emerald-600, the admin-tools accent), Company/Building2 (stone-600), Alerts/Bell (stone-600), Security/Lock (stone-600).
- PROFILE TAB: avatar fallback switched to stone-600 to match section. Form labels restyled with `text-[11px] uppercase tracking-wide text-muted-foreground` for consistency with StatCard labels. Save button uses `SAVE_BUTTON` (bg-stone-600 hover:bg-stone-700).
- USERS TAB (admin-only): 
  - Non-admin access uses shared `EmptyState`.
  - 4 StatCards above the table (Total / Active / Admins / New 30d) — all `section="overview"` (emerald) + `compact`, in `grid-cols-2 md:grid-cols-4`.
  - Users table wrapped in `<ScrollArea max-h-[500px]>` with `min-w-[...]` column headers for horizontal scroll on mobile; sticky header + `hover:bg-slate-50` rows.
  - Loading uses shared `LoadingState`. Empty users list uses shared `EmptyState`.
  - Add User + Edit User dialogs changed to `w-full sm:max-w-lg max-h-[90vh] overflow-y-auto ayk-scrollbar` per spec; footer buttons stack full-width on mobile.
  - All role badges preserved (ROLE_BADGE map: Admin=emerald, PM=sky, SiteSupervisor=violet, SafetyOfficer=red, Engineer=blue, StoreOfficer=amber, Worker=slate). Add/Edit buttons stay emerald-600 (overview accent for the admin-tools tab). AlertDialog destructive stays red-600.
- COMPANY TAB: logo preview card border recolored stone-50/60; upload button uses Upload icon; Remove logo uses X icon. Form fields are full-width (`sm:col-span-2`) since they're long-text inputs. Defaults `APP_NAME` ("AYK PTE LTD") and `APP_TAGLINE`. Save button uses `SAVE_BUTTON` (stone-600).
- ALERTS TAB: NOTIF_META map gives each notification type an icon + short description (e.g. DelayedProject=ShieldAlert/"A project falls behind its planned schedule"; LowStock=Package/"Material stock drops below the minimum level"). Icon containers recolored stone-100 / stone-600.
- SECURITY TAB: title icons (KeyRound, ShieldCheck) recolored stone-600 (was emerald). Form labels restyled uppercase. Save button uses `SAVE_BUTTON` (stone-600).
- Removed unused `UserStat` interface, `SectionKey`, `getSectionTheme`, `cn` imports.
- Defensive coding: `user?.name || '—'`, `data?.users || []`. Stat counts via `users.filter(...).length` (no redundant `?? 0`).

## Validation
- `bun run lint` → 0 errors, 0 warnings on both files.
- `bunx tsc --noEmit --skipLibCheck` → 0 errors in reports-page.tsx and settings-page.tsx. (Pre-existing TS errors in OTHER files — dashboard-page duplicate PieChart identifier, mobile-page missing 'More' icon, examples/ scripts/ skills/ issues — remain and are out of scope.)
- Dev.log shows the same pre-existing dashboard-page OOM/duplicate-PieChart issue and unrelated sandbox memory pressure — not introduced by this work.

## Out of scope / untouched
- No API routes modified.
- No Prisma schema changes.
- No other pages touched.
- No test files created.
