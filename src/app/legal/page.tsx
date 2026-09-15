import type { Metadata } from 'next'
import Link from 'next/link'
import { Sun, FileText, ShieldCheck, Cookie, Scale, AlertTriangle, Lock, Mail, ChevronRight, Building2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Legal Center — AYK PTE LTD',
  description:
    'AYK PTE LTD legal documents: Terms of Service, Privacy Policy, Cookie Policy, Acceptable Use Policy, Disclaimer, and GDPR/Data Processing Addendum for the Solar Project Management System.',
}

const LAST_UPDATED = '15 September 2025'

interface LegalDoc {
  href: string
  title: string
  short: string
  icon: React.ReactNode
  accent: string
}

const docs: LegalDoc[] = [
  {
    href: '/legal/terms',
    title: 'Terms of Service',
    short: 'The terms and conditions that govern your use of the AYK Solar Project Management platform.',
    icon: <FileText className="h-5 w-5" />,
    accent: 'bg-emerald-100 text-emerald-700',
  },
  {
    href: '/legal/privacy',
    title: 'Privacy Policy',
    short: 'How AYK collects, uses, stores, and protects personal and project data across tenant boundaries.',
    icon: <ShieldCheck className="h-5 w-5" />,
    accent: 'bg-sky-100 text-sky-700',
  },
  {
    href: '/legal/cookies',
    title: 'Cookie Policy',
    short: 'What cookies and local storage the platform uses, why, and how you can control them.',
    icon: <Cookie className="h-5 w-5" />,
    accent: 'bg-amber-100 text-amber-700',
  },
  {
    href: '/legal/acceptable-use',
    title: 'Acceptable Use Policy',
    short: 'Permitted and prohibited uses of the platform, plus enforcement and penalties for violations.',
    icon: <Scale className="h-5 w-5" />,
    accent: 'bg-rose-100 text-rose-700',
  },
  {
    href: '/legal/disclaimer',
    title: 'Disclaimer',
    short: 'No-warranty, accuracy, limitation of liability, and third-party notices for the platform.',
    icon: <AlertTriangle className="h-5 w-5" />,
    accent: 'bg-orange-100 text-orange-700',
  },
  {
    href: '/legal/gdpr',
    title: 'GDPR / Data Processing Addendum',
    short: 'Controller/processor roles, data subject rights, sub-processors, breach notice, and DPA terms.',
    icon: <Lock className="h-5 w-5" />,
    accent: 'bg-violet-100 text-violet-700',
  },
]

export default function LegalIndexPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Branded hero header */}
      <header className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white">
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(16,185,129,0.5) 0%, transparent 45%), radial-gradient(circle at 80% 70%, rgba(56,189,248,0.35) 0%, transparent 45%)',
          }}
        />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg">
              <Sun className="h-7 w-7 text-white" />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight">AYK PTE LTD</div>
              <div className="text-xs text-emerald-300 tracking-wide">Solar Energy • Build a Brighter Future</div>
            </div>
          </Link>

          <div className="mt-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs font-medium text-emerald-200 backdrop-blur">
              <Building2 className="h-3.5 w-3.5" />
              <span>Legal Center</span>
            </div>
            <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
              Legal & Compliance Documents
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-300">
              Transparency is part of how we build. Below are the policies that govern your use of the AYK Solar Project
              Management System. Review them at any time, and contact our legal team if anything is unclear.
            </p>
            <p className="mt-6 text-xs text-slate-400">
              Last updated: <span className="font-medium text-slate-200">{LAST_UPDATED}</span>
            </p>
          </div>
        </div>
      </header>

      {/* Document grid */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {docs.map(doc => (
            <Link
              key={doc.href}
              href={doc.href}
              className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all"
            >
              <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${doc.accent}`}>
                {doc.icon}
              </div>
              <h2 className="mt-4 text-lg font-semibold text-slate-900 group-hover:text-emerald-700">{doc.title}</h2>
              <p className="mt-2 flex-1 text-sm text-slate-600 leading-relaxed">{doc.short}</p>
              <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-emerald-700 group-hover:gap-2 transition-all">
                Read more
                <ChevronRight className="h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>

        {/* Contact card */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">General legal enquiries</h3>
                <p className="text-xs text-slate-500">Questions about any of these documents</p>
              </div>
            </div>
            <a href="mailto:legal@ayk.com.sg" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:underline">
              legal@ayk.com.sg
            </a>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Privacy & data protection</h3>
                <p className="text-xs text-slate-500">Data subject requests, DPA, breach notifications</p>
              </div>
            </div>
            <a href="mailto:privacy@ayk.com.sg" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-sky-700 hover:underline">
              privacy@ayk.com.sg
            </a>
          </div>
        </div>

        {/* Entity block */}
        <div className="mt-10 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-emerald-50/40 p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Operating Entity</h3>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-500">Legal name</p>
              <p className="font-semibold text-slate-900">AYK PTE. LTD.</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Registered in</p>
              <p className="font-semibold text-slate-900">Singapore</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Governing law</p>
              <p className="font-semibold text-slate-900">Laws of Singapore</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Data protection</p>
              <p className="font-semibold text-slate-900">PDPA (Singapore) & GDPR (EU)</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} AYK PTE LTD. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/legal/terms" className="hover:text-emerald-700">Terms</Link>
            <Link href="/legal/privacy" className="hover:text-emerald-700">Privacy</Link>
            <Link href="/legal/cookies" className="hover:text-emerald-700">Cookies</Link>
            <Link href="/" className="hover:text-emerald-700">Back to app</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
