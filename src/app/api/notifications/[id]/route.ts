import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const updated = await db.notification.update({
    where: { id },
    data: { isRead: body.isRead ?? true },
  })
  return NextResponse.json({ notification: updated })
}

// Mark all read
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (id === 'all') {
    await db.notification.updateMany({ data: { isRead: true } })
    return NextResponse.json({ success: true })
  }
  return NextResponse.json({ error: 'Use PUT for single' }, { status: 400 })
}
