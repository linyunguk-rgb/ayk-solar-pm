import type { Metadata } from 'next'

// Legal route layout — Server Component.
// Provides a clean outer shell for all /legal/* pages. Individual documents
// use the shared <LegalShell> (client) for their TOC sidebar + content.

export const metadata: Metadata = {
  title: 'Legal — AYK PTE LTD',
  description:
    'Legal documents for the AYK Solar Project Management System: Terms of Service, Privacy Policy, Cookie Policy, Acceptable Use Policy, Disclaimer, and GDPR/Data Processing Addendum.',
  robots: { index: true, follow: true },
}

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-slate-50 text-slate-900">{children}</div>
}
