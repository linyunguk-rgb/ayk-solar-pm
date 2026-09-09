'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAppStore } from '@/store/app-store'
import { useFetch, apiPost } from '@/hooks/use-fetch'
import { SectionHeader, SubSection } from '@/components/shared/section-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState, CardSkeleton } from '@/components/shared/empty-state'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Sun, Plus, Trash2, MapPin, Camera, CheckCircle2, ArrowLeft, Loader2,
  ClipboardList, FolderKanban, Package, FileText, UploadCloud, AlertTriangle,
} from 'lucide-react'
import { SITE_STATUSES, formatNumber, formatDate } from '@/lib/constants'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const EQUIPMENT_OPTIONS = ['Crane', 'Drill Rig', 'Torque Wrench', 'Lift', 'Scaffold', 'Generator', 'Other']

interface PhotoFile {
  name: string
  url: string
}

const INPUT_CLS = 'h-11'

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
  const [dragOver, setDragOver] = useState(false)

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

  const addPhotoFiles = useCallback((files: File[]) => {
    if (!files.length) return
    const newPhotos: PhotoFile[] = files.map(f => ({
      name: f.name,
      url: URL.createObjectURL(f),
    }))
    setPhotos(prev => [...prev, ...newPhotos])
  }, [])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    addPhotoFiles(files)
    e.target.value = '' // allow re-adding the same file
  }

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files || []).filter(f => f.type.startsWith('image/'))
    if (!files.length) return
    addPhotoFiles(files)
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
    <div className="space-y-6">
      <SectionHeader
        section="dailyEntry"
        title="Daily Progress Entry"
        description="Submit today's site progress from the field"
        icon={<Sun className="h-6 w-6" />}
        actions={
          <Button variant="outline" onClick={() => setNav('progress')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Progress
          </Button>
        }
      />

      {/* Success banner */}
      {submitted && (
        <Card className="border-emerald-200 bg-emerald-50 max-w-2xl mx-auto">
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
      <Card className="max-w-2xl mx-auto border-amber-200/60">
        <CardContent className="p-4 sm:p-6 space-y-7">
          {/* Project & Date */}
          <div>
            <SubSection
              section="dailyEntry"
              title="Project & Date"
              description="Which project and which day"
              icon={<FolderKanban className="h-4 w-4" />}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Project <span className="text-red-500">*</span></Label>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger className={cn('w-full mt-1 h-11')}>
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
                <Label className="text-sm font-medium">Date <span className="text-red-500">*</span></Label>
                <Input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className={cn('mt-1', INPUT_CLS)}
                />
              </div>
            </div>
          </div>

          {/* Production */}
          <div>
            <SubSection
              section="dailyEntry"
              title="Production"
              description="Panels installed and labour"
              icon={<Sun className="h-4 w-4" />}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Installed Panels Today</Label>
                <Input
                  type="number"
                  min={0}
                  value={installedPanels}
                  onChange={e => handleInstalledChange(e.target.value)}
                  placeholder="0"
                  className={cn('mt-1', INPUT_CLS)}
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
                  className={cn('mt-1', INPUT_CLS)}
                />
                {lastEntry ? (
                  <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200/60 rounded px-2 py-1 mt-1.5 flex items-center gap-1.5">
                    <Sun className="h-3 w-3 shrink-0" />
                    <span>Auto-suggested: <strong className="font-semibold">{formatNumber(Number(lastEntry.totalInstalled) || 0)}</strong> (last) + <strong className="font-semibold">{formatNumber(Number(installedPanels) || 0)}</strong> (today)</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-muted-foreground mt-1">No previous entry — enter running total manually</p>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium">Man-hours</Label>
                <Input
                  type="number"
                  step={0.1}
                  min={0}
                  value={manHours}
                  onChange={e => setManHours(e.target.value)}
                  placeholder="0.0"
                  className={cn('mt-1', INPUT_CLS)}
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
                  className={cn('mt-1', INPUT_CLS)}
                />
              </div>
            </div>
          </div>

          {/* Materials & Equipment */}
          <div>
            <SubSection
              section="dailyEntry"
              title="Materials & Equipment"
              description="What was used today"
              icon={<Package className="h-4 w-4" />}
            />
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Materials Used</Label>
                <div className="mt-1 space-y-2">
                  {materials.map((m, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        placeholder="Material name"
                        value={m.name}
                        onChange={e => updateMaterial(i, 'name', e.target.value)}
                        className={cn('flex-1', INPUT_CLS)}
                      />
                      <Input
                        placeholder="Qty"
                        value={m.qty}
                        onChange={e => updateMaterial(i, 'qty', e.target.value)}
                        className={cn('w-24', INPUT_CLS)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeMaterialRow(i)}
                        disabled={materials.length === 1}
                        aria-label="Remove material row"
                        className="h-11 w-11 shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addMaterialRow} className="mt-2 border-amber-200 text-amber-700 hover:bg-amber-50">
                  <Plus className="h-4 w-4 mr-1" /> Add row
                </Button>
              </div>

              <div>
                <Label className="text-sm font-medium">Equipment Used</Label>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {EQUIPMENT_OPTIONS.map(e => {
                    const checked = equipment.includes(e)
                    return (
                      <label
                        key={e}
                        className={cn(
                          'flex items-center gap-2 text-sm cursor-pointer rounded-md border px-3 py-2.5 hover:bg-amber-50 transition-colors select-none',
                          checked ? 'border-amber-300 bg-amber-50' : 'border-slate-200'
                        )}
                      >
                        <Checkbox checked={checked} onCheckedChange={() => toggleEquipment(e)} />
                        <span>{e}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Work Details */}
          <div>
            <SubSection
              section="dailyEntry"
              title="Work Details"
              description="What was done and what's pending"
              icon={<FileText className="h-4 w-4" />}
            />
            <div className="space-y-4">
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
              <div>
                <Label className="text-sm font-medium">Site Status</Label>
                <Select value={siteStatus} onValueChange={setSiteStatus}>
                  <SelectTrigger className={cn('w-full mt-1 h-11')}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SITE_STATUSES.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Site Info */}
          <div>
            <SubSection
              section="dailyEntry"
              title="Site Info"
              description="Remarks, location and photos"
              icon={<MapPin className="h-4 w-4" />}
            />
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Remarks</Label>
                <Textarea
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  placeholder="Any additional notes for today…"
                  className="mt-1 min-h-[60px]"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">GPS / Site Location</Label>
                <div className="mt-1 flex gap-2">
                  <Input
                    value={gpsLocation}
                    onChange={e => setGpsLocation(e.target.value)}
                    placeholder="lat,lng or site name"
                    className={cn('flex-1', INPUT_CLS)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={getLocation}
                    className="border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800 h-11 shrink-0"
                  >
                    <MapPin className="h-4 w-4 mr-1" /> Get Location
                  </Button>
                </div>
                {gpsLocation && (
                  <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-amber-600" /> Captured: <span className="font-mono">{gpsLocation}</span>
                  </p>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium">Photos</Label>
                <label
                  htmlFor="photo-upload"
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={cn(
                    'mt-1 flex flex-col items-center justify-center text-center cursor-pointer rounded-xl border-2 border-dashed px-4 py-6 transition-colors',
                    dragOver
                      ? 'border-amber-400 bg-amber-50'
                      : 'border-amber-200 bg-amber-50/40 hover:bg-amber-50 hover:border-amber-300'
                  )}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 mb-2">
                    <Camera className="h-6 w-6" />
                  </div>
                  <div className="text-sm font-medium text-amber-800 flex items-center gap-1.5">
                    <UploadCloud className="h-4 w-4" /> Tap to take a photo or drag &amp; drop
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">PNG/JPG · On mobile this opens the camera</div>
                  <input
                    id="photo-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </label>
                {photos.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {photos.map((p, i) => (
                      <div key={i} className="relative group aspect-square rounded-md overflow-hidden border border-amber-200 bg-slate-100">
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
                {photos.length > 0 && (
                  <p className="text-[11px] text-muted-foreground mt-2">
                    {photos.length} photo{photos.length === 1 ? '' : 's'} selected
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <Button
              onClick={handleSubmit}
              disabled={submitting || !projectId}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white h-12 text-base font-semibold gap-2 shadow-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Submitting…
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" /> Submit Progress
                </>
              )}
            </Button>
            {!projectId && (
              <p className="text-[11px] text-amber-700 mt-2 flex items-center justify-center gap-1.5">
                <AlertTriangle className="h-3 w-3" /> Please select a project to enable submit
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent submissions */}
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-4 sm:p-6">
          <SubSection
            section="dailyEntry"
            title="Recent Submissions"
            description="Last 5 progress entries across all projects"
            icon={<ClipboardList className="h-4 w-4" />}
          />
          {recentLoading && recentEntries.length === 0 ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <CardSkeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : recentEntries.length === 0 ? (
            <EmptyState
              icon={<ClipboardList className="h-6 w-6" />}
              title="No recent submissions yet"
              description="Once you submit a progress entry, it will show up here."
            />
          ) : (
            <ul className="space-y-2">
              {recentEntries.map((e: any) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 hover:bg-amber-50/40 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-slate-900 truncate">{e.project?.name || '—'}</span>
                      <StatusBadge status={e.siteStatus} />
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(e.date)}{' '}
                      • {formatNumber(e.installedPanels || 0)} panels installed
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground text-right shrink-0 ml-3">
                    <div className="truncate max-w-[120px]">{e.submittedBy?.name || '—'}</div>
                    <div className="tabular-nums font-medium text-slate-700">{formatNumber(e.totalInstalled || 0)} total</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
