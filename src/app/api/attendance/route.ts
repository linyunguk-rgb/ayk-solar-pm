import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const workerId = searchParams.get('workerId')

  const where: any = {}
  if (from || to) {
    where.date = {}
    if (from) where.date.gte = new Date(from)
    if (to) where.date.lte = new Date(to)
  }
  if (workerId) where.workerId = workerId

  const records = await db.attendance.findMany({
    where,
    include: { worker: { include: { project: true } } },
    orderBy: { date: 'desc' },
    take: 500,
  })
  return NextResponse.json({ records })
}
