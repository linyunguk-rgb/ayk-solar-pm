import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

// Reset ALL passwords to simple secure ones + ensure clean state
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    if (body.secret !== 'ayk-reset-2025') {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 403 })
    }

    const log: string[] = []
    const MASTER_PASSWORD = 'Ayk!Solar#Admin2025@Secure'
    const ADMIN_PASSWORD = 'Ayk2025Solar!'

    // 1. Update ALL master admins to new password
    const masterAdmins = await db.user.findMany({ where: { isMasterAdmin: true } })
    for (const admin of masterAdmins) {
      await db.user.update({ where: { id: admin.id }, data: { password: hashPassword(MASTER_PASSWORD) } })
      log.push(`✓ Updated master admin: ${admin.email}`)
    }

    // 2. Update the company admin (admin@ayk.com.sg) password
    const companyAdmin = await db.user.findUnique({ where: { email: 'admin@ayk.com.sg' } })
    if (companyAdmin && !companyAdmin.isMasterAdmin) {
      await db.user.update({ where: { id: companyAdmin.id }, data: { password: hashPassword(ADMIN_PASSWORD) } })
      log.push('✓ Updated company admin password')
    }

    // 3. If no company admin exists, create one
    const tenant = await db.tenant.findFirst({ where: { plan: 'enterprise' } })
    if (tenant && !companyAdmin) {
      await db.user.create({
        data: {
          email: 'admin@ayk.com.sg',
          name: 'AYK Admin',
          password: hashPassword(ADMIN_PASSWORD),
          role: 'Admin',
          isTenantAdmin: true,
          setupComplete: true,
          tenantId: tenant.id,
        },
      })
      log.push('✓ Created company admin')
    }

    // 4. If no tenant exists, create one
    if (!tenant) {
      const newTenant = await db.tenant.create({ data: { name: 'AYK PTE LTD', plan: 'enterprise', isActive: true } })
      await db.user.create({
        data: {
          email: 'admin@ayk.com.sg',
          name: 'AYK Admin',
          password: hashPassword(ADMIN_PASSWORD),
          role: 'Admin',
          isTenantAdmin: true,
          setupComplete: true,
          tenantId: newTenant.id,
        },
      })
      log.push('✓ Created company + admin')
    }

    // 5. Delete demo tenant if exists
    const demoTenant = await db.tenant.findFirst({ where: { plan: 'demo' } })
    if (demoTenant) {
      await db.tenant.delete({ where: { id: demoTenant.id } })
      log.push('✓ Removed demo data')
    }

    return NextResponse.json({
      success: true,
      message: 'Reset complete!',
      log,
      credentials: {
        companyAdmin: 'admin@ayk.com.sg / Ayk2025Solar!',
        masterAdmin: 'master@ayk.com.sg / Ayk!Solar#Admin2025@Secure',
        masterLoginUrl: '/master-access',
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Reset failed' }, { status: 500 })
  }
}
