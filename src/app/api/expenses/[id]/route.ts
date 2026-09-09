import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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
  const { id } = await params
  await db.expense.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
