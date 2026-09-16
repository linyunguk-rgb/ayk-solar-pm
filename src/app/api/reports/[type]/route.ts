import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { calcOverallProgress, calcPlannedProgress, formatCurrency, formatDate, APP_NAME, APP_TAGLINE } from '@/lib/constants'
import { getSessionUser, tenantWhere } from '@/lib/auth'

// Report generator - returns structured data + a print-ready HTML payload (tenant-scoped)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tw = await tenantWhere()
  const { type } = await params

  const projects = await db.project.findMany({ where: tw, include: { stages: true, manager: true, dailyProgress: true, tasks: true, expenses: true, documents: true, materialTransactions: true } })
  const tasks = await db.task.findMany({ where: tw, include: { project: true, assignedTo: true } })
  const workers = await db.worker.findMany({ where: tw, include: { project: true, attendance: { take: 30, orderBy: { date: 'desc' } } } })
  const materials = await db.material.findMany({ where: tw, include: { transactions: { include: { project: true } } } })
  const expenses = await db.expense.findMany({ where: tw, include: { project: true } })
  const incidents = await db.safetyIncident.findMany({ where: tw, include: { project: true } })
  const checklists = await db.safetyChecklist.findMany({ where: tw, include: { project: true } })

  let report: any = { type, generatedAt: new Date().toISOString(), title: '', html: '' }

  const header = (title: string) => `
    <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #16a34a;padding-bottom:12px;margin-bottom:20px;">
      <div>
        <div style="font-size:22px;font-weight:800;color:#0f172a;">${APP_NAME}</div>
        <div style="font-size:11px;color:#16a34a;letter-spacing:1px;">${APP_TAGLINE}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:16px;font-weight:600;color:#0f172a;">${title}</div>
        <div style="font-size:11px;color:#64748b;">Generated ${formatDate(new Date())}</div>
      </div>
    </div>`

  switch (type) {
    case 'daily': {
      const today = new Date(); today.setHours(0,0,0,0)
      const todayEntries = await db.dailyProgress.findMany({ where: { ...tw, date: { gte: today } }, include: { project: true, submittedBy: true } })
      report.title = 'Daily Progress Report'
      report.data = { entries: todayEntries }
      report.html = header('Daily Progress Report') + `
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead><tr style="background:#f1f5f9;">
            <th style="padding:8px;text-align:left;border:1px solid #e2e8f0;">Project</th>
            <th style="padding:8px;text-align:left;border:1px solid #e2e8f0;">Date</th>
            <th style="padding:8px;text-align:right;border:1px solid #e2e8f0;">Installed</th>
            <th style="padding:8px;text-align:right;border:1px solid #e2e8f0;">Total</th>
            <th style="padding:8px;text-align:right;border:1px solid #e2e8f0;">Man-hrs</th>
            <th style="padding:8px;text-align:right;border:1px solid #e2e8f0;">Workers</th>
            <th style="padding:8px;text-align:left;border:1px solid #e2e8f0;">Status</th>
            <th style="padding:8px;text-align:left;border:1px solid #e2e8f0;">Submitted By</th>
          </tr></thead>
          <tbody>
            ${todayEntries.map((e:any) => `<tr>
              <td style="padding:8px;border:1px solid #e2e8f0;">${e.project?.name || '-'}</td>
              <td style="padding:8px;border:1px solid #e2e8f0;">${formatDate(e.date)}</td>
              <td style="padding:8px;text-align:right;border:1px solid #e2e8f0;">${e.installedPanels}</td>
              <td style="padding:8px;text-align:right;border:1px solid #e2e8f0;">${e.totalInstalled}</td>
              <td style="padding:8px;text-align:right;border:1px solid #e2e8f0;">${e.manHours}</td>
              <td style="padding:8px;text-align:right;border:1px solid #e2e8f0;">${e.workers}</td>
              <td style="padding:8px;border:1px solid #e2e8f0;">${e.siteStatus}</td>
              <td style="padding:8px;border:1px solid #e2e8f0;">${e.submittedBy?.name || '-'}</td>
            </tr>`).join('') || `<tr><td colspan="8" style="padding:16px;text-align:center;color:#64748b;">No entries for today</td></tr>`}
          </tbody>
        </table>`
      break
    }
    case 'weekly': {
      const weekAgo = new Date(Date.now() - 7 * 86400000)
      const weekly = await db.dailyProgress.findMany({ where: { ...tw, date: { gte: weekAgo } }, include: { project: true } })
      report.title = 'Weekly Progress Report'
      report.data = { entries: weekly }
      const byProject = new Map<string, number>()
      for (const e of weekly) byProject.set(e.project?.name || '-', (byProject.get(e.project?.name || '-') || 0) + e.installedPanels)
      report.html = header('Weekly Progress Report') + `
        <h3 style="font-size:14px;color:#0f172a;margin:16px 0 8px;">Summary by Project (Last 7 days)</h3>
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead><tr style="background:#f1f5f9;">
            <th style="padding:8px;text-align:left;border:1px solid #e2e8f0;">Project</th>
            <th style="padding:8px;text-align:right;border:1px solid #e2e8f0;">Panels Installed</th>
          </tr></thead>
          <tbody>
            ${[...byProject].map(([name, total]) => `<tr><td style="padding:8px;border:1px solid #e2e8f0;">${name}</td><td style="padding:8px;text-align:right;border:1px solid #e2e8f0;">${total}</td></tr>`).join('')}
          </tbody>
        </table>
        <h3 style="font-size:14px;color:#0f172a;margin:16px 0 8px;">Daily Entries</h3>
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead><tr style="background:#f1f5f9;">
            <th style="padding:8px;text-align:left;border:1px solid #e2e8f0;">Date</th>
            <th style="padding:8px;text-align:left;border:1px solid #e2e8f0;">Project</th>
            <th style="padding:8px;text-align:right;border:1px solid #e2e8f0;">Installed</th>
            <th style="padding:8px;text-align:right;border:1px solid #e2e8f0;">Workers</th>
          </tr></thead>
          <tbody>
            ${weekly.map((e:any) => `<tr><td style="padding:8px;border:1px solid #e2e8f0;">${formatDate(e.date)}</td><td style="padding:8px;border:1px solid #e2e8f0;">${e.project?.name || '-'}</td><td style="padding:8px;text-align:right;border:1px solid #e2e8f0;">${e.installedPanels}</td><td style="padding:8px;text-align:right;border:1px solid #e2e8f0;">${e.workers}</td></tr>`).join('')}
          </tbody>
        </table>`
      break
    }
    case 'monthly': {
      const monthAgo = new Date(Date.now() - 30 * 86400000)
      const monthly = await db.dailyProgress.findMany({ where: { ...tw, date: { gte: monthAgo } }, include: { project: true } })
      report.title = 'Monthly Progress Report'
      const totalInstalled = monthly.reduce((s, e) => s + e.installedPanels, 0)
      const totalManHours = monthly.reduce((s, e) => s + e.manHours, 0)
      report.html = header('Monthly Progress Report') + `
        <div style="display:flex;gap:16px;margin-bottom:16px;">
          <div style="flex:1;background:#f0fdf4;padding:12px;border-radius:6px;border:1px solid #bbf7d0;">
            <div style="font-size:11px;color:#16a34a;">Total Panels Installed</div>
            <div style="font-size:20px;font-weight:700;color:#0f172a;">${totalInstalled.toLocaleString()}</div>
          </div>
          <div style="flex:1;background:#eff6ff;padding:12px;border-radius:6px;border:1px solid #bfdbfe;">
            <div style="font-size:11px;color:#2563eb;">Total Man-hours</div>
            <div style="font-size:20px;font-weight:700;color:#0f172a;">${totalManHours.toFixed(1)}</div>
          </div>
          <div style="flex:1;background:#fef3c7;padding:12px;border-radius:6px;border:1px solid #fde68a;">
            <div style="font-size:11px;color:#d97706;">Entries</div>
            <div style="font-size:20px;font-weight:700;color:#0f172a;">${monthly.length}</div>
          </div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead><tr style="background:#f1f5f9;">
            <th style="padding:8px;text-align:left;border:1px solid #e2e8f0;">Date</th>
            <th style="padding:8px;text-align:left;border:1px solid #e2e8f0;">Project</th>
            <th style="padding:8px;text-align:right;border:1px solid #e2e8f0;">Installed</th>
            <th style="padding:8px;text-align:right;border:1px solid #e2e8f0;">Man-hrs</th>
            <th style="padding:8px;text-align:left;border:1px solid #e2e8f0;">Status</th>
          </tr></thead>
          <tbody>
            ${monthly.slice(0, 50).map((e:any) => `<tr><td style="padding:8px;border:1px solid #e2e8f0;">${formatDate(e.date)}</td><td style="padding:8px;border:1px solid #e2e8f0;">${e.project?.name}</td><td style="padding:8px;text-align:right;border:1px solid #e2e8f0;">${e.installedPanels}</td><td style="padding:8px;text-align:right;border:1px solid #e2e8f0;">${e.manHours}</td><td style="padding:8px;border:1px solid #e2e8f0;">${e.siteStatus}</td></tr>`).join('')}
          </tbody>
        </table>`
      break
    }
    case 'manpower': {
      report.title = 'Manpower Report'
      report.html = header('Manpower Report') + `
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead><tr style="background:#f1f5f9;">
            <th style="padding:8px;text-align:left;border:1px solid #e2e8f0;">Employee ID</th>
            <th style="padding:8px;text-align:left;border:1px solid #e2e8f0;">Name</th>
            <th style="padding:8px;text-align:left;border:1px solid #e2e8f0;">Role</th>
            <th style="padding:8px;text-align:left;border:1px solid #e2e8f0;">Team</th>
            <th style="padding:8px;text-align:left;border:1px solid #e2e8f0;">Project</th>
            <th style="padding:8px;text-align:left;border:1px solid #e2e8f0;">Skill</th>
            <th style="padding:8px;text-align:left;border:1px solid #e2e8f0;">Status</th>
          </tr></thead>
          <tbody>
            ${workers.map((w:any) => `<tr>
              <td style="padding:8px;border:1px solid #e2e8f0;">${w.employeeId}</td>
              <td style="padding:8px;border:1px solid #e2e8f0;">${w.name}</td>
              <td style="padding:8px;border:1px solid #e2e8f0;">${w.role}</td>
              <td style="padding:8px;border:1px solid #e2e8f0;">${w.team || '-'}</td>
              <td style="padding:8px;border:1px solid #e2e8f0;">${w.project?.name || '-'}</td>
              <td style="padding:8px;border:1px solid #e2e8f0;">${w.skillLevel}</td>
              <td style="padding:8px;border:1px solid #e2e8f0;">${w.status}</td>
            </tr>`).join('')}
          </tbody>
        </table>`
      break
    }
    case 'material': {
      report.title = 'Material Usage Report'
      report.html = header('Material Usage Report') + `
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead><tr style="background:#f1f5f9;">
            <th style="padding:8px;text-align:left;border:1px solid #e2e8f0;">Material</th>
            <th style="padding:8px;text-align:left;border:1px solid #e2e8f0;">Category</th>
            <th style="padding:8px;text-align:right;border:1px solid #e2e8f0;">Stock</th>
            <th style="padding:8px;text-align:right;border:1px solid #e2e8f0;">Min Level</th>
            <th style="padding:8px;text-align:right;border:1px solid #e2e8f0;">Unit Price</th>
            <th style="padding:8px;text-align:right;border:1px solid #e2e8f0;">Stock Value</th>
            <th style="padding:8px;text-align:left;border:1px solid #e2e8f0;">Status</th>
          </tr></thead>
          <tbody>
            ${materials.map((m:any) => `<tr>
              <td style="padding:8px;border:1px solid #e2e8f0;">${m.name}</td>
              <td style="padding:8px;border:1px solid #e2e8f0;">${m.category}</td>
              <td style="padding:8px;text-align:right;border:1px solid #e2e8f0;">${m.stockQty} ${m.unit}</td>
              <td style="padding:8px;text-align:right;border:1px solid #e2e8f0;">${m.minStockLevel} ${m.unit}</td>
              <td style="padding:8px;text-align:right;border:1px solid #e2e8f0;">${formatCurrency(m.unitPrice)}</td>
              <td style="padding:8px;text-align:right;border:1px solid #e2e8f0;">${formatCurrency(m.stockQty * m.unitPrice)}</td>
              <td style="padding:8px;border:1px solid #e2e8f0;${m.stockQty <= m.minStockLevel ? 'color:#dc2626;font-weight:600;' : 'color:#16a34a;'}">${m.stockQty <= m.minStockLevel ? 'LOW STOCK' : 'OK'}</td>
            </tr>`).join('')}
          </tbody>
        </table>`
      break
    }
    case 'expense': {
      report.title = 'Expense Report'
      const total = expenses.reduce((s, e) => s + e.amount, 0)
      report.html = header('Expense Report') + `
        <div style="background:#fff7ed;padding:12px;border-radius:6px;border:1px solid #fed7aa;margin-bottom:16px;">
          <div style="font-size:11px;color:#ea580c;">Total Expenses</div>
          <div style="font-size:22px;font-weight:700;color:#0f172a;">${formatCurrency(total)}</div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead><tr style="background:#f1f5f9;">
            <th style="padding:8px;text-align:left;border:1px solid #e2e8f0;">Date</th>
            <th style="padding:8px;text-align:left;border:1px solid #e2e8f0;">Project</th>
            <th style="padding:8px;text-align:left;border:1px solid #e2e8f0;">Category</th>
            <th style="padding:8px;text-align:left;border:1px solid #e2e8f0;">Description</th>
            <th style="padding:8px;text-align:right;border:1px solid #e2e8f0;">Amount</th>
            <th style="padding:8px;text-align:left;border:1px solid #e2e8f0;">Approval</th>
          </tr></thead>
          <tbody>
            ${expenses.map((e:any) => `<tr>
              <td style="padding:8px;border:1px solid #e2e8f0;">${formatDate(e.date)}</td>
              <td style="padding:8px;border:1px solid #e2e8f0;">${e.project?.name || '-'}</td>
              <td style="padding:8px;border:1px solid #e2e8f0;">${e.category}</td>
              <td style="padding:8px;border:1px solid #e2e8f0;">${e.description}</td>
              <td style="padding:8px;text-align:right;border:1px solid #e2e8f0;">${formatCurrency(e.amount)}</td>
              <td style="padding:8px;border:1px solid #e2e8f0;">${e.approvalStatus}</td>
            </tr>`).join('')}
          </tbody>
        </table>`
      break
    }
    case 'safety': {
      report.title = 'Safety Report'
      const openInc = incidents.filter(i => i.status !== 'Closed').length
      const closedInc = incidents.filter(i => i.status === 'Closed').length
      const avgCompliance = checklists.length ? Math.round(checklists.reduce((s,c) => s + (c.compliancePct || 0), 0) / checklists.length) : 0
      report.html = header('Safety Report') + `
        <div style="display:flex;gap:16px;margin-bottom:16px;">
          <div style="flex:1;background:#fef2f2;padding:12px;border-radius:6px;border:1px solid #fecaca;"><div style="font-size:11px;color:#dc2626;">Total Incidents</div><div style="font-size:20px;font-weight:700;">${incidents.length}</div></div>
          <div style="flex:1;background:#fff7ed;padding:12px;border-radius:6px;border:1px solid #fed7aa;"><div style="font-size:11px;color:#ea580c;">Open</div><div style="font-size:20px;font-weight:700;">${openInc}</div></div>
          <div style="flex:1;background:#f0fdf4;padding:12px;border-radius:6px;border:1px solid #bbf7d0;"><div style="font-size:11px;color:#16a34a;">Closed</div><div style="font-size:20px;font-weight:700;">${closedInc}</div></div>
          <div style="flex:1;background:#eff6ff;padding:12px;border-radius:6px;border:1px solid #bfdbfe;"><div style="font-size:11px;color:#2563eb;">PPE Compliance</div><div style="font-size:20px;font-weight:700;">${avgCompliance}%</div></div>
        </div>
        <h3 style="font-size:14px;color:#0f172a;margin:16px 0 8px;">Incidents & Near Misses</h3>
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead><tr style="background:#f1f5f9;">
            <th style="padding:8px;text-align:left;border:1px solid #e2e8f0;">Date</th>
            <th style="padding:8px;text-align:left;border:1px solid #e2e8f0;">Type</th>
            <th style="padding:8px;text-align:left;border:1px solid #e2e8f0;">Severity</th>
            <th style="padding:8px;text-align:left;border:1px solid #e2e8f0;">Description</th>
            <th style="padding:8px;text-align:left;border:1px solid #e2e8f0;">Status</th>
          </tr></thead>
          <tbody>
            ${incidents.map((i:any) => `<tr>
              <td style="padding:8px;border:1px solid #e2e8f0;">${formatDate(i.date)}</td>
              <td style="padding:8px;border:1px solid #e2e8f0;">${i.type}</td>
              <td style="padding:8px;border:1px solid #e2e8f0;">${i.severity}</td>
              <td style="padding:8px;border:1px solid #e2e8f0;">${i.description}</td>
              <td style="padding:8px;border:1px solid #e2e8f0;">${i.status}</td>
            </tr>`).join('')}
          </tbody>
        </table>`
      break
    }
    case 'project-summary': {
      report.title = 'Project Summary Report'
      report.html = header('Project Summary Report') + `
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead><tr style="background:#f1f5f9;">
            <th style="padding:8px;text-align:left;border:1px solid #e2e8f0;">Code</th>
            <th style="padding:8px;text-align:left;border:1px solid #e2e8f0;">Name</th>
            <th style="padding:8px;text-align:left;border:1px solid #e2e8f0;">Location</th>
            <th style="padding:8px;text-align:right;border:1px solid #e2e8f0;">Panels</th>
            <th style="padding:8px;text-align:right;border:1px solid #e2e8f0;">Installed</th>
            <th style="padding:8px;text-align:right;border:1px solid #e2e8f0;">Progress</th>
            <th style="padding:8px;text-align:right;border:1px solid #e2e8f0;">Budget</th>
            <th style="padding:8px;text-align:right;border:1px solid #e2e8f0;">Actual</th>
            <th style="padding:8px;text-align:left;border:1px solid #e2e8f0;">Status</th>
          </tr></thead>
          <tbody>
            ${projects.map((p:any) => `<tr>
              <td style="padding:8px;border:1px solid #e2e8f0;">${p.code}</td>
              <td style="padding:8px;border:1px solid #e2e8f0;">${p.name}</td>
              <td style="padding:8px;border:1px solid #e2e8f0;">${p.location}</td>
              <td style="padding:8px;text-align:right;border:1px solid #e2e8f0;">${p.totalPanels}</td>
              <td style="padding:8px;text-align:right;border:1px solid #e2e8f0;">${p.installedPanels}</td>
              <td style="padding:8px;text-align:right;border:1px solid #e2e8f0;">${calcOverallProgress(p.stages)}%</td>
              <td style="padding:8px;text-align:right;border:1px solid #e2e8f0;">${formatCurrency(p.budget)}</td>
              <td style="padding:8px;text-align:right;border:1px solid #e2e8f0;">${formatCurrency(p.actualCost)}</td>
              <td style="padding:8px;border:1px solid #e2e8f0;">${p.status}</td>
            </tr>`).join('')}
          </tbody>
        </table>`
      break
    }
    case 'planned-vs-actual': {
      report.title = 'Planned vs Actual Report'
      report.html = header('Planned vs Actual Report') + `
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead><tr style="background:#f1f5f9;">
            <th style="padding:8px;text-align:left;border:1px solid #e2e8f0;">Project</th>
            <th style="padding:8px;text-align:right;border:1px solid #e2e8f0;">Planned %</th>
            <th style="padding:8px;text-align:right;border:1px solid #e2e8f0;">Actual %</th>
            <th style="padding:8px;text-align:right;border:1px solid #e2e8f0;">Variance</th>
            <th style="padding:8px;text-align:right;border:1px solid #e2e8f0;">Budget</th>
            <th style="padding:8px;text-align:right;border:1px solid #e2e8f0;">Actual Cost</th>
            <th style="padding:8px;text-align:left;border:1px solid #e2e8f0;">Status</th>
          </tr></thead>
          <tbody>
            ${projects.map((p:any) => {
              const planned = calcPlannedProgress(p.stages)
              const actual = calcOverallProgress(p.stages)
              const variance = Math.round((actual - planned) * 10) / 10
              return `<tr>
                <td style="padding:8px;border:1px solid #e2e8f0;">${p.name}</td>
                <td style="padding:8px;text-align:right;border:1px solid #e2e8f0;">${planned}%</td>
                <td style="padding:8px;text-align:right;border:1px solid #e2e8f0;">${actual}%</td>
                <td style="padding:8px;text-align:right;border:1px solid #e2e8f0;color:${variance < 0 ? '#dc2626' : '#16a34a'};font-weight:600;">${variance > 0 ? '+' : ''}${variance}%</td>
                <td style="padding:8px;text-align:right;border:1px solid #e2e8f0;">${formatCurrency(p.budget)}</td>
                <td style="padding:8px;text-align:right;border:1px solid #e2e8f0;">${formatCurrency(p.actualCost)}</td>
                <td style="padding:8px;border:1px solid #e2e8f0;">${p.status}</td>
              </tr>`
            }).join('')}
          </tbody>
        </table>`
      break
    }
    default:
      report.title = 'Report'
      report.html = header('Report') + `<p>No data for ${type}</p>`
  }

  return NextResponse.json(report)
}
