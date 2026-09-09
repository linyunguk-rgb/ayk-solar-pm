import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const data: any = {}
  for (const k of ['type', 'severity', 'description', 'location', 'status', 'actionTaken', 'projectId']) {
    if (body[k] !== undefined) data[k] = body[k]
  }
  if (body.date) data.date = new Date(body.date)
  const updated = await db.safetyIncident.update({ where: { id }, data, include: { project: true } })
  return NextResponse.json({ incident: updated })
}
