'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Sun, ArrowRight, ShieldCheck, BarChart3, HardHat, Package, Bell, Smartphone, X } from 'lucide-react'
import { APP_NAME, APP_TAGLINE } from '@/lib/constants'
import { LoginPage } from './login-page'

const FEATURES = [
  { icon: <BarChart3 className="h-5 w-5" />, title: 'Live dashboards', desc: 'Track overall progress, panels installed, man-hours, and budget across every project in real time.' },
  { icon: <HardHat className="h-5 w-5" />, title: 'Manpower & tasks', desc: 'Worker attendance, role-based tasks, and team assignments — built for site teams.' },
  { icon: <Package className="h-5 w-5" />, title: 'Materials & expenses', desc: 'Inventory with low-stock alerts, transactions, expense approvals, and project profitability.' },
  { icon: <ShieldCheck className="h-5 w-5" />, title: 'Safety first', desc: 'Daily PPE checklists, incident logging, and compliance scoring keep your sites safe.' },
  { icon: <Bell className="h-5 w-5" />, title: 'Smart notifications', desc: 'Low-stock alerts, overdue tasks, and safety incidents delivered in-app and by email.' },
  { icon: <Smartphone className="h-5 w-5" />, title: 'Field-ready PWA', desc: 'Install on any device, capture site photos + GPS, and keep working offline.' },
]

const STATS = [
  { label: 'Active Projects', value: '3' },
  { label: 'Panels Installed', value: '11,680+' },
  { label: 'Workers', value: '24' },
  { label: 'PPE Compliance', value: '94%' },
]

/**
 * Public marketing landing page for AYK Solar PM.
 * Renders hero + features + stats + footer.
 * A "Sign in" CTA toggles the LoginPage overlay.
 */
export function LandingPage() {
  const [showLogin, setShowLogin] = useState(false)

  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-50 text-slate-900">
      {/* Top nav */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur print:hidden">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow">
              <Sun className="h-5 w-5 text-white" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold tracking-tight">{APP_NAME}</div>
              <div className="text-[10px] uppercase tracking-wider text-emerald-600">Solar PM</div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/legal" className="hidden sm:inline-flex text-xs font-medium text-slate-600 hover:text-emerald-700 px-3 py-1.5">
              Legal
            </Link>
            <button
              type="button"
              onClick={() => setShowLogin(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 text-sm font-medium shadow-sm"
            >
              Sign in <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white">
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(16,185,129,0.5) 0%, transparent 45%), radial-gradient(circle at 80% 70%, rgba(56,189,248,0.35) 0%, transparent 45%)',
          }}
        />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs font-medium text-emerald-200 backdrop-blur">
                <Sun className="h-3.5 w-3.5" />
                <span>{APP_TAGLINE}</span>
              </div>
              <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
                Solar construction,<br />built to run like clockwork.
              </h1>
              <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-xl">
                The AYK Solar Project Management System unifies project tracking, daily progress, manpower, materials,
                expenses, safety, and documents — built for solar teams in the field and the office.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowLogin(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 text-sm font-semibold shadow-lg shadow-emerald-900/30"
                >
                  Sign in to your account <ArrowRight className="h-4 w-4" />
                </button>
                <Link
                  href="/legal"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-white px-6 py-3 text-sm font-semibold backdrop-blur"
                >
                  Read the policies
                </Link>
              </div>
            </div>

            {/* Stat tiles */}
            <div className="grid grid-cols-2 gap-4">
              {STATS.map(s => (
                <div key={s.label} className="rounded-2xl bg-white/10 backdrop-blur p-5 border border-white/10">
                  <div className="text-3xl sm:text-4xl font-bold tracking-tight">{s.value}</div>
                  <div className="text-xs text-slate-300 mt-1.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">Everything your solar team needs, in one platform</h2>
          <p className="mt-3 text-slate-600">From the boardroom to the rooftop — AYK keeps every part of your project in sync.</p>
        </div>
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(f => (
            <div key={f.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-emerald-200 transition">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">{f.icon}</div>
              <h3 className="mt-4 text-base font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
        <div className="rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-8 sm:p-12 text-center shadow-lg">
          <h2 className="text-2xl sm:text-3xl font-bold">Ready to manage your solar projects like a pro?</h2>
          <p className="mt-2 text-emerald-50">Sign in with a demo account and explore the full AYK experience in seconds.</p>
          <button
            type="button"
            onClick={() => setShowLogin(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white text-emerald-700 hover:bg-emerald-50 px-6 py-3 text-sm font-bold shadow"
          >
            Sign in <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* Footer with legal links */}
      <footer className="mt-auto border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow">
                  <Sun className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold">{APP_NAME}</div>
                  <div className="text-[10px] uppercase tracking-wider text-emerald-600">{APP_TAGLINE}</div>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-500 max-w-xs">
                Solar construction project management, built by AYK PTE LTD in Singapore. Track projects, progress,
                manpower, materials, safety, and expenses — all in one place.
              </p>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Legal</h3>
              <ul className="mt-3 space-y-2 text-sm">
                <li><Link href="/legal/terms" className="text-slate-700 hover:text-emerald-700">Terms of Service</Link></li>
                <li><Link href="/legal/privacy" className="text-slate-700 hover:text-emerald-700">Privacy Policy</Link></li>
                <li><Link href="/legal/cookies" className="text-slate-700 hover:text-emerald-700">Cookie Policy</Link></li>
                <li><Link href="/legal/disclaimer" className="text-slate-700 hover:text-emerald-700">Disclaimer</Link></li>
                <li><Link href="/legal/acceptable-use" className="text-slate-700 hover:text-emerald-700">Acceptable Use</Link></li>
                <li><Link href="/legal/gdpr" className="text-slate-700 hover:text-emerald-700">GDPR / DPA</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Contact</h3>
              <ul className="mt-3 space-y-2 text-sm">
                <li><a href="mailto:legal@ayk.com.sg" className="text-slate-700 hover:text-emerald-700">legal@ayk.com.sg</a></li>
                <li><a href="mailto:privacy@ayk.com.sg" className="text-slate-700 hover:text-emerald-700">privacy@ayk.com.sg</a></li>
                <li className="text-slate-500">AYK PTE. LTD. · Singapore</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <p>© 2025 AYK PTE LTD. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link href="/legal/terms" className="hover:text-emerald-700">Terms</Link>
              <Link href="/legal/privacy" className="hover:text-emerald-700">Privacy</Link>
              <Link href="/legal/cookies" className="hover:text-emerald-700">Cookies</Link>
              <Link href="/legal/disclaimer" className="hover:text-emerald-700">Disclaimer</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Login overlay (renders the full-screen LoginPage) */}
      {showLogin && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm overflow-y-auto print:hidden">
          <div className="relative min-h-screen">
            <button
              type="button"
              aria-label="Close sign-in"
              onClick={() => setShowLogin(false)}
              className="hidden lg:flex absolute top-4 right-4 z-10 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <X className="h-3.5 w-3.5" /> Close
            </button>
            <LoginPage />
          </div>
        </div>
      )}
    </div>
  )
}
