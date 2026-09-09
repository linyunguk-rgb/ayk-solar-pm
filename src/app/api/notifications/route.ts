import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const notifications = await db.notification.findMany({
    include: { project: true },
    orderBy: { createdAt: 'desc' },
    take: 30,
  })
  return NextResponse.json({ notifications })
}
