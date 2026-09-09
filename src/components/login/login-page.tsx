'use client'
import { useState, useEffect } from 'react'
import { useAppStore } from '@/store/app-store'
import { apiPost } from '@/hooks/use-fetch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sun, HardHat, ShieldCheck, Wrench, Package, Cog, ChevronRight, Loader2, AlertCircle } from 'lucide-react'
import { ROLES, APP_NAME, APP_TAGLINE } from '@/lib/constants'

interface DemoUser {
  id: string
  email: string
  name: string
  role: string
  password: string
}

const roleIcons: Record<string, React.ReactNode> = {
  Admin: <Cog className="h-4 w-4" />,
  ProjectManager: <HardHat className="h-4 w-4" />,
  SiteSupervisor: <HardHat className="h-4 w-4" />,
  SafetyOfficer: <ShieldCheck className="h-4 w-4" />,
  Engineer: <Wrench className="h-4 w-4" />,
  StoreOfficer: <Package className="h-4 w-4" />,
}

export function LoginPage() {
  const setUser = useAppStore(s => s.setUser)
  const [email, setEmail] = useState('admin@ayk.com.sg')
  const [password, setPassword] = useState('admin123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [demoUsers, setDemoUsers] = useState<DemoUser[]>([])

  useEffect(() => {
    fetch('/api/auth/demo-users').then(r => r.json()).then(d => setDemoUsers(d.users || [])).catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await apiPost<{ id: string; email: string; name: string; role: any; phone?: string }>('/api/auth/login', { email, password })
      setUser(res as any)
    } catch (e: any) {
      setError(e.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  async function quickLogin(u: DemoUser) {
    setEmail(u.email); setPassword(u.password)
    setLoading(true); setError('')
    try {
      const res = await apiPost('/api/auth/login', { email: u.email, password: u.password })
      setUser(res as any)
    } catch (e: any) {
      setError(e.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-50">
      {/* Left brand panel */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-12 text-white">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(34,197,94,0.4) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(56,189,248,0.3) 0%, transparent 40%)'
        }} />
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg">
            <Sun className="h-7 w-7 text-white" />
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight">{APP_NAME}</div>
            <div className="text-xs text-emerald-300 tracking-wide">{APP_TAGLINE}</div>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-bold leading-tight">
            Solar Construction<br />Project Management
          </h1>
          <p className="text-slate-300 text-lg max-w-md">
            Track projects, progress, manpower, materials, safety and expenses — all in one place, built for solar teams.
          </p>
          <div className="grid grid-cols-2 gap-4 max-w-md">
            {[
              { label: 'Active Projects', value: '3' },
              { label: 'Panels Installed', value: '11,680+' },
              { label: 'Workers', value: '24' },
              { label: 'PPE Compliance', value: '94%' },
            ].map(s => (
              <div key={s.label} className="rounded-xl bg-white/10 backdrop-blur p-4 border border-white/10">
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-xs text-slate-300 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-400">
          © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg">
              <Sun className="h-7 w-7 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold text-slate-900">{APP_NAME}</div>
              <div className="text-xs text-emerald-600">{APP_TAGLINE}</div>
            </div>
          </div>

          <Card className="border-border/60 shadow-xl">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
              <CardDescription>Sign in to your AYK account to continue</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@ayk.com.sg" required disabled={loading} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button type="button" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">Forgot password?</button>
                  </div>
                  <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required disabled={loading} />
                </div>
                {error && (
                  <div className="flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 shrink-0" /> <span>{error}</span>
                  </div>
                )}
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11" disabled={loading}>
                  {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Signing in…</> : <>Sign in <ChevronRight className="h-4 w-4 ml-1" /></>}
                </Button>
              </form>

              {demoUsers.length > 0 && (
                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                    <div className="relative flex justify-center text-xs uppercase tracking-wide">
                      <span className="bg-card px-2 text-muted-foreground">Quick demo login</span>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {demoUsers.map(u => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => quickLogin(u)}
                        disabled={loading}
                        className="flex items-center gap-2 rounded-lg border border-border/60 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 px-3 py-2 text-left text-xs transition disabled:opacity-50"
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 shrink-0">
                          {roleIcons[u.role] || <HardHat className="h-4 w-4" />}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-medium text-foreground truncate">{u.name.split(' ')[0]}</span>
                          <span className="block text-muted-foreground truncate">{ROLES[u.role as keyof typeof ROLES] || u.role}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Demo accounts: admin@ayk.com.sg / admin123 · pm@ayk.com.sg / pm123
          </p>
        </div>
      </div>
    </div>
  )
}
