'use client'
import { useAppStore } from '@/store/app-store'
import { APP_NAME, APP_TAGLINE } from '@/lib/constants'
import { Sun, Rocket, Building2, ArrowRight, ShieldCheck, Users, Zap, Lock } from 'lucide-react'
import Link from 'next/link'

export function LandingPage() {
  const setEntryMode = useAppStore(s => s.setEntryMode)
  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white">
      <div className="flex items-center justify-center sm:justify-start gap-3 p-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg">
          <Sun className="h-6 w-6 text-white" />
        </div>
        <div>
          <div className="text-lg font-bold tracking-tight">{APP_NAME}</div>
          <div className="text-[11px] text-emerald-300">{APP_TAGLINE}</div>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12">
        <div className="max-w-4xl w-full text-center mb-10 sm:mb-14">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-4">Solar Construction<br className="sm:hidden" /> Project Management</h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">The all-in-one platform for solar contractors — track projects, progress, manpower, materials, safety and expenses.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-3xl">
          <button onClick={() => setEntryMode('demo')} className="group relative text-left rounded-2xl bg-white/10 backdrop-blur border border-white/20 p-6 sm:p-8 hover:bg-white/15 hover:border-emerald-400/50 transition-all hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300"><Rocket className="h-6 w-6" /></div>
              <div><div className="text-xl font-bold">Try the Demo</div><div className="text-xs text-emerald-300">No commitment · instant access</div></div>
            </div>
            <p className="text-sm text-slate-300 mb-4">Explore a fully populated demo workspace with realistic sample data. Pick any role to log in as.</p>
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300 group-hover:text-emerald-200">Explore demo <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" /></div>
          </button>
          <button onClick={() => setEntryMode('enterprise')} className="group relative text-left rounded-2xl bg-gradient-to-br from-emerald-600/20 to-teal-600/20 backdrop-blur border border-emerald-400/30 p-6 sm:p-8 hover:from-emerald-600/30 hover:to-teal-600/30 hover:border-emerald-400/60 transition-all hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/30 text-emerald-200"><Building2 className="h-6 w-6" /></div>
              <div><div className="text-xl font-bold">Enterprise Access</div><div className="text-xs text-emerald-200">For your company · private & isolated</div></div>
            </div>
            <p className="text-sm text-slate-200 mb-4">Have an access code? Set up your company's private workspace, add your team, and manage your solar projects in a fully isolated environment.</p>
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-200 group-hover:text-emerald-100">Enter access code <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" /></div>
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-10 text-xs text-slate-400">
          <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-400" /> Data-isolated per company</span>
          <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-emerald-400" /> Role-based access</span>
          <span className="flex items-center gap-1.5"><Zap className="h-4 w-4 text-emerald-400" /> Real-time dashboards</span>
          <span className="flex items-center gap-1.5"><Lock className="h-4 w-4 text-emerald-400" /> Secure authentication</span>
        </div>
      </div>
      <div className="text-center text-xs text-slate-500 p-4">
        <div className="flex items-center justify-center gap-4 mb-2">
          <Link href="/legal/terms" className="hover:text-emerald-400">Terms</Link>
          <Link href="/legal/privacy" className="hover:text-emerald-400">Privacy</Link>
          <Link href="/legal/cookies" className="hover:text-emerald-400">Cookies</Link>
          <Link href="/legal/disclaimer" className="hover:text-emerald-400">Disclaimer</Link>
        </div>
        © {new Date().getFullYear()} {APP_NAME}. Solar Energy • Build a Brighter Future.
      </div>
    </div>
  )
}
