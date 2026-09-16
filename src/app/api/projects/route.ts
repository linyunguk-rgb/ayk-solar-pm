import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { PROJECT_STAGES, calcOverallProgress, calcPlannedProgress } from '@/lib/constants'
import { getSessionUser, tenantWhere } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tw = await tenantWhere()

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const managerId = searchParams.get('managerId')

  const where: any = { ...tw }
  if (status && status !== 'all') where.status = status
  if (managerId) where.managerId = managerId

  const projects = await db.project.findMany({
    where,
    include: { stages: { orderBy: { order: 'asc' } }, manager: true, _count: { select: { tasks: true, dailyProgress: true, documents: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const result = projects.map(p => ({
    ...p,
    overallProgress: calcOverallProgress(p.stages),
    plannedProgress: calcPlannedProgress(p.stages),
    installationPct: p.totalPanels > 0 ? Math.round((p.installedPanels / p.totalPanels) * 1000) / 10 : 0,
  }))

  return NextResponse.json({ projects: result })
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tw = await tenantWhere()
  const body = await req.json()
  const { name, location, client, totalPanels, capacity, status, startDate, endDate, budget, managerId, description, code } = body

  if (!name || !location || !startDate || !endDate) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // generate code if not provided
  let projectCode = code
  if (!projectCode) {
    const count = await db.project.count({ where: tw })
    projectCode = `AYK-NEW-${String(count + 1).padStart(3, '0')}`
  }

  const project = await db.project.create({
    data: {
      code: projectCode, name, location, client: client || null,
      totalPanels: Number(totalPanels) || 0, capacity: capacity || null,
      status: status || 'Active',
      startDate: new Date(startDate), endDate: new Date(endDate),
      budget: Number(budget) || 0, managerId: managerId || null,
      description: description || null,
      tenantId: user.tenantId,
    },
    include: { stages: true, manager: true },
  })

  // create default stages
  const stageWeights = [5, 15, 15, 40, 15, 10]
  const totalDays = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000*60*60*24))
  const segDays = Math.max(1, Math.floor(totalDays / 6))
  for (let i = 0; i < PROJECT_STAGES.length; i++) {
    const stStart = new Date(new Date(startDate).getTime() + segDays * i * 86400000)
    const stEnd = new Date(stStart.getTime() + segDays * 86400000)
    await db.projectStage.create({
      data: {
        projectId: project.id, name: PROJECT_STAGES[i], order: i,
        plannedPct: 0, actualPct: 0, weight: stageWeights[i], status: 'NotStarted',
        startDate: stStart, endDate: stEnd,
      },
    })
  }

  const refreshed = await db.project.findUnique({ where: { id: project.id }, include: { stages: { orderBy: { order: 'asc' } }, manager: true } })
  return NextResponse.json({ project: refreshed })
}
