import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, tenantWhere } from '@/lib/auth'

export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tw = await tenantWhere()
  const users = await db.user.findMany({
    where: tw,
    select: { id: true, email: true, name: true, role: true, phone: true, avatar: true, isActive: true, createdAt: true, isTenantAdmin: true },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json({ users })
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // Only tenant admins / admins / master admin can create users
  if (!user.isMasterAdmin && !user.isTenantAdmin && user.role !== 'Admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }
  const body = await req.json()
  const { email, name, password, role, phone } = body
  if (!email || !name || !password || !role) {
    return NextResponse.json({ error: 'Email, name, password and role required' }, { status: 400 })
  }
  const exists = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } })
  if (exists) return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
  const created = await db.user.create({
    data: {
      email: email.toLowerCase().trim(), name, password: `demo$${password}`,
      role, phone: phone || null,
      tenantId: user.tenantId,
      setupComplete: true,
    },
    select: { id: true, email: true, name: true, role: true, phone: true, isActive: true, createdAt: true, isTenantAdmin: true },
  })
  return NextResponse.json({ user: created })
}
