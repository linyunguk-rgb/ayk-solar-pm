---
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
  - Upload dialog: drag-drop area + click-to-browse, auto-fill name from filename, FileReader API to read file metadata, simulated progress bar, POST /api/documents with fileUrl fallback `/documents/${name}`. Object URL kept for image preview.
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
