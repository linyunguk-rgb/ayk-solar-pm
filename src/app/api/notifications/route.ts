import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, tenantWhere } from '@/lib/auth'

export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tw = await tenantWhere()
  const notifications = await db.notification.findMany({
    where: tw,
    include: { project: true },
    orderBy: { createdAt: 'desc' },
    take: 30,
  })
  return NextResponse.json({ notifications })
}
