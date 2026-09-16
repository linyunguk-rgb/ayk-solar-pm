import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user || !user.isMasterAdmin) return NextResponse.json({ error: 'Master admin only' }, { status: 403 })
  const { id } = await params
  const body = await req.json()
  const updated = await db.accessCode.update({ where: { id }, data: { isActive: body.isActive ?? true, label: body.label, maxUses: body.maxUses ? Number(body.maxUses) : undefined } })
  return NextResponse.json({ code: updated })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user || !user.isMasterAdmin) return NextResponse.json({ error: 'Master admin only' }, { status: 403 })
  const { id } = await params
  await db.accessCode.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
