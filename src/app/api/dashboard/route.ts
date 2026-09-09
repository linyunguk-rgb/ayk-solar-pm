import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { calcOverallProgress, calcPlannedProgress } from '@/lib/constants'

// Aggregated dashboard stats
export async function GET() {
  const projects = await db.project.findMany({ include: { stages: true, manager: true } })
  const tasks = await db.task.findMany()
  const workers = await db.worker.findMany()
  const materials = await db.material.findMany()
  const incidents = await db.safetyIncident.findMany()
  const expenses = await db.expense.findMany()
  const notifications = await db.notification.findMany({ orderBy: { createdAt: 'desc' }, take: 12 })
  const checklists = await db.safetyChecklist.findMany({ orderBy: { date: 'desc' }, take: 30 })

  const activeProjects = projects.filter(p => p.status === 'Active').length
  const delayedProjects = projects.filter(p => p.status === 'Delayed').length
  const completedProjects = projects.filter(p => p.status === 'Completed').length

  // overall progress = avg of project overall progress — include full fields for ProjectCard
  const projectProgress = projects.map(p => ({
    id: p.id, name: p.name, status: p.status,
    location: p.location,
    code: p.code,
    client: p.client,
    capacity: p.capacity,
    totalPanels: p.totalPanels,
    installedPanels: p.installedPanels,
    budget: p.budget,
    actualCost: p.actualCost,
    startDate: p.startDate,
    endDate: p.endDate,
    manager: p.manager,
    overall: calcOverallProgress(p.stages),
    planned: calcPlannedProgress(p.stages),
    overallProgress: calcOverallProgress(p.stages),
    plannedProgress: calcPlannedProgress(p.stages),
    installationPct: p.totalPanels > 0 ? Math.round((p.installedPanels / p.totalPanels) * 1000) / 10 : 0,
  }))
  const overallProgress = projectProgress.length
    ? Math.round(projectProgress.reduce((s, p) => s + p.overall, 0) / projectProgress.length * 10) / 10
    : 0

  const totalBudget = projects.reduce((s, p) => s + p.budget, 0)
  const budgetUsed = projects.reduce((s, p) => s + p.actualCost, 0) + expenses.reduce((s, e) => s + e.amount, 0)
  const remainingBudget = totalBudget - budgetUsed

  const pendingTasks = tasks.filter(t => t.status === 'Todo' || t.status === 'InProgress').length
  const overdueTasks = tasks.filter(t => t.status !== 'Completed' && new Date(t.dueDate) < new Date()).length

  const totalWorkers = workers.length
  // workers on site today = present today
  const today = new Date(); today.setHours(0,0,0,0)
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)
  const todayAttendance = await db.attendance.findMany({
    where: { date: { gte: today, lt: tomorrow }, status: 'Present' },
  })
  const workersOnSite = todayAttendance.length

  const lowStockMaterials = materials.filter(m => m.stockQty <= m.minStockLevel)

  const totalIncidents = incidents.length
  const openIncidents = incidents.filter(i => i.status !== 'Closed').length
  const closedIncidents = incidents.filter(i => i.status === 'Closed').length
  const nearMisses = incidents.filter(i => i.type === 'NearMiss').length

  // PPE compliance avg
  const ppeCompliance = checklists.length
    ? Math.round(checklists.reduce((s, c) => s + (c.compliancePct || 0), 0) / checklists.length)
    : 0

  // Charts
  // 1. Installation progress over last 14 days (panels installed)
  const last14 = [] as { date: string; installed: number; cumulative: number }[]
  const dailyEntries = await db.dailyProgress.findMany({
    where: { date: { gte: new Date(Date.now() - 14 * 86400000) } },
    orderBy: { date: 'asc' },
  })
  const byDate = new Map<string, number>()
  for (const d of dailyEntries) {
    const key = new Date(d.date).toISOString().slice(0, 10)
    byDate.set(key, (byDate.get(key) || 0) + d.installedPanels)
  }
  let cumulative = 0
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    const key = d.toISOString().slice(0, 10)
    const installed = byDate.get(key) || 0
    cumulative += installed
    last14.push({ date: key, installed, cumulative })
  }

  // 2. Project status distribution
  const statusDist = {
    Active: projects.filter(p => p.status === 'Active').length,
    Completed: projects.filter(p => p.status === 'Completed').length,
    Delayed: projects.filter(p => p.status === 'Delayed').length,
    OnHold: projects.filter(p => p.status === 'OnHold').length,
  }

  // 3. Budget vs Actual per project
  const budgetChart = projects.map(p => ({
    name: p.name.length > 16 ? p.name.slice(0, 16) + '…' : p.name,
    budget: p.budget,
    actual: p.actualCost,
  }))

  // 4. Manpower trend last 7 days
  const manpowerTrend = [] as { date: string; workers: number }[]
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    d.setHours(0,0,0,0)
    const next = new Date(d); next.setDate(next.getDate() + 1)
    const att = await db.attendance.findMany({ where: { date: { gte: d, lt: next }, status: 'Present' } })
    manpowerTrend.push({ date: d.toISOString().slice(0,10), workers: att.length })
  }

  return NextResponse.json({
    stats: {
      activeProjects, completedProjects, delayedProjects, totalProjects: projects.length,
      overallProgress, plannedProgress: overallProgress,
      totalBudget, budgetUsed, remainingBudget,
      totalWorkers, workersOnSite, workersAbsent: totalWorkers - workersOnSite,
      pendingTasks, overdueTasks,
      lowStockCount: lowStockMaterials.length,
      totalIncidents, openIncidents, closedIncidents, nearMisses, ppeCompliance,
    },
    projects: projectProgress,
    charts: {
      installationTrend: last14,
      statusDistribution: statusDist,
      budgetChart,
      manpowerTrend,
    },
    notifications,
    lowStockMaterials: lowStockMaterials.map(m => ({ id: m.id, name: m.name, stockQty: m.stockQty, minStockLevel: m.minStockLevel, unit: m.unit })),
  })
}
