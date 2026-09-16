import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json()
    if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 })
    const accessCode = await db.accessCode.findUnique({ where: { code: code.trim().toUpperCase() } })
    if (!accessCode) return NextResponse.json({ valid: false, error: 'Invalid access code' }, { status: 404 })
    if (!accessCode.isActive) return NextResponse.json({ valid: false, error: 'This access code has been deactivated' }, { status: 403 })
    if (accessCode.usedCount >= accessCode.maxUses) return NextResponse.json({ valid: false, error: 'This access code has reached its usage limit' }, { status: 403 })
    return NextResponse.json({ valid: true, plan: accessCode.plan, label: accessCode.label, hasTenant: !!accessCode.tenantId, tenantId: accessCode.tenantId, remainingUses: accessCode.maxUses - accessCode.usedCount })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Validation failed' }, { status: 500 })
  }
}
