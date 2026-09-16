import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function GET() {
  const user = await getSessionUser()
  if (!user || !user.isMasterAdmin) return NextResponse.json({ error: 'Master admin only' }, { status: 403 })
  const tenants = await db.tenant.findMany({ include: { _count: { select: { users: true, projects: true } } }, orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ tenants })
}
