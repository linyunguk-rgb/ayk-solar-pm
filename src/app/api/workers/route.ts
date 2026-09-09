import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')
  const team = searchParams.get('team')
  const status = searchParams.get('status')

  const where: any = {}
  if (projectId && projectId !== 'all') where.projectId = projectId
  if (team && team !== 'all') where.team = team
  if (status && status !== 'all') where.status = status

  const workers = await db.worker.findMany({
    where,
    include: { project: true, attendance: { orderBy: { date: 'desc' }, take: 7 } },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json({ workers })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, employeeId, role, team, projectId, phone, skillLevel, status } = body
  if (!name || !employeeId) {
    return NextResponse.json({ error: 'Name and Employee ID required' }, { status: 400 })
  }
  const worker = await db.worker.create({
    data: {
      name, employeeId, role: role || 'Solar Installer',
      team: team || null, projectId: projectId || null,
      phone: phone || null, skillLevel: skillLevel || 'Junior',
      status: status || 'Active',
    },
    include: { project: true },
  })
  return NextResponse.json({ worker })
}
