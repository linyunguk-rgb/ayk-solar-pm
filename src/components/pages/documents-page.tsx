'use client'
import { useState, useMemo, useRef } from 'react'
import { useAppStore } from '@/store/app-store'
import { useFetch, apiPost, apiDelete } from '@/hooks/use-fetch'
import { SectionHeader, SubSection } from '@/components/shared/section-header'
import { StatCard } from '@/components/shared/stat-card'
import { EmptyState } from '@/components/shared/empty-state'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  FileText, Image as ImageIcon, File, Upload, Download, Trash2, Eye, Search, Plus,
  FolderOpen, FileCheck, FileSpreadsheet, HardHat, FileWarning, ShieldCheck, Library, ClipboardList,
} from 'lucide-react'
import {
  DOCUMENT_CATEGORIES, formatDate,
} from '@/lib/constants'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

/* ---- Category labels (human-readable) ---- */
const CATEGORY_LABELS: Record<string, string> = {
  Drawings: 'Drawings',
  Permits: 'Permits',
  MethodStatements: 'Method Statements',
  RiskAssessments: 'Risk Assessments',
  Certificates: 'Certificates',
  Inspection: 'Inspection',
  Photos: 'Photos',
  Reports: 'Reports',
}

/* ---- Category icon + accent per category (per design spec) ----
   Drawings=sky, Permits=violet, MethodStatements=amber, RiskAssessments=red,
   Certificates=emerald, Inspection=cyan, Photos=pink, Reports=slate */
const CATEGORY_META: Record<string, { icon: any; cls: string }> = {
  Drawings: { icon: FileText, cls: 'bg-sky-50 text-sky-600' },
  Permits: { icon: FileCheck, cls: 'bg-violet-50 text-violet-600' },
  MethodStatements: { icon: ClipboardList, cls: 'bg-amber-50 text-amber-600' },
  RiskAssessments: { icon: FileWarning, cls: 'bg-red-50 text-red-600' },
  Certificates: { icon: ShieldCheck, cls: 'bg-emerald-50 text-emerald-600' },
  Inspection: { icon: HardHat, cls: 'bg-cyan-50 text-cyan-600' },
  Photos: { icon: ImageIcon, cls: 'bg-pink-50 text-pink-600' },
  Reports: { icon: FileSpreadsheet, cls: 'bg-slate-100 text-slate-600' },
}

/* ---- File-type icon (per doc.fileType) ----
   pdf=red, image=sky, spreadsheet=emerald, word=blue, other=slate */
function FileTypeIcon({ fileType, className }: { fileType: string; className?: string }) {
  const t = (fileType || '').toLowerCase()
  if (t.startsWith('image')) return <ImageIcon className={cn('h-7 w-7 text-sky-600', className)} />
  if (t.includes('pdf')) return <FileText className={cn('h-7 w-7 text-red-500', className)} />
  if (t.includes('sheet') || t.includes('excel') || t.includes('csv')) return <FileSpreadsheet className={cn('h-7 w-7 text-emerald-600', className)} />
  if (t.includes('word') || t.includes('document')) return <FileText className={cn('h-7 w-7 text-blue-600', className)} />
  return <File className={cn('h-7 w-7 text-slate-500', className)} />
}

function formatFileSize(bytes: number | undefined | null): string {
  if (!bytes || bytes <= 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export function DocumentsPage() {
  const { user } = useAppStore()

  // Filters
  const [projFilter, setProjFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  // Dialogs
  const [uploadOpen, setUploadOpen] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<any | null>(null)

  // Map of uploaded object URLs keyed by doc name (so preview can show real image)
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({})

  const { data: projData } = useFetch<any>('/api/projects')
  const projects = projData?.projects || []

  const docUrl = `/api/documents?projectId=${projFilter}&category=${categoryFilter}`
  const { data: docData, loading: docLoading, refetch: refetchDocs } = useFetch<any>(docUrl)
  const documents: any[] = docData?.documents || []

  // Apply search locally (search by name)
  const filteredDocs = useMemo(() => {
    if (!search.trim()) return documents
    const q = search.trim().toLowerCase()
    return documents.filter(d => (d.name || '').toLowerCase().includes(q))
  }, [documents, search])

  // ----- Stats -----
  const stats = useMemo(() => {
    const total = documents?.length ?? 0
    const byCat: Record<string, number> = {}
    for (const d of documents || []) byCat[d.category] = (byCat[d.category] || 0) + 1
    let topCat = '—'
    let topCount = 0
    for (const [k, v] of Object.entries(byCat)) {
      if (v > topCount) { topCount = v; topCat = CATEGORY_LABELS[k] || k }
    }
    const photos = byCat.Photos || 0
    const reports = byCat.Reports || 0
    return { total, topCat, topCount, photos, reports }
  }, [documents])

  // ----- Per-category counts (for category cards) -----
  const categoryCounts = useMemo(() => {
    const m: Record<string, number> = {}
    for (const d of documents || []) m[d.category] = (m[d.category] || 0) + 1
    return m
  }, [documents])

  return (
    <div className="space-y-6">
      <SectionHeader
        section="documents"
        title="Document Management"
        description="Upload, organize and share project documents"
        icon={<FileText className="h-6 w-6" />}
        actions={
          <Button onClick={() => setUploadOpen(true)} className="bg-teal-600 hover:bg-teal-700 text-white">
            <Upload className="h-4 w-4 mr-2" /> Upload Document
          </Button>
        }
      />

      {/* Library Summary — KPI grid */}
      <div>
        <SubSection
          section="documents"
          title="Library Summary"
          description="Overview of all uploaded project documents"
          icon={<Library className="h-4 w-4" />}
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            title="Total Documents"
            value={stats.total ?? 0}
            subtitle="All categories"
            icon={<FileText className="h-5 w-5" />}
            section="documents"
          />
          <StatCard
            title="Top Category"
            value={stats.topCat}
            subtitle={stats.topCount > 0 ? `${stats.topCount} documents` : '—'}
            icon={<FolderOpen className="h-5 w-5" />}
            section="documents"
          />
          <StatCard
            title="Photos"
            value={stats.photos ?? 0}
            subtitle="Site photos"
            icon={<ImageIcon className="h-5 w-5" />}
            section="documents"
          />
          <StatCard
            title="Reports"
            value={stats.reports ?? 0}
            subtitle="Generated reports"
            icon={<FileSpreadsheet className="h-5 w-5" />}
            section="documents"
          />
        </div>
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs">Project</Label>
              <Select value={projFilter} onValueChange={setProjFilter}>
                <SelectTrigger className="w-full"><SelectValue placeholder="All projects" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs">Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full"><SelectValue placeholder="All categories" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {DOCUMENT_CATEGORIES.map(c => <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs">Search</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name…"
                  className="pl-8"
                />
              </div>
            </div>
            <Button onClick={() => setUploadOpen(true)} className="bg-teal-600 hover:bg-teal-700 text-white sm:w-auto w-full">
              <Plus className="h-4 w-4 mr-2" /> Upload
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Category cards row */}
      <div>
        <SubSection
          section="documents"
          title="Browse by Category"
          description="Tap a category to filter"
          icon={<FolderOpen className="h-4 w-4" />}
        />
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {DOCUMENT_CATEGORIES.map(cat => {
            const meta = CATEGORY_META[cat]
            const Icon = meta.icon
            const count = categoryCounts[cat] || 0
            const active = categoryFilter === cat
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(active ? 'all' : cat)}
                className={cn(
                  'text-left rounded-xl border bg-white p-3 transition hover:shadow-md',
                  active ? 'border-teal-400 ring-2 ring-teal-100' : 'border-border/60'
                )}
              >
                <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg mb-2', meta.cls)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-xs font-medium text-muted-foreground truncate leading-tight">{CATEGORY_LABELS[cat]}</div>
                <div className="text-lg font-bold text-slate-900 tabular-nums">{count}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Documents grid */}
      {docLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse"><CardContent className="p-5 h-44" /></Card>
          ))}
        </div>
      ) : filteredDocs.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={<FileText className="h-6 w-6" />}
              title="No documents found"
              description="Try adjusting filters or upload a new document."
              action={
                <Button onClick={() => setUploadOpen(true)} className="bg-teal-600 hover:bg-teal-700 text-white">
                  <Upload className="h-4 w-4 mr-2" /> Upload Document
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredDocs.map((doc: any) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              previewUrl={previewUrls[doc.name]}
              onPreview={() => setPreviewDoc({ ...doc, url: previewUrls[doc.name] })}
              onDownload={() => toast.info('Download started (demo)')}
              onDeleted={async () => {
                try {
                  await apiDelete(`/api/documents/${doc.id}`)
                  toast.success('Document deleted')
                  refetchDocs()
                } catch (e: any) {
                  toast.error(e.message || 'Failed to delete')
                }
              }}
            />
          ))}
        </div>
      )}

      {/* ============== UPLOAD DIALOG ============== */}
      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        projects={projects}
        onUploaded={(name, objectUrl) => {
          if (objectUrl) setPreviewUrls(prev => ({ ...prev, [name]: objectUrl }))
          refetchDocs()
        }}
      />

      {/* ============== PREVIEW DIALOG ============== */}
      <Dialog open={!!previewDoc} onOpenChange={(o) => { if (!o) setPreviewDoc(null) }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 truncate">
              <FileText className="h-4 w-4 shrink-0 text-teal-600" />
              <span className="truncate">{previewDoc?.name}</span>
            </DialogTitle>
            <DialogDescription>
              {previewDoc?.category && CATEGORY_LABELS[previewDoc.category]}{previewDoc?.project?.name ? ` · ${previewDoc.project.name}` : ''}
            </DialogDescription>
          </DialogHeader>
          <PreviewBody doc={previewDoc} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDoc(null)}>Close</Button>
            <Button
              className="bg-teal-600 hover:bg-teal-700 text-white"
              onClick={() => toast.info('Download started (demo)')}
            >
              <Download className="h-4 w-4 mr-2" /> Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ----------------------------------------------------------------- */
/* Sub-components                                                     */
/* ----------------------------------------------------------------- */

function PreviewBody({ doc }: { doc: any | null }) {
  if (!doc) return null
  const ft = (doc.fileType || '').toLowerCase()
  if (ft.startsWith('image')) {
    if (doc.url) {
      return (
        <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center min-h-[260px]">
          <img src={doc.url} alt={doc.name} className="max-h-[60vh] w-auto object-contain" />
        </div>
      )
    }
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-muted-foreground">
        <ImageIcon className="h-10 w-10 mx-auto mb-2 text-slate-300" />
        Preview not available for demo.
      </div>
    )
  }
  if (ft.includes('pdf')) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center text-sm text-muted-foreground">
        <FileText className="h-10 w-10 mx-auto mb-2 text-red-400" />
        <p className="font-medium text-slate-700 mb-1">PDF Document</p>
        <p className="mb-3">In-browser PDF viewer is not available in this demo.</p>
        <Button
          variant="outline"
          onClick={() => toast.info('Open in viewer (demo) — would launch PDF viewer in production')}
        >
          <Eye className="h-4 w-4 mr-2" /> Open in viewer
        </Button>
      </div>
    )
  }
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center text-sm text-muted-foreground">
      <File className="h-10 w-10 mx-auto mb-2 text-slate-300" />
      Preview not available for this file type.
    </div>
  )
}

function DocumentCard({
  doc, previewUrl, onPreview, onDownload, onDeleted,
}: {
  doc: any
  previewUrl?: string
  onPreview: () => void
  onDownload: () => void
  onDeleted: () => void
}) {
  const meta = CATEGORY_META[doc.category] || CATEGORY_META.Reports
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow border-border/60 flex flex-col">
      <CardContent className="p-4 sm:p-5 flex-1 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-lg', meta.cls)}>
            <FileTypeIcon fileType={doc.fileType || ''} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-slate-900 truncate leading-tight" title={doc.name}>{doc.name}</h3>
            <Badge variant="outline" className={cn('mt-1 font-medium', meta.cls, 'border-transparent')}>
              {CATEGORY_LABELS[doc.category] || doc.category}
            </Badge>
          </div>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          {doc.project?.name && (
            <div className="flex items-center gap-1 truncate">
              <FolderOpen className="h-3 w-3 shrink-0" /> {doc.project.name}
            </div>
          )}
          <div className="flex items-center gap-1 truncate">
            <Upload className="h-3 w-3 shrink-0" /> {doc.uploadedByName || 'Unknown'}
          </div>
          <div className="flex items-center gap-1 truncate">
            <File className="h-3 w-3 shrink-0" /> {formatFileSize(doc.fileSize)} · {formatDate(doc.createdAt)}
          </div>
        </div>

        {doc.description && (
          <p className="text-xs text-slate-600 line-clamp-2">{doc.description}</p>
        )}

        <div className="flex items-center gap-1.5 pt-2 mt-auto border-t border-slate-100">
          <Button size="sm" variant="ghost" className="h-8 text-xs flex-1 text-teal-700 hover:bg-teal-50" onClick={onPreview}>
            <Eye className="h-3.5 w-3.5 mr-1" /> Preview
          </Button>
          <Button size="sm" variant="ghost" className="h-8 text-xs flex-1 text-sky-700 hover:bg-sky-50" onClick={onDownload}>
            <Download className="h-3.5 w-3.5 mr-1" /> Download
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8 text-xs text-red-600 hover:bg-red-50">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete document?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete <span className="font-medium text-slate-900">{doc.name}</span>. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDeleted}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  )
}

function UploadDialog({
  open, onOpenChange, projects, onUploaded,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  projects: any[]
  onUploaded: (name: string, objectUrl: string | null) => void
}) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<string>('Drawings')
  const [projectId, setProjectId] = useState<string>('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setName(''); setCategory('Drawings'); setProjectId(''); setDescription('')
    setFile(null)
    if (objectUrl) URL.revokeObjectURL(objectUrl)
    setObjectUrl(null)
    setProgress(0); setUploading(false); setDragOver(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleFile = (f: File) => {
    setFile(f)
    if (!name) setName(f.name.replace(/\.[^.]+$/, ''))
    // create object URL for preview if image
    if (objectUrl) URL.revokeObjectURL(objectUrl)
    const url = f.type.startsWith('image') ? URL.createObjectURL(f) : null
    setObjectUrl(url)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }

  const handleSubmit = async () => {
    if (!file) { toast.error('Please select a file'); return }
    if (!category) { toast.error('Please select a category'); return }
    setUploading(true)
    setProgress(0)
    // simulate progress
    const step = setInterval(() => {
      setProgress(p => {
        if (p >= 90) { clearInterval(step); return 90 }
        return p + 10
      })
    }, 80)
    try {
      await apiPost('/api/documents', {
        name: name || file.name,
        category,
        projectId: projectId || null,
        fileUrl: objectUrl || `/documents/${name || file.name}`,
        fileType: file.type || 'unknown',
        fileSize: file.size,
        description,
      })
      setProgress(100)
      clearInterval(step)
      toast.success('Document uploaded')
      onUploaded(name || file.name, objectUrl)
      onOpenChange(false)
      reset()
    } catch (e: any) {
      clearInterval(step)
      toast.error(e.message || 'Failed to upload')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset() }}>
      <DialogContent className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto ayk-scrollbar">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-teal-600" /> Upload Document
          </DialogTitle>
          <DialogDescription>Upload a project document, photo or report to the system.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drag-drop file area — large & prominent on mobile */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={cn(
              'cursor-pointer rounded-xl border-2 border-dashed p-6 sm:p-8 text-center transition',
              dragOver ? 'border-teal-400 bg-teal-50' : 'border-slate-300 hover:border-teal-400 hover:bg-slate-50'
            )}
          >
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleFile(f)
              }}
            />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileTypeIcon fileType={file.type} />
                <div className="text-left min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">{file.name}</div>
                  <div className="text-xs text-muted-foreground">{formatFileSize(file.size)} · {file.type || 'unknown'}</div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex h-12 w-12 mx-auto mb-2 items-center justify-center rounded-full bg-teal-50">
                  <Upload className="h-6 w-6 text-teal-600" />
                </div>
                <p className="text-sm font-medium text-slate-700">Drag & drop a file here, or click to browse</p>
                <p className="text-xs text-muted-foreground mt-1">Images, PDFs, documents up to ~10MB</p>
              </>
            )}
          </div>

          {uploading && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Uploading…</span>
                <span className="font-semibold text-teal-700 tabular-nums">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Document Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Auto-filled from filename" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DOCUMENT_CATEGORIES.map(c => <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Project (optional)</Label>
              <Select value={projectId || '__none__'} onValueChange={(v) => setProjectId(v === '__none__' ? '' : v)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select project (optional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No project</SelectItem>
                  {projects.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Description (optional)</Label>
              <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description of the document…" />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={uploading} className="bg-teal-600 hover:bg-teal-700 text-white">
            {uploading ? 'Uploading…' : (
              <>
                <Upload className="h-4 w-4 mr-2" /> Upload
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
