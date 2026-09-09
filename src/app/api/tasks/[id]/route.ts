import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const data: any = {}
  for (const k of ['title', 'description', 'projectId', 'assignedToId', 'assignedToName', 'team', 'priority', 'status', 'progress', 'remarks']) {
    if (body[k] !== undefined) data[k] = body[k]
  }
  if (body.startDate) data.startDate = new Date(body.startDate)
  if (body.dueDate) data.dueDate = new Date(body.dueDate)
  if (body.status === 'Completed') data.completedAt = new Date()

  const updated = await db.task.update({ where: { id }, data, include: { project: true, assignedTo: true } })
  return NextResponse.json({ task: updated })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.task.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
