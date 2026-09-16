import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const existing = await db.material.findUnique({ where: { id }, select: { tenantId: true } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!user.isMasterAdmin && existing.tenantId !== user.tenantId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const body = await req.json()
  const data: any = {}
  for (const k of ['name', 'category', 'unit', 'minStockLevel', 'unitPrice', 'supplier']) {
    if (body[k] !== undefined) data[k] = body[k]
  }
  // stockQty handled through transactions, but allow direct edit
  if (body.stockQty !== undefined) data.stockQty = Number(body.stockQty)
  const updated = await db.material.update({ where: { id }, data })
  return NextResponse.json({ material: updated })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const existing = await db.material.findUnique({ where: { id }, select: { tenantId: true } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!user.isMasterAdmin && existing.tenantId !== user.tenantId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  await db.material.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
