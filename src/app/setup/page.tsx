'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
      setStatus(res.ok ? 'success' : 'error')
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
          <h1 className="text-2xl font-bold text-white">AYK Solar — Setup</h1>
          <p className="text-sm text-emerald-300 mt-2">Click the button below to set up your database</p>
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
                  This creates all database tables and sets up your admin account. Takes 10-30 seconds.
                </p>
                <Button onClick={runSetup} size="lg" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base">
                  <Database className="h-5 w-5 mr-2" /> Set Up Database
                </Button>
              </div>
            )}

            {status === 'loading' && (
              <div className="text-center py-8">
                <Loader2 className="h-12 w-12 text-emerald-600 animate-spin mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-slate-900 mb-2">Setting up...</h2>
                <p className="text-sm text-slate-600">Creating tables and admin account. This takes 10-30 seconds.</p>
              </div>
            )}

            {status === 'success' && (
              <div className="text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mx-auto mb-4">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900 mb-2">Setup complete! 🎉</h2>
                <p className="text-sm text-slate-600 mb-6">Your database is ready. Use the credentials below to log in.</p>

                {result?.credentials && (
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 mb-6 text-left">
                    <p className="text-xs font-bold text-emerald-800 mb-3 uppercase">Login Credentials:</p>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between gap-2 items-center">
                        <span className="text-emerald-700 font-medium">Admin Email:</span>
                        <code className="font-mono text-emerald-900 text-xs">admin@ayk.com.sg</code>
                      </div>
                      <div className="flex justify-between gap-2 items-center">
                        <span className="text-emerald-700 font-medium">Admin Password:</span>
                        <code className="font-mono text-emerald-900 text-xs">Ayk2025Solar!</code>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-emerald-200">
                      <p className="text-xs text-emerald-600 mb-1">Master admin (platform owner):</p>
                      <p className="text-xs text-emerald-700">URL: /master-access</p>
                      <p className="text-xs text-emerald-700">Email: master@ayk.com.sg</p>
                    </div>
                  </div>
                )}

                <a href="/">
                  <Button size="lg" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12">
                    Go to Login <ArrowRight className="h-4 w-4 ml-2" />
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
                <Button onClick={runSetup} variant="outline" className="mr-2">Try Again</Button>
                <a href="/"><Button variant="ghost">Go to Login</Button></a>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
