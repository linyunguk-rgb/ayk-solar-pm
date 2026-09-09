# Task 10-b — Reports + Settings + Mobile Pages Builder

## Files Created
1. `src/components/pages/reports-page.tsx` — `ReportsPage`
2. `src/components/pages/settings-page.tsx` — `SettingsPage`
3. `src/components/pages/mobile-page.tsx` — `MobilePage`

## Key Decisions
- Reports: print via `window.open` + `document.write` + `print()` so the inline-styled AYK-branded HTML renders cleanly without affecting app layout.
- Settings: Company + Notification preferences are intentionally localStorage-backed (no backend route), per task spec.
- Mobile: phone frame on sm+ screens (rounded-3xl border-4 border-slate-800 shadow-2xl) and full-width on mobile (per task spec).
- All three pages are `'use client'` and read `useAppStore().setNav` for navigation.
- Lint clean, `tsc --noEmit` clean for my files (other agents' unrelated Prisma include warnings exist), `GET / 200` confirms successful runtime compile.
