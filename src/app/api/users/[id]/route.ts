import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const data: any = {}
  for (const k of ['name', 'role', 'phone', 'isActive']) {
    if (body[k] !== undefined) data[k] = body[k]
  }
  if (body.password) data.password = `demo$${body.password}`
  const updated = await db.user.update({
    where: { id }, data,
    select: { id: true, email: true, name: true, role: true, phone: true, isActive: true, createdAt: true },
  })
  return NextResponse.json({ user: updated })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.user.update({ where: { id }, data: { isActive: false } })
  return NextResponse.json({ success: true })
}
