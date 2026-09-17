import { PrismaClient } from '@prisma/client'

// Supabase connection pooler URL — used as fallback when DATABASE_URL env var is not set.
// This ensures the app connects to Supase even if Vercel env vars are not configured.
const SUPABASE_POOLER_URL = 'postgresql://postgres.qwcgtrbqiakfzxlpbwpj:DATABASE%2313a%5C@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&pool_timeout=120'
const SUPABASE_DIRECT_URL = 'postgresql://postgres:DATABASE%2313a%5C@db.qwcgtrbqiakfzxlpbwpj.supabase.co:5432/postgres'

// Use environment variable if set, otherwise fall back to Supabase pooler
const databaseUrl = process.env.DATABASE_URL || SUPABASE_POOLER_URL

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
