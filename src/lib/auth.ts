// AYK PTE LTD - Simple cookie-based auth helper (demo)
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
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const store = await cookies()
    const cookie = store.get(SESSION_COOKIE)
    if (!cookie?.value) return null
    // cookie value format: userId
    const userId = cookie.value
    const user = await db.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true, role: true, phone: true, avatar: true } })
    if (!user) return null
    return user
  } catch {
    return null
  }
}

export function verifyPassword(input: string, stored: string): boolean {
  // Demo only - stored as `demo$<plain>` from seed
  return stored === `demo$${input}` || stored === input
}
