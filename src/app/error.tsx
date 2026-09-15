'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home, RotateCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // In production this would be forwarded to an error tracking service
    // (Sentry / Datadog / LogRocket etc.)
    console.error('AYK App error:', error)
  }, [error])

  const isDev = process.env.NODE_ENV !== 'production'

  return (
    <div className="min-h-[80vh] w-full flex items-center justify-center p-4 sm:p-6 bg-slate-50">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <AlertTriangle className="h-7 w-7" />
            </div>
          </div>

          <h1 className="mt-5 text-center text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Something went wrong
          </h1>
          <p className="mt-2 text-center text-sm text-slate-500">
            An unexpected error occurred while loading this part of the AYK Solar
            system. Your data is safe — please try again.
          </p>

          {isDev && error?.message && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs font-medium text-amber-800">Dev message</p>
              <p className="mt-1 break-words text-xs text-amber-700 font-mono">
                {error.message}
              </p>
              {error.digest && (
                <p className="mt-1 text-[10px] text-amber-600/80">
                  digest: {error.digest}
                </p>
              )}
            </div>
          )}

          {!isDev && error?.digest && (
            <p className="mt-4 text-center text-xs text-slate-400">
              Error ref: <span className="font-mono">{error.digest}</span>
            </p>
          )}

          <div className="mt-6 flex flex-col gap-2">
            <Button
              onClick={reset}
              className="h-11 w-full bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button
                asChild
                variant="outline"
                className="h-11 w-full border-slate-200"
              >
                <a href="/" aria-label="Go to dashboard">
                  <Home className="h-4 w-4" />
                  Dashboard
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 w-full border-slate-200"
              >
                <a href="/" aria-label="Reload page" onClick={() => window.location.reload()}>
                  <RotateCw className="h-4 w-4" />
                  Reload
                </a>
              </Button>
            </div>
          </div>

          <p className="mt-6 text-center text-[11px] text-slate-400">
            AYK PTE LTD &middot; Solar Energy &middot; Build a Brighter Future
          </p>
        </div>
      </div>
    </div>
  )
}
