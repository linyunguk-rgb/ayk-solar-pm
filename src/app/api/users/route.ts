import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const users = await db.user.findMany({
    select: { id: true, email: true, name: true, role: true, phone: true, avatar: true, isActive: true, createdAt: true },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json({ users })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { email, name, password, role, phone } = body
  if (!email || !name || !password || !role) {
    return NextResponse.json({ error: 'Email, name, password and role required' }, { status: 400 })
  }
  const exists = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } })
  if (exists) return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
  const user = await db.user.create({
    data: {
      email: email.toLowerCase().trim(), name, password: `demo$${password}`,
      role, phone: phone || null,
    },
    select: { id: true, email: true, name: true, role: true, phone: true, isActive: true, createdAt: true },
  })
  return NextResponse.json({ user })
}
