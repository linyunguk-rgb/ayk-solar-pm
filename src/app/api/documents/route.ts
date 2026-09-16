import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, tenantWhere } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tw = await tenantWhere()
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')
  const category = searchParams.get('category')

  const where: any = { ...tw }
  if (projectId && projectId !== 'all') where.projectId = projectId
  if (category && category !== 'all') where.category = category

  const documents = await db.document.findMany({
    where,
    include: { project: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ documents })
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { name, category, projectId, fileUrl, fileType, fileSize, description, uploadedByName } = body
  if (!name || !category) {
    return NextResponse.json({ error: 'Name and category required' }, { status: 400 })
  }
  if (projectId) {
    const project = await db.project.findUnique({ where: { id: projectId }, select: { tenantId: true } })
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    if (!user.isMasterAdmin && project.tenantId !== user.tenantId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
  }
  const document = await db.document.create({
    data: {
      name, category, projectId: projectId || null, tenantId: user.tenantId,
      fileUrl: fileUrl || `/documents/${name}`,
      fileType: fileType || 'unknown',
      fileSize: Number(fileSize) || 0,
      uploadedById: user.id,
      uploadedByName: uploadedByName || user.name,
      description: description || null,
    },
    include: { project: true },
  })
  return NextResponse.json({ document })
}
