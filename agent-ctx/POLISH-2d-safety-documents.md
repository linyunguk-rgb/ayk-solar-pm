# Task POLISH-2d — Safety + Documents Polish

**Agent:** Safety + Documents Polish
**Task:** Polish Safety and Documents pages for desktop+mobile consistency

## Work Log
- Read `/home/z/my-project/worklog.md` to understand the design system: SECTION_THEMES (14 sections), SectionHeader/SubSection, StatCard (now section-based), EmptyState, color semantics.
- Read existing `/home/z/my-project/src/components/pages/safety-page.tsx` (783 lines) and `/home/z/my-project/src/components/pages/documents-page.tsx` (598 lines).
- Read shared components: `section-header.tsx`, `stat-card.tsx`, `empty-state.tsx`, `status-badge.tsx`, `page-header.tsx`.
- Read `src/lib/design-system.ts` for SECTION_THEMES palette (safety=red, documents=teal).
- Rewrote `safety-page.tsx` in place (kept `SafetyPage` export name, kept `'use client'`):
  - Replaced `PageHeader` import with `SectionHeader` + `SubSection` from `@/components/shared/section-header`.
  - Imported `EmptyState` from `@/components/shared/empty-state`.
  - All 5 StatCards now use `section="safety"` (red icon containers) instead of the old `accent` prop.
  - Added `SubSection section="safety" title="Safety Overview"` grouping the KPI grid.
  - KPI grid: `grid-cols-2 md:grid-cols-4 lg:grid-cols-5` (2 cols mobile, 4 on tablet, 5 on large desktop so all cards fit in one row at full width).
  - PPE Compliance Trend chart: line color changed to red (`#ef4444`) to match the safety section color; icon next to chart title remains `TrendingUp`.
  - Tables wrapped in `ScrollArea` with `max-h-[500px]` (was `h-[28rem]` — changed to allow flexibility on different screens).
  - Filter bars already used `flex flex-col sm:flex-row gap-3` — kept; added `w-full sm:w-auto` to primary action buttons so they stack full-width on mobile.
  - Empty states for both checklists and incidents now use `EmptyState` component with icon + title + description + CTA button (was a plain centered text block).
  - Added `INCIDENT_TYPE_STYLE` map for colored left border by type: Incident=`border-l-red-500`, NearMiss=`border-l-amber-500`, UnsafeCondition=`border-l-sky-500`. IncidentCard uses `border-l-4` with this color.
  - Severity badges still render via `StatusBadge` (already has Low=slate, Medium=amber, High=orange, Critical=red).
  - Added `complianceColor()` and `complianceText()` helpers: green ≥90, amber 70–89, red <70. Applied to: checklist table progress bar + value text, Overall Compliance card value + bar, and each PPE per-item progress bar + value text.
  - PPE_ITEMS now carries an `icon` per item (HardHat, Footprints, Hand, Link2, Sparkles, Wrench, Zap). The new-checklist dialog shows each checkbox in a `grid-cols-1 sm:grid-cols-2` layout with icon + label + checkbox; checkbox upgraded to `h-5 w-5` for touch targets. The PPE Compliance tab per-item list also shows the same icon next to each label.
  - Both `NewChecklistDialog` and `IncidentDialog` DialogContent switched to `w-full sm:max-w-lg max-h-[90vh] overflow-y-auto ayk-scrollbar` (was `max-w-2xl`). Dialog titles now include a colored icon (ClipboardList / AlertCircle).
  - Defensive coding: `?? 0` applied to all numeric stats (totalIncidents, openIncidents, closedIncidents, nearMisses, ppeAvg, checklists length, incidents length, compliancePct usage). `formatDate` handles undefined gracefully already.
  - Loading states kept as `animate-pulse` skeleton cards (incident cards) and pulse rows (checklist table).
  - PPE Compliance tab empty state uses `EmptyState` component (was a plain centered paragraph).
- Rewrote `documents-page.tsx` in place (kept `DocumentsPage` export name, kept `'use client'`):
  - Replaced `PageHeader` import with `SectionHeader` + `SubSection`.
  - Imported `EmptyState` from `@/components/shared/empty-state`.
  - All 4 StatCards now use `section="documents"` (teal icon containers).
  - Added `SubSection section="documents" title="Library Summary"` grouping the KPI grid.
  - KPI grid: `grid-cols-2 md:grid-cols-4` (2 cols mobile, 4 desktop) per spec.
  - Document grid switched from `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` → `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` per spec (2 cols mobile, 3 on small tablet, 4 on desktop). Loading skeleton grid also updated to match.
  - Category cards (8) — `CATEGORY_META` re-colored per spec:
    * Drawings=sky (`bg-sky-50 text-sky-600`)
    * Permits=violet (`bg-violet-50 text-violet-600`)
    * MethodStatements=amber (`bg-amber-50 text-amber-600`, icon `ClipboardList`)
    * RiskAssessments=red (`bg-red-50 text-red-600`)
    * Certificates=emerald (`bg-emerald-50 text-emerald-600`)
    * Inspection=cyan (`bg-cyan-50 text-cyan-600`)
    * Photos=pink (`bg-pink-50 text-pink-600`)
    * Reports=slate (`bg-slate-100 text-slate-600`)
  - Added a `SubSection section="documents" title="Browse by Category"` above the category card grid.
  - Category card grid kept at `grid-cols-2 sm:grid-cols-4 lg:grid-cols-8` (2 cols mobile, 4 on tablet, 8 on desktop). Added `leading-tight` to label text.
  - Document file icons updated per spec: pdf=red, image=sky, spreadsheet=emerald, word=blue, other=slate (removed amber-for-zip special case — any other file type now falls through to slate).
  - Document card preview/download action buttons now tinted teal (`text-teal-700 hover:bg-teal-50`) instead of emerald to match the documents section color.
  - Empty state for no documents now uses `EmptyState` component with icon + title + description + Upload CTA.
  - Upload dialog: DialogContent changed to `w-full sm:max-w-lg max-h-[90vh] overflow-y-auto ayk-scrollbar`. Drag-drop area redesigned: dashed border (already had), now larger (p-6 sm:p-8), with a circular teal icon container around the upload icon for visual prominence. Dialog title gets an Upload icon.
  - Upload progress bar text + percentage now tinted teal instead of emerald.
  - Primary Upload buttons everywhere (header action, filter bar, empty-state CTA, dialog submit) now `bg-teal-600 hover:bg-teal-700 text-white` to match documents section color (was emerald).
  - Preview dialog kept at `max-w-3xl` (it's a content preview, not a form — needs the extra width for PDF/image preview). Dialog title icon colored teal.
  - Defensive coding: `?? 0` applied to `stats.total`, `stats.photos`, `stats.reports`, `documents.length`, `categoryCounts` lookups. `formatFileSize` signature widened to `number | undefined | null` and returns '—' for falsy.
- All existing functionality preserved: PPE checklist submit (POST /api/safety/checklists), incident report (POST /api/safety/incidents), incident edit (PUT /api/safety/incidents/[id]), document upload (POST /api/documents), document delete (DELETE /api/documents/[id]), drag-drop file selection, image preview via object URL, all filters (project / category / type / status / search), tab switching.
- Ran `bun run lint` — 0 errors, 0 warnings on the two edited files.
- Ran `bunx tsc --noEmit --skipLibCheck` on my files — 0 errors after replacing the non-existent `Mitten` lucide icon with `Hand`.
- Dev log: only unrelated errors remain (dashboard-page.tsx has a `PieChart` import clash between lucide-react and recharts belonging to another agent; out-of-memory heap crashes during dev-server compilation). My two files do not appear in any error log.

## Stage Summary
- Files edited (in place, no other files touched):
  1. `/home/z/my-project/src/components/pages/safety-page.tsx` — exports `SafetyPage`, `'use client'`.
  2. `/home/z/my-project/src/components/pages/documents-page.tsx` — exports `DocumentsPage`, `'use client'`.
- Design decisions:
  - Section color coding applied via `section` prop on StatCard (safety=red, documents=teal) — this replaces the old `accent` prop. Icon containers, gradient strips (SectionHeader), and primary buttons are tinted accordingly.
  - Compliance % color logic (green ≥90 / amber 70–89 / red <70) is centralized in `complianceColor()` and `complianceText()` helpers in safety-page so the table progress bars, per-item PPE bars, and the overall compliance card all share the same thresholds.
  - PPE checklist form gets lucide icons per item (HardHat/Footprints/Hand/Link2/Sparkles/Wrench/Zap) both in the new-checklist dialog and in the PPE Compliance tab per-item list for visual scanning.
  - Incident cards use `border-l-4` colored by type so incidents are visually distinguishable at a glance even before reading the label.
  - Document category cards use the exact 8-color palette from the spec (sky/violet/amber/red/emerald/cyan/pink/slate) — no indigo or blue-violet, compliant with the no-blue rule.
  - Documents page primary buttons switched from emerald to teal to align with the documents section color; safety page primary action buttons kept emerald (the "New Checklist" CTA) for consistency with the rest of the app's primary action color, while safety-only buttons (Report Incident) stay red. SectionHeader gradient strip + icon container still reflect the safety=red theme.
  - All dialogs use `w-full sm:max-w-lg` for mobile-friendly full-width stacking on small screens, capped at 32rem on desktop. The preview dialog stays at `max-w-3xl` because it shows images/PDFs that benefit from extra width.
- Lint: clean (0 errors, 0 warnings).
- TypeScript: clean on my two files (other agents' files have unrelated Prisma include warnings, projects-page StatCard `accent` prop issues, dashboard-page PieChart duplicate identifier, etc.).
