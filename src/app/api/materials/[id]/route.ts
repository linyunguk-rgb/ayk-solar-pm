import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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
  const { id } = await params
  await db.material.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
