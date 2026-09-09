import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const users = await db.user.findMany({
    where: { isActive: true },
    select: { id: true, email: true, name: true, role: true, phone: true, avatar: true },
    orderBy: { name: 'asc' },
  })
  // Demo credentials hint (email -> password). Passwords follow pattern based on role.
  const demo = users.map(u => {
    const pwMap: Record<string, string> = {
      Admin: 'admin123', ProjectManager: 'pm123', SiteSupervisor: 'super123',
      SafetyOfficer: 'safety123', Engineer: 'eng123', StoreOfficer: 'store123',
    }
    return { ...u, password: pwMap[u.role] || 'demo' }
  })
  return NextResponse.json({ users: demo })
}
