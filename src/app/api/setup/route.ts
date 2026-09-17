import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

// This route handles database setup AFTER deployment.
// It tries multiple Supabase pooler connections to find the one that works.

const SUPABASE_REF = 'qwcgtrbqiakfzxlpbwpj'
const SUPABASE_PASS = 'Ayk2025Solar' // Reset password — no special characters

// Try all common Supabase pooler regions
const POOLER_REGIONS = [
  'aws-0-ap-southeast-1',
  'aws-0-ap-northeast-1',
  'aws-0-us-east-1',
  'aws-0-us-west-1',
  'aws-0-eu-west-1',
  'aws-0-eu-central-1',
  'aws-0-ap-south-1',
  'aws-0-sa-east-1',
]

// Also try the direct connection as fallback
const DIRECT_URL = `postgresql://postgres:${SUPABASE_PASS}@db.${SUPABASE_REF}.supabase.co:5432/postgres`

function getPoolerUrls(): string[] {
  return POOLER_REGIONS.map(region =>
    `postgresql://postgres.${SUPABASE_REF}:${SUPABASE_PASS}@${region}.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&pool_timeout=120`
  )
}

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

    // ─── Step 1: Find a working database connection ───
    log.push('Testing database connections (trying multiple Supabase pooler regions)...')

    // First, try the DATABASE_URL from environment
    const envUrl = process.env.DATABASE_URL
    const candidates: { url: string; label: string }[] = []

    if (envUrl && envUrl.startsWith('postgresql://')) {
      candidates.push({ url: envUrl, label: 'Environment DATABASE_URL' })
    }

    // Add all pooler regions
    for (const poolerUrl of getPoolerUrls()) {
      const region = poolerUrl.match(/@(aws-0-[^.]+)/)?.[1] || 'unknown'
      candidates.push({ url: poolerUrl, label: `Pooler: ${region}` })
    }

    // Add direct connection as last resort
    candidates.push({ url: DIRECT_URL, label: 'Direct connection (port 5432)' })

    let workingDb: PrismaClient | null = null
    let workingUrl = ''
    let workingLabel = ''

    for (const candidate of candidates) {
      try {
        log.push(`  Trying: ${candidate.label}...`)
        const testDb = new PrismaClient({
          datasources: { db: { url: candidate.url } },
        })
        await testDb.$queryRaw`SELECT 1`
        await testDb.$disconnect()
        workingDb = new PrismaClient({
          datasources: { db: { url: candidate.url } },
        })
        workingUrl = candidate.url
        workingLabel = candidate.label
        log.push(`  ✓ SUCCESS: ${candidate.label}`)
        break
      } catch (e: any) {
        log.push(`  ✗ Failed: ${e.message?.slice(0, 80) || 'unknown error'}`)
      }
    }

    if (!workingDb) {
      log.push('✗ All connection attempts failed')
      log.push('')
      log.push('=== TROUBLESHOOTING ===')
      log.push('1. Check that your Supabase project is active (not paused)')
      log.push('   Go to: https://supabase.com/dashboard/project/qwcgtrbqiakfzxlpbwpj')
      log.push('2. If paused, click "Restore project"')
      log.push('3. Check that the database password is correct: DATABASE#13a\\')
      log.push('4. Try setting DATABASE_URL manually in Vercel environment variables')
      log.push('   Go to: Vercel → Settings → Environment Variables')
      log.push(`   Set DATABASE_URL to the connection string from Supabase dashboard:`)
      log.push('   https://supabase.com/dashboard/project/qwcgtrbqiakfzxlpbwpj/settings/database')
      return NextResponse.json({ error: 'Cannot connect to database', log }, { status: 500 })
    }

    log.push(`✓ Connected using: ${workingLabel}`)

    try {
      // ─── Step 2: Create tables using raw SQL ───
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

      // Add foreign key constraints separately (after all tables exist)
      const addConstraints = [
        `ALTER TABLE "access_codes" ADD CONSTRAINT IF NOT EXISTS "access_codes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL`,
        `ALTER TABLE "users" ADD CONSTRAINT IF NOT EXISTS "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE`,
        `ALTER TABLE "projects" ADD CONSTRAINT IF NOT EXISTS "projects_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "users"("id")`,
        `ALTER TABLE "projects" ADD CONSTRAINT IF NOT EXISTS "projects_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE`,
        `ALTER TABLE "project_stages" ADD CONSTRAINT IF NOT EXISTS "project_stages_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE`,
      ]

      for (const sql of createTables) {
        try { await workingDb.$executeRawUnsafe(sql) } catch (e: any) { if (!e.message.includes('already exists')) log.push(`  note: ${e.message.slice(0, 60)}`) }
      }
      for (const sql of addConstraints) {
        try { await workingDb.$executeRawUnsafe(sql) } catch (e: any) { /* constraint might exist */ }
      }
      log.push('✓ All tables created')

      // ─── Step 3: Seed data ───
      const hash = (pw: string) => `demo$${pw}`
      const now = new Date()
      const userCount = await workingDb.user.count()
      if (userCount > 0) {
        log.push(`Database already has ${userCount} users — skipping seed`)
        return NextResponse.json({ success: true, message: 'Database already set up', log, connection: workingLabel, duration: `${Date.now() - startTime}ms` })
      }

      log.push('Seeding demo data...')
      const master = await workingDb.user.create({ data: { email: 'master@ayk.com.sg', name: 'Platform Admin', password: hash('master123'), role: 'Admin', phone: '+65 9000 0000', isMasterAdmin: true, setupComplete: true } })
      const demoTenant = await workingDb.tenant.create({ data: { name: 'AYK Demo', plan: 'demo', address: '1 Tuas Avenue, Singapore', uen: 'DEMO2024001', isActive: true } })
      const users = await Promise.all([
        workingDb.user.create({ data: { email: 'admin@ayk.com.sg', name: 'Alex Tan', password: hash('admin123'), role: 'Admin', phone: '+65 9001 0001', tenantId: demoTenant.id, isTenantAdmin: true, setupComplete: true } }),
        workingDb.user.create({ data: { email: 'pm@ayk.com.sg', name: 'Priya Menon', password: hash('pm123'), role: 'ProjectManager', phone: '+65 9001 0002', tenantId: demoTenant.id, setupComplete: true } }),
        workingDb.user.create({ data: { email: 'supervisor@ayk.com.sg', name: 'Raj Kumar', password: hash('super123'), role: 'SiteSupervisor', phone: '+65 9001 0003', tenantId: demoTenant.id, setupComplete: true } }),
        workingDb.user.create({ data: { email: 'safety@ayk.com.sg', name: 'Lim Wei Ming', password: hash('safety123'), role: 'SafetyOfficer', phone: '+65 9001 0004', tenantId: demoTenant.id, setupComplete: true } }),
        workingDb.user.create({ data: { email: 'engineer@ayk.com.sg', name: 'Sarah Wong', password: hash('eng123'), role: 'Engineer', phone: '+65 9001 0005', tenantId: demoTenant.id, setupComplete: true } }),
        workingDb.user.create({ data: { email: 'store@ayk.com.sg', name: 'Daniel Lee', password: hash('store123'), role: 'StoreOfficer', phone: '+65 9001 0006', tenantId: demoTenant.id, setupComplete: true } }),
      ])
      const [admin, pm, supervisor, safety, engineer, store] = users
      log.push('✓ Users created')

      const projects = await Promise.all([
        workingDb.project.create({ data: { code: 'AYK-TUAS-001', name: 'Tuas Solar Project', location: 'Tuas, Singapore', client: 'Tuas Power Ltd', totalPanels: 8400, installedPanels: 2100, capacity: '3.5 MWp', status: 'Active', startDate: new Date(2025,0,15), endDate: new Date(2025,11,30), budget: 5800000, actualCost: 2410000, managerId: pm.id, tenantId: demoTenant.id, description: 'Rooftop solar installation.' } }),
        workingDb.project.create({ data: { code: 'AYK-JUR-002', name: 'Jurong Industrial Solar', location: 'Jurong, Singapore', client: 'Jurong Chemicals', totalPanels: 12500, installedPanels: 8600, capacity: '5.2 MWp', status: 'Active', startDate: new Date(2025,1,1), endDate: new Date(2026,1,28), budget: 8200000, actualCost: 5870000, managerId: pm.id, tenantId: demoTenant.id, description: 'Ground-mount hybrid.' } }),
        workingDb.project.create({ data: { code: 'AYK-SEM-003', name: 'Sembcorp Solar Farm', location: 'Sembcorp, Singapore', client: 'Sembcorp', totalPanels: 5200, installedPanels: 5200, capacity: '2.1 MWp', status: 'Completed', startDate: new Date(2025,2,10), endDate: new Date(2025,9,15), budget: 3900000, actualCost: 3720000, managerId: pm.id, tenantId: demoTenant.id, description: 'Completed.' } }),
        workingDb.project.create({ data: { code: 'AYK-WD-004', name: 'Woodlands Warehouse Solar', location: 'Woodlands, Singapore', client: 'Woodlands Logistics', totalPanels: 3200, installedPanels: 980, capacity: '1.4 MWp', status: 'Delayed', startDate: new Date(2024,8,1), endDate: new Date(2025,5,30), budget: 2100000, actualCost: 1980000, managerId: pm.id, tenantId: demoTenant.id, description: 'Delayed.' } }),
        workingDb.project.create({ data: { code: 'AYK-CCK-005', name: 'Choa Chu Kang Solar', location: 'Choa Chu Kang, Singapore', client: 'CCK Holdings', totalPanels: 6800, installedPanels: 0, capacity: '2.8 MWp', status: 'OnHold', startDate: new Date(2025,4,5), endDate: new Date(2026,3,20), budget: 4500000, actualCost: 320000, managerId: pm.id, tenantId: demoTenant.id, description: 'On hold.' } }),
      ])
      const [tuas, jurong, sembcorp, woodlands, cck] = projects
      log.push('✓ Projects created')

      // Stages, tasks, workers, materials, expenses, safety, docs, notifications
      const sw = [5,15,15,40,15,10], sn = ['Survey','Design','Procurement','Installation','Testing','Handover']
      const stageData = [
        { pcts: [100,100,80,45,20,0], sts: ['Completed','Completed','InProgress','InProgress','NotStarted','NotStarted'] },
        { pcts: [100,100,100,70,40,10], sts: ['Completed','Completed','Completed','InProgress','InProgress','InProgress'] },
        { pcts: [100,100,100,100,100,100], sts: ['Completed','Completed','Completed','Completed','Completed','Completed'] },
        { pcts: [100,100,60,30,0,0], sts: ['Completed','Completed','Delayed','Delayed','NotStarted','NotStarted'] },
        { pcts: [100,50,0,0,0,0], sts: ['Completed','InProgress','NotStarted','NotStarted','NotStarted','NotStarted'] },
      ]
      for (const [pi, p] of projects.entries()) {
        const sd = stageData[pi]
        for (let i=0;i<6;i++) { const td = Math.ceil((p.endDate.getTime()-p.startDate.getTime())/86400000/6); await workingDb.projectStage.create({ data: { projectId: p.id, name: sn[i], order: i, plannedPct: sd.pcts[i], actualPct: sd.pcts[i], weight: sw[i], status: sd.sts[i], startDate: new Date(p.startDate.getTime()+td*i*86400000), endDate: new Date(p.startDate.getTime()+td*(i+1)*86400000) } }) }
      }

      const tasks = [
        { title: 'Complete Block 2 mounting rail', projectId: tuas.id, assignedToId: supervisor.id, priority: 'High', status: 'InProgress', progress: 60, dueOffset: 7 },
        { title: 'Procure DC cables', projectId: tuas.id, assignedToId: store.id, priority: 'Critical', status: 'InProgress', progress: 40, dueOffset: 3 },
        { title: 'Inverter commissioning', projectId: tuas.id, assignedToId: engineer.id, priority: 'Medium', status: 'Todo', progress: 0, dueOffset: 14 },
        { title: 'Toolbox meeting', projectId: tuas.id, assignedToId: safety.id, priority: 'Medium', status: 'Completed', progress: 100, dueOffset: -2 },
        { title: 'Jurong cable testing', projectId: jurong.id, assignedToId: engineer.id, priority: 'High', status: 'InProgress', progress: 75, dueOffset: 5 },
        { title: 'Woodlands rail resupply', projectId: woodlands.id, assignedToId: store.id, priority: 'Critical', status: 'Delayed', progress: 30, dueOffset: -3 },
      ]
      for (const t of tasks) await workingDb.task.create({ data: { title: t.title, projectId: t.projectId, assignedToId: t.assignedToId, assignedToName: users.find(u=>u.id===t.assignedToId)?.name, priority: t.priority, status: t.status, progress: t.progress, startDate: new Date(now.getTime()-14*86400000), dueDate: new Date(now.getTime()+t.dueOffset*86400000), tenantId: demoTenant.id } })

      const wn = ['Wong HK','Tan AL','Ravi S','Muthu K','Chen BJ','Ali R','Mohd S','Singh G','Ng PL','Lim CH','Kumar V','Das S']
      const wr = ['Solar Installer','Electrician','Foreman','Technician','Helper','Crane Operator']
      const tm = ['Team Alpha','Team Bravo','Team Charlie','Team Delta']
      for (let i=0;i<wn.length;i++) { const p = i<5?tuas:i<9?jurong:woodlands; await workingDb.worker.create({ data: { name: wn[i], employeeId: `AYK-${1001+i}`, role: wr[i%wr.length], team: tm[i%tm.length], projectId: p?.id, phone: `+65 9${(1000000+i*137).toString().slice(0,6)}`, skillLevel: i%5===0?'Senior':i%3===0?'Intermediate':'Junior', tenantId: demoTenant.id } }) }

      for (const m of [{ name: 'Mono PV Panel 540W', category: 'SolarPanels', unit: 'pcs', stockQty: 5800, minStockLevel: 2000, unitPrice: 210, supplier: 'JinkoSolar' },{ name: 'DC Cable 4mm²', category: 'DCCables', unit: 'roll', stockQty: 42, minStockLevel: 60, unitPrice: 180, supplier: 'Prysmian' },{ name: 'AC Cable 6mm²', category: 'ACCables', unit: 'roll', stockQty: 85, minStockLevel: 40, unitPrice: 220, supplier: 'Nexans' },{ name: 'Mounting Rail 4m', category: 'MountingRails', unit: 'pcs', stockQty: 120, minStockLevel: 300, unitPrice: 65, supplier: 'Schletter' },{ name: 'String Inverter 50kW', category: 'Inverters', unit: 'pcs', stockQty: 18, minStockLevel: 8, unitPrice: 4200, supplier: 'SMA' },{ name: 'MC4 Connector Pair', category: 'MC4Connectors', unit: 'pair', stockQty: 4200, minStockLevel: 1500, unitPrice: 2.5, supplier: 'Multi-Contact' },{ name: 'M8 Bolt & Nut', category: 'Bolts', unit: 'pcs', stockQty: 12000, minStockLevel: 5000, unitPrice: 0.8, supplier: 'Fastenal' }]) await workingDb.material.create({ data: { ...m, tenantId: demoTenant.id } })

      for (const e of [{ date: new Date(now.getTime()-2*86400000), projectId: tuas.id, category: 'Materials', description: 'DC cable purchase', amount: 14500, paidBy: 'Daniel Lee', approvalStatus: 'Approved' },{ date: new Date(now.getTime()-5*86400000), projectId: tuas.id, category: 'Transport', description: 'Lorry rental', amount: 2200, paidBy: 'Raj Kumar', approvalStatus: 'Approved' },{ date: new Date(now.getTime()-13*86400000), projectId: woodlands.id, category: 'Labour', description: 'Overtime', amount: 6800, paidBy: 'Priya Menon', approvalStatus: 'Pending' }]) await workingDb.expense.create({ data: { ...e, tenantId: demoTenant.id } })

      await workingDb.safetyChecklist.create({ data: { date: now, projectId: tuas.id, checklistType: 'PPE', helmet: true, safetyShoes: true, gloves: true, harness: false, workAreaClean: true, equipmentCondition: true, electricalSafety: true, conductedById: safety.id, conductedByName: safety.name, location: 'Tuas', compliancePct: 86, remarks: 'OK', tenantId: demoTenant.id } })
      await workingDb.safetyIncident.create({ data: { date: new Date(now.getTime()-3*86400000), projectId: tuas.id, type: 'NearMiss', severity: 'Low', description: 'Worker nearly slipped.', location: 'Tuas', reportedById: safety.id, reportedByName: safety.name, status: 'Closed', actionTaken: 'Anti-slip matting.', tenantId: demoTenant.id } })
      await workingDb.document.create({ data: { name: 'Tuas Rooftop Drawing.pdf', category: 'Drawings', projectId: tuas.id, fileUrl: '/documents/tuas-drawing', fileType: 'pdf', fileSize: 2400000, uploadedById: engineer.id, uploadedByName: 'Sarah Wong', tenantId: demoTenant.id } })
      await workingDb.notification.create({ data: { type: 'LowStock', title: 'Low Stock: DC Cables', message: '42 rolls below 60.', severity: 'critical', tenantId: demoTenant.id } })
      await workingDb.notification.create({ data: { type: 'OverdueTask', title: 'Overdue: Mounting rail resupply', message: '3 days overdue.', projectId: woodlands.id, severity: 'warning', tenantId: demoTenant.id } })

      await workingDb.accessCode.create({ data: { code: 'AYK-DEMO-VIEW', label: 'Demo viewing code', plan: 'demo', maxUses: 100, isActive: true } })
      await workingDb.accessCode.create({ data: { code: 'AYK-NEW-ENT1', label: 'New enterprise (1 seat)', plan: 'enterprise', maxUses: 1, isActive: true } })
      await workingDb.accessCode.create({ data: { code: 'AYK-NEW-ENT5', label: 'New enterprise (5 seats)', plan: 'enterprise', maxUses: 5, isActive: true } })

      log.push('✓ All demo data created')
      log.push('🎉 Database setup complete!')

      return NextResponse.json({
        success: true,
        message: 'Database set up and seeded successfully!',
        log,
        connection: workingLabel,
        credentials: {
          masterAdmin: 'master@ayk.com.sg / master123',
          demoAdmin: 'admin@ayk.com.sg / admin123',
          accessCodes: ['AYK-DEMO-VIEW', 'AYK-NEW-ENT1', 'AYK-NEW-ENT5'],
        },
        duration: `${Date.now() - startTime}ms`
      })
    } finally {
      await workingDb.$disconnect()
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Setup failed', stack: e.stack?.slice(0, 500) }, { status: 500 })
  }
}
