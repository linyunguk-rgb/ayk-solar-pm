# Task ID POLISH-2c — Materials + Expenses Polish

## Files Edited (overwritten in place)
- `/home/z/my-project/src/components/pages/materials-page.tsx` — export `MaterialsPage`
- `/home/z/my-project/src/components/pages/expenses-page.tsx` — export `ExpensesPage`

## Pre-work Reading
- `/home/z/my-project/worklog.md` — foundation, POLISH-1 (design system), POLISH-2b (tasks+manpower polish)
- `/home/z/my-project/src/lib/design-system.ts` — SECTION_THEMES (materials=violet, expenses=pink, safety=red, tasks=amber)
- `/home/z/my-project/src/components/shared/section-header.tsx` — `SectionHeader` + `SubSection`
- `/home/z/my-project/src/components/shared/stat-card.tsx` — uses `section` prop, not the old `accent` prop; labels `text-[11px]`, values `text-xl sm:text-2xl leading-tight`
- `/home/z/my-project/src/components/shared/empty-state.tsx` — `EmptyState`, `LoadingState`, `CardSkeleton`
- `/home/z/my-project/src/components/shared/status-badge.tsx` — Pending=amber / Approved=emerald / Rejected=red already mapped
- `/home/z/my-project/src/lib/constants.ts` — confirmed `formatCurrency`/`formatDate` already handle undefined

## Materials Page Changes
- Imports: replaced `PageHeader` with `SectionHeader` + `SubSection` from `@/components/shared/section-header`; added `EmptyState` import; added `BarChart3` icon import; removed unused `useEffect` and `formatNumber` imports.
- Page header: `<SectionHeader section="materials" ...>` with violet gradient Package icon; header buttons recolored violet-600.
- Stat cards: consolidated from 5 to 4 (folded "Out of Stock" count into the "Low Stock Items" subtitle) so the grid uses the spec's exact `grid-cols-2 md:grid-cols-4`. Cards use sections: materials / safety (red) for low-stock / materials / materials.
- KPIs grouped under `<SubSection section="materials" title="Inventory Summary" icon={<BarChart3 />}>`.
- Low stock alert card: restyled amber-300 border + amber-50 bg, with item count Badge, warning icon container, scrollable item list (max-h-72). Out-of-stock items show red badge, low-stock items show amber badge.
- Inventory table: stock qty cell rendered as a colored pill — red bg+text with AlertTriangle icon when <= min level, emerald bg+text otherwise.
- Tabs: violet-50 background, active tab uses white bg + violet text.
- Material usage chart: added Y-axis unit label "qty" (recharts `label` prop). Wrapped in `EmptyState` when no transactions in last 30 days. Card header now uses violet icon container with BarChart3 icon.
- Empty states in inventory + transaction tables use shared `EmptyState` component (with icon + title + description + CTA where relevant).
- Loading skeleton: 4-card grid + chart skeleton; SubSection header preserved for layout consistency.
- Dialogs: both material and transaction dialogs now `w-full sm:max-w-lg` (was `sm:max-w-md` for txn dialog).
- Defensive coding: `formatQty` now handles null/undefined/non-finite; `Number(... ?? 0)` on all numerics.

## Expenses Page Changes
- Imports: replaced `PageHeader` with `SectionHeader` + `SubSection`; added `EmptyState` import; added `BarChart3` + `PieChart as PieChartIcon` icons; removed unused `StatusBadge` import (replaced with local `ApprovalBadge` helper). Aliased lucide's `PieChart` to `PieChartIcon` to avoid identifier collision with recharts' `PieChart` (the same bug that breaks dashboard-page.tsx).
- Page header: `<SectionHeader section="expenses" ...>` with pink gradient DollarSign icon; "Add Expense" button recolored pink-600.
- Stat cards: 4 cards in `grid-cols-2 md:grid-cols-4`. Total + Approved use section="expenses" (pink), Pending uses section="tasks" (amber), Rejected uses section="safety" (red).
- KPIs grouped under `<SubSection section="expenses" title="Spending Summary" icon={<BarChart3 />}>`.
- Updated `EXPENSE_CATEGORY_BADGE` palette to match the spec exactly: Tools=slate, Transport=sky, Accommodation=violet, Fuel=amber, Materials=pink, Labour=cyan, Miscellaneous=stone. Updated `PIE_COLORS` to align.
- Added local `ApprovalBadge` helper: Pending=amber, Approved=emerald, Rejected=red.
- Budget vs Actual chart: added "S$" Y-axis unit label. Wrapped in `EmptyState` when no projects. Card header uses pink icon container with BarChart3 icon.
- Expense by Category pie chart: card header uses pink icon container with PieChartIcon. Wrapped in `EmptyState` when no expenses.
- Project profitability card: header uses pink icon container with TrendingUp icon. Margin % rendered as a colored Badge (emerald/red/slate). Wrapped in `EmptyState` when no projects.
- Expenses table: approve/reject buttons icon-only on mobile, icon+label on desktop. Edit/Delete remain icon-only with `title` attributes. Empty state uses shared `EmptyState` with an "Add Expense" CTA.
- Loading state: 4-card skeleton grid + 2 chart skeletons; SubSection header preserved.
- Dialog: kept `w-full sm:max-w-lg`. Upload button hides the "Upload" label on mobile (icon-only).
- Defensive coding: `Number(... ?? 0)`, `Number(...) || 0` on all numerics.

## Verification
- `bun run lint` → exit 0, no errors, no warnings on either file.
- dev.log inspection: no errors specific to `materials-page` or `expenses-page` (the only dev.log errors are pre-existing in dashboard-page.tsx from another agent — duplicate PieChart identifier — which I deliberately avoided by aliasing lucide's PieChart as PieChartIcon).
- No API routes or other files modified.
- No test files created.

## Functionality Preserved (NO logic changes)
Materials:
- Add/Edit/Delete material (POST/PUT/DELETE `/api/materials` + `/api/materials/[id]`)
- Add/Issue/Return transactions (POST `/api/transactions`) — auto-updates stock levels
- Category filter, Low Stock Only filter
- Txn filters: material / project / type
- Inventory table actions: Add Stock / Issue / Return / Edit / Delete

Expenses:
- Add/Edit/Delete expense (POST/PUT/DELETE `/api/expenses` + `/api/expenses/[id]`)
- Approve / Reject pending expenses (PUT with `approvalStatus`)
- Receipt upload (filename attachment)
- Filters: project / category / approval status
- Budget vs Actual chart, Expense by Category pie chart, Project profitability cards
