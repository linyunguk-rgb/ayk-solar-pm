import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

// This route resets ALL master admin passwords and removes demo data.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    if (body.secret !== 'ayk-reset-2025') {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 403 })
    }

    const log: string[] = []
    const NEW_PASSWORD = 'Ayk!Solar#Admin2025@Secure'

    // 1. Find ALL master admins and update their passwords
    const masterAdmins = await db.user.findMany({ where: { isMasterAdmin: true } })
    if (masterAdmins.length > 0) {
      for (const admin of masterAdmins) {
        await db.user.update({
          where: { id: admin.id },
          data: { password: hashPassword(NEW_PASSWORD) },
        })
        log.push(`✓ Updated master admin password: ${admin.email}`)
      }
    } else {
      // No master admin exists — create one
      // Try admin@ayk.com.sg first, fall back to master@ayk.com.sg
      let email = 'admin@ayk.com.sg'
      const existing = await db.user.findUnique({ where: { email } })
      if (existing) {
        email = 'master@ayk.com.sg'
        const existing2 = await db.user.findUnique({ where: { email } })
        if (existing2) {
          // Both emails taken — update master@ayk.com.sg to be master admin
          await db.user.update({ where: { id: existing2.id }, data: { isMasterAdmin: true, password: hashPassword(NEW_PASSWORD) } })
          log.push(`✓ Set ${email} as master admin with new password`)
          return NextResponse.json({ success: true, log, credentials: getCredentials(email, NEW_PASSWORD) })
        }
      }
      await db.user.create({
        data: {
          email,
          name: 'Platform Admin',
          password: hashPassword(NEW_PASSWORD),
          role: 'Admin',
          isMasterAdmin: true,
          setupComplete: true,
        },
      })
      log.push(`✓ Created master admin: ${email}`)
    }

    // 2. Delete demo tenant and all its data
    const demoTenant = await db.tenant.findFirst({ where: { plan: 'demo' } })
    if (demoTenant) {
      await db.tenant.delete({ where: { id: demoTenant.id } })
      log.push('✓ Demo tenant and all demo data removed')
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

    const masterEmail = masterAdmins[0]?.email || 'admin@ayk.com.sg'
    return NextResponse.json({ success: true, message: 'Security reset complete!', log, credentials: getCredentials(masterEmail, NEW_PASSWORD) })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Reset failed' }, { status: 500 })
  }
}

function getCredentials(email: string, password: string) {
  return {
    masterEmail: email,
    masterPassword: password,
    masterLoginUrl: '/master-access',
    accessCodes: ['AYK-NEW-ENT1', 'AYK-NEW-ENT5', 'AYK-NEW-ENT20'],
  }
}
