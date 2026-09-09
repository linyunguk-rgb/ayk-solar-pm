import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const data: any = {}
  for (const k of ['name', 'employeeId', 'role', 'team', 'projectId', 'phone', 'skillLevel', 'status']) {
    if (body[k] !== undefined) data[k] = body[k]
  }
  const updated = await db.worker.update({ where: { id }, data, include: { project: true } })
  return NextResponse.json({ worker: updated })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.worker.delete({ where: { id } })
  return NextResponse.json({ success: true })
}

// Check-in / check-out
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { action, date } = body // action: 'checkin' | 'checkout'
  const today = date ? new Date(date) : new Date()
  today.setHours(0,0,0,0)
  const next = new Date(today); next.setDate(next.getDate() + 1)

  let record = await db.attendance.findFirst({ where: { workerId: id, date: { gte: today, lt: next } } })
  if (!record) {
    record = await db.attendance.create({ data: { workerId: id, date: today, status: 'Present' } })
  }
  if (action === 'checkin') {
    record = await db.attendance.update({ where: { id: record.id }, data: { checkIn: new Date(), status: 'Present' } })
  } else if (action === 'checkout') {
    const checkOut = new Date()
    const checkIn = record.checkIn ? new Date(record.checkIn) : null
    const hours = checkIn ? Math.round((checkOut.getTime() - checkIn.getTime()) / (1000*60*60) * 10) / 10 : 0
    record = await db.attendance.update({ where: { id: record.id }, data: { checkOut, workingHours: hours, overtime: Math.max(0, Math.round((hours - 8) * 10) / 10) } })
  }
  return NextResponse.json({ attendance: record })
}
