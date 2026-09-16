// AYK PTE LTD — Environment configuration
// Auto-detects the app URL from Vercel's VERCEL_URL env var.
// This means you NEVER need to set NEXT_PUBLIC_APP_URL manually.

export const env = {
  // Database
  databaseUrl: process.env.DATABASE_URL || 'file:./db/custom.db',
  
  // App URL — auto-detected from Vercel, falls back to localhost
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 
          (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
  
  // Environment
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV !== 'production',
  
  // Auth
  nextAuthUrl: process.env.NEXTAUTH_URL || 
               (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
  nextAuthSecret: process.env.NEXTAUTH_SECRET || 'ayk-solar-dev-secret-key',
}
