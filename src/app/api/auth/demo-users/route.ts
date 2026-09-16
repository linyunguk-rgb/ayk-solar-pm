import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  let demoTenant = await db.tenant.findFirst({ where: { plan: 'demo' } })
  if (!demoTenant) {
    demoTenant = await db.tenant.create({ data: { name: 'AYK Demo', plan: 'demo' } })
  }
  const users = await db.user.findMany({
    where: { isActive: true, tenantId: demoTenant.id },
    select: { id: true, email: true, name: true, role: true, phone: true, avatar: true },
    orderBy: { name: 'asc' },
  })
  const pwMap: Record<string, string> = {
    Admin: 'admin123', ProjectManager: 'pm123', SiteSupervisor: 'super123',
    SafetyOfficer: 'safety123', Engineer: 'eng123', StoreOfficer: 'store123',
  }
  const demo = users.map(u => ({ ...u, password: pwMap[u.role] || 'demo' }))
  return NextResponse.json({ users: demo, tenant: { id: demoTenant.id, name: demoTenant.name } })
}
