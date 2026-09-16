import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const existing = await db.safetyIncident.findUnique({ where: { id }, select: { tenantId: true } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!user.isMasterAdmin && existing.tenantId !== user.tenantId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const body = await req.json()
  const data: any = {}
  for (const k of ['type', 'severity', 'description', 'location', 'status', 'actionTaken', 'projectId']) {
    if (body[k] !== undefined) data[k] = body[k]
  }
  if (body.date) data.date = new Date(body.date)
  const updated = await db.safetyIncident.update({ where: { id }, data, include: { project: true } })
  return NextResponse.json({ incident: updated })
}
