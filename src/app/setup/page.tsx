'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Sun, Database, CheckCircle2, Loader2, AlertCircle, ArrowRight } from 'lucide-react'

export default function SetupPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [result, setResult] = useState<any>(null)

  async function runSetup() {
    setStatus('loading')
    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: 'ayk-setup-2025' }),
      })
      const data = await res.json()
      setResult(data)
      if (res.ok) setStatus('success')
      else setStatus('error')
    } catch (e: any) {
      setResult({ error: e.message })
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg mx-auto mb-4">
            <Sun className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">AYK Solar — Database Setup</h1>
          <p className="text-sm text-emerald-300 mt-2">Click the button below to set up your Supabase database</p>
        </div>

        <Card className="shadow-2xl">
          <CardContent className="p-6 sm:p-8">
            {status === 'idle' && (
              <div className="text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mx-auto mb-4">
                  <Database className="h-7 w-7" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900 mb-2">Ready to set up database</h2>
                <p className="text-sm text-slate-600 mb-6 max-w-md mx-auto">
                  This will create all database tables in your Supabase PostgreSQL database and populate them with demo data
                  (master admin, demo company, projects, workers, materials, and access codes).
                </p>
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 mb-6 text-left">
                  <p className="text-xs font-semibold text-slate-700 mb-2">This will create:</p>
                  <ul className="text-xs text-slate-600 space-y-1">
                    <li>✓ All 16 database tables (users, projects, tasks, workers, etc.)</li>
                    <li>✓ Master admin account (master@ayk.com.sg)</li>
                    <li>✓ Demo company with 6 demo users</li>
                    <li>✓ 5 sample projects with stages and progress</li>
                    <li>✓ 12 workers, 7 materials, 3 expenses, safety data</li>
                    <li>✓ 3 access codes for enterprise onboarding</li>
                  </ul>
                </div>
                <Button onClick={runSetup} size="lg" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base">
                  <Database className="h-5 w-5 mr-2" /> Set Up Database Now
                </Button>
              </div>
            )}

            {status === 'loading' && (
              <div className="text-center py-8">
                <Loader2 className="h-12 w-12 text-emerald-600 animate-spin mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-slate-900 mb-2">Setting up database...</h2>
                <p className="text-sm text-slate-600">Creating tables and seeding demo data. This takes 10-30 seconds.</p>
              </div>
            )}

            {status === 'success' && (
              <div className="text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mx-auto mb-4">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900 mb-2">Database setup complete! 🎉</h2>
                <p className="text-sm text-slate-600 mb-6">Your Supabase database is now connected and populated with demo data.</p>

                {result?.credentials && (
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 mb-6 text-left">
                    <p className="text-xs font-bold text-emerald-800 mb-2 uppercase">Login Credentials:</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-emerald-700">Master Admin:</span><code className="font-mono text-emerald-900">master@ayk.com.sg / master123</code></div>
                      <div className="flex justify-between"><span className="text-emerald-700">Demo Admin:</span><code className="font-mono text-emerald-900">admin@ayk.com.sg / admin123</code></div>
                      <div className="flex justify-between"><span className="text-emerald-700">Access Codes:</span><code className="font-mono text-emerald-900 text-xs">AYK-NEW-ENT1, AYK-NEW-ENT5</code></div>
                    </div>
                  </div>
                )}

                {result?.log && (
                  <details className="text-left mb-4">
                    <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700">View setup log</summary>
                    <pre className="mt-2 text-xs text-slate-600 bg-slate-50 rounded p-3 overflow-x-auto max-h-48 overflow-y-auto">
                      {result.log.join('\n')}
                    </pre>
                  </details>
                )}

                <a href="/">
                  <Button size="lg" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12">
                    Go to App <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </a>
              </div>
            )}

            {status === 'error' && (
              <div className="text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 mx-auto mb-4">
                  <AlertCircle className="h-7 w-7" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900 mb-2">Setup failed</h2>
                <p className="text-sm text-red-600 mb-4">{result?.error || 'Unknown error'}</p>
                {result?.hint && <p className="text-xs text-slate-500 mb-4">{result.hint}</p>}
                {result?.log && (
                  <pre className="text-xs text-slate-600 bg-slate-50 rounded p-3 overflow-x-auto max-h-48 overflow-y-auto mb-4 text-left">
                    {result.log.join('\n')}
                  </pre>
                )}
                <Button onClick={runSetup} variant="outline" className="mr-2">Try Again</Button>
                <a href="/"><Button variant="ghost">Go to App</Button></a>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-500 mt-4">
          AYK PTE LTD — Solar Energy • Build a Brighter Future
        </p>
      </div>
    </div>
  )
}
