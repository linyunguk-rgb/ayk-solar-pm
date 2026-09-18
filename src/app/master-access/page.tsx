'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Sun, ShieldCheck, Loader2, AlertCircle, ArrowRight } from 'lucide-react'

export default function MasterAccessPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')
      if (!data.isMasterAdmin) throw new Error('Access denied. This page is for platform administrators only.')
      // Reload to enter the app
      window.location.href = '/'
    } catch (e: any) {
      setError(e.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg mb-3 ring-2 ring-emerald-400/30">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Platform Admin Access</h1>
          <p className="text-xs text-emerald-300/70">Restricted area — authorized personnel only</p>
        </div>
        <Card className="border-emerald-800/30 shadow-2xl bg-slate-900/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Sun className="h-5 w-5 text-emerald-400" /> Secure Login
            </CardTitle>
            <CardDescription className="text-slate-400">Enter your platform administrator credentials</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Email</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@ayk.com.sg" required disabled={loading} className="h-11 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" autoComplete="off" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Password</Label>
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••••••" required disabled={loading} className="h-11 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" autoComplete="new-password" />
              </div>
              {error && <div className="flex items-center gap-2 rounded-md bg-red-950/50 border border-red-800 px-3 py-2 text-sm text-red-300"><AlertCircle className="h-4 w-4 shrink-0" /> <span>{error}</span></div>}
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11" disabled={loading}>
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Authenticating…</> : <>Secure Sign In <ArrowRight className="h-4 w-4 ml-1" /></>}
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="text-center text-xs text-slate-600 mt-4">
          🔒 This page is not linked from the main app. Bookmark this URL for future access.
        </p>
      </div>
    </div>
  )
}
