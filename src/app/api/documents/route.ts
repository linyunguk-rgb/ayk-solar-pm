import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')
  const category = searchParams.get('category')

  const where: any = {}
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
  const document = await db.document.create({
    data: {
      name, category, projectId: projectId || null,
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
