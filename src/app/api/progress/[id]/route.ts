import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const entry = await db.dailyProgress.findUnique({ where: { id }, select: { tenantId: true } })
  if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!user.isMasterAdmin && entry.tenantId !== user.tenantId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  await db.dailyProgress.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
