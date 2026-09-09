import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')
  const type = searchParams.get('type')
  const status = searchParams.get('status')

  const where: any = {}
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

  const incident = await db.safetyIncident.create({
    data: {
      date: date ? new Date(date) : new Date(),
      projectId: projectId || null,
      type, severity: severity || 'Low',
      description, location: location || null,
      reportedById: user.id, reportedByName: user.name,
      status: status || 'Open', actionTaken: actionTaken || null,
    },
    include: { project: true },
  })

  // Create notification for new incident
  await db.notification.create({
    data: {
      type: 'SafetyIncident',
      title: `New ${type}: ${severity}`,
      message: description.slice(0, 120),
      projectId: projectId || null,
      severity: severity === 'Critical' ? 'critical' : 'warning',
    },
  })

  return NextResponse.json({ incident })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const data: any = {}
  for (const k of ['type', 'severity', 'description', 'location', 'status', 'actionTaken']) {
    if (body[k] !== undefined) data[k] = body[k]
  }
  if (body.date) data.date = new Date(body.date)
  const updated = await db.safetyIncident.update({ where: { id }, data, include: { project: true } })
  return NextResponse.json({ incident: updated })
}
