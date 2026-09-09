import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const materialId = searchParams.get('materialId')
  const projectId = searchParams.get('projectId')
  const type = searchParams.get('type')

  const where: any = {}
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
  const body = await req.json()
  const { materialId, projectId, type, qty, remarks, date } = body
  if (!materialId || !type || qty === undefined) {
    return NextResponse.json({ error: 'Material, type and qty required' }, { status: 400 })
  }
  const material = await db.material.findUnique({ where: { id: materialId } })
  if (!material) return NextResponse.json({ error: 'Material not found' }, { status: 404 })

  const txn = await db.materialTransaction.create({
    data: {
      materialId, projectId: projectId || null,
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

  // Create low-stock notification if needed
  if (newStock <= material.minStockLevel) {
    await db.notification.create({
      data: {
        type: 'LowStock', title: `Low Stock: ${material.name}`,
        message: `${material.name} stock (${newStock} ${material.unit}) below minimum (${material.minStockLevel} ${material.unit}).`,
        severity: 'critical',
      },
    })
  }

  return NextResponse.json({ transaction: txn, newStock })
}
