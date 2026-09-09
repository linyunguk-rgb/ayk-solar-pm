import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const lowStock = searchParams.get('lowStock')

  const where: any = {}
  if (category && category !== 'all') where.category = category

  let materials = await db.material.findMany({
    where,
    include: { transactions: { orderBy: { date: 'desc' }, take: 5, include: { project: true } } },
    orderBy: { name: 'asc' },
  })

  if (lowStock === 'true') {
    materials = materials.filter(m => m.stockQty <= m.minStockLevel)
  }

  return NextResponse.json({ materials })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, category, unit, stockQty, minStockLevel, unitPrice, supplier } = body
  if (!name || !category) {
    return NextResponse.json({ error: 'Name and category required' }, { status: 400 })
  }
  const material = await db.material.create({
    data: {
      name, category, unit: unit || 'pcs',
      stockQty: Number(stockQty) || 0,
      minStockLevel: Number(minStockLevel) || 0,
      unitPrice: Number(unitPrice) || 0,
      supplier: supplier || null,
    },
  })
  return NextResponse.json({ material })
}
