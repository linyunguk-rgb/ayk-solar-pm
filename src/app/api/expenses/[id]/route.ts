import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const existing = await db.expense.findUnique({ where: { id }, select: { tenantId: true } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!user.isMasterAdmin && existing.tenantId !== user.tenantId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const body = await req.json()
  const data: any = {}
  for (const k of ['date', 'projectId', 'category', 'description', 'amount', 'paidBy', 'approvalStatus', 'receiptUrl']) {
    if (body[k] !== undefined) {
      if (k === 'date' && body[k]) data.date = new Date(body[k])
      else if (k === 'amount') data.amount = Number(body[k])
      else data[k] = body[k]
    }
  }
  const updated = await db.expense.update({ where: { id }, data, include: { project: true } })
  return NextResponse.json({ expense: updated })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const existing = await db.expense.findUnique({ where: { id }, select: { tenantId: true } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!user.isMasterAdmin && existing.tenantId !== user.tenantId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  await db.expense.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
