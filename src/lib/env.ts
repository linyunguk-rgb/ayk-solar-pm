/**
 * AYK PTE LTD — Solar Project Management System
 * Typed, centralized environment variable accessor.
 *
 * Never access `process.env.*` directly in app code — import from here
 * so we have one place to validate, default, and document the surface.
 *
 * Validation is intentionally lightweight (no hard throw on missing
 * optional vars) so the dev sandbox keeps working out-of-the-box.
 */

function trimTrailingSlash(value: string): string {
  return value.replace(/\/$/, '')
}

const rawAppUrl =
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export const env = {
  /** Public app URL (no trailing slash). Used for sitemap, OG tags, PWA manifest. */
  appUrl: trimTrailingSlash(rawAppUrl),

  /** True when running in production. */
  isProduction: process.env.NODE_ENV === 'production',

  /** True when running in development. */
  isDevelopment: process.env.NODE_ENV === 'development',

  /** True when running the test suite. */
  isTest: process.env.NODE_ENV === 'test',

  /** Database connection string (SQLite file by default). */
  databaseUrl: process.env.DATABASE_URL || 'file:./db/custom.db',

  /** NextAuth URL (defaults to app URL). */
  nextAuthUrl: process.env.NEXTAUTH_URL || rawAppUrl,

  /** NextAuth secret — required in production. */
  nextAuthSecret: process.env.NEXTAUTH_SECRET || '',

  /** SMTP host (optional — used for password reset / notifications). */
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  smtpFrom: process.env.SMTP_FROM || 'no-reply@ayk.com.sg',
} as const

export type Env = typeof env

/**
 * Hard validation for production startup.
 * Call this from a server entry point if you want the app to refuse to
 * boot when critical configuration is missing in prod.
 */
export function assertProductionEnv(): void {
  if (!env.isProduction) return

  const missing: string[] = []
  if (!env.nextAuthSecret) missing.push('NEXTAUTH_SECRET')
  if (!env.appUrl) missing.push('NEXT_PUBLIC_APP_URL')
  if (!env.databaseUrl) missing.push('DATABASE_URL')

  if (missing.length > 0) {
    throw new Error(
      `[AYK] Missing required production env vars: ${missing.join(', ')}. ` +
        `Set them in your deployment environment before starting the app.`,
    )
  }
}
