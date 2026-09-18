import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { hashPassword } from '@/lib/auth'

// SIMPLE setup: creates tables + master admin + one default company admin.
// No access codes, no demo data — just a working login.

const SUPABASE_POOLER_URL = 'postgresql://postgres.qwcgtrbqiakfzxlpbwpj:Ayk2025Solar@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&pool_timeout=120'

// Credentials
const MASTER_EMAIL = 'master@ayk.com.sg'
const MASTER_PASSWORD = 'Ayk!Solar#Admin2025@Secure'

// Default company admin (the user who will use the app)
const ADMIN_EMAIL = 'admin@ayk.com.sg'
const ADMIN_PASSWORD = 'Ayk2025Solar!'

export async function GET() {
  return NextResponse.json({ status: 'ready', message: 'Send POST with {"secret":"ayk-setup-2025"}' })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    if (body.secret !== 'ayk-setup-2025') {
      return NextResponse.json({ error: 'Invalid secret. Use: ayk-setup-2025' }, { status: 403 })
    }

    const log: string[] = []
    log.push('Starting setup...')

    const db = new PrismaClient({ datasources: { db: { url: SUPABASE_POOLER_URL } } })

    try {
      // Test connection
      log.push('Testing database connection...')
      await db.$queryRaw`SELECT 1`
      log.push('✓ Database connected')

      // Create tables
      log.push('Creating tables...')
      const tables = [
        `CREATE TABLE IF NOT EXISTS "tenants" ("id" TEXT PRIMARY KEY, "name" TEXT NOT NULL, "logo" TEXT, "address" TEXT, "uen" TEXT, "plan" TEXT DEFAULT 'enterprise', "isActive" BOOLEAN DEFAULT true, "createdAt" TIMESTAMP DEFAULT NOW(), "updatedAt" TIMESTAMP DEFAULT NOW())`,
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
      for (const sql of tables) {
        try { await db.$executeRawUnsafe(sql) } catch (e: any) { if (!e.message.includes('already exists')) log.push(`  note: ${e.message.slice(0, 60)}`) }
      }
      log.push('✓ Tables created')

      // Check if already set up
      const userCount = await db.user.count()
      if (userCount > 0) {
        log.push(`Database already has ${userCount} users — skipping seed`)
        return NextResponse.json({ success: true, message: 'Already set up', log })
      }

      // Create the company (tenant)
      log.push('Creating company...')
      const tenant = await db.tenant.create({ data: { name: 'AYK PTE LTD', plan: 'enterprise', isActive: true } })
      log.push('✓ Company created: AYK PTE LTD')

      // Create master admin (for you — platform owner)
      log.push('Creating master admin...')
      await db.user.create({
        data: {
          email: MASTER_EMAIL,
          name: 'Platform Admin',
          password: hashPassword(MASTER_PASSWORD),
          role: 'Admin',
          isMasterAdmin: true,
          setupComplete: true,
        },
      })
      log.push('✓ Master admin created')

      // Create company admin (the main user who will use the app)
      log.push('Creating company admin...')
      await db.user.create({
        data: {
          email: ADMIN_EMAIL,
          name: 'AYK Admin',
          password: hashPassword(ADMIN_PASSWORD),
          role: 'Admin',
          isTenantAdmin: true,
          setupComplete: true,
          tenantId: tenant.id,
        },
      })
      log.push('✓ Company admin created')

      log.push('🎉 Setup complete!')

      return NextResponse.json({
        success: true,
        message: 'Database set up successfully!',
        log,
        credentials: {
          companyAdmin: `${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`,
          masterAdmin: `${MASTER_EMAIL} / ${MASTER_PASSWORD}`,
          masterLoginUrl: '/master-access',
        },
      })
    } finally {
      await db.$disconnect()
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Setup failed' }, { status: 500 })
  }
}
