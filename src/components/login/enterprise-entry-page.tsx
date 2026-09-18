'use client'
import { useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { apiPost } from '@/hooks/use-fetch'
import { APP_NAME, APP_TAGLINE } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Sun, ArrowLeft, Building2, KeyRound, ArrowRight, Loader2, AlertCircle, CheckCircle2, UserPlus, LogIn } from 'lucide-react'

export function EnterpriseEntryPage() {
  const setEntryMode = useAppStore(s => s.setEntryMode)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [validated, setValidated] = useState<any>(null)

  async function validateCode() {
    if (!code.trim()) { setError('Please enter your access code'); return }
    setLoading(true); setError('')
    try {
      const res = await apiPost<any>('/api/access-code/validate', { code: code.trim().toUpperCase() })
      setValidated(res)
    } catch (e: any) { setError(e.message || 'Invalid code') }
    finally { setLoading(false) }
  }

  // If valid + new company → show setup wizard
  if (validated?.valid && !validated.hasTenant) {
    return <CompanySetupWizard code={code.trim().toUpperCase()} label={validated.label} />
  }

  // If valid + existing company → show login OR signup options
  if (validated?.valid && validated.hasTenant) {
    return <ExistingCompanyEntry code={code.trim().toUpperCase()} tenantId={validated.tenantId} />
  }

  // Default: show code entry form
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg mb-3"><Sun className="h-7 w-7 text-white" /></div>
          <div className="text-xl font-bold text-white">{APP_NAME}</div>
          <div className="text-xs text-emerald-300">{APP_TAGLINE}</div>
        </div>
        <Card className="border-emerald-200/30 shadow-2xl">
          <CardHeader>
            <button onClick={() => setEntryMode('landing')} className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-2"><ArrowLeft className="h-3 w-3" /> Back to start</button>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><KeyRound className="h-5 w-5" /></div>
              <div><CardTitle className="text-xl">Enterprise Access</CardTitle><CardDescription>Enter the access code provided by your company admin</CardDescription></div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Access Code</Label>
              <Input id="code" value={code} onChange={e => { setCode(e.target.value.toUpperCase()); setError('') }} placeholder="AYK-XXXX-XXXX" className="font-mono text-center text-lg tracking-widest h-12" onKeyDown={e => e.key === 'Enter' && validateCode()} autoFocus />
            </div>
            {error && <div className="flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700"><AlertCircle className="h-4 w-4 shrink-0" /> <span>{error}</span></div>}
            <Button onClick={validateCode} disabled={loading || !code.trim()} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11">{loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Validating…</> : <>Validate Code <ArrowRight className="h-4 w-4 ml-1" /></>}</Button>
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700">
              <p className="font-semibold mb-1">How it works:</p>
              <ul className="space-y-1 list-disc list-inside text-emerald-600">
                <li>New company: set up your company name, logo and first admin.</li>
                <li>Existing company: log in or create your employee account.</li>
                <li>Your data is fully isolated — no other company can access it.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ─── Existing Company: Login or Signup ───
function ExistingCompanyEntry({ code, tenantId }: { code: string; tenantId: string }) {
  const [mode, setMode] = useState<'choose' | 'login' | 'signup'>('choose')

  if (mode === 'login') return <EnterpriseLogin code={code} onBack={() => setMode('choose')} />
  if (mode === 'signup') return <EmployeeSignup code={code} tenantId={tenantId} onBack={() => setMode('choose')} />

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg mb-3"><Building2 className="h-7 w-7 text-white" /></div>
          <h1 className="text-xl font-bold text-white">Company Verified</h1>
          <p className="text-xs text-emerald-300">Access code validated — choose an option below</p>
        </div>
        <Card className="shadow-2xl">
          <CardContent className="p-6 space-y-3">
            <Button onClick={() => setMode('login')} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-14 justify-start text-left">
              <LogIn className="h-5 w-5 mr-3" />
              <div><div className="font-semibold">I have an account</div><div className="text-xs text-emerald-100">Log in with your email and password</div></div>
            </Button>
            <Button onClick={() => setMode('signup')} variant="outline" className="w-full h-14 justify-start text-left border-emerald-200 hover:bg-emerald-50">
              <UserPlus className="h-5 w-5 mr-3 text-emerald-600" />
              <div><div className="font-semibold text-slate-900">I'm new — create account</div><div className="text-xs text-slate-500">Join your company as a new employee</div></div>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ─── Employee Signup (new employee joining existing company) ───
function EmployeeSignup({ code, tenantId, onBack }: { code: string; tenantId: string; onBack: () => void }) {
  const setUser = useAppStore(s => s.setUser)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState('Worker')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await apiPost<any>('/api/auth/signup', { code, name, email, password, phone, role })
      setUser(res)
    } catch (e: any) { setError(e.message || 'Signup failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg mb-3"><UserPlus className="h-7 w-7 text-white" /></div>
          <h1 className="text-xl font-bold text-white">Create Employee Account</h1>
          <p className="text-xs text-emerald-300">Join your company's workspace</p>
        </div>
        <Card className="shadow-2xl">
          <CardHeader>
            <button onClick={onBack} className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-2"><ArrowLeft className="h-3 w-3" /> Back</button>
            <CardTitle className="text-xl">Sign Up</CardTitle>
            <CardDescription>Create your account to join the company</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2"><Label htmlFor="sname">Full Name *</Label><Input id="sname" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" required disabled={loading} className="h-11" /></div>
              <div className="space-y-2"><Label htmlFor="semail">Email *</Label><Input id="semail" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required disabled={loading} className="h-11" /></div>
              <div className="space-y-2"><Label htmlFor="spass">Password *</Label><Input id="spass" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 8 characters" required disabled={loading} className="h-11" /><p className="text-xs text-slate-500">Use a strong, unique password. Do NOT reuse passwords from other sites.</p></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label htmlFor="sphone">Phone</Label><Input id="sphone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+65 9000 0000" disabled={loading} className="h-11" /></div>
                <div className="space-y-2"><Label htmlFor="srole">Your Role</Label>
                  <select id="srole" value={role} onChange={e => setRole(e.target.value)} disabled={loading} className="w-full h-11 rounded-md border border-input bg-transparent px-3 text-sm">
                    <option value="Worker">Worker</option>
                    <option value="SiteSupervisor">Site Supervisor</option>
                    <option value="Engineer">Engineer</option>
                    <option value="SafetyOfficer">Safety Officer</option>
                    <option value="StoreOfficer">Store Officer</option>
                    <option value="ProjectManager">Project Manager</option>
                  </select>
                </div>
              </div>
              {error && <div className="flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700"><AlertCircle className="h-4 w-4 shrink-0" /> <span>{error}</span></div>}
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11" disabled={loading || !name.trim() || !email.trim() || !password.trim()}>
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating account…</> : <>Create Account & Sign In <ArrowRight className="h-4 w-4 ml-1" /></>}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ─── Company Setup Wizard (for new enterprise tenants) ───
function CompanySetupWizard({ code, label }: { code: string; label?: string }) {
  const setUser = useAppStore(s => s.setUser)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [address, setAddress] = useState('')
  const [uen, setUen] = useState('')
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [phone, setPhone] = useState('')

  async function handleSubmit() {
    setLoading(true); setError('')
    try {
      const res = await apiPost<any>('/api/company/setup', { code, companyName, address, uen, adminName, adminEmail, adminPassword, phone })
      setUser(res.user)
    } catch (e: any) { setError(e.message || 'Setup failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-4 sm:p-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg mx-auto mb-3"><Building2 className="h-7 w-7 text-white" /></div>
          <h1 className="text-2xl font-bold text-white">Set Up Your Company</h1>
          <p className="text-sm text-emerald-300 mt-1">Welcome to {APP_NAME}! Let's configure your private workspace.</p>
        </div>
        <div className="flex items-center justify-center gap-2 mb-6">
          {Array.from({ length: 2 }).map((_, i) => (<div key={i} className={`h-1.5 rounded-full transition-all ${i + 1 <= step ? 'bg-emerald-400 w-12' : 'bg-white/20 w-8'}`} />))}
          <span className="text-xs text-slate-400 ml-2">Step {step} of 2</span>
        </div>
        <Card className="shadow-2xl">
          <CardContent className="p-6 sm:p-8">
            {step === 1 && (
              <div className="space-y-4">
                <div><h2 className="text-lg font-semibold text-slate-900 mb-1">Company Details</h2><p className="text-sm text-slate-500 mb-4">Tell us about your company. You can change these later in Settings.</p></div>
                <div className="space-y-3">
                  <div><Label htmlFor="cname">Company Name *</Label><Input id="cname" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. SunTech Solar Pte Ltd" className="h-11" /></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div><Label htmlFor="uen">UEN / Reg. No.</Label><Input id="uen" value={uen} onChange={e => setUen(e.target.value)} placeholder="202400001A" className="h-11" /></div>
                    <div><Label htmlFor="phone">Company Phone</Label><Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+65 6000 0000" className="h-11" /></div>
                  </div>
                  <div><Label htmlFor="addr">Address</Label><Input id="addr" value={address} onChange={e => setAddress(e.target.value)} placeholder="1 Tuas Avenue, Singapore 639000" className="h-11" /></div>
                </div>
                <Button onClick={() => setStep(2)} disabled={!companyName.trim()} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11">Continue <ArrowRight className="h-4 w-4 ml-1" /></Button>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-4">
                <div><h2 className="text-lg font-semibold text-slate-900 mb-1">Admin Account</h2><p className="text-sm text-slate-500 mb-4">Create the first admin account for {companyName}. You'll be able to add more team members later.</p></div>
                <div className="space-y-3">
                  <div><Label htmlFor="aname">Your Name *</Label><Input id="aname" value={adminName} onChange={e => setAdminName(e.target.value)} placeholder="John Doe" className="h-11" /></div>
                  <div><Label htmlFor="aemail">Email *</Label><Input id="aemail" type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} placeholder="admin@yourcompany.com" className="h-11" /></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div><Label htmlFor="apass">Password *</Label><Input id="apass" type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} placeholder="Min 8 characters" className="h-11" /><p className="text-xs text-slate-500 mt-1">Use a strong, unique password.</p></div>
                    <div><Label htmlFor="aphone">Your Phone</Label><Input id="aphone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+65 9000 0000" className="h-11" /></div>
                  </div>
                </div>
                {error && <div className="flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700"><AlertCircle className="h-4 w-4 shrink-0" /> <span>{error}</span></div>}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(1)} className="h-11">Back</Button>
                  <Button onClick={handleSubmit} disabled={loading || !adminName.trim() || !adminEmail.trim() || !adminPassword.trim()} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-11">{loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating workspace…</> : <>Create Workspace <CheckCircle2 className="h-4 w-4 ml-1" /></>}</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ─── Enterprise Login (for existing employees) ───
function EnterpriseLogin({ code, onBack }: { code: string; onBack: () => void }) {
  const setUser = useAppStore(s => s.setUser)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await apiPost<any>('/api/auth/login', { email, password, accessCode: code })
      setUser(res)
    } catch (e: any) { setError(e.message || 'Login failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg mb-3"><LogIn className="h-7 w-7 text-white" /></div>
          <h1 className="text-xl font-bold text-white">Sign In</h1>
          <p className="text-xs text-emerald-300">Enter your company email and password</p>
        </div>
        <Card className="shadow-2xl">
          <CardHeader>
            <button onClick={onBack} className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-2"><ArrowLeft className="h-3 w-3" /> Back</button>
            <CardTitle className="text-xl">Sign In</CardTitle>
            <CardDescription>Enter your company email and password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@yourcompany.com" required disabled={loading} className="h-11" /></div>
              <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required disabled={loading} className="h-11" /></div>
              {error && <div className="flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700"><AlertCircle className="h-4 w-4 shrink-0" /> <span>{error}</span></div>}
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11" disabled={loading}>{loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Signing in…</> : <>Sign in <ArrowRight className="h-4 w-4 ml-1" /></>}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
