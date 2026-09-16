'use client'
import { useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { SectionHeader } from '@/components/shared/section-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { useFetch, apiPost, apiPut, apiDelete } from '@/hooks/use-fetch'
import { ShieldCheck, KeyRound, Building2, Users, Plus, Copy, Trash2, Power, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/constants'

export function MasterAdminPage() {
  const { data: codesData, refetch: refetchCodes } = useFetch<any>('/api/master/codes')
  const { data: tenantsData, refetch: refetchTenants } = useFetch<any>('/api/master/tenants')
  const [createOpen, setCreateOpen] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newPlan, setNewPlan] = useState('enterprise')
  const [newMaxUses, setNewMaxUses] = useState(1)
  const [creating, setCreating] = useState(false)
  const codes = codesData?.codes || []
  const tenants = tenantsData?.tenants || []

  async function handleCreate() {
    setCreating(true)
    try { await apiPost('/api/master/codes', { label: newLabel, plan: newPlan, maxUses: newMaxUses }); toast.success('Access code created'); setCreateOpen(false); setNewLabel(''); setNewMaxUses(1); refetchCodes() }
    catch (e: any) { toast.error(e.message || 'Failed to create code') }
    finally { setCreating(false) }
  }
  async function toggleCode(id: string, active: boolean) { try { await apiPut(`/api/master/codes/${id}`, { isActive: !active }); toast.success(active ? 'Code deactivated' : 'Code activated'); refetchCodes() } catch (e: any) { toast.error(e.message) } }
  async function deleteCode(id: string) { try { await apiDelete(`/api/master/codes/${id}`); toast.success('Code deleted'); refetchCodes() } catch (e: any) { toast.error(e.message) } }
  function copyCode(code: string) { navigator.clipboard.writeText(code); toast.success(`Code ${code} copied`) }

  return (
    <div className="space-y-6">
      <SectionHeader section="settings" title="Platform Admin" description="Manage access codes, tenants and platform-wide settings" icon={<ShieldCheck className="h-6 w-6" />} actions={<Button onClick={() => setCreateOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white"><Plus className="h-4 w-4 mr-2" /> Generate Code</Button>} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card><CardContent className="p-4 sm:p-5"><div className="flex items-center gap-2"><Building2 className="h-5 w-5 text-sky-500" /><div><p className="text-[11px] uppercase font-semibold text-muted-foreground">Tenants</p><p className="text-2xl font-bold">{tenants.length}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4 sm:p-5"><div className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-violet-500" /><div><p className="text-[11px] uppercase font-semibold text-muted-foreground">Access Codes</p><p className="text-2xl font-bold">{codes.length}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4 sm:p-5"><div className="flex items-center gap-2"><Users className="h-5 w-5 text-emerald-500" /><div><p className="text-[11px] uppercase font-semibold text-muted-foreground">Total Users</p><p className="text-2xl font-bold">{tenants.reduce((s: number, t: any) => s + (t._count?.users || 0), 0)}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4 sm:p-5"><div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-amber-500" /><div><p className="text-[11px] uppercase font-semibold text-muted-foreground">Active Codes</p><p className="text-2xl font-bold">{codes.filter((c: any) => c.isActive).length}</p></div></div></CardContent></Card>
      </div>
      <Card>
        <CardHeader><div className="flex items-center justify-between"><div><CardTitle className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-violet-600" /> Access Codes</CardTitle><CardDescription className="text-xs mt-1">Generate and manage codes that grant access to create/join companies</CardDescription></div><Button variant="ghost" size="sm" onClick={() => { refetchCodes(); refetchTenants() }}><RefreshCw className="h-4 w-4 mr-1" /> Refresh</Button></div></CardHeader>
        <CardContent>
          {codes.length === 0 ? (<div className="text-center py-10 text-sm text-muted-foreground">No access codes yet. Click "Generate Code" to create one.</div>) : (
            <div className="overflow-x-auto ayk-scrollbar rounded-lg border border-border/40">
              <table className="w-full text-sm min-w-[700px]">
                <thead className="bg-slate-50 border-b border-border/40"><tr><th className="px-3 py-2.5 text-left font-semibold text-xs uppercase text-muted-foreground">Code</th><th className="px-3 py-2.5 text-left font-semibold text-xs uppercase text-muted-foreground">Label</th><th className="px-3 py-2.5 text-left font-semibold text-xs uppercase text-muted-foreground">Plan</th><th className="px-3 py-2.5 text-center font-semibold text-xs uppercase text-muted-foreground">Usage</th><th className="px-3 py-2.5 text-left font-semibold text-xs uppercase text-muted-foreground">Company</th><th className="px-3 py-2.5 text-center font-semibold text-xs uppercase text-muted-foreground">Status</th><th className="px-3 py-2.5 text-right font-semibold text-xs uppercase text-muted-foreground">Actions</th></tr></thead>
                <tbody className="divide-y divide-border/30">
                  {codes.map((c: any) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5"><div className="flex items-center gap-2"><code className="font-mono font-bold text-violet-700">{c.code}</code><button onClick={() => copyCode(c.code)} className="text-slate-400 hover:text-slate-700" title="Copy"><Copy className="h-3.5 w-3.5" /></button></div></td>
                      <td className="px-3 py-2.5 text-slate-600">{c.label || '—'}</td>
                      <td className="px-3 py-2.5"><Badge variant="outline" className={c.plan === 'enterprise' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-600'}>{c.plan}</Badge></td>
                      <td className="px-3 py-2.5 text-center tabular-nums"><span className={c.usedCount >= c.maxUses ? 'text-red-600 font-semibold' : 'text-slate-700'}>{c.usedCount}</span><span className="text-slate-400"> / {c.maxUses}</span></td>
                      <td className="px-3 py-2.5 text-slate-600 text-xs">{c.tenant?.name || <span className="text-slate-400 italic">New company</span>}</td>
                      <td className="px-3 py-2.5 text-center"><Badge className={c.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}>{c.isActive ? 'Active' : 'Inactive'}</Badge></td>
                      <td className="px-3 py-2.5"><div className="flex items-center justify-end gap-1"><button onClick={() => toggleCode(c.id, c.isActive)} className="p-1.5 rounded hover:bg-slate-100 text-slate-500" title={c.isActive ? 'Deactivate' : 'Activate'}><Power className="h-3.5 w-3.5" /></button><AlertDialog><AlertDialogTrigger asChild><button className="p-1.5 rounded hover:bg-red-50 text-red-500" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete access code?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the code <code className="font-mono">{c.code}</code>.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteCode(c.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-4 w-4 text-sky-600" /> Companies (Tenants)</CardTitle><CardDescription className="text-xs mt-1">All companies using the platform</CardDescription></CardHeader>
        <CardContent>
          {tenants.length === 0 ? (<div className="text-center py-10 text-sm text-muted-foreground">No companies yet.</div>) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tenants.map((t: any) => (
                <div key={t.id} className="rounded-xl border border-border/60 p-4 bg-white">
                  <div className="flex items-center justify-between mb-2"><div className="font-semibold text-slate-900 truncate">{t.name}</div><Badge className={t.plan === 'demo' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-700'}>{t.plan}</Badge></div>
                  <div className="text-xs text-slate-500 space-y-1"><div>UEN: {t.uen || '—'}</div><div>Address: {t.address || '—'}</div><div>Users: {t._count?.users || 0} · Projects: {t._count?.projects || 0}</div><div>Created: {formatDate(t.createdAt)}</div></div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="w-full sm:max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-violet-600" /> Generate Access Code</DialogTitle><DialogDescription>Create a new code for a company to access the platform.</DialogDescription></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label htmlFor="label">Label (optional)</Label><Input id="label" value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="e.g. Acme Corp — 3 seats" /></div>
            <div><Label htmlFor="plan">Plan</Label><select id="plan" value={newPlan} onChange={e => setNewPlan(e.target.value)} className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"><option value="enterprise">Enterprise (new company)</option><option value="demo">Demo</option></select></div>
            <div><Label htmlFor="maxUses">Max Uses</Label><Input id="maxUses" type="number" min={1} value={newMaxUses} onChange={e => setNewMaxUses(Number(e.target.value))} /><p className="text-xs text-muted-foreground mt-1">How many people can use this code.</p></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={handleCreate} disabled={creating} className="bg-emerald-600 hover:bg-emerald-700 text-white">{creating ? 'Generating…' : 'Generate Code'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
