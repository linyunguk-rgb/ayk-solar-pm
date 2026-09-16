import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { SESSION_COOKIE, verifyPassword } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password, accessCode } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }
    const user = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } })
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }
    if (!verifyPassword(password, user.password)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }
    if (accessCode) {
      const code = await db.accessCode.findUnique({ where: { code: accessCode.trim().toUpperCase() } })
      if (!code || !code.isActive) {
        return NextResponse.json({ error: 'Invalid access code' }, { status: 403 })
      }
      if (code.usedCount >= code.maxUses) {
        return NextResponse.json({ error: 'Access code usage limit reached' }, { status: 403 })
      }
      if (code.tenantId && code.tenantId !== user.tenantId) {
        return NextResponse.json({ error: 'This access code does not match your company' }, { status: 403 })
      }
      await db.accessCode.update({ where: { id: code.id }, data: { usedCount: { increment: 1 } } })
    }
    const res = NextResponse.json({
      id: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone, avatar: user.avatar,
      tenantId: user.tenantId, isTenantAdmin: user.isTenantAdmin, isMasterAdmin: user.isMasterAdmin,
      setupComplete: user.setupComplete,
    })
    res.cookies.set(SESSION_COOKIE, user.id, {
      httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/',
    })
    return res
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Login failed' }, { status: 500 })
  }
}

export async function DELETE() {
  const res = NextResponse.json({ success: true })
  res.cookies.delete(SESSION_COOKIE)
  return res
}
