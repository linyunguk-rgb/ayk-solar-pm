import { PrismaClient } from '@prisma/client'

// ─── Supabase Connection ───
// ALWAYS use the Transaction Pooler (port 6543) — it works with Vercel serverless.
// The direct connection (port 5432) is blocked by Vercel's serverless functions.
// Password: Ayk2025Solar (no special characters)

const SUPABASE_POOLER_URL = 'postgresql://postgres.qwcgtrbqiakfzxlpbwpj:Ayk2025Solar@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&pool_timeout=120'

// For local dev, use SQLite. For production, ALWAYS use the pooler.
const isLocalDev = process.env.NODE_ENV !== 'production' && (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('file:'))

const databaseUrl = isLocalDev
  ? (process.env.DATABASE_URL || 'file:/home/z/my-project/db/custom.db')
  : SUPABASE_POOLER_URL  // In production, ALWAYS use the pooler — ignore any other DATABASE_URL

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: databaseUrl } },
    log: [],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
