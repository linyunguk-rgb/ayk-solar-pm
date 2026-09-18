// AYK PTE LTD — Secure auth helper with proper password hashing
import { cookies } from 'next/headers'
import { db } from './db'
import { scryptSync, randomBytes, timingSafeEqual } from 'crypto'

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

// ─── Password Hashing (using Node's built-in scrypt) ───
// Format: "scrypt:<salt>:<hash>" — this is secure and doesn't need external libraries.
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `scrypt:${salt}:${hash}`
}

export function verifyPassword(input: string, stored: string): boolean {
  // Support old demo passwords (demo$<plain>) for backwards compatibility during migration
  if (stored.startsWith('demo$')) {
    return stored === `demo$${input}`
  }
  // New scrypt-based passwords
  if (stored.startsWith('scrypt:')) {
    const parts = stored.split(':')
    if (parts.length !== 3) return false
    const [, salt, hash] = parts
    try {
      const inputHash = scryptSync(input, salt, 64)
      const storedHash = Buffer.from(hash, 'hex')
      return inputHash.length === storedHash.length && timingSafeEqual(inputHash, storedHash)
    } catch {
      return false
    }
  }
  return false
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

export function generateAccessCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const part = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `AYK-${part()}-${part()}`
}
