import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const project = await db.project.findUnique({ where: { id }, select: { tenantId: true } })
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!user.isMasterAdmin && project.tenantId !== user.tenantId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const stages = await db.projectStage.findMany({ where: { projectId: id }, orderBy: { order: 'asc' } })
  return NextResponse.json({ stages })
}

// Update a stage (or batch update stages)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const project = await db.project.findUnique({ where: { id }, select: { tenantId: true } })
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!user.isMasterAdmin && project.tenantId !== user.tenantId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const body = await req.json()
  // body.stages = [{ id, name, plannedPct, actualPct, weight, status, startDate, endDate }]
  if (Array.isArray(body.stages)) {
    for (const s of body.stages) {
      await db.projectStage.update({
        where: { id: s.id },
        data: {
          name: s.name,
          plannedPct: Number(s.plannedPct) || 0,
          actualPct: Number(s.actualPct) || 0,
          weight: Number(s.weight) || 0,
          status: s.status,
          startDate: s.startDate ? new Date(s.startDate) : null,
          endDate: s.endDate ? new Date(s.endDate) : null,
        },
      })
    }
    const refreshed = await db.projectStage.findMany({ where: { projectId: id }, orderBy: { order: 'asc' } })
    return NextResponse.json({ stages: refreshed })
  }
  // single update
  if (body.id) {
    const updated = await db.projectStage.update({
      where: { id: body.id },
      data: {
        name: body.name,
        plannedPct: Number(body.plannedPct) || 0,
        actualPct: Number(body.actualPct) || 0,
        weight: Number(body.weight) || 0,
        status: body.status,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
      },
    })
    return NextResponse.json({ stage: updated })
  }
  return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
}
