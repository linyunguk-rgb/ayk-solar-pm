import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

// GET daily progress entries with optional filters
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')
  const limit = Number(searchParams.get('limit') || 50)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const where: any = {}
  if (projectId && projectId !== 'all') where.projectId = projectId
  if (from || to) {
    where.date = {}
    if (from) where.date.gte = new Date(from)
    if (to) where.date.lte = new Date(to)
  }

  const entries = await db.dailyProgress.findMany({
    where,
    include: { project: true, submittedBy: true },
    orderBy: { date: 'desc' },
    take: limit,
  })
  return NextResponse.json({ entries })
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { projectId, date, installedPanels, totalInstalled, manHours, workers, materialsUsed, equipmentUsed, workCompleted, workPending, siteStatus, remarks, photoUrls, gpsLocation } = body

  if (!projectId || !date) {
    return NextResponse.json({ error: 'Project and date required' }, { status: 400 })
  }

  const entry = await db.dailyProgress.create({
    data: {
      projectId, date: new Date(date),
      installedPanels: Number(installedPanels) || 0,
      totalInstalled: Number(totalInstalled) || 0,
      manHours: Number(manHours) || 0,
      workers: Number(workers) || 0,
      materialsUsed: materialsUsed ? JSON.stringify(materialsUsed) : null,
      equipmentUsed: equipmentUsed ? JSON.stringify(equipmentUsed) : null,
      workCompleted: workCompleted || null,
      workPending: workPending || null,
      siteStatus: siteStatus || 'Normal',
      remarks: remarks || null,
      photoUrls: photoUrls ? JSON.stringify(photoUrls) : null,
      gpsLocation: gpsLocation || null,
      submittedById: user.id,
    },
    include: { project: true, submittedBy: true },
  })

  // Update project installedPanels if totalInstalled provided
  if (totalInstalled !== undefined) {
    await db.project.update({ where: { id: projectId }, data: { installedPanels: Number(totalInstalled) } })
  }

  // Update installation stage actualPct if there's an Installation stage
  const project = await db.project.findUnique({ where: { id: projectId } })
  if (project && project.totalPanels > 0) {
    const installPct = Math.min(100, Math.round((Number(totalInstalled) / project.totalPanels) * 1000) / 10)
    const installStage = await db.projectStage.findFirst({ where: { projectId, name: 'Installation' } })
    if (installStage) {
      await db.projectStage.update({ where: { id: installStage.id }, data: { actualPct: installPct, status: installPct >= 100 ? 'Completed' : 'InProgress' } })
    }
  }

  return NextResponse.json({ entry })
}
