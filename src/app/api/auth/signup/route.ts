import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { SESSION_COOKIE, hashPassword, verifyPassword } from '@/lib/auth'

// Employee signup — a new employee joins an existing company using an access code.
// Body: { code, name, email, password, phone, role }
export async function POST(req: NextRequest) {
  try {
    const { code, name, email, password, phone, role } = await req.json()
    if (!code || !name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    // Validate the access code
    const accessCode = await db.accessCode.findUnique({ where: { code: code.trim().toUpperCase() } })
    if (!accessCode || !accessCode.isActive) {
      return NextResponse.json({ error: 'Invalid or inactive access code' }, { status: 403 })
    }
    if (accessCode.usedCount >= accessCode.maxUses) {
      return NextResponse.json({ error: 'Access code has reached usage limit' }, { status: 403 })
    }
    if (!accessCode.tenantId) {
      return NextResponse.json({ error: 'This code is for creating a new company, not joining one' }, { status: 400 })
    }

    // Check email not already taken
    const existing = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } })
    if (existing) {
      return NextResponse.json({ error: 'Email already registered. Please log in instead.' }, { status: 400 })
    }

    // Create the employee user in the tenant
    const user = await db.user.create({
      data: {
        email: email.toLowerCase().trim(),
        name,
        password: hashPassword(password),
        role: role || 'Worker',
        phone: phone || null,
        isTenantAdmin: false,
        isMasterAdmin: false,
        setupComplete: true,
        tenantId: accessCode.tenantId,
      },
    })

    // Increment code usage
    await db.accessCode.update({ where: { id: accessCode.id }, data: { usedCount: { increment: 1 } } })

    const res = NextResponse.json({
      id: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone,
      tenantId: user.tenantId, isTenantAdmin: user.isTenantAdmin, isMasterAdmin: user.isMasterAdmin,
      setupComplete: user.setupComplete,
    })
    res.cookies.set(SESSION_COOKIE, user.id, { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/' })
    return res
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Signup failed' }, { status: 500 })
  }
}
