'use client'
import { useState, useCallback } from 'react'
import { useAppStore } from '@/store/app-store'
import { useFetch, apiPost, apiPut, apiDelete } from '@/hooks/use-fetch'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import {
  Settings, User as UserIcon, Users, Building2, Bell, Lock, Plus,
  Pencil, Trash2, UserPlus, ShieldCheck, Loader2, Save, KeyRound,
} from 'lucide-react'
import { ROLES, APP_NAME, APP_TAGLINE, NOTIFICATION_TYPES, formatDate, type RoleKey } from '@/lib/constants'

// ---------- helpers ----------
const ROLE_BADGE: Record<string, string> = {
  Admin: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  ProjectManager: 'bg-sky-100 text-sky-700 border-sky-200',
  SiteSupervisor: 'bg-violet-100 text-violet-700 border-violet-200',
  SafetyOfficer: 'bg-red-100 text-red-700 border-red-200',
  Engineer: 'bg-blue-100 text-blue-700 border-blue-200',
  StoreOfficer: 'bg-amber-100 text-amber-700 border-amber-200',
  Worker: 'bg-slate-100 text-slate-700 border-slate-200',
}

interface UserRow {
  id: string
  email: string
  name: string
  role: string
  phone?: string | null
  avatar?: string | null
  isActive: boolean
  createdAt: string
}

// ============================================================
// Main
// ============================================================
export function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account and system preferences"
        icon={<Settings className="h-5 w-5" />}
      />
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid grid-cols-2 sm:grid-cols-5 h-auto w-full">
          <TabsTrigger value="profile" className="gap-1.5"><UserIcon className="h-4 w-4" /> Profile</TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5"><Users className="h-4 w-4" /> Users</TabsTrigger>
          <TabsTrigger value="company" className="gap-1.5"><Building2 className="h-4 w-4" /> Company</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5"><Bell className="h-4 w-4" /> Alerts</TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5"><Lock className="h-4 w-4" /> Security</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-4"><ProfileTab /></TabsContent>
        <TabsContent value="users" className="mt-4"><UsersTab /></TabsContent>
        <TabsContent value="company" className="mt-4"><CompanyTab /></TabsContent>
        <TabsContent value="notifications" className="mt-4"><NotificationsTab /></TabsContent>
        <TabsContent value="security" className="mt-4"><SecurityTab /></TabsContent>
      </Tabs>
    </div>
  )
}

// ============================================================
// Profile tab
// ============================================================
function ProfileTab() {
  const { user, setUser } = useAppStore()
  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)

  if (!user) return null

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      const body: any = { name, phone }
      if (password) body.password = password
      const res = await apiPut<{ user: UserRow }>(`/api/users/${user.id}`, body)
      setUser({
        ...user,
        name: res.user.name,
        phone: res.user.phone,
      })
      setPassword('')
      toast.success('Profile updated')
    } catch (e: any) {
      toast.error(e.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Account Overview</CardTitle>
          <CardDescription className="text-xs">Your signed-in identity</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center text-center gap-3 pt-2">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="bg-emerald-600 text-white text-2xl font-semibold">
              {user.name?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="text-base font-semibold text-foreground">{user.name}</div>
            <div className="text-xs text-muted-foreground">{user.email}</div>
          </div>
          <Badge className={`border ${ROLE_BADGE[user.role] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
            {ROLES[user.role as RoleKey] || user.role}
          </Badge>
          <div className="grid grid-cols-1 gap-2 w-full text-left pt-3 mt-2 border-t border-border/60">
            <Row label="Phone" value={user.phone || '—'} />
            <Row label="Member since" value={formatDate(new Date().toISOString())} />
            <Row label="Status" value={<Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 border">Active</Badge>} />
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2 border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Edit Profile</CardTitle>
          <CardDescription className="text-xs">Update your name, contact, or password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="p-name">Full name</Label>
              <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-email">Email</Label>
              <Input id="p-email" value={user.email} disabled className="bg-muted/50" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-phone">Phone</Label>
              <Input id="p-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+65 6XXX XXXX" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-role">Role</Label>
              <Input id="p-role" value={ROLES[user.role as RoleKey] || user.role} disabled className="bg-muted/50" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="p-pw">New password (optional)</Label>
              <Input id="p-pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Leave blank to keep current" />
              <p className="text-[11px] text-muted-foreground">Demo accounts use format <code>demo$&lt;plain&gt;</code>.</p>
            </div>
          </div>
          <div className="flex justify-end pt-2 border-t border-border/60">
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground text-right truncate">{value}</span>
    </div>
  )
}

// ============================================================
// Users tab (Admin only)
// ============================================================
function UsersTab() {
  const { user } = useAppStore()
  const { data, loading, refetch } = useFetch<{ users: UserRow[] }>('/api/users')
  const [addOpen, setAddOpen] = useState(false)
  const [editUser, setEditUser] = useState<UserRow | null>(null)
  const [deleteUser, setDeleteUser] = useState<UserRow | null>(null)

  if (!user) return null
  if (user.role !== 'Admin') {
    return (
      <Card className="border-border/60 shadow-sm">
        <CardContent className="py-12 flex flex-col items-center text-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <Lock className="h-7 w-7" />
          </div>
          <div>
            <div className="font-semibold text-foreground">Admins only</div>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              User management is restricted to administrators. Contact your AYK administrator if you need access.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const users: UserRow[] = data?.users || []

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4 text-emerald-600" /> User Management</CardTitle>
            <CardDescription className="text-xs">{users.length} registered user(s)</CardDescription>
          </div>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                <UserPlus className="h-4 w-4" /> Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <AddUserForm
                onClose={() => setAddOpen(false)}
                onCreated={() => { refetch(); setAddOpen(false) }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {loading ? (
          <div className="py-12 flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading users…
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh] ayk-scrollbar">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{u.email}</TableCell>
                    <TableCell>
                      <Badge className={`border ${ROLE_BADGE[u.role] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                        {ROLES[u.role as RoleKey] || u.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{u.phone || '—'}</TableCell>
                    <TableCell>
                      <Badge className={u.isActive ? 'bg-emerald-100 text-emerald-700 border-emerald-200 border' : 'bg-slate-100 text-slate-500 border-slate-200 border'}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(u.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setEditUser(u)} aria-label="Edit user" title="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteUser(u)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          aria-label="Deactivate user"
                          title="Deactivate"
                          disabled={!u.isActive}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>

      {/* Edit dialog */}
      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent>
          {editUser && (
            <EditUserForm
              user={editUser}
              onClose={() => setEditUser(null)}
              onSaved={() => { refetch(); setEditUser(null) }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Deactivate alert */}
      <AlertDialog open={!!deleteUser} onOpenChange={(o) => !o && setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark <strong>{deleteUser?.name}</strong> ({deleteUser?.email}) as inactive. They will no longer be able to log in. This action can be reversed later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={async (e) => {
                e.preventDefault()
                if (!deleteUser) return
                try {
                  await apiDelete(`/api/users/${deleteUser.id}`)
                  toast.success(`${deleteUser.name} deactivated`)
                  setDeleteUser(null)
                  refetch()
                } catch (err: any) {
                  toast.error(err.message || 'Failed to deactivate user')
                }
              }}
            >
              Yes, deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

function AddUserForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<RoleKey>('Worker')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!email || !name || !password || !role) {
      toast.error('Email, name, password and role are required')
      return
    }
    setSaving(true)
    try {
      await apiPost('/api/users', { email, name, password, role, phone })
      toast.success('User created')
      onCreated()
    } catch (e: any) {
      toast.error(e.message || 'Failed to create user')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2"><UserPlus className="h-4 w-4 text-emerald-600" /> Add User</DialogTitle>
        <DialogDescription>Create a new AYK system account</DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
        <div className="space-y-1.5">
          <Label htmlFor="add-name">Full name *</Label>
          <Input id="add-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Tan" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="add-email">Email *</Label>
          <Input id="add-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@ayk.com.sg" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="add-pw">Password *</Label>
          <Input id="add-pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Initial password" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="add-phone">Phone</Label>
          <Input id="add-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+65 9XXX XXXX" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="add-role">Role *</Label>
          <Select value={role} onValueChange={(v) => setRole(v as RoleKey)}>
            <SelectTrigger id="add-role" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(ROLES).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Create user
        </Button>
      </DialogFooter>
    </>
  )
}

function EditUserForm({ user, onClose, onSaved }: { user: UserRow; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(user.name)
  const [role, setRole] = useState<RoleKey>(user.role as RoleKey)
  const [phone, setPhone] = useState(user.phone || '')
  const [isActive, setIsActive] = useState(user.isActive)
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const body: any = { name, role, phone, isActive }
      if (password) body.password = password
      await apiPut(`/api/users/${user.id}`, body)
      toast.success('User updated')
      onSaved()
    } catch (e: any) {
      toast.error(e.message || 'Failed to update user')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2"><Pencil className="h-4 w-4 text-emerald-600" /> Edit User</DialogTitle>
        <DialogDescription>{user.email}</DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
        <div className="space-y-1.5">
          <Label htmlFor="ed-name">Full name</Label>
          <Input id="ed-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ed-phone">Phone</Label>
          <Input id="ed-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+65 9XXX XXXX" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ed-role">Role</Label>
          <Select value={role} onValueChange={(v) => setRole(v as RoleKey)}>
            <SelectTrigger id="ed-role" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(ROLES).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ed-pw">New password (optional)</Label>
          <Input id="ed-pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Leave blank to keep" />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-3 sm:col-span-2">
          <div>
            <div className="text-sm font-medium">Account active</div>
            <div className="text-xs text-muted-foreground">Inactive users cannot log in</div>
          </div>
          <Switch checked={isActive} onCheckedChange={setIsActive} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save changes
        </Button>
      </DialogFooter>
    </>
  )
}

// ============================================================
// Company tab (local-only)
// ============================================================
const COMPANY_LS_KEY = 'ayk-company-settings'

interface CompanySettings {
  name: string
  tagline: string
  address: string
  uen: string
  logo: string | null
}

function loadCompany(): CompanySettings {
  if (typeof window === 'undefined') {
    return { name: APP_NAME, tagline: APP_TAGLINE, address: '', uen: '', logo: null }
  }
  try {
    const raw = window.localStorage.getItem(COMPANY_LS_KEY)
    if (raw) return { ...{ name: APP_NAME, tagline: APP_TAGLINE, address: '', uen: '', logo: null }, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return { name: APP_NAME, tagline: APP_TAGLINE, address: '', uen: '', logo: null }
}

function CompanyTab() {
  const [form, setForm] = useState<CompanySettings>(() => loadCompany())
  const [saving, setSaving] = useState(false)

  const handleLogo = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setForm((f) => ({ ...f, logo: String(reader.result) }))
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    setSaving(true)
    try {
      window.localStorage.setItem(COMPANY_LS_KEY, JSON.stringify(form))
      toast.success('Company settings saved')
    } catch {
      toast.error('Failed to save company settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Logo Preview</CardTitle>
          <CardDescription className="text-xs">Shows on printed reports</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3">
          <div className="h-28 w-28 rounded-xl border-2 border-dashed border-border/60 flex items-center justify-center bg-emerald-50/40 overflow-hidden">
            {form.logo ? (
              <img src={form.logo} alt="Company logo" className="h-full w-full object-contain" />
            ) : (
              <Building2 className="h-10 w-10 text-emerald-600" />
            )}
          </div>
          <label className="cursor-pointer">
            <span className="inline-flex items-center justify-center gap-2 rounded-md border bg-background shadow-xs hover:bg-accent px-3 py-1.5 text-sm font-medium h-9">
              <Plus className="h-4 w-4" /> Upload
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogo(e.target.files?.[0])} />
          </label>
          {form.logo && (
            <Button variant="ghost" size="sm" onClick={() => setForm((f) => ({ ...f, logo: null }))} className="text-red-600 hover:text-red-700">
              Remove logo
            </Button>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2 border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4 text-emerald-600" /> Company Details</CardTitle>
          <CardDescription className="text-xs">Stored locally in your browser</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="c-name">Company name</Label>
            <Input id="c-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-tag">Tagline</Label>
            <Input id="c-tag" value={form.tagline} onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-addr">Address</Label>
            <Input id="c-addr" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="20 Ayer Rajah Crescent, Singapore 139964" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-uen">UEN (Singapore business reg. no.)</Label>
            <Input id="c-uen" value={form.uen} onChange={(e) => setForm((f) => ({ ...f, uen: e.target.value }))} placeholder="e.g. 201812345K" />
          </div>
          <div className="flex justify-end pt-2 border-t border-border/60">
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================
// Notifications tab (local-only)
// ============================================================
const NOTIF_LS_KEY = 'ayk-notification-toggles'

function loadNotif(): Record<string, boolean> {
  const defaults: Record<string, boolean> = {
    DelayedProject: true,
    LowStock: true,
    OverdueTask: true,
    SafetyIncident: true,
    PendingApproval: false,
    DailyProgress: true,
  }
  if (typeof window === 'undefined') return defaults
  try {
    const raw = window.localStorage.getItem(NOTIF_LS_KEY)
    if (raw) return { ...defaults, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return defaults
}

function NotificationsTab() {
  const [toggles, setToggles] = useState<Record<string, boolean>>(() => loadNotif())

  const updateToggle = useCallback((key: string, value: boolean) => {
    setToggles((prev) => {
      const next = { ...prev, [key]: value }
      try { window.localStorage.setItem(NOTIF_LS_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      toast.success(`${NOTIFICATION_TYPES[key as keyof typeof NOTIFICATION_TYPES] || key} ${value ? 'enabled' : 'disabled'}`)
      return next
    })
  }, [])

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4 text-emerald-600" /> Notification Preferences</CardTitle>
        <CardDescription className="text-xs">Choose which alerts you want to receive (stored locally)</CardDescription>
      </CardHeader>
      <CardContent className="pt-2 divide-y divide-border/60">
        {Object.entries(NOTIFICATION_TYPES).map(([key, label]) => (
          <div key={key} className="flex items-center justify-between py-3 gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">{label}</div>
                <div className="text-xs text-muted-foreground">Receive a notification when this event occurs</div>
              </div>
            </div>
            <Switch checked={!!toggles[key]} onCheckedChange={(v) => updateToggle(key, v)} />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// ============================================================
// Security tab
// ============================================================
function SecurityTab() {
  const { user } = useAppStore()
  const [cur, setCur] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [twofa, setTwofa] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleChange = async () => {
    if (!user) return
    if (!next || next.length < 4) { toast.error('New password is too short'); return }
    if (next !== confirm) { toast.error('Passwords do not match'); return }
    setSaving(true)
    try {
      // The API doesn't validate the current password; we simply update with new
      await apiPut(`/api/users/${user.id}`, { password: next })
      setCur(''); setNext(''); setConfirm('')
      toast.success('Password changed')
    } catch (e: any) {
      toast.error(e.message || 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><KeyRound className="h-4 w-4 text-emerald-600" /> Change Password</CardTitle>
          <CardDescription className="text-xs">Use at least 4 characters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="s-cur">Current password</Label>
            <Input id="s-cur" type="password" value={cur} onChange={(e) => setCur(e.target.value)} placeholder="Enter current password" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-next">New password</Label>
            <Input id="s-next" type="password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="Enter new password" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-conf">Confirm new password</Label>
            <Input id="s-conf" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter new password" />
          </div>
          <div className="flex justify-end pt-2 border-t border-border/60">
            <Button onClick={handleChange} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              Update password
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Two-Factor Authentication</CardTitle>
            <CardDescription className="text-xs">Add an extra layer of security</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3">
              <div>
                <div className="text-sm font-medium text-foreground">Authenticator app</div>
                <div className="text-xs text-muted-foreground">{twofa ? 'Enabled' : 'Disabled — UI only for this demo'}</div>
              </div>
              <Switch checked={twofa} onCheckedChange={setTwofa} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Session Info</CardTitle>
            <CardDescription className="text-xs">Current browser session</CardDescription>
          </CardHeader>
          <CardContent className="pt-2 space-y-2 text-sm">
            <Row label="Signed in as" value={user?.name || '—'} />
            <Row label="Email" value={user?.email || '—'} />
            <Row label="Role" value={ROLES[user?.role as RoleKey] || '—'} />
            <Row label="Session" value={<Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 border">Active</Badge>} />
            <Row label="Cookie" value={<code className="text-xs">ayk_session</code>} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


