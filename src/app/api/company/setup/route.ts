import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { SESSION_COOKIE } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { code, companyName, address, uen, adminName, adminEmail, adminPassword, phone, logo } = body
    if (!code || !companyName || !adminName || !adminEmail || !adminPassword) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    const accessCode = await db.accessCode.findUnique({ where: { code: code.trim().toUpperCase() } })
    if (!accessCode || !accessCode.isActive) return NextResponse.json({ error: 'Invalid or inactive access code' }, { status: 403 })
    if (accessCode.usedCount >= accessCode.maxUses) return NextResponse.json({ error: 'Access code has reached usage limit' }, { status: 403 })
    if (accessCode.tenantId) return NextResponse.json({ error: 'This code is for joining an existing company, not creating a new one' }, { status: 400 })
    const existing = await db.user.findUnique({ where: { email: adminEmail.toLowerCase().trim() } })
    if (existing) return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
    const tenant = await db.tenant.create({ data: { name: companyName, address: address || null, uen: uen || null, plan: 'enterprise', isActive: true, logo: logo || null } })
    const user = await db.user.create({ data: { email: adminEmail.toLowerCase().trim(), name: adminName, password: `demo$${adminPassword}`, role: 'Admin', phone: phone || null, avatar: logo || null, isTenantAdmin: true, isMasterAdmin: false, setupComplete: true, tenantId: tenant.id } })
    await db.accessCode.update({ where: { id: accessCode.id }, data: { usedCount: { increment: 1 }, tenantId: tenant.id } })
    const res = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone, tenantId: user.tenantId, isTenantAdmin: user.isTenantAdmin, isMasterAdmin: user.isMasterAdmin }, tenant: { id: tenant.id, name: tenant.name, plan: tenant.plan } })
    res.cookies.set(SESSION_COOKIE, user.id, { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/' })
    return res
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Setup failed' }, { status: 500 })
  }
}
