'use client'
import { useState, useEffect, useMemo } from 'react'
import { useAppStore } from '@/store/app-store'
import { useFetch, apiPost } from '@/hooks/use-fetch'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Sun, Plus, Trash2, MapPin, Camera, CheckCircle2, ArrowLeft, Loader2, ClipboardList } from 'lucide-react'
import { SITE_STATUSES, formatNumber } from '@/lib/constants'
import { toast } from 'sonner'

const EQUIPMENT_OPTIONS = ['Crane', 'Drill Rig', 'Torque Wrench', 'Lift', 'Scaffold', 'Generator', 'Other']

interface PhotoFile {
  name: string
  url: string
}

export function DailyEntryPage() {
  const { setNav } = useAppStore()

  // Projects list
  const { data: projectsData, loading: projectsLoading } = useFetch<{ projects: any[] }>('/api/projects')
  const projects = projectsData?.projects || []

  // Recent submissions
  const { data: recentData, loading: recentLoading, refetch: refetchRecent } = useFetch<{ entries: any[] }>('/api/progress?limit=5')
  const recentEntries = recentData?.entries || []

  // ----- form state -----
  const today = useMemo(() => new Date().toISOString().split('T')[0], [])
  const [projectId, setProjectId] = useState('')
  const [date, setDate] = useState(today)
  const [installedPanels, setInstalledPanels] = useState('')
  const [totalInstalled, setTotalInstalled] = useState('')
  const [totalEdited, setTotalEdited] = useState(false)
  const [manHours, setManHours] = useState('')
  const [workers, setWorkers] = useState('')
  const [materials, setMaterials] = useState<{ name: string; qty: string }[]>([{ name: '', qty: '' }])
  const [equipment, setEquipment] = useState<string[]>([])
  const [workCompleted, setWorkCompleted] = useState('')
  const [workPending, setWorkPending] = useState('')
  const [siteStatus, setSiteStatus] = useState<string>('Normal')
  const [remarks, setRemarks] = useState('')
  const [photos, setPhotos] = useState<PhotoFile[]>([])
  const [gpsLocation, setGpsLocation] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Fetch last entry for this project (for prefilling totalInstalled)
  const lastEntryUrl = projectId ? `/api/progress?projectId=${projectId}&limit=1` : null
  const { data: lastEntryData } = useFetch<{ entries: any[] }>(lastEntryUrl)
  const lastEntry = lastEntryData?.entries?.[0]

  // Auto-suggest totalInstalled when installedPanels or lastEntry changes (unless user edited manually)
  useEffect(() => {
    if (totalEdited) return
    const installed = Number(installedPanels) || 0
    const lastTotal = lastEntry ? Number(lastEntry.totalInstalled) || 0 : 0
    setTotalInstalled(String(lastTotal + installed))
  }, [lastEntry, installedPanels, totalEdited])

  // Reset totalEdited flag when project changes (so prefill resumes)
  useEffect(() => {
    setTotalEdited(false)
  }, [projectId])

  // ----- handlers -----
  const handleInstalledChange = (v: string) => {
    setInstalledPanels(v)
  }

  const handleTotalChange = (v: string) => {
    setTotalInstalled(v)
    setTotalEdited(true)
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const newPhotos: PhotoFile[] = files.map(f => ({
      name: f.name,
      url: URL.createObjectURL(f),
    }))
    setPhotos(prev => [...prev, ...newPhotos])
    e.target.value = '' // allow re-adding the same file
  }

  const removePhoto = (idx: number) => {
    setPhotos(prev => {
      const removed = prev[idx]
      if (removed) URL.revokeObjectURL(removed.url)
      return prev.filter((_, i) => i !== idx)
    })
  }

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported on this device')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLocation(`${pos.coords.latitude.toFixed(6)},${pos.coords.longitude.toFixed(6)}`)
        toast.success('Location captured')
      },
      (err) => {
        toast.error('Could not get location: ' + err.message)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const toggleEquipment = (e: string) => {
    setEquipment(prev => (prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]))
  }

  const addMaterialRow = () => setMaterials(prev => [...prev, { name: '', qty: '' }])
  const removeMaterialRow = (idx: number) =>
    setMaterials(prev => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev))
  const updateMaterial = (idx: number, field: 'name' | 'qty', value: string) => {
    setMaterials(prev => prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)))
  }

  const resetForm = () => {
    setProjectId('')
    setDate(today)
    setInstalledPanels('')
    setTotalInstalled('')
    setTotalEdited(false)
    setManHours('')
    setWorkers('')
    setMaterials([{ name: '', qty: '' }])
    setEquipment([])
    setWorkCompleted('')
    setWorkPending('')
    setSiteStatus('Normal')
    setRemarks('')
    setPhotos([])
    setGpsLocation('')
  }

  const handleSubmit = async () => {
    if (!projectId) {
      toast.error('Please select a project')
      return
    }
    if (!date) {
      toast.error('Please select a date')
      return
    }
    setSubmitting(true)
    try {
      // Convert materials rows to a key-value object (filter empty names)
      const materialsObj: Record<string, string> = {}
      materials.forEach(m => {
        if (m.name.trim()) materialsObj[m.name.trim()] = m.qty.trim()
      })

      await apiPost('/api/progress', {
        projectId,
        date,
        installedPanels: Number(installedPanels) || 0,
        totalInstalled: Number(totalInstalled) || 0,
        manHours: Number(manHours) || 0,
        workers: Number(workers) || 0,
        materialsUsed: Object.keys(materialsObj).length ? materialsObj : null,
        equipmentUsed: equipment.length ? equipment : null,
        workCompleted: workCompleted || null,
        workPending: workPending || null,
        siteStatus,
        remarks: remarks || null,
        photoUrls: photos.length ? photos.map(p => p.name) : null,
        gpsLocation: gpsLocation || null,
      })
      toast.success('Progress submitted')
      setSubmitted(true)
      resetForm()
      refetchRecent()
    } catch (e: any) {
      toast.error(e.message || 'Failed to submit progress')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Daily Progress Entry"
        description="Submit today's site progress"
        icon={<Sun className="h-5 w-5" />}
        actions={
          <Button variant="outline" onClick={() => setNav('progress')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Progress
          </Button>
        }
      />

      {/* Success banner */}
      {submitted && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-emerald-800">Progress entry submitted successfully!</p>
              <p className="text-xs text-emerald-700">
                The project&apos;s installed panel count and installation stage progress have been updated.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSubmitted(false)}
              className="border-emerald-300 text-emerald-700 hover:bg-emerald-100 shrink-0"
            >
              Submit Another
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Form card */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Site Progress Form</CardTitle>
          <CardDescription className="text-xs">
            Site supervisors should submit this form by end of day. All fields marked <span className="text-red-500">*</span> are required.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Project + Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Project <span className="text-red-500">*</span></Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projectsLoading ? (
                    <SelectItem value="_loading" disabled>Loading…</SelectItem>
                  ) : projects.length === 0 ? (
                    <SelectItem value="_empty" disabled>No projects available</SelectItem>
                  ) : (
                    projects.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">Date</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1" />
            </div>
          </div>

          {/* Installed + Total */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Installed Panels Today</Label>
              <Input
                type="number"
                min={0}
                value={installedPanels}
                onChange={e => handleInstalledChange(e.target.value)}
                placeholder="0"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Total Installed Quantity</Label>
              <Input
                type="number"
                min={0}
                value={totalInstalled}
                onChange={e => handleTotalChange(e.target.value)}
                placeholder="0 (running total)"
                className="mt-1"
              />
              {lastEntry ? (
                <p className="text-[10px] text-muted-foreground mt-1">
                  Auto-suggested: {formatNumber(Number(lastEntry.totalInstalled) || 0)} (last) + {Number(installedPanels) || 0} (today)
                </p>
              ) : (
                <p className="text-[10px] text-muted-foreground mt-1">No previous entry — enter running total manually</p>
              )}
            </div>
          </div>

          {/* Man-hours + Workers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Man-hours</Label>
              <Input
                type="number"
                step={0.1}
                min={0}
                value={manHours}
                onChange={e => setManHours(e.target.value)}
                placeholder="0.0"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Number of Workers</Label>
              <Input
                type="number"
                min={0}
                value={workers}
                onChange={e => setWorkers(e.target.value)}
                placeholder="0"
                className="mt-1"
              />
            </div>
          </div>

          {/* Materials used */}
          <div>
            <Label className="text-sm font-medium">Materials Used</Label>
            <div className="mt-1 space-y-2">
              {materials.map((m, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder="Material name"
                    value={m.name}
                    onChange={e => updateMaterial(i, 'name', e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Qty"
                    value={m.qty}
                    onChange={e => updateMaterial(i, 'qty', e.target.value)}
                    className="w-24"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeMaterialRow(i)}
                    disabled={materials.length === 1}
                    aria-label="Remove material row"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addMaterialRow} className="mt-2">
              <Plus className="h-4 w-4 mr-1" /> Add row
            </Button>
          </div>

          {/* Equipment used */}
          <div>
            <Label className="text-sm font-medium">Equipment Used</Label>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {EQUIPMENT_OPTIONS.map(e => (
                <label
                  key={e}
                  className="flex items-center gap-2 text-sm cursor-pointer rounded-md border border-slate-200 px-3 py-2 hover:bg-slate-50 transition"
                >
                  <Checkbox checked={equipment.includes(e)} onCheckedChange={() => toggleEquipment(e)} />
                  <span>{e}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Work completed / pending */}
          <div>
            <Label className="text-sm font-medium">Work Completed</Label>
            <Textarea
              value={workCompleted}
              onChange={e => setWorkCompleted(e.target.value)}
              placeholder="Describe what was done today…"
              className="mt-1 min-h-[80px]"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">Work Pending</Label>
            <Textarea
              value={workPending}
              onChange={e => setWorkPending(e.target.value)}
              placeholder="Pending tasks for next day…"
              className="mt-1 min-h-[80px]"
            />
          </div>

          {/* Site status */}
          <div>
            <Label className="text-sm font-medium">Site Status</Label>
            <Select value={siteStatus} onValueChange={setSiteStatus}>
              <SelectTrigger className="w-full mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SITE_STATUSES.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Remarks */}
          <div>
            <Label className="text-sm font-medium">Remarks</Label>
            <Textarea
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="Any additional notes for today…"
              className="mt-1 min-h-[60px]"
            />
          </div>

          {/* Photos */}
          <div>
            <Label className="text-sm font-medium">Photos</Label>
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <label className="inline-flex items-center gap-2 cursor-pointer rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 px-3 py-2 text-sm hover:bg-emerald-100 transition">
                <Camera className="h-4 w-4" /> Add Photos
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </label>
              {photos.length > 0 && (
                <span className="text-xs text-muted-foreground">{photos.length} photo(s) selected</span>
              )}
            </div>
            {photos.length > 0 && (
              <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
                {photos.map((p, i) => (
                  <div key={i} className="relative group aspect-square rounded-md overflow-hidden border border-slate-200">
                    <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded p-1 opacity-0 group-hover:opacity-100 transition"
                      aria-label={`Remove ${p.name}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                    <p className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-1 py-0.5 truncate">
                      {p.name}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* GPS Location */}
          <div>
            <Label className="text-sm font-medium">GPS / Site Location</Label>
            <div className="mt-1 flex gap-2">
              <Input
                value={gpsLocation}
                onChange={e => setGpsLocation(e.target.value)}
                placeholder="lat,lng or site name"
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={getLocation}>
                <MapPin className="h-4 w-4 mr-1" /> Get Location
              </Button>
            </div>
            {gpsLocation && (
              <p className="text-[10px] text-muted-foreground mt-1">Captured: {gpsLocation}</p>
            )}
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={submitting || !projectId}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting…
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" /> Submit Progress
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Recent submissions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-emerald-600" /> Recent Submissions
          </CardTitle>
          <CardDescription className="text-xs">Last 5 progress entries across all projects</CardDescription>
        </CardHeader>
        <CardContent>
          {recentLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 bg-slate-100 rounded animate-pulse" />
              ))}
            </div>
          ) : recentEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No recent submissions yet</p>
          ) : (
            <div className="space-y-2">
              {recentEntries.map((e: any) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 hover:bg-slate-50 transition"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-slate-900 truncate">{e.project?.name || '—'}</span>
                      <StatusBadge status={e.siteStatus} />
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {new Date(e.date).toLocaleDateString('en-SG', { day: '2-digit', month: 'short', year: 'numeric' })}{' '}
                      • {formatNumber(e.installedPanels || 0)} panels installed
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground text-right shrink-0 ml-3">
                    <div className="truncate max-w-[120px]">{e.submittedBy?.name || '—'}</div>
                    <div className="tabular-nums font-medium text-slate-700">{formatNumber(e.totalInstalled || 0)} total</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
