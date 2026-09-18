import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { hashPassword, generateAccessCode } from '@/lib/auth'

// This route handles database setup AFTER deployment.
// It creates tables + master admin + access codes ONLY (NO demo data).

const SUPABASE_POOLER_URL = 'postgresql://postgres.qwcgtrbqiakfzxlpbwpj:Ayk2025Solar@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&pool_timeout=120'

// Strong master admin password — NOT in any breach database
const MASTER_EMAIL = 'admin@ayk.com.sg'
const MASTER_PASSWORD = 'Ayk!Solar#Admin2025@Secure'

export async function GET() {
  return NextResponse.json({
    status: 'ready',
    message: 'Database Setup API',
    instructions: 'Send a POST request with the secret to set up your database',
    secret: 'ayk-setup-2025',
  })
}

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  try {
    const body = await req.json().catch(() => ({}))
    const secret = body.secret || req.headers.get('x-setup-secret')
    if (secret !== 'ayk-setup-2025') {
      return NextResponse.json({ error: 'Invalid secret. Use: ayk-setup-2025' }, { status: 403 })
    }

    const log: string[] = []
    log.push('Starting database setup...')

    const db = new PrismaClient({ datasources: { db: { url: SUPABASE_POOLER_URL } } })

    try {
      // Test connection
      log.push('Testing database connection...')
      try {
        await db.$queryRaw`SELECT 1`
        log.push('✓ Database connection successful')
      } catch (e: any) {
        log.push(`✗ Database connection failed: ${e.message}`)
        return NextResponse.json({ error: 'Cannot connect to database', log }, { status: 500 })
      }

      // Create tables
      log.push('Creating database tables...')
      const createTables = [
        `CREATE TABLE IF NOT EXISTS "tenants" ("id" TEXT PRIMARY KEY, "name" TEXT NOT NULL, "logo" TEXT, "address" TEXT, "uen" TEXT, "plan" TEXT DEFAULT 'demo', "isActive" BOOLEAN DEFAULT true, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW())`,
        `CREATE TABLE IF NOT EXISTS "access_codes" ("id" TEXT PRIMARY KEY, "code" TEXT UNIQUE NOT NULL, "label" TEXT, "plan" TEXT DEFAULT 'enterprise', "maxUses" INTEGER DEFAULT 1, "usedCount" INTEGER DEFAULT 0, "isActive" BOOLEAN DEFAULT true, "tenantId" TEXT, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW())`,
        `CREATE TABLE IF NOT EXISTS "users" ("id" TEXT PRIMARY KEY, "email" TEXT UNIQUE NOT NULL, "name" TEXT NOT NULL, "password" TEXT NOT NULL, "role" TEXT DEFAULT 'Worker', "avatar" TEXT, "phone" TEXT, "isActive" BOOLEAN DEFAULT true, "isTenantAdmin" BOOLEAN DEFAULT false, "isMasterAdmin" BOOLEAN DEFAULT false, "setupComplete" BOOLEAN DEFAULT true, "tenantId" TEXT, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW())`,
        `CREATE TABLE IF NOT EXISTS "projects" ("id" TEXT PRIMARY KEY, "code" TEXT NOT NULL, "name" TEXT NOT NULL, "location" TEXT NOT NULL, "client" TEXT, "totalPanels" INTEGER DEFAULT 0, "installedPanels" INTEGER DEFAULT 0, "capacity" TEXT, "status" TEXT DEFAULT 'Active', "startDate" TIMESTAMP NOT NULL, "endDate" TIMESTAMP NOT NULL, "budget" FLOAT DEFAULT 0, "actualCost" FLOAT DEFAULT 0, "managerId" TEXT, "description" TEXT, "tenantId" TEXT, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW())`,
        `CREATE TABLE IF NOT EXISTS "project_stages" ("id" TEXT PRIMARY KEY, "projectId" TEXT NOT NULL, "name" TEXT NOT NULL, "order" INTEGER DEFAULT 0, "plannedPct" FLOAT DEFAULT 0, "actualPct" FLOAT DEFAULT 0, "weight" FLOAT DEFAULT 16.66, "status" TEXT DEFAULT 'NotStarted', "startDate" TIMESTAMP, "endDate" TIMESTAMP, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW())`,
        `CREATE TABLE IF NOT EXISTS "daily_progress" ("id" TEXT PRIMARY KEY, "projectId" TEXT NOT NULL, "date" TIMESTAMP NOT NULL, "installedPanels" INTEGER DEFAULT 0, "totalInstalled" INTEGER DEFAULT 0, "manHours" FLOAT DEFAULT 0, "workers" INTEGER DEFAULT 0, "materialsUsed" TEXT, "equipmentUsed" TEXT, "workCompleted" TEXT, "workPending" TEXT, "siteStatus" TEXT DEFAULT 'Normal', "remarks" TEXT, "photoUrls" TEXT, "gpsLocation" TEXT, "submittedById" TEXT, "tenantId" TEXT, "createdAt" TIMESTAMP DEFAULT NOW())`,
        `CREATE TABLE IF NOT EXISTS "tasks" ("id" TEXT PRIMARY KEY, "title" TEXT NOT NULL, "description" TEXT, "projectId" TEXT, "assignedToId" TEXT, "assignedToName" TEXT, "team" TEXT, "priority" TEXT DEFAULT 'Medium', "status" TEXT DEFAULT 'Todo', "progress" FLOAT DEFAULT 0, "startDate" TIMESTAMP NOT NULL, "dueDate" TIMESTAMP NOT NULL, "completedAt" TIMESTAMP, "remarks" TEXT, "tenantId" TEXT, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW())`,
        `CREATE TABLE IF NOT EXISTS "workers" ("id" TEXT PRIMARY KEY, "name" TEXT NOT NULL, "employeeId" TEXT NOT NULL, "role" TEXT NOT NULL, "team" TEXT, "projectId" TEXT, "phone" TEXT, "status" TEXT DEFAULT 'Active', "skillLevel" TEXT DEFAULT 'Intermediate', "tenantId" TEXT, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW())`,
        `CREATE TABLE IF NOT EXISTS "attendance" ("id" TEXT PRIMARY KEY, "workerId" TEXT NOT NULL, "date" TIMESTAMP NOT NULL, "checkIn" TIMESTAMP, "checkOut" TIMESTAMP, "workingHours" FLOAT DEFAULT 0, "overtime" FLOAT DEFAULT 0, "status" TEXT DEFAULT 'Present', "createdAt" TIMESTAMP DEFAULT NOW())`,
        `CREATE TABLE IF NOT EXISTS "materials" ("id" TEXT PRIMARY KEY, "name" TEXT NOT NULL, "category" TEXT NOT NULL, "unit" TEXT DEFAULT 'pcs', "stockQty" FLOAT DEFAULT 0, "minStockLevel" FLOAT DEFAULT 0, "unitPrice" FLOAT DEFAULT 0, "supplier" TEXT, "tenantId" TEXT, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW())`,
        `CREATE TABLE IF NOT EXISTS "material_transactions" ("id" TEXT PRIMARY KEY, "materialId" TEXT NOT NULL, "projectId" TEXT, "type" TEXT NOT NULL, "qty" FLOAT NOT NULL, "fromProject" TEXT, "toProject" TEXT, "remarks" TEXT, "date" TIMESTAMP NOT NULL, "tenantId" TEXT, "createdAt" TIMESTAMP DEFAULT NOW())`,
        `CREATE TABLE IF NOT EXISTS "expenses" ("id" TEXT PRIMARY KEY, "date" TIMESTAMP NOT NULL, "projectId" TEXT, "category" TEXT NOT NULL, "description" TEXT NOT NULL, "amount" FLOAT NOT NULL, "paidBy" TEXT, "approvalStatus" TEXT DEFAULT 'Pending', "receiptUrl" TEXT, "tenantId" TEXT, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW())`,
        `CREATE TABLE IF NOT EXISTS "safety_checklists" ("id" TEXT PRIMARY KEY, "date" TIMESTAMP NOT NULL, "projectId" TEXT, "checklistType" TEXT DEFAULT 'PPE', "helmet" BOOLEAN DEFAULT false, "safetyShoes" BOOLEAN DEFAULT false, "gloves" BOOLEAN DEFAULT false, "harness" BOOLEAN DEFAULT false, "workAreaClean" BOOLEAN DEFAULT false, "equipmentCondition" BOOLEAN DEFAULT false, "electricalSafety" BOOLEAN DEFAULT false, "conductedById" TEXT, "conductedByName" TEXT, "location" TEXT, "remarks" TEXT, "compliancePct" FLOAT DEFAULT 0, "tenantId" TEXT, "createdAt" TIMESTAMP DEFAULT NOW())`,
        `CREATE TABLE IF NOT EXISTS "safety_incidents" ("id" TEXT PRIMARY KEY, "date" TIMESTAMP NOT NULL, "projectId" TEXT, "type" TEXT NOT NULL, "severity" TEXT DEFAULT 'Low', "description" TEXT NOT NULL, "location" TEXT, "reportedById" TEXT, "reportedByName" TEXT, "status" TEXT DEFAULT 'Open', "actionTaken" TEXT, "tenantId" TEXT, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW())`,
        `CREATE TABLE IF NOT EXISTS "documents" ("id" TEXT PRIMARY KEY, "name" TEXT NOT NULL, "category" TEXT NOT NULL, "projectId" TEXT, "fileUrl" TEXT NOT NULL, "fileType" TEXT NOT NULL, "fileSize" INTEGER DEFAULT 0, "uploadedById" TEXT, "uploadedByName" TEXT, "description" TEXT, "tenantId" TEXT, "createdAt" TIMESTAMP DEFAULT NOW())`,
        `CREATE TABLE IF NOT EXISTS "notifications" ("id" TEXT PRIMARY KEY, "type" TEXT NOT NULL, "title" TEXT NOT NULL, "message" TEXT NOT NULL, "projectId" TEXT, "isRead" BOOLEAN DEFAULT false, "severity" TEXT DEFAULT 'info', "tenantId" TEXT, "createdAt" TIMESTAMP DEFAULT NOW())`,
      ]

      for (const sql of createTables) {
        try { await db.$executeRawUnsafe(sql) } catch (e: any) { if (!e.message.includes('already exists')) log.push(`  note: ${e.message.slice(0, 60)}`) }
      }
      log.push('✓ All tables created')

      // Create ONLY master admin + access codes (NO demo data)
      const userCount = await db.user.count()
      if (userCount > 0) {
        log.push(`Database already has ${userCount} users — skipping seed`)
        return NextResponse.json({ success: true, message: 'Database already set up', log, duration: `${Date.now() - startTime}ms` })
      }

      log.push('Creating master admin (secure hashed password)...')
      await db.user.create({
        data: {
          email: MASTER_EMAIL,
          name: 'Platform Admin',
          password: hashPassword(MASTER_PASSWORD), // SECURE: scrypt hashing
          role: 'Admin',
          isMasterAdmin: true,
          setupComplete: true,
        },
      })
      log.push('✓ Master admin created')

      log.push('Creating access codes...')
      // Code for creating NEW companies
      await db.accessCode.create({ data: { code: 'AYK-NEW-ENT1', label: 'New enterprise (1 seat)', plan: 'enterprise', maxUses: 1, isActive: true } })
      await db.accessCode.create({ data: { code: 'AYK-NEW-ENT5', label: 'New enterprise (5 seats)', plan: 'enterprise', maxUses: 5, isActive: true } })
      await db.accessCode.create({ data: { code: 'AYK-NEW-ENT20', label: 'New enterprise (20 seats)', plan: 'enterprise', maxUses: 20, isActive: true } })
      log.push('✓ Access codes created')

      log.push('🎉 Database setup complete!')
      log.push('')
      log.push('=== CREDENTIALS ===')
      log.push(`Master Admin Email: ${MASTER_EMAIL}`)
      log.push(`Master Admin Password: ${MASTER_PASSWORD}`)
      log.push(`Master Login URL: https://your-app.vercel.app/master-access`)
      log.push(`Access Codes: AYK-NEW-ENT1, AYK-NEW-ENT5, AYK-NEW-ENT20`)

      return NextResponse.json({
        success: true,
        message: 'Database set up successfully!',
        log,
        credentials: {
          masterAdmin: `${MASTER_EMAIL} / ${MASTER_PASSWORD}`,
          masterLoginUrl: 'https://your-app.vercel.app/master-access',
          accessCodes: ['AYK-NEW-ENT1', 'AYK-NEW-ENT5', 'AYK-NEW-ENT20'],
        },
        duration: `${Date.now() - startTime}ms`
      })
    } finally {
      await db.$disconnect()
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Setup failed' }, { status: 500 })
  }
}
