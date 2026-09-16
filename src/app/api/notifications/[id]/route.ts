import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, tenantWhere } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const existing = await db.notification.findUnique({ where: { id }, select: { tenantId: true } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!user.isMasterAdmin && existing.tenantId !== user.tenantId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const body = await req.json()
  const updated = await db.notification.update({
    where: { id },
    data: { isRead: body.isRead ?? true },
  })
  return NextResponse.json({ notification: updated })
}

// Mark all read
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tw = await tenantWhere()
  const { id } = await params
  if (id === 'all') {
    await db.notification.updateMany({ where: tw, data: { isRead: true } })
    return NextResponse.json({ success: true })
  }
  return NextResponse.json({ error: 'Use PUT for single' }, { status: 400 })
}
