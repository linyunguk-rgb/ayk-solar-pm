import { PrismaClient } from '@prisma/client'

// Supabase connection — password: Ayk2025Solar (no special characters)
// Uses the Transaction Pooler (port 6543) which works with Vercel serverless.
const SUPABASE_POOLER_URL = 'postgresql://postgres.qwcgtrbqiakfzxlpbwpj:Ayk2025Solar@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&pool_timeout=120'
const SUPABASE_DIRECT_URL = 'postgresql://postgres:Ayk2025Solar@db.qwcgtrbqiakfzxlpbwpj.supabase.co:5432/postgres'

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
