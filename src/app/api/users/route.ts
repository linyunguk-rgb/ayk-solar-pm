import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, tenantWhere, hashPassword } from '@/lib/auth'

// GET — list users in the current tenant
export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Master admin sees all users; tenant users see only their tenant
  const where = user.isMasterAdmin ? {} : { tenantId: user.tenantId }
  const users = await db.user.findMany({
    where,
    select: { id: true, email: true, name: true, role: true, phone: true, avatar: true, isActive: true, isTenantAdmin: true, createdAt: true },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json({ users })
}

// POST — add a new user (admin only)
export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Only admins can add users
  if (user.role !== 'Admin' && !user.isMasterAdmin) {
    return NextResponse.json({ error: 'Only admins can add users' }, { status: 403 })
  }

  const body = await req.json()
  const { name, email, password, role, phone } = body

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
  }

  // Check email not taken
  const existing = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } })
  if (existing) return NextResponse.json({ error: 'Email already registered' }, { status: 400 })

  // Create the user in the same tenant as the admin
  const newUser = await db.user.create({
    data: {
      email: email.toLowerCase().trim(),
      name,
      password: hashPassword(password),
      role: role || 'Worker',
      phone: phone || null,
      isTenantAdmin: false,
      isMasterAdmin: false,
      setupComplete: true,
      tenantId: user.tenantId, // Same company as the admin who creates them
    },
    select: { id: true, email: true, name: true, role: true, phone: true, isActive: true, createdAt: true },
  })

  return NextResponse.json({ user: newUser })
}
