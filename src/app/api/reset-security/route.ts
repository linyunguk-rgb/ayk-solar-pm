import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

// This route resets the master admin password and removes demo data.
// Call it after updating the code to migrate from old passwords to secure ones.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    if (body.secret !== 'ayk-reset-2025') {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 403 })
    }

    const log: string[] = []

    // 1. Update master admin password to strong hashed password
    const master = await db.user.findUnique({ where: { email: 'admin@ayk.com.sg' } })
    if (master) {
      await db.user.update({
        where: { id: master.id },
        data: { password: hashPassword('Ayk!Solar#Admin2025@Secure') },
      })
      log.push('✓ Master admin password updated to secure hash')
    } else {
      await db.user.create({
        data: {
          email: 'admin@ayk.com.sg',
          name: 'Platform Admin',
          password: hashPassword('Ayk!Solar#Admin2025@Secure'),
          role: 'Admin',
          isMasterAdmin: true,
          setupComplete: true,
        },
      })
      log.push('✓ Master admin created with secure password')
    }

    // 2. Delete demo tenant and all its data
    const demoTenant = await db.tenant.findFirst({ where: { plan: 'demo' } })
    if (demoTenant) {
      await db.tenant.delete({ where: { id: demoTenant.id } })
      log.push('✓ Demo tenant and all demo data removed')
    } else {
      log.push('• No demo tenant found')
    }

    // 3. Ensure access codes exist
    const codes = [
      { code: 'AYK-NEW-ENT1', label: 'New enterprise (1 seat)', maxUses: 1 },
      { code: 'AYK-NEW-ENT5', label: 'New enterprise (5 seats)', maxUses: 5 },
      { code: 'AYK-NEW-ENT20', label: 'New enterprise (20 seats)', maxUses: 20 },
    ]
    for (const c of codes) {
      const existing = await db.accessCode.findUnique({ where: { code: c.code } })
      if (!existing) {
        await db.accessCode.create({ data: { code: c.code, label: c.label, plan: 'enterprise', maxUses: c.maxUses, isActive: true } })
        log.push(`✓ Created access code: ${c.code}`)
      }
    }

    // 4. Delete old demo access codes
    await db.accessCode.deleteMany({ where: { code: 'AYK-DEMO-VIEW' } })
    log.push('✓ Removed demo access code (AYK-DEMO-VIEW)')

    return NextResponse.json({
      success: true,
      message: 'Security reset complete!',
      log,
      credentials: {
        masterEmail: 'admin@ayk.com.sg',
        masterPassword: 'Ayk!Solar#Admin2025@Secure',
        masterLoginUrl: '/master-access',
        accessCodes: ['AYK-NEW-ENT1', 'AYK-NEW-ENT5', 'AYK-NEW-ENT20'],
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Reset failed' }, { status: 500 })
  }
}
