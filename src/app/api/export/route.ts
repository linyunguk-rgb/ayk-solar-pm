import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, tenantWhere } from '@/lib/auth'

// Export all company data as JSON for backup
export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tw = await tenantWhere()

  const [projects, tasks, workers, materials, expenses, checklists, incidents, documents, notifications, progress, transactions, attendance] = await Promise.all([
    db.project.findMany({ where: tw, include: { stages: true, manager: true } }),
    db.task.findMany({ where: tw, include: { project: true } }),
    db.worker.findMany({ where: tw, include: { project: true } }),
    db.material.findMany({ where: tw }),
    db.expense.findMany({ where: tw, include: { project: true } }),
    db.safetyChecklist.findMany({ where: tw, include: { project: true } }),
    db.safetyIncident.findMany({ where: tw, include: { project: true } }),
    db.document.findMany({ where: tw, include: { project: true } }),
    db.notification.findMany({ where: tw }),
    db.dailyProgress.findMany({ where: tw, include: { project: true } }),
    db.materialTransaction.findMany({ where: tw, include: { material: true, project: true } }),
    db.attendance.findMany({ where: { worker: { ...tw } }, include: { worker: true } }),
  ])

  const tenant = user.tenantId ? await db.tenant.findUnique({ where: { id: user.tenantId } }) : null
  const users = user.tenantId ? await db.user.findMany({ where: { tenantId: user.tenantId }, select: { id: true, email: true, name: true, role: true, phone: true, isTenantAdmin: true, isActive: true } }) : []

  const backup = {
    exportedAt: new Date().toISOString(),
    tenant: tenant ? { name: tenant.name, uen: tenant.uen, address: tenant.address, plan: tenant.plan } : { name: 'Platform', plan: 'master' },
    users,
    projects,
    tasks,
    workers,
    materials,
    expenses,
    safetyChecklists: checklists,
    safetyIncidents: incidents,
    documents,
    notifications,
    dailyProgress: progress,
    materialTransactions: transactions,
    attendance,
  }

  return NextResponse.json(backup)
}
