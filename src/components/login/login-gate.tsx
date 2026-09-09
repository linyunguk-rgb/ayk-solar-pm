'use client'
import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { LoginPage } from './login-page'
import { Loader2 } from 'lucide-react'

// On first load, check server session. If user not in store, attempt restore.
export function LoginGate() {
  const setUser = useAppStore(s => s.setUser)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (cancelled) return
      if (d.user) setUser(d.user as any)
      setChecking(false)
    }).catch(() => setChecking(false))
    return () => { cancelled = true }
  }, [setUser])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-6 w-6 text-emerald-600 animate-spin" />
      </div>
    )
  }
  return <LoginPage />
}
