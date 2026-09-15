import Link from 'next/link'
import { Sun, ArrowLeft, FileText, Scale } from 'lucide-react'
import { APP_NAME, APP_TAGLINE } from '@/lib/constants'

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-50">
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-lg text-center">
          {/* Solar / sun illustration */}
          <div className="relative mx-auto h-32 w-32 sm:h-40 sm:w-40">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-200 via-amber-300 to-emerald-200 blur-2xl opacity-60" />
            <div className="relative flex h-full w-full items-center justify-center">
              <div className="absolute inset-0 animate-pulse">
                {[...Array(12)].map((_, i) => (
                  <span
                    key={i}
                    className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400"
                    style={{
                      transform: `rotate(${i * 30}deg) translateY(-72px)`,
                      transformOrigin: 'center',
                    }}
                  />
                ))}
              </div>
              <div className="relative flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-emerald-500 shadow-xl">
                <Sun className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
              </div>
            </div>
          </div>

          {/* Brand */}
          <div className="mt-6 flex items-center justify-center gap-2">
            <span className="text-lg font-bold text-slate-900">{APP_NAME}</span>
          </div>
          <p className="mt-0.5 text-xs text-emerald-600">{APP_TAGLINE}</p>

          <h1 className="mt-6 text-5xl sm:text-6xl font-extrabold tracking-tight text-slate-900">
            404
          </h1>
          <h2 className="mt-2 text-xl sm:text-2xl font-bold text-slate-800">
            Page not found
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-500 max-w-md mx-auto">
            The page you&apos;re looking for doesn&apos;t exist or may have been
            moved. Let&apos;s get you back to building a brighter future.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-emerald-600 px-6 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
            >
              <ArrowLeft className="h-4 w-4" />
              Go to Home
            </Link>
            <Link
              href="/legal"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <Scale className="h-4 w-4" />
              Go to Legal
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-400">
            <Link href="/legal/terms" className="inline-flex items-center gap-1 hover:text-emerald-700">
              <FileText className="h-3 w-3" />
              Terms of Service
            </Link>
            <Link href="/legal/privacy" className="inline-flex items-center gap-1 hover:text-emerald-700">
              <FileText className="h-3 w-3" />
              Privacy Policy
            </Link>
          </div>
        </div>
      </main>

      <footer className="mt-auto border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-4 text-center text-xs text-slate-400">
          &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
