'use client'

// Simple fetch hook with auto-refetch capability
import { useState, useEffect, useCallback, useRef } from 'react'

interface UseFetchResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useFetch<T = any>(url: string | null, options?: RequestInit): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(!!url)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchData = useCallback(async () => {
    if (!url) { setData(null); setLoading(false); return }
    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(url, { ...options, signal: ac.signal })
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        throw new Error(errBody.error || `Request failed (${res.status})`)
      }
      const json = await res.json()
      if (!ac.signal.aborted) setData(json)
    } catch (e: any) {
      if (e.name === 'AbortError') return
      setError(e.message || 'Failed to fetch')
    } finally {
      if (!ac.signal.aborted) setLoading(false)
    }
  }, [url, JSON.stringify(options || {})])

  useEffect(() => { fetchData() }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

export async function apiPost<T = any>(url: string, body: any): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Request failed (${res.status})`)
  }
  return res.json()
}

export async function apiPut<T = any>(url: string, body: any): Promise<T> {
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Request failed (${res.status})`)
  }
  return res.json()
}

export async function apiDelete<T = any>(url: string): Promise<T> {
  const res = await fetch(url, { method: 'DELETE' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Request failed (${res.status})`)
  }
  return res.json()
}
