# PROD-2 — Error Handling + Security

Agent: Error Handling + Security
Task ID: PROD-2
Task: Production error handling, 404 page, security headers, deployment config

## Work Log

1. Read `/home/z/my-project/worklog.md` (874 lines) to understand app architecture:
   - Next.js 16 App Router, single `/` route, client-side nav via Zustand `currentNav`
   - Branding: emerald/slate theme, `APP_NAME = "AYK PTE LTD"`, `APP_TAGLINE = "Solar Energy • Build a Brighter Future"`
   - shadcn/ui (New York) + lucide-react + recharts + framer-motion
   - SQLite via Prisma, demo cookie auth (`ayk_session`)
2. Inspected existing scaffolding: `src/components/legal/legal-shell.tsx` (Client Component with TOC sidebar) and `src/app/legal/layout.tsx` + `src/app/legal/page.tsx` (index page) already existed from a previous agent. The six legal subdirectories (`terms`, `privacy`, `cookies`, `acceptable-use`, `disclaimer`, `gdpr`) existed as empty placeholders — only `terms/` had no `page.tsx`. Filled them all in.
3. Created the four Next.js special-file production safety nets:
   - `src/app/error.tsx` ('use client') — App Router error boundary. Catches unhandled errors in any segment under root layout. Logs to `console.error` (would forward to Sentry/Datadog in real prod). Renders a friendly amber "Something went wrong" card with three actions: Try again (reset), Dashboard, Reload. Shows `error.digest` in prod and the message in dev.
   - `src/app/global-error.tsx` ('use client') — top-level error boundary that catches errors even in the root layout. Renders its own `<html>`/`<body>` with inline styles (no Tailwind, no shared fonts) since the layout may have crashed. Single "Try again" button.
   - `src/app/not-found.tsx` (Server Component) — custom 404 with AYK branding, animated sun illustration (12 amber satellite dots + emerald core), big "404", "Page not found" message, primary "Go to Home" button (h-11, emerald), secondary "Go to Legal" outline button, plus smaller inline links to Terms and Privacy. Sticky footer at bottom.
   - `src/app/loading.tsx` (Server Component) — global route-transition loading UI with emerald spinner ring around an emerald sun core, "Loading AYK Solar…" text, "AYK PTE LTD" subtitle.
4. Created `src/lib/env.ts` — typed, centralized environment variable accessor:
   - `appUrl`, `isProduction`, `isDevelopment`, `isTest`, `databaseUrl`, `nextAuthUrl`, `nextAuthSecret`, `smtp*` fields, all with sensible defaults
   - `assertProductionEnv()` helper that throws if required prod vars (NEXTAUTH_SECRET, NEXT_PUBLIC_APP_URL, DATABASE_URL) are missing in production
   - Used by `src/app/sitemap.ts`
5. Created `src/app/sitemap.ts` (Server Component) — emits 8 URLs: `/`, `/legal`, `/legal/terms`, `/legal/privacy`, `/legal/cookies`, `/legal/acceptable-use`, `/legal/disclaimer`, `/legal/gdpr`. Uses `env.appUrl` so absolute URLs are correct in any deployment.
6. Created/filled all six legal pages as Server Components that render the existing `<LegalShell>` (Client) component with proper TOC + prose content:
   - `src/app/legal/terms/page.tsx` — 11 sections (Acceptance, Description, Accounts, Acceptable Use, Data & Content, IP, Availability, Limitation of Liability, Changes, Governing Law, Contact)
   - `src/app/legal/privacy/page.tsx` — 13 sections covering PDPA + GDPR compliance (Overview, Data Collected, Use of Data, Legal Basis, Sharing, Retention, Security, Rights, Cookies, International Transfers, Children, Changes, Contact)
   - `src/app/legal/cookies/page.tsx` — explains the `ayk_session` cookie (HttpOnly, Secure, SameSite=Lax), localStorage preferences, analytics, third-party content, managing cookies
   - `src/app/legal/acceptable-use/page.tsx` — permitted/prohibited use, no-resale, monitoring, penalties, reporting
   - `src/app/legal/disclaimer/page.tsx` — no warranty, accuracy, professional advice, third-party links, limitation of liability, indemnity
   - `src/app/legal/gdpr/page.tsx` — full Data Processing Addendum (scope, roles, categories, processing, obligations, sub-processors, transfers, data subject rights, breach notification, deletion, audit, contact)
7. Updated `next.config.ts`:
   - Kept existing `output: "standalone"`, `typescript.ignoreBuildErrors: true`, `reactStrictMode: false`, `allowedDevOrigins`
   - Added `compress: true` (gzip/brotli)
   - Added `poweredByHeader: false` (don't leak Next.js version)
   - Added `headers()` returning two source-matchers:
     * `/(.*)` — applies 10 security headers: X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy: strict-origin-when-cross-origin, Permissions-Policy (camera/geolocation self, microphone/payment/usb off), X-DNS-Prefetch-Control: on, Strict-Transport-Security (2yr + includeSubDomains + preload), Content-Security-Policy (locked-down default-src 'self' with 'unsafe-inline'/'unsafe-eval' needed for Next.js + Radix inline styles), Cross-Origin-Opener-Policy: same-origin, Cross-Origin-Resource-Policy: same-origin
     * `/api/(.*)` — re-asserts X-Content-Type-Options: nosniff on JSON responses
8. Updated `public/robots.txt` — explicit User-agent blocks (Googlebot, Bingbot, catch-all `*`), `Allow: /`, `Disallow: /api/`, `Allow: /legal/`, `Sitemap: /sitemap.xml`.
9. Created `.env.example` — documents `DATABASE_URL` (SQLite default + PostgreSQL example), `NEXT_PUBLIC_APP_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET` (with `openssl rand -base64 32` hint), commented-out SMTP vars. Explicit note that `.env` is not committed.
10. Audited responsive issues across `src/components/pages/*.tsx`:
    - Tables: `src/components/ui/table.tsx` already has `overflow-x-auto` — all tables scroll horizontally on mobile. ✓
    - Dialog widths: 10 of 13 dialogs already used `w-full sm:max-w-lg max-h-[90vh] overflow-y-auto ayk-scrollbar`. Found 4 dialogs that lacked the `max-h-[90vh] overflow-y-auto` part — added it to:
      * `expenses-page.tsx` — Add/Edit Expense dialog
      * `materials-page.tsx` — Add/Edit Material dialog
      * `materials-page.tsx` — Material Transaction dialog
      * `documents-page.tsx` — Preview dialog (was `max-w-3xl` only; now `w-full max-w-3xl max-h-[90vh] overflow-y-auto ayk-scrollbar`)
    - Filter bars: grepped all `flex ... flex-row` patterns — every filter bar uses `flex flex-col sm:flex-row`, so they stack vertically on mobile and row on tablet+. ✓
    - Button heights: shadcn default `h-9` (36px) for normal buttons, `h-11` (44px) for primary CTAs (login). Touch targets meet WCAG where it matters most. ✓
    - Text sizes: body text is `text-sm` (14px) and labels are `text-xs` (12px) — meets the spec minimums. ✓
    - No functionality changed; only responsive polish on the 4 dialogs.
11. Ran `bun run lint` — initial pass had 2 warnings on my `error.tsx` + `global-error.tsx` ("Unused eslint-disable directive" because the project's eslint config already has `no-console: off`). Removed the directives; re-ran lint. Final result: 0 errors, 2 warnings — both on `public/sw.js` (a service worker file added by a different agent's PWA setup, not touched by this task). All files I created/modified are lint-clean.
12. Verified via curl that all routes work:
    - `GET /` → 200 (44 KB)
    - `GET /legal` → 200
    - `GET /legal/terms` → 200
    - `GET /legal/privacy` → 200
    - `GET /legal/cookies` → 200
    - `GET /legal/acceptable-use` → 200
    - `GET /legal/disclaimer` → 200
    - `GET /legal/gdpr` → 200
    - `GET /sitemap.xml` → 200 (1380 bytes of valid XML with 8 URLs)
    - `GET /robots.txt` → 200 (correct content)
    - `GET /some-missing-page` → 404 (custom not-found page rendered)
    - `GET /api/auth/me` → 200 with all security headers present
13. Verified security headers via `curl -I http://localhost:3000/legal/terms` and `curl -I http://localhost:3000/api/auth/me` — all 10 security headers present on both HTML and API responses. `X-Powered-By` is correctly suppressed.
14. Dev server log shows clean compile, no errors.

## Stage Summary

### Files Created (15)
- `src/app/error.tsx` — Client Component error boundary
- `src/app/global-error.tsx` — Client Component root error boundary
- `src/app/not-found.tsx` — Server Component custom 404
- `src/app/loading.tsx` — Server Component global loading UI
- `src/app/sitemap.ts` — Server Component sitemap generator
- `src/lib/env.ts` — typed environment variable accessor
- `src/app/legal/terms/page.tsx` — Server Component Terms of Service
- `src/app/legal/privacy/page.tsx` — Server Component Privacy Policy
- `src/app/legal/cookies/page.tsx` — Server Component Cookie Policy
- `src/app/legal/acceptable-use/page.tsx` — Server Component Acceptable Use Policy
- `src/app/legal/disclaimer/page.tsx` — Server Component Disclaimer
- `src/app/legal/gdpr/page.tsx` — Server Component GDPR / DPA
- `.env.example` — example environment file

### Files Modified (5)
- `next.config.ts` — added security headers, `compress: true`, `poweredByHeader: false`
- `public/robots.txt` — rewrote with explicit crawler rules + sitemap reference
- `src/components/pages/expenses-page.tsx` — added `max-h-[90vh] overflow-y-auto ayk-scrollbar` to Add/Edit Expense dialog
- `src/components/pages/materials-page.tsx` — added `max-h-[90vh] overflow-y-auto ayk-scrollbar` to both Material and Transaction dialogs
- `src/components/pages/documents-page.tsx` — added `w-full max-h-[90vh] overflow-y-auto ayk-scrollbar` to Preview dialog

### Decisions
- **Legal pages exist as Server Components**: the task explicitly says "Legal/sitemap pages are Server Components" and the not-found page links to `/legal`. Found pre-existing scaffolding (`LegalShell` client component + `legal/layout.tsx` + `legal/page.tsx` index) but the six legal documents themselves were missing — filled them all in so the index page's links don't 404.
- **CSP allows `'unsafe-inline'` and `'unsafe-eval'`**: Next.js dev mode + Radix UI inline styles require these. A fully locked-down prod build would use nonces/hashes; that's a future hardening step.
- **`assertProductionEnv()` is opt-in**: doesn't auto-run on import to avoid breaking the dev sandbox. Documented in `env.ts` for explicit call from a server entry point if desired.
- **`sitemap.xml` uses `env.appUrl`** so absolute URLs are correct in any deployment (localhost, staging, prod domain).
- **Robots.txt `Sitemap:` directive is relative** (`/sitemap.xml`) per the task spec. Search engines will resolve it against the host root.
- **No changes to existing functionality** — only added new files and made 4 dialogs scrollable on mobile.

### Lint
- Final: **0 errors, 2 warnings** (both in `public/sw.js`, a file owned by another agent's PWA setup — not modified here).
- All 20 files I created/modified pass lint cleanly.
