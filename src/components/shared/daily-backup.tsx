'use client'
import { useEffect, useRef } from 'react'

/**
 * DailyBackup — silently downloads a JSON backup of all company data
 * at 11:59 PM in the user's local timezone. The backup is saved to the
 * browser's Downloads folder. It runs once per day per browser.
 *
 * This does NOT remove data from the app — it's a safety copy on the
 * user's device. The app database is the source of truth.
 */
export function DailyBackup() {
  const hasRunToday = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    function checkAndBackup() {
      const now = new Date()
      const hours = now.getHours()
      const minutes = now.getMinutes()
      const todayKey = `ayk-backup-${now.toISOString().slice(0, 10)}`

      // Already backed up today?
      if (localStorage.getItem(todayKey)) {
        hasRunToday.current = true
        return
      }

      // Run between 23:55 and 23:59 (catches 11:59 PM)
      if (hours === 23 && minutes >= 55 && !hasRunToday.current) {
        hasRunToday.current = true
        doBackup(todayKey)
      }
    }

    async function doBackup(todayKey: string) {
      try {
        const res = await fetch('/api/export')
        if (!res.ok) return
        const data = await res.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const date = new Date().toISOString().slice(0, 10)
        const tenantName = data.tenant?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'company'
        a.download = `ayk-backup-${tenantName}-${date}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        localStorage.setItem(todayKey, new Date().toISOString())
      } catch (e) {
        // Silent fail — backup is best-effort
      }
    }

    // Check every minute
    const interval = setInterval(checkAndBackup, 60000)
    checkAndBackup() // Check immediately on mount

    return () => clearInterval(interval)
  }, [])

  return null // This component is invisible — it runs in the background
}
