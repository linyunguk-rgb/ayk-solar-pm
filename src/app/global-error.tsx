'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('AYK global error:', error)
  }, [error])

  // Minimal HTML — the root layout may itself have crashed,
  // so we cannot rely on shared fonts, Tailwind layers, etc.
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          backgroundColor: '#f8fafc',
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          color: '#0f172a',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 440,
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: 32,
            boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              margin: '0 auto',
              borderRadius: 16,
              background: '#fff7ed',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AlertTriangle size={28} color="#d97706" />
          </div>

          <h1
            style={{
              marginTop: 20,
              fontSize: 22,
              fontWeight: 700,
              color: '#0f172a',
            }}
          >
            AYK Solar is temporarily unavailable
          </h1>
          <p
            style={{
              marginTop: 8,
              fontSize: 14,
              color: '#64748b',
              lineHeight: 1.5,
            }}
          >
            A critical error prevented the application from loading. Your data is
            safe. Please try again, and contact support if the problem persists.
          </p>

          {error?.digest && (
            <p
              style={{
                marginTop: 16,
                fontSize: 11,
                color: '#94a3b8',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              }}
            >
              ref: {error.digest}
            </p>
          )}

          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 24,
              width: '100%',
              height: 44,
              borderRadius: 8,
              background: '#059669',
              color: '#ffffff',
              border: 'none',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <RefreshCw size={16} color="#ffffff" />
            Try again
          </button>

          <p
            style={{
              marginTop: 24,
              fontSize: 11,
              color: '#94a3b8',
            }}
          >
            AYK PTE LTD &middot; Solar Energy &middot; Build a Brighter Future
          </p>
        </div>
      </body>
    </html>
  )
}
