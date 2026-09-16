// AYK PTE LTD - Auth helper with multi-tenant support
import { cookies } from 'next/headers'
import { db } from './db'

export const SESSION_COOKIE = 'ayk_session'

export interface SessionUser {
  id: string
  email: string
  name: string
  role: string
  phone?: string | null
  avatar?: string | null
  tenantId?: string | null
  isTenantAdmin?: boolean
  isMasterAdmin?: boolean
  setupComplete?: boolean
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const store = await cookies()
    const cookie = store.get(SESSION_COOKIE)
    if (!cookie?.value) return null
    const userId = cookie.value
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, name: true, role: true, phone: true, avatar: true,
        tenantId: true, isTenantAdmin: true, isMasterAdmin: true, setupComplete: true,
      },
    })
    if (!user) return null
    return user
  } catch {
    return null
  }
}

export async function getTenantFilter(): Promise<string | null> {
  const user = await getSessionUser()
  if (!user) return null
  if (user.isMasterAdmin) return null
  return user.tenantId || null
}

export async function tenantWhere(): Promise<Record<string, any>> {
  const tid = await getTenantFilter()
  return tid ? { tenantId: tid } : {}
}

export function verifyPassword(input: string, stored: string): boolean {
  return stored === `demo$${input}` || stored === input
}

export function generateAccessCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const part = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `AYK-${part()}-${part()}`
}
