import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, tenantWhere } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tw = await tenantWhere()
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')
  const type = searchParams.get('type')
  const status = searchParams.get('status')

  const where: any = { ...tw }
  if (projectId && projectId !== 'all') where.projectId = projectId
  if (type && type !== 'all') where.type = type
  if (status && status !== 'all') where.status = status

  const incidents = await db.safetyIncident.findMany({
    where,
    include: { project: true, reportedBy: true },
    orderBy: { date: 'desc' },
  })
  return NextResponse.json({ incidents })
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { date, projectId, type, severity, description, location, status, actionTaken } = body
  if (!type || !description) {
    return NextResponse.json({ error: 'Type and description required' }, { status: 400 })
  }
  if (projectId) {
    const project = await db.project.findUnique({ where: { id: projectId }, select: { tenantId: true } })
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    if (!user.isMasterAdmin && project.tenantId !== user.tenantId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
  }

  const incident = await db.safetyIncident.create({
    data: {
      date: date ? new Date(date) : new Date(),
      projectId: projectId || null, tenantId: user.tenantId,
      type, severity: severity || 'Low',
      description, location: location || null,
      reportedById: user.id, reportedByName: user.name,
      status: status || 'Open', actionTaken: actionTaken || null,
    },
    include: { project: true },
  })

  // Create notification for new incident (tenant-scoped)
  await db.notification.create({
    data: {
      type: 'SafetyIncident',
      title: `New ${type}: ${severity}`,
      message: description.slice(0, 120),
      projectId: projectId || null,
      severity: severity === 'Critical' ? 'critical' : 'warning',
      tenantId: user.tenantId,
    },
  })

  return NextResponse.json({ incident })
}
