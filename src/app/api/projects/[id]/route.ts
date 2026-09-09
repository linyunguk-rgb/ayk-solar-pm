import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { calcOverallProgress, calcPlannedProgress } from '@/lib/constants'
import { getSessionUser } from '@/lib/auth'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const project = await db.project.findUnique({
    where: { id },
    include: {
      stages: { orderBy: { order: 'asc' } },
      manager: true,
      dailyProgress: { orderBy: { date: 'desc' }, take: 60, include: { submittedBy: true } },
      tasks: { include: { assignedTo: true, project: true } },
      expenses: { orderBy: { date: 'desc' }, take: 50 },
      documents: { orderBy: { createdAt: 'desc' } },
      notifications: { orderBy: { createdAt: 'desc' }, take: 10 },
      materialTransactions: { include: { material: true }, orderBy: { date: 'desc' }, take: 30 },
    },
  })
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // build S-curve data from daily progress
  const sCurve = project.dailyProgress.slice().reverse().map(d => ({
    date: new Date(d.date).toISOString().slice(0, 10),
    actual: d.totalInstalled,
    planned: Math.round(project.totalPanels * Math.min(1, Math.max(0, (new Date(d.date).getTime() - project.startDate.getTime()) / (project.endDate.getTime() - project.startDate.getTime())))),
  }))

  return NextResponse.json({
    project: {
      ...project,
      overallProgress: calcOverallProgress(project.stages),
      plannedProgress: calcPlannedProgress(project.stages),
      installationPct: project.totalPanels > 0 ? Math.round((project.installedPanels / project.totalPanels) * 1000) / 10 : 0,
      sCurve,
    },
  })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const { name, location, client, totalPanels, installedPanels, capacity, status, startDate, endDate, budget, actualCost, managerId, description } = body

  const data: any = {}
  if (name !== undefined) data.name = name
  if (location !== undefined) data.location = location
  if (client !== undefined) data.client = client
  if (totalPanels !== undefined) data.totalPanels = Number(totalPanels)
  if (installedPanels !== undefined) data.installedPanels = Number(installedPanels)
  if (capacity !== undefined) data.capacity = capacity
  if (status !== undefined) data.status = status
  if (startDate !== undefined) data.startDate = new Date(startDate)
  if (endDate !== undefined) data.endDate = new Date(endDate)
  if (budget !== undefined) data.budget = Number(budget)
  if (actualCost !== undefined) data.actualCost = Number(actualCost)
  if (managerId !== undefined) data.managerId = managerId || null
  if (description !== undefined) data.description = description

  const updated = await db.project.update({ where: { id }, data, include: { stages: true, manager: true } })
  return NextResponse.json({ project: updated })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user || user.role !== 'Admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  const { id } = await params
  await db.project.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
