import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')
  const checklistType = searchParams.get('checklistType')

  const where: any = {}
  if (projectId && projectId !== 'all') where.projectId = projectId
  if (checklistType && checklistType !== 'all') where.checklistType = checklistType

  const checklists = await db.safetyChecklist.findMany({
    where,
    include: { project: true, conductedBy: true },
    orderBy: { date: 'desc' },
    take: 100,
  })
  return NextResponse.json({ checklists })
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { date, projectId, checklistType, helmet, safetyShoes, gloves, harness, workAreaClean, equipmentCondition, electricalSafety, location, remarks } = body

  const checks = { helmet, safetyShoes, gloves, harness, workAreaClean, equipmentCondition, electricalSafety }
  const totalChecks = 7
  const passedChecks = Object.values(checks).filter(Boolean).length
  const compliancePct = Math.round((passedChecks / totalChecks) * 100)

  const checklist = await db.safetyChecklist.create({
    data: {
      date: date ? new Date(date) : new Date(),
      projectId: projectId || null,
      checklistType: checklistType || 'PPE',
      helmet: !!helmet, safetyShoes: !!safetyShoes, gloves: !!gloves, harness: !!harness,
      workAreaClean: !!workAreaClean, equipmentCondition: !!equipmentCondition, electricalSafety: !!electricalSafety,
      conductedById: user.id, conductedByName: user.name,
      location: location || null, remarks: remarks || null,
      compliancePct,
    },
    include: { project: true },
  })
  return NextResponse.json({ checklist })
}
