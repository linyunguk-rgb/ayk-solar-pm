import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')
  const status = searchParams.get('status')
  const assignedToId = searchParams.get('assignedToId')

  const where: any = {}
  if (projectId && projectId !== 'all') where.projectId = projectId
  if (status && status !== 'all') where.status = status
  if (assignedToId) where.assignedToId = assignedToId

  const tasks = await db.task.findMany({
    where,
    include: { project: true, assignedTo: true },
    orderBy: { createdAt: 'desc' },
  })

  // mark overdue
  const now = new Date()
  const result = tasks.map(t => ({
    ...t,
    isOverdue: t.status !== 'Completed' && new Date(t.dueDate) < now,
  }))

  return NextResponse.json({ tasks: result })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { title, description, projectId, assignedToId, assignedToName, team, priority, status, progress, startDate, dueDate, remarks } = body

  if (!title || !dueDate) {
    return NextResponse.json({ error: 'Title and due date required' }, { status: 400 })
  }

  const task = await db.task.create({
    data: {
      title, description: description || null,
      projectId: projectId || null,
      assignedToId: assignedToId || null,
      assignedToName: assignedToName || null,
      team: team || null,
      priority: priority || 'Medium',
      status: status || 'Todo',
      progress: Number(progress) || 0,
      startDate: new Date(startDate || Date.now()),
      dueDate: new Date(dueDate),
      remarks: remarks || null,
    },
    include: { project: true, assignedTo: true },
  })
  return NextResponse.json({ task })
}
