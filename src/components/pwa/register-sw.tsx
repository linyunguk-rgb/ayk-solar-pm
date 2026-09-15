'use client'
import { useEffect } from 'react'

/**
 * Registers the AYK service worker on the client.
 *
 * Behaviour:
 *  - Only runs in production (`process.env.NODE_ENV === 'production'`) so
 *    that hot-reload / HMR in dev is never cached by the SW.
 *  - Only runs in browsers that actually support service workers.
 *  - Listens for the SW-navigator-controller change and reloads the page
 *    once so the user picks up the new app shell on the next navigation.
 *
 * This component renders nothing. Drop it anywhere in the tree (it's
 * imported from the root layout).
 */
export function RegisterSW() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return
    // Don't register in dev — it interferes with HMR.
    if (process.env.NODE_ENV !== 'production') return

    let refreshing = false

    const onControllerChange = () => {
      if (refreshing) return
      refreshing = true
      window.location.reload()
    }

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
        // Listen for updates
        reg.addEventListener('updatefound', () => {
          const installing = reg.installing
          if (!installing) return
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              // New version ready — let the SW skip waiting; the
              // controllerchange listener above will trigger a reload.
              installing.postMessage?.('AYK_SKIP_WAITING')
            }
          })
        })
      } catch (err) {
        // Non-fatal — the app still works without offline support.
        console.warn('[PWA] SW registration failed:', err)
      }
    }

    register()

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
    }
  }, [])

  return null
}
