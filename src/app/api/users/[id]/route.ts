import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const existing = await db.user.findUnique({ where: { id }, select: { tenantId: true, isMasterAdmin: true } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  // Master admin can edit anyone; tenant admin / admin can edit only their own tenant's users
  if (!user.isMasterAdmin && existing.tenantId !== user.tenantId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const body = await req.json()
  const data: any = {}
  for (const k of ['name', 'role', 'phone', 'isActive']) {
    if (body[k] !== undefined) data[k] = body[k]
  }
  if (body.password) data.password = `demo$${body.password}`
  const updated = await db.user.update({
    where: { id }, data,
    select: { id: true, email: true, name: true, role: true, phone: true, isActive: true, createdAt: true, isTenantAdmin: true },
  })
  return NextResponse.json({ user: updated })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const existing = await db.user.findUnique({ where: { id }, select: { tenantId: true, isMasterAdmin: true } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!user.isMasterAdmin && existing.tenantId !== user.tenantId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  // Never hard-delete master admin
  if (existing.isMasterAdmin) {
    return NextResponse.json({ error: 'Cannot delete master admin' }, { status: 403 })
  }
  await db.user.update({ where: { id }, data: { isActive: false } })
  return NextResponse.json({ success: true })
}
