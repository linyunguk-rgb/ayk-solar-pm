import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, hashPassword } from '@/lib/auth'

// PUT — update a user (admin can update anyone in their tenant; user can update self)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()

  // Get the target user
  const target = await db.user.findUnique({ where: { id }, select: { id: true, tenantId: true, isMasterAdmin: true } })
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Permission: admin can update users in their tenant; user can update self; master admin can update anyone
  const canEdit = user.isMasterAdmin || user.id === id || (user.role === 'Admin' && target.tenantId === user.tenantId)
  if (!canEdit) return NextResponse.json({ error: 'Permission denied' }, { status: 403 })

  const data: any = {}
  for (const k of ['name', 'role', 'phone', 'isActive']) {
    if (body[k] !== undefined) data[k] = body[k]
  }
  if (body.password) {
    if (body.password.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    data.password = hashPassword(body.password)
  }

  const updated = await db.user.update({
    where: { id },
    data,
    select: { id: true, email: true, name: true, role: true, phone: true, isActive: true, createdAt: true },
  })
  return NextResponse.json({ user: updated })
}

// DELETE — deactivate a user (admin only, same tenant)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const target = await db.user.findUnique({ where: { id }, select: { id: true, tenantId: true, isMasterAdmin: true } })
  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Can't delete yourself or master admin
  if (user.id === id) return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
  if (target.isMasterAdmin) return NextResponse.json({ error: 'Cannot delete master admin' }, { status: 400 })

  // Permission check
  const canDelete = user.isMasterAdmin || (user.role === 'Admin' && target.tenantId === user.tenantId)
  if (!canDelete) return NextResponse.json({ error: 'Permission denied' }, { status: 403 })

  // Soft delete — deactivate instead of hard delete
  await db.user.update({ where: { id }, data: { isActive: false } })
  return NextResponse.json({ success: true })
}
