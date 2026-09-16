import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

// Multipart file upload — save to public/uploads/, create Document record with tenantId
export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await req.formData()
  const file = form.get('file') as File | null
  const name = (form.get('name') as string) || file?.name || 'Untitled'
  const category = (form.get('category') as string) || 'Other'
  const projectId = (form.get('projectId') as string) || null
  const description = (form.get('description') as string) || null

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
  }

  // Verify project belongs to tenant
  if (projectId && projectId !== 'null') {
    const project = await db.project.findUnique({ where: { id: projectId }, select: { tenantId: true } })
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    if (!user.isMasterAdmin && project.tenantId !== user.tenantId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
  }

  // Save the file to public/uploads/<tenantId>/<timestamp>-<name>
  const tenantDir = user.tenantId || 'master'
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', tenantDir)
  try {
    await mkdir(uploadDir, { recursive: true })
  } catch {
    // directory might already exist
  }
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const fileName = `${Date.now()}-${safeName}`
  const fullPath = path.join(uploadDir, fileName)
  const arrayBuffer = await file.arrayBuffer()
  await writeFile(fullPath, Buffer.from(arrayBuffer))

  const fileUrl = `/uploads/${tenantDir}/${fileName}`
  const fileType = file.type || 'unknown'
  const fileSize = file.size

  const document = await db.document.create({
    data: {
      name,
      category,
      projectId: projectId && projectId !== 'null' ? projectId : null,
      tenantId: user.tenantId,
      fileUrl,
      fileType,
      fileSize,
      uploadedById: user.id,
      uploadedByName: user.name,
      description,
    },
    include: { project: true },
  })

  return NextResponse.json({ document })
}
