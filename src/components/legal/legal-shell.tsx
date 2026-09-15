'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Sun, ArrowLeft, Printer, Menu, X, FileText } from 'lucide-react'

// Shared layout for individual legal pages: sidebar TOC + Back/Print buttons + content area.
// Used by every /legal/<doc>/page.tsx Server Component.

export interface TocItem {
  id: string
  label: string
}

export interface LegalShellProps {
  title: string
  lastUpdated: string
  description?: string
  toc: TocItem[]
  children: React.ReactNode
}

export function LegalShell({ title, lastUpdated, description, toc, children }: LegalShellProps) {
  const [mobileTocOpen, setMobileTocOpen] = useState(false)

  // Smooth-scroll to a section + close the mobile drawer
  const handleTocClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    setMobileTocOpen(false)
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      history.replaceState(null, '', `#${id}`)
    }
  }

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print()
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar — branding + actions */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur print:hidden">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/legal" className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-emerald-700">
            <Sun className="h-5 w-5 text-emerald-600" />
            <span className="font-bold tracking-tight">AYK</span>
            <span className="hidden sm:inline text-slate-400">·</span>
            <span className="hidden sm:inline text-slate-500">Legal</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/legal"
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Back to Legal</span>
              <span className="sm:hidden">Back</span>
            </Link>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>
            {/* Mobile TOC toggle */}
            <button
              type="button"
              onClick={() => setMobileTocOpen(o => !o)}
              className="lg:hidden inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              aria-label="Toggle table of contents"
            >
              {mobileTocOpen ? <X className="h-3.5 w-3.5" /> : <Menu className="h-3.5 w-3.5" />}
              <span>Contents</span>
            </button>
          </div>
        </div>
      </header>

      {/* Page title block */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-emerald-600">
            <FileText className="h-3.5 w-3.5" />
            <span>Legal Document</span>
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
          {description && <p className="mt-2 max-w-3xl text-sm text-slate-600 sm:text-base">{description}</p>}
          <p className="mt-3 text-xs text-slate-500">Last updated: <span className="font-medium text-slate-700">{lastUpdated}</span></p>
        </div>
      </section>

      {/* Body: sidebar TOC + main content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-10">
          {/* Desktop TOC */}
          <aside className="hidden lg:block">
            <div className="sticky top-20">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Contents</h2>
              <nav className="mt-3 space-y-1 border-l border-slate-200">
                {toc.map(item => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={e => handleTocClick(e, item.id)}
                    className="block border-l-2 border-transparent -ml-[1px] pl-4 py-1.5 text-sm text-slate-600 hover:text-emerald-700 hover:border-emerald-500"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
              <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-700">Questions?</p>
                <p className="mt-1 text-xs text-slate-500">Contact our legal team at</p>
                <a href="mailto:legal@ayk.com.sg" className="mt-1 inline-block text-xs font-semibold text-emerald-700 hover:underline">legal@ayk.com.sg</a>
              </div>
            </div>
          </aside>

          {/* Mobile TOC drawer (collapsible) */}
          {mobileTocOpen && (
            <div className="lg:hidden mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm print:hidden">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Contents</h2>
                <button onClick={() => setMobileTocOpen(false)} aria-label="Close contents">
                  <X className="h-4 w-4 text-slate-400" />
                </button>
              </div>
              <nav className="space-y-1">
                {toc.map(item => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={e => handleTocClick(e, item.id)}
                    className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          )}

          {/* Main content */}
          <main className="min-w-0">
            <article className="legal-prose max-w-none rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
              {children}
            </article>

            <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-emerald-50/40 p-5">
              <div>
                <p className="text-sm font-semibold text-slate-900">Need clarification on this document?</p>
                <p className="mt-1 text-xs text-slate-600">Our legal team is happy to help with any questions about AYK&apos;s policies.</p>
              </div>
              <a
                href="mailto:legal@ayk.com.sg"
                className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Contact Legal
              </a>
            </div>

            <p className="mt-6 text-center text-xs text-slate-400">
              © {new Date().getFullYear()} AYK PTE LTD · All rights reserved.
            </p>
          </main>
        </div>
      </div>
    </div>
  )
}
