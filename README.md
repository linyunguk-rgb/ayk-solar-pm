# AYK PTE LTD — Solar Project Management System

> **Solar Energy • Build a Brighter Future**
>
> A production-ready, multi-tenant SaaS application for solar construction project management. Track projects, progress, manpower, materials, safety, expenses and documents — built for solar contractors.

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Quick Start (Development)](#quick-start-development)
4. [Production Deployment](#production-deployment)
5. [Play Store Launch (TWA)](#play-store-launch-twa)
6. [PWA & Offline Support](#pwa--offline-support)
7. [Database & Backups](#database--backups)
8. [Multi-Tenant Architecture](#multi-tenant-architecture)
9. [Legal & Compliance](#legal--compliance)
10. [Security](#security)
11. [Environment Variables](#environment-variables)
12. [Scripts Reference](#scripts-reference)
13. [Troubleshooting](#troubleshooting)

---

## Overview

AYK PTE LTD Solar PM is a full-stack enterprise application that lets solar contractors manage their entire operation — from project planning and daily site progress to safety compliance, material inventory and financial reporting.

### Key Features

- **Multi-tenant SaaS** — each company gets a private, isolated workspace
- **Access code system** — platform owner controls who can create/join companies
- **7 user roles** with granular permissions (Admin, PM, Site Supervisor, Safety Officer, Engineer, Store Officer, Worker)
- **13 modules** — Dashboard, Projects, Progress, Tasks, Manpower, Materials, Expenses, Safety, Documents, Reports, Settings, Mobile Site View, Daily Entry
- **PWA** — installable, offline-capable, Play Store-ready
- **Comprehensive legal pages** — Terms, Privacy, Cookies, Acceptable Use, Disclaimer, GDPR/DPA
- **Real-time charts** — S-curves, planned vs actual, budget, manpower trends
- **PDF/Printable reports** with company branding
- **Mobile-first design** — optimized for field use on phones

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) + TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui (New York) |
| Database | Prisma ORM + SQLite (dev) / PostgreSQL (prod) |
| State | Zustand (client) + React Query patterns |
| Charts | Recharts |
| Icons | Lucide React |
| PWA | Web App Manifest + Service Worker |
| Auth | Cookie-based sessions ( NextAuth-ready) |

---

## Quick Start (Development)

```bash
# 1. Install dependencies
bun install

# 2. Set up the database
bun run db:push        # Create SQLite schema
bun run scripts/seed.ts # Seed demo data

# 3. Start the dev server
bun run dev            # http://localhost:3000

# 4. Run lint
bun run lint
```

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Platform Admin | `master@ayk.com.sg` | `master123` |
| Demo Admin | `admin@ayk.com.sg` | `admin123` |
| Demo PM | `pm@ayk.com.sg` | `pm123` |
| Demo Supervisor | `supervisor@ayk.com.sg` | `super123` |
| Demo Safety | `safety@ayk.com.sg` | `safety123` |
| Demo Engineer | `engineer@ayk.com.sg` | `eng123` |
| Demo Store | `store@ayk.com.sg` | `store123` |

### Access Codes (for enterprise onboarding)

| Code | Purpose |
|------|---------|
| `AYK-DEMO-VIEW` | Demo viewing (100 uses) |
| `AYK-NEW-ENT1` | New enterprise company (1 seat) |
| `AYK-NEW-ENT5` | New enterprise company (5 seats) |

Generate more codes from the Master Admin dashboard.

---

## Production Deployment

### Option A: Vercel (Recommended — easiest)

1. **Push to GitHub/GitLab**
2. **Import to Vercel** — vercel.com/new
3. **Set environment variables** (see [Environment Variables](#environment-variables))
4. **Deploy** — Vercel auto-detects Next.js
5. **Set up PostgreSQL** — use Vercel Postgres, Supabase, or Neon
6. **Run database migration**:
   ```bash
   # Update prisma/schema.prisma datasource to postgresql
   # Then run:
   bun run db:push
   bun run scripts/seed.ts  # Only for initial demo data
   ```

### Option B: Self-Hosted (VPS / Docker)

1. **Build the production bundle**:
   ```bash
   bun run build
   ```

2. **Run with the standalone server**:
   ```bash
   NODE_ENV=production bun .next/standalone/server.js
   ```

3. **Set up a reverse proxy** (Nginx/Caddy) with:
   - HTTPS (Let's Encrypt)
   - Gzip compression
   - Static file caching

4. **Set up PostgreSQL**:
   ```bash
   # Update DATABASE_URL in .env
   DATABASE_URL="postgresql://user:pass@localhost:5432/ayk_solar"
   bun run db:push
   ```

5. **Set up automatic backups** (see [Database & Backups](#database--backups))

### Option C: Docker

```dockerfile
# Dockerfile (create this in project root)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json bun.lockb ./
RUN npm install -g bun && bun install
COPY . .
RUN bun run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/db ./db
EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "server.js"]
```

---

## Play Store Launch (TWA)

This app is a PWA that can be packaged as a Trusted Web Activity (TWA) for the Google Play Store using **Bubblewrap**.

### Prerequisites

1. **Deploy to production** — your app must be live at a public HTTPS URL
2. **Install Bubblewrap**:
   ```bash
   npm install -g @bubblewrap/cli
   ```

3. **Update the TWA manifest** — edit `twa-manifest.json`:
   - Set `"host"` to your production domain (e.g., `https://app.ayk.com.sg`)
   - Set `"webManifestUrl"` to `https://your-domain.com/manifest.json`
   - Set `"iconUrl"` and `"maskableIconUrl"` to your production icon URLs
   - Set `"fullScopeUrl"` to your production domain

### Build the APK

```bash
# 1. Initialize the Android project from your live manifest
bubblewrap init --manifest=https://your-domain.com/manifest.json

# 2. Build the release APK/AAB
bubblewrap build

# 3. The output will be in app-release-signed.aab
```

### Upload to Play Store

1. **Create a Play Console account** — play.google.com/console (one-time $25 fee)
2. **Create a new app** → select "App bundle (.aab)"
3. **Upload** the `app-release-signed.aab`
4. **Fill in store listing**:
   - App name: AYK Solar Project Management
   - Category: Business
   - Privacy policy URL: `https://your-domain.com/legal/privacy`
   - Terms URL: `https://your-domain.com/legal/terms`
5. **Set up Digital Asset Links** — Bubblewrap generates these automatically; verify at `https://your-domain.com/.well-known/assetlinks.json`
6. **Submit for review** — Google reviews TWAs in 1-3 days

### Play Store Requirements Checklist

- [ ] App published at HTTPS URL
- [ ] `manifest.json` valid and accessible
- [ ] Icons (192x192, 512x512) accessible at production URL
- [ ] Digital Asset Links file at `/.well-known/assetlinks.json`
- [ ] Privacy Policy URL set in Play Console
- [ ] App content rating completed
- [ ] Target audience selected
- [ ] Data safety form filled (declare data collected: name, email, photos, location)

---

## PWA & Offline Support

The app includes a full PWA setup:

### Files

| File | Purpose |
|------|---------|
| `public/manifest.json` | Web App Manifest (installable, TWA-ready) |
| `public/sw.js` | Service Worker (offline caching, background sync) |
| `public/offline.html` | Offline fallback page |
| `public/icons/` | PWA icons (16, 32, 192, 512, apple-touch) |
| `src/components/pwa/register-sw.tsx` | SW registration (production only) |

### Offline Behavior

- **App shell** — cached on first visit, loads instantly offline
- **API requests** — network-first, falls back to cached responses
- **Static assets** — cache-first (images, fonts)
- **Form submissions** — queued via Background Sync API, sent when back online

### Install Prompt

The app shows an install prompt on supported browsers (Chrome, Edge, Samsung Internet). Users can "Add to Home Screen" on iOS via Safari's share button.

---

## Database & Backups

### Development (SQLite)

The default database is SQLite at `db/custom.db`. No setup needed — `bun run db:push` creates it.

### Production (PostgreSQL — recommended)

1. **Update `prisma/schema.prisma`**:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. **Set `DATABASE_URL`** in your production environment:
   ```
   DATABASE_URL="postgresql://user:password@host:5432/ayk_solar"
   ```

3. **Run migration**:
   ```bash
   bun run db:push
   ```

### Backup Scripts

```bash
# Create a backup (auto-compressed, auto-cleans old backups)
bash scripts/backup-db.sh

# Restore from a backup
bash scripts/restore-db.sh backups/ayk-backup-20250912-100000.db.gz
```

### Automated Backups (Cron)

Add to your server's crontab (`crontab -e`):
```cron
# Daily backup at 2 AM
0 2 * * * cd /path/to/ayk-solar && bash scripts/backup-db.sh >> logs/backup.log 2>&1
```

### Data Migration (SQLite → PostgreSQL)

```bash
# 1. Export from SQLite
sqlite3 db/custom.db .dump > data.sql

# 2. Clean up SQLite-specific syntax (remove AUTOINCREMENT, etc.)
# Use a tool like pgloader for best results:
# https://github.com/dimitri/pgloader

# 3. Import to PostgreSQL
psql $DATABASE_URL < data.sql
```

---

## Multi-Tenant Architecture

### How It Works

```
┌─────────────────────────────────────────┐
│           Platform Admin (You)          │
│         master@ayk.com.sg               │
│   • Generates access codes              │
│   • Manages all tenants                 │
│   • Sees aggregate stats                │
└──────────────┬──────────────────────────┘
               │ Issues access codes
               ▼
┌──────────────┴──────────────┐  ┌──────────────────────────┐
│      Tenant: "Company A"     │  │   Tenant: "Company B"    │
│  ┌─────────────────────────┐ │  │  ┌────────────────────┐  │
│  │ Admin (tenant admin)    │ │  │  │ Admin              │  │
│  │ PM, Supervisor, Workers │ │  │  │ PM, Workers        │  │
│  │ Projects, Tasks, etc.   │ │  │  │ Projects, Tasks    │  │
│  └─────────────────────────┘ │  │  └────────────────────┘  │
│  Data ISOLATED — Company B   │  │  Cannot see Company A    │
└──────────────────────────────┘  └──────────────────────────┘
```

### Data Isolation

- Every data model has a `tenantId` column
- Every API route uses `tenantWhere()` to filter queries by the logged-in user's tenant
- One company **cannot** access another company's data — verified on every GET/PUT/DELETE
- The master admin (`isMasterAdmin: true`) sees all data for management purposes

### Access Code Flow

1. **Platform admin generates a code** (e.g., `AYK-XXXX-XXXX`)
2. **Company enters the code** at the landing page → "Enterprise Access"
3. **If new company** → setup wizard creates a new Tenant + first Admin
4. **If existing company** → login page for that company
5. **Code usage tracked** — `usedCount` vs `maxUses` prevents overuse

---

## Legal & Compliance

All legal pages are server-rendered at:

| Page | URL |
|------|-----|
| Legal landing | `/legal` |
| Terms of Service | `/legal/terms` |
| Privacy Policy | `/legal/privacy` |
| Cookie Policy | `/legal/cookies` |
| Acceptable Use | `/legal/acceptable-use` |
| Disclaimer | `/legal/disclaimer` |
| GDPR / DPA | `/legal/gdpr` |

### Compliance Notes

- **PDPA (Singapore)** — Personal Data Protection Act compliance built into Privacy Policy
- **GDPR (EU)** — Data Processing Addendum available at `/legal/gdpr`
- **Cookie compliance** — Cookie Policy describes all cookies/local storage used
- **Children** — 18+ only, stated in Terms and Privacy Policy
- **Governing law** — Singapore (stated in Terms)

### Before Launch

- [ ] Review all legal pages with a qualified lawyer
- [ ] Update "AYK PTE LTD" to your actual company name if different
- [ ] Update contact emails (legal@, privacy@, support@)
- [ ] Set your actual business registration number (UEN)
- [ ] Update the governing law if not Singapore-based

---

## Security

### Implemented Security Measures

1. **Authentication** — cookie-based sessions (httpOnly, sameSite=lax)
2. **Password storage** — demo uses `demo$<plain>` (REPLACE with bcrypt in production)
3. **Tenant isolation** — every query filtered by tenantId
4. **Security headers** — CSP, X-Frame-Options, X-Content-Type-Options, HSTS, Referrer-Policy, Permissions-Policy
5. **Input validation** — all API routes validate inputs
6. **Error handling** — no stack traces exposed to users (error boundary catches all)

### Production Security Checklist

Before going live, you MUST:

- [ ] **Replace demo password hashing** with bcrypt/argon2 — update `src/lib/auth.ts` `verifyPassword()` and the seed script
- [ ] **Set `NEXTAUTH_SECRET`** — generate with `openssl rand -base64 32`
- [ ] **Enable HTTPS** — required for PWA, service worker, and cookie security
- [ ] **Set up rate limiting** — use a middleware or API gateway
- [ ] **Enable CSRF protection** — for form submissions
- [ ] **Set up monitoring/logging** — Sentry, DataDog, or similar
- [ ] **Audit dependencies** — `bun audit` regularly
- [ ] **Set up database connection pooling** — for PostgreSQL production

---

## Environment Variables

Copy `.env.example` to `.env` and fill in:

```bash
# Required
DATABASE_URL="file:./db/custom.db"           # SQLite (dev)
# DATABASE_URL="postgresql://..."            # PostgreSQL (prod)

# Production
NEXT_PUBLIC_APP_URL="https://your-domain.com"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Optional (email notifications)
# SMTP_HOST=""
# SMTP_PORT=""
# SMTP_USER=""
# SMTP_PASS=""
```

---

## Scripts Reference

| Command | Description |
|---------|-------------|
| `bun run dev` | Start dev server (port 3000) |
| `bun run build` | Production build |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |
| `bun run db:push` | Push schema to database |
| `bun run db:generate` | Generate Prisma client |
| `bun run scripts/seed.ts` | Seed demo data |
| `bash scripts/backup-db.sh` | Create database backup |
| `bash scripts/restore-db.sh <file>` | Restore from backup |
| `bash start-dev.sh` | Start dev server (detached) |

---

## Troubleshooting

### Dev server crashes (OOM)

The Next.js 16 dev server uses ~1.5GB RAM. If your machine has <4GB:
- Use `NODE_OPTIONS="--max-old-space-size=1024" bun run dev`
- Or build for production: `bun run build && bun run start`

### Blank dashboard after deploy

- Clear browser cache / hard refresh (`Ctrl+Shift+R`)
- Check browser console for chunk-loading errors
- Ensure `NEXT_PUBLIC_APP_URL` is set correctly

### Service worker not updating

- The SW uses cache versioning — increment `CACHE_VERSION` in `public/sw.js`
- Users may need to close ALL tabs of the app, then reopen

### Database locked (SQLite)

SQLite doesn't handle concurrent writes well. For production:
- Switch to PostgreSQL (see [Database & Backups](#database--backups))
- Or use WAL mode: `sqlite3 db/custom.db "PRAGMA journal_mode=WAL;"`

---

## License

© 2025 AYK PTE LTD. All rights reserved.

This software is proprietary. Unauthorized copying, modification, or distribution is prohibited.

---

## Contact

- **General:** hello@ayk.com.sg
- **Legal:** legal@ayk.com.sg
- **Privacy:** privacy@ayk.com.sg
- **Support:** support@ayk.com.sg

**AYK PTE LTD**
Solar Energy • Build a Brighter Future
