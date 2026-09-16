import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, tenantWhere } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tw = await tenantWhere()
  const { searchParams } = new URL(req.url)
  const materialId = searchParams.get('materialId')
  const projectId = searchParams.get('projectId')
  const type = searchParams.get('type')

  const where: any = { ...tw }
  if (materialId) where.materialId = materialId
  if (projectId && projectId !== 'all') where.projectId = projectId
  if (type && type !== 'all') where.type = type

  const transactions = await db.materialTransaction.findMany({
    where,
    include: { material: true, project: true },
    orderBy: { date: 'desc' },
    take: 200,
  })
  return NextResponse.json({ transactions })
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { materialId, projectId, type, qty, remarks, date } = body
  if (!materialId || !type || qty === undefined) {
    return NextResponse.json({ error: 'Material, type and qty required' }, { status: 400 })
  }
  const material = await db.material.findUnique({ where: { id: materialId } })
  if (!material) return NextResponse.json({ error: 'Material not found' }, { status: 404 })
  if (!user.isMasterAdmin && material.tenantId !== user.tenantId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (projectId) {
    const project = await db.project.findUnique({ where: { id: projectId }, select: { tenantId: true } })
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    if (!user.isMasterAdmin && project.tenantId !== user.tenantId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
  }

  const txn = await db.materialTransaction.create({
    data: {
      materialId, projectId: projectId || null, tenantId: user.tenantId,
      type, qty: Number(qty),
      remarks: remarks || null,
      date: date ? new Date(date) : new Date(),
    },
    include: { material: true, project: true },
  })

  // Update stock
  let newStock = material.stockQty
  if (type === 'Add') newStock += Number(qty)
  else if (type === 'Issue') newStock -= Number(qty)
  else if (type === 'Return') newStock += Number(qty)
  newStock = Math.max(0, newStock)

  await db.material.update({ where: { id: materialId }, data: { stockQty: newStock } })

  // Create low-stock notification if needed (tenant-scoped)
  if (newStock <= material.minStockLevel) {
    await db.notification.create({
      data: {
        type: 'LowStock', title: `Low Stock: ${material.name}`,
        message: `${material.name} stock (${newStock} ${material.unit}) below minimum (${material.minStockLevel} ${material.unit}).`,
        severity: 'critical',
        tenantId: user.tenantId,
      },
    })
  }

  return NextResponse.json({ transaction: txn, newStock })
}
