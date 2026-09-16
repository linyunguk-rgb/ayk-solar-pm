import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, generateAccessCode } from '@/lib/auth'

export async function GET() {
  const user = await getSessionUser()
  if (!user || !user.isMasterAdmin) return NextResponse.json({ error: 'Master admin only' }, { status: 403 })
  const codes = await db.accessCode.findMany({ include: { tenant: true }, orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ codes })
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user || !user.isMasterAdmin) return NextResponse.json({ error: 'Master admin only' }, { status: 403 })
  const body = await req.json()
  const code = await db.accessCode.create({ data: { code: generateAccessCode(), label: body.label || null, plan: body.plan || 'enterprise', maxUses: Number(body.maxUses) || 1, usedCount: 0, isActive: true, tenantId: body.tenantId || null } })
  return NextResponse.json({ code })
}
