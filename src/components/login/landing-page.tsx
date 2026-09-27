'use client'
import { useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { apiPost } from '@/hooks/use-fetch'
import { APP_NAME, APP_TAGLINE } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Sun, Loader2, AlertCircle, ArrowRight, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

export function LandingPage() {
  const setUser = useAppStore(s => s.setUser)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await apiPost<any>('/api/auth/login', { email, password })
      setUser(res)
    } catch (e: any) {
      setError(e.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900">
      {/* Header */}
      <div className="flex items-center justify-center gap-3 p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg">
          <Sun className="h-7 w-7 text-white" />
        </div>
        <div>
          <div className="text-lg font-bold tracking-tight text-white">{APP_NAME}</div>
          <div className="text-[11px] text-emerald-300">{APP_TAGLINE}</div>
        </div>
      </div>

      {/* Login form centered */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <Card className="shadow-2xl border-emerald-200/20 bg-white">
            <CardHeader className="space-y-1 text-center pb-4">
              <CardTitle className="text-2xl font-bold text-slate-900">Sign In</CardTitle>
              <CardDescription className="text-slate-500">Enter your email and password to continue</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      required
                      disabled={loading}
                      className="h-11 pl-10"
                      autoComplete="off"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      disabled={loading}
                      className="h-11 pl-10 pr-10"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 shrink-0" /> <span>{error}</span>
                  </div>
                )}

                {/* Submit */}
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11 text-base font-semibold" disabled={loading}>
                  {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Signing in…</> : <>Sign In <ArrowRight className="h-4 w-4 ml-1" /></>}
                </Button>
              </form>

              {/* Help text */}
              <div className="mt-5 pt-4 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-500">
                  Don't have an account? <br />
                  <span className="text-slate-600">Ask your company admin to add you.</span>
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  Forgot your password? <br />
                  <span className="text-slate-500">Ask your admin to reset it for you.</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-500 p-4">
        <div className="flex items-center justify-center gap-4 mb-2">
          <Link href="/legal/terms" className="hover:text-emerald-400">Terms</Link>
          <Link href="/legal/privacy" className="hover:text-emerald-400">Privacy</Link>
          <Link href="/legal/cookies" className="hover:text-emerald-400">Cookies</Link>
        </div>
        © {new Date().getFullYear()} {APP_NAME}. Solar Energy • Build a Brighter Future.
      </div>
    </div>
  )
}
