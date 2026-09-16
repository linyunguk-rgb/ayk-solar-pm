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
  const approvalStatus = searchParams.get('approvalStatus')

  const where: any = { ...tw }
  if (projectId && projectId !== 'all') where.projectId = projectId
  if (category && category !== 'all') where.category = category
  if (approvalStatus && approvalStatus !== 'all') where.approvalStatus = approvalStatus

  const expenses = await db.expense.findMany({
    where,
    include: { project: true },
    orderBy: { date: 'desc' },
  })
  return NextResponse.json({ expenses })
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { date, projectId, category, description, amount, paidBy, approvalStatus, receiptUrl } = body
  if (!category || !description || amount === undefined) {
    return NextResponse.json({ error: 'Category, description and amount required' }, { status: 400 })
  }
  if (projectId) {
    const project = await db.project.findUnique({ where: { id: projectId }, select: { tenantId: true } })
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    if (!user.isMasterAdmin && project.tenantId !== user.tenantId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
  }
  const expense = await db.expense.create({
    data: {
      date: date ? new Date(date) : new Date(),
      projectId: projectId || null, tenantId: user.tenantId,
      category, description,
      amount: Number(amount),
      paidBy: paidBy || null,
      approvalStatus: approvalStatus || 'Pending',
      receiptUrl: receiptUrl || null,
    },
    include: { project: true },
  })
  return NextResponse.json({ expense })
}
