# Task ID: TENANT-FILTER — Multi-tenant API Isolation Verifier

## Summary
Verified that all 27 target API routes under `src/app/api/` enforce multi-tenant data isolation using the `getSessionUser()` + `tenantWhere()` + ownership-check pattern from `src/lib/auth.ts`. No code changes were required — every route already conforms to the required pattern.

## Helper functions used (from `src/lib/auth.ts`)
- `getSessionUser()` — returns `SessionUser | null`. The `SessionUser` interface carries `tenantId?`, `isMasterAdmin?`, `isTenantAdmin?` alongside the standard `id`, `email`, `name`, `role`.
- `getTenantFilter()` — returns `null` for master admin (sees all data) or the user's `tenantId` for tenant users.
- `tenantWhere()` — returns `{}` for master admin (no filter applied) or `{ tenantId: <id> }` for tenant users.

## Pattern enforcement
| Endpoint type | Pattern |
|---|---|
| GET list | `const tw = await tenantWhere()` then `db.model.findMany({ where: { ...tw, ...filters } })` |
| POST create | Set `tenantId: user.tenantId` on the new record; verify parent (project/material) belongs to tenant before linking |
| GET/PUT/DELETE by-id | `select: { tenantId: true }`, 404 if missing, then `if (!user.isMasterAdmin && existing.tenantId !== user.tenantId) return 404` |

## File-by-file verification (all PASS)

### List + Create routes
1. `dashboard/route.ts` — `tw` applied to 9 `findMany` calls (projects, tasks, workers, materials, safetyIncidents, expenses, notifications, safetyChecklists, dailyProgress); attendance queries use `worker: { ...tw }` join.
2. `projects/route.ts` — GET `where: { ...tw, ... }`, POST sets `tenantId: user.tenantId`, auto-code count uses `where: tw`.
3. `progress/route.ts` — GET `where: { ...tw, ... }`, POST sets `tenantId: user.tenantId`, verifies project.
4. `tasks/route.ts` — GET `where: { ...tw, ... }`, POST sets `tenantId: user.tenantId`, verifies project.
5. `workers/route.ts` — GET `where: { ...tw, ... }`, POST sets `tenantId: user.tenantId`, verifies project.
6. `attendance/route.ts` — GET uses `worker: { ...tw }` join (Attendance has no `tenantId` column in schema — inherits via Worker).
7. `materials/route.ts` — GET `where: { ...tw, ... }`, POST sets `tenantId: user.tenantId`.
8. `transactions/route.ts` — GET `where: { ...tw, ... }`, POST sets `tenantId: user.tenantId`, verifies Material + Project, low-stock Notification also scoped.
9. `expenses/route.ts` — GET `where: { ...tw, ... }`, POST sets `tenantId: user.tenantId`, verifies project.
10. `safety/checklists/route.ts` — GET `where: { ...tw, ... }`, POST sets `tenantId: user.tenantId`, verifies project.
11. `safety/incidents/route.ts` — GET `where: { ...tw, ... }`, POST sets `tenantId: user.tenantId` on Incident + auto-notification, verifies project.
12. `documents/route.ts` — GET `where: { ...tw, ... }`, POST sets `tenantId: user.tenantId`, verifies project.
13. `documents/upload/route.ts` — POST sets `tenantId: user.tenantId`, verifies project, saves file under `public/uploads/<tenantId>/`.
14. `notifications/route.ts` — GET `where: tw`.
15. `users/route.ts` — GET `where: tw` (master admin sees all), POST sets `tenantId: user.tenantId`, requires Admin/TenantAdmin/MasterAdmin role.

### By-id routes (ownership verification)
16. `projects/[id]/route.ts` — GET/PUT/DELETE all verify `project.tenantId !== user.tenantId` (master bypass). DELETE also requires Admin role.
17. `projects/[id]/stages/route.ts` — GET/PUT both load parent project's `tenantId` and verify.
18. `progress/[id]/route.ts` — DELETE verifies entry's `tenantId`.
19. `tasks/[id]/route.ts` — PUT/DELETE verify task's `tenantId`.
20. `workers/[id]/route.ts` — PUT/DELETE/POST (check-in/out) all verify worker's `tenantId`. The POST creates an Attendance row (no `tenantId` column — inherits via `workerId`); worker ownership check prevents cross-tenant attendance.
21. `materials/[id]/route.ts` — PUT/DELETE verify material's `tenantId`.
22. `expenses/[id]/route.ts` — PUT/DELETE verify expense's `tenantId`.
23. `safety/incidents/[id]/route.ts` — PUT verifies incident's `tenantId`.
24. `documents/[id]/route.ts` — DELETE verifies document's `tenantId`.
25. `notifications/[id]/route.ts` — PUT verifies notification's `tenantId`; POST (mark-all-read with `id === 'all'`) uses `where: tw` for tenant-scoped batch update.
26. `users/[id]/route.ts` — PUT/DELETE verify user's `tenantId`; DELETE refuses to hard-delete master admin (soft-delete via `isActive: false`).

### Report route
27. `reports/[type]/route.ts` — `tw` applied to all 7 top-level `findMany` calls (projects, tasks, workers, materials, expenses, incidents, checklists). Inside the switch cases, the on-demand `dailyProgress.findMany` calls (daily/weekly/monthly) also use `{ ...tw, date: ... }`. Master admin sees cross-tenant aggregates; tenant users see only their own data.

## Excluded routes (correctly untouched)
- `auth/login`, `auth/me`, `auth/demo-users` — tenant-agnostic auth.
- `access-code/validate` — access code validation is tenant-agnostic (codes resolve to tenant).
- `company/setup` — initial tenant bootstrap.
- `master/*` (tenants, codes, codes/[id]) — master-admin-only routes that intentionally span tenants.
- `seed` — dev-only seeding.

## Schema note
The `Attendance` model intentionally has no `tenantId` field — it inherits tenancy through its `workerId` relation. All attendance queries (in `dashboard/route.ts`, `attendance/route.ts`) correctly filter via `worker: { ...tw }`. All attendance writes (in `workers/[id]/route.ts` POST check-in/out) verify the worker's tenant before creating the record. This is the correct design — adding a redundant `tenantId` to Attendance would require denormalisation logic that the Worker-relation filter already handles safely.

## Validation
- `bun run lint` — 0 errors, 0 warnings.
- All API responses preserve their original shape (`{ items }`, `{ projects }`, `{ tasks }`, etc.) — no client-side breakage.
- Master admin (`isMasterAdmin: true`) bypasses all tenant checks: `tenantWhere()` returns `{}` for them, and the by-id ownership check skips the comparison.

## Files modified
None. All 27 target routes were already correctly implemented. This task was a verification pass — the worklog entry now serves as the canonical reference for the tenant-isolation pattern.
