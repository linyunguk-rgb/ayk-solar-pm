// AYK PTE LTD - Database seed script
// Run with: bun run scripts/seed.ts
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

function simpleHash(pw: string): string {
  // Simple hash for demo only - not secure. Stored plainly so login can compare directly.
  return `demo$${pw}`
}

async function main() {
  console.log('Seeding AYK PTE LTD database...')

  // 1. Users
  const users = await Promise.all([
    db.user.create({ data: { email: 'admin@ayk.com.sg', name: 'Alex Tan', password: simpleHash('admin123'), role: 'Admin', phone: '+65 9001 0001', avatar: '' } }),
    db.user.create({ data: { email: 'pm@ayk.com.sg', name: 'Priya Menon', password: simpleHash('pm123'), role: 'ProjectManager', phone: '+65 9001 0002' } }),
    db.user.create({ data: { email: 'supervisor@ayk.com.sg', name: 'Raj Kumar', password: simpleHash('super123'), role: 'SiteSupervisor', phone: '+65 9001 0003' } }),
    db.user.create({ data: { email: 'safety@ayk.com.sg', name: 'Lim Wei Ming', password: simpleHash('safety123'), role: 'SafetyOfficer', phone: '+65 9001 0004' } }),
    db.user.create({ data: { email: 'engineer@ayk.com.sg', name: 'Sarah Wong', password: simpleHash('eng123'), role: 'Engineer', phone: '+65 9001 0005' } }),
    db.user.create({ data: { email: 'store@ayk.com.sg', name: 'Daniel Lee', password: simpleHash('store123'), role: 'StoreOfficer', phone: '+65 9001 0006' } }),
  ])
  const [admin, pm, supervisor, safety, engineer, store] = users
  console.log(`Created ${users.length} users`)

  // 2. Projects
  const now = new Date()
  const p1Start = new Date(2025, 0, 15)  // Jan 15, 2025
  const p1End = new Date(2025, 11, 30)   // Dec 30, 2025
  const p2Start = new Date(2025, 1, 1)
  const p2End = new Date(2026, 1, 28)
  const p3Start = new Date(2025, 2, 10)
  const p3End = new Date(2025, 9, 15)
  const p4Start = new Date(2024, 8, 1)
  const p4End = new Date(2025, 5, 30)
  const p5Start = new Date(2025, 4, 5)
  const p5End = new Date(2026, 3, 20)

  const projects = await Promise.all([
    db.project.create({
      data: {
        code: 'AYK-TUAS-001', name: 'Tuas Solar Project', location: 'Tuas, Singapore',
        client: 'Tuas Power Ltd', totalPanels: 8400, installedPanels: 2100,
        capacity: '3.5 MWp', status: 'Active', startDate: p1Start, endDate: p1End,
        budget: 5800000, actualCost: 2410000, managerId: pm.id,
        description: 'Rooftop solar installation at Tuas industrial estate. Largest AYK project to date covering 3 warehouse rooftops.',
      },
    }),
    db.project.create({
      data: {
        code: 'AYK-JUR-002', name: 'Jurong Industrial Solar', location: 'Jurong, Singapore',
        client: 'Jurong Chemicals Pte Ltd', totalPanels: 12500, installedPanels: 8600,
        capacity: '5.2 MWp', status: 'Active', startDate: p2Start, endDate: p2End,
        budget: 8200000, actualCost: 5870000, managerId: pm.id,
        description: 'Ground-mount and rooftop hybrid system for Jurong Chemicals facility.',
      },
    }),
    db.project.create({
      data: {
        code: 'AYK-SEM-003', name: 'Sembcorp Solar Farm', location: 'Sembcorp, Singapore',
        client: 'Sembcorp Industries', totalPanels: 5200, installedPanels: 5200,
        capacity: '2.1 MWp', status: 'Completed', startDate: p3Start, endDate: p3End,
        budget: 3900000, actualCost: 3720000, managerId: pm.id,
        description: 'Completed solar farm installation for Sembcorp. Handed over Q4 2025.',
      },
    }),
    db.project.create({
      data: {
        code: 'AYK-WD-004', name: 'Woodlands Warehouse Solar', location: 'Woodlands, Singapore',
        client: 'Woodlands Logistics Co', totalPanels: 3200, installedPanels: 980,
        capacity: '1.4 MWp', status: 'Delayed', startDate: p4Start, endDate: p4End,
        budget: 2100000, actualCost: 1980000, managerId: pm.id,
        description: 'Delayed due to supply chain issues for mounting rails and DC cables.',
      },
    }),
    db.project.create({
      data: {
        code: 'AYK-CCK-005', name: 'Choa Chu Kang Solar', location: 'Choa Chu Kang, Singapore',
        client: 'CCK Holdings', totalPanels: 6800, installedPanels: 0,
        capacity: '2.8 MWp', status: 'OnHold', startDate: p5Start, endDate: p5End,
        budget: 4500000, actualCost: 320000, managerId: pm.id,
        description: 'On hold pending permit approval from JTC Corporation.',
      },
    }),
  ])
  const [tuas, jurong, sembcorp, woodlands, cck] = projects
  console.log(`Created ${projects.length} projects`)

  // 3. Project stages with weights
  const stageWeights = [5, 15, 15, 40, 15, 10] // Survey, Design, Procurement, Installation, Testing, Handover
  const stageNames = ['Survey', 'Design', 'Procurement', 'Installation', 'Testing', 'Handover']

  async function seedStages(project: any, pcts: number[], statuses: string[]) {
    const startDate = new Date(project.startDate)
    const totalDays = Math.ceil((project.endDate.getTime() - project.startDate.getTime()) / (1000*60*60*24))
    const segDays = Math.floor(totalDays / 6)
    for (let i = 0; i < 6; i++) {
      const stStart = new Date(startDate.getTime() + segDays * i * 24*60*60*1000)
      const stEnd = new Date(stStart.getTime() + segDays * 24*60*60*1000)
      await db.projectStage.create({
        data: {
          projectId: project.id, name: stageNames[i], order: i,
          plannedPct: Math.min(100, pcts[i] + (statuses[i] === 'Delayed' ? 0 : 0)),
          actualPct: pcts[i], weight: stageWeights[i], status: statuses[i],
          startDate: stStart, endDate: stEnd,
        },
      })
    }
  }

  await seedStages(tuas, [100, 100, 80, 45, 20, 0], ['Completed', 'Completed', 'InProgress', 'InProgress', 'NotStarted', 'NotStarted'])
  await seedStages(jurong, [100, 100, 100, 70, 40, 10], ['Completed', 'Completed', 'Completed', 'InProgress', 'InProgress', 'InProgress'])
  await seedStages(sembcorp, [100, 100, 100, 100, 100, 100], ['Completed', 'Completed', 'Completed', 'Completed', 'Completed', 'Completed'])
  await seedStages(woodlands, [100, 100, 60, 30, 0, 0], ['Completed', 'Completed', 'Delayed', 'Delayed', 'NotStarted', 'NotStarted'])
  await seedStages(cck, [100, 50, 0, 0, 0, 0], ['Completed', 'InProgress', 'NotStarted', 'NotStarted', 'NotStarted', 'NotStarted'])

  // 4. Daily progress entries (last 30 days for Tuas & Jurong)
  async function seedDailyProgress(project: any, startInstalled: number, dailyRate: number) {
    let totalInstalled = startInstalled
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24*60*60*1000)
      if (d.getDay() === 0) continue
      const installed = Math.round(dailyRate * (0.7 + Math.random() * 0.6))
      totalInstalled += installed
      await db.dailyProgress.create({
        data: {
          projectId: project.id, date: d,
          installedPanels: installed, totalInstalled: Math.min(totalInstalled, project.totalPanels),
          manHours: Math.round((20 + Math.random() * 12) * 10) / 10,
          workers: 18 + Math.floor(Math.random() * 12),
          materialsUsed: JSON.stringify({ SolarPanels: installed, DCCables: installed * 2, MC4Connectors: installed * 4 }),
          equipmentUsed: JSON.stringify(['Crane', 'Drill Rig', 'Torque Wrench']),
          workCompleted: `Installed ${installed} panels on Block ${1 + (i % 3)}`,
          workPending: i % 2 === 0 ? 'Cable routing for Block 2' : 'Inverter commissioning prep',
          siteStatus: i % 7 === 0 ? 'Delay' : 'Normal',
          remarks: i % 5 === 0 ? 'Weather delay in afternoon' : 'Smooth progress',
          gpsLocation: project.location,
          submittedById: supervisor.id,
        },
      })
    }
    await db.project.update({ where: { id: project.id }, data: { installedPanels: Math.min(totalInstalled, project.totalPanels) } })
  }

  await seedDailyProgress(tuas, 1300, 28)
  await seedDailyProgress(jurong, 8200, 14)
  await seedDailyProgress(woodlands, 980, 5)
  console.log('Seeded daily progress')

  // 5. Tasks
  const tasks = [
    { title: 'Complete Block 2 mounting rail installation', projectId: tuas.id, assignedToId: supervisor.id, priority: 'High', status: 'InProgress', progress: 60, dueOffset: 7 },
    { title: 'Procure 3,000 DC cables (emergency)', projectId: tuas.id, assignedToId: store.id, priority: 'Critical', status: 'InProgress', progress: 40, dueOffset: 3 },
    { title: 'Inverter commissioning prep', projectId: tuas.id, assignedToId: engineer.id, priority: 'Medium', status: 'Todo', progress: 0, dueOffset: 14 },
    { title: 'Weekly toolbox meeting', projectId: tuas.id, assignedToId: safety.id, priority: 'Medium', status: 'Completed', progress: 100, dueOffset: -2 },
    { title: 'Jurong Block C cable testing', projectId: jurong.id, assignedToId: engineer.id, priority: 'High', status: 'InProgress', progress: 75, dueOffset: 5 },
    { title: 'Jurong final inspection prep', projectId: jurong.id, assignedToId: pm.id, priority: 'High', status: 'Todo', progress: 0, dueOffset: 21 },
    { title: 'Woodlands mounting rail resupply', projectId: woodlands.id, assignedToId: store.id, priority: 'Critical', status: 'Delayed', progress: 30, dueOffset: -3 },
    { title: 'Woodlands permit renewal', projectId: woodlands.id, assignedToId: pm.id, priority: 'High', status: 'InProgress', progress: 50, dueOffset: 10 },
    { title: 'CCK permit follow-up with JTC', projectId: cck.id, assignedToId: pm.id, priority: 'High', status: 'Delayed', progress: 20, dueOffset: -5 },
    { title: 'Monthly safety audit', projectId: tuas.id, assignedToId: safety.id, priority: 'Medium', status: 'Todo', progress: 0, dueOffset: 12 },
    { title: 'Material stock reconciliation', projectId: null, assignedToId: store.id, priority: 'Medium', status: 'InProgress', progress: 40, dueOffset: 4 },
    { title: 'Q4 budget review', projectId: null, assignedToId: pm.id, priority: 'Medium', status: 'Todo', progress: 0, dueOffset: 20 },
  ]
  for (const t of tasks) {
    await db.task.create({
      data: {
        title: t.title, projectId: t.projectId, assignedToId: t.assignedToId,
        assignedToName: users.find(u => u.id === t.assignedToId)?.name,
        priority: t.priority, status: t.status, progress: t.progress,
        startDate: new Date(now.getTime() - 14 * 24*60*60*1000),
        dueDate: new Date(now.getTime() + t.dueOffset * 24*60*60*1000),
      },
    })
  }
  console.log(`Created ${tasks.length} tasks`)

  // 6. Workers
  const workerNames = [
    'Wong HK', 'Tan AL', 'Ravi S', 'Muthu K', 'Chen BJ', 'Ali R', 'Mohd S', 'Singh G',
    'Ng PL', 'Lim CH', 'Kumar V', 'Das S', 'Yusof B', 'Rahman A', 'Ho JS', 'Tan BH',
    'Lee KW', 'Goh TM', 'Phua D', 'Ramachandran P', 'Krishnan M', 'Subramaniam R', 'Selvam T', 'Bala K',
  ]
  const workerRoles = ['Solar Installer', 'Electrician', 'Foreman', 'Technician', 'Helper', 'Crane Operator']
  const teams = ['Team Alpha', 'Team Bravo', 'Team Charlie', 'Team Delta']
  const workers: any[] = []
  for (let i = 0; i < workerNames.length; i++) {
    const project = i < 10 ? tuas : i < 18 ? jurong : i < 22 ? woodlands : null
    const w = await db.worker.create({
      data: {
        name: workerNames[i],
        employeeId: `AYK-${(1001 + i).toString()}`,
        role: workerRoles[i % workerRoles.length],
        team: teams[i % teams.length],
        projectId: project?.id,
        phone: `+65 9${(1000000 + i * 137).toString().slice(0, 6)}`,
        skillLevel: i % 5 === 0 ? 'Senior' : i % 3 === 0 ? 'Intermediate' : 'Junior',
      },
    })
    workers.push(w)
  }

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24*60*60*1000)
    if (d.getDay() === 0) continue
    for (const w of workers) {
      const absent = Math.random() < 0.08
      const checkIn = new Date(d.getTime() + (7 * 60 + Math.floor(Math.random()*30)) * 60 * 1000)
      const checkOut = new Date(d.getTime() + (17 * 60 + Math.floor(Math.random()*60)) * 60 * 1000)
      const hours = (checkOut.getTime() - checkIn.getTime()) / (1000*60*60)
      await db.attendance.create({
        data: {
          workerId: w.id, date: d,
          checkIn: absent ? null : checkIn,
          checkOut: absent ? null : checkOut,
          workingHours: absent ? 0 : Math.round(hours * 10) / 10,
          overtime: absent ? 0 : Math.round(Math.max(0, hours - 8) * 10) / 10,
          status: absent ? 'Absent' : 'Present',
        },
      })
    }
  }
  console.log(`Created ${workers.length} workers + attendance`)

  // 7. Materials
  const materials = [
    { name: 'Mono PV Panel 540W', category: 'SolarPanels', unit: 'pcs', stockQty: 5800, minStockLevel: 2000, unitPrice: 210, supplier: 'JinkoSolar SG' },
    { name: 'DC Cable 4mm² (100m roll)', category: 'DCCables', unit: 'roll', stockQty: 42, minStockLevel: 60, unitPrice: 180, supplier: 'Prysmian Group' },
    { name: 'AC Cable 6mm² (100m roll)', category: 'ACCables', unit: 'roll', stockQty: 85, minStockLevel: 40, unitPrice: 220, supplier: 'Nexans' },
    { name: 'Aluminium Mounting Rail 4m', category: 'MountingRails', unit: 'pcs', stockQty: 120, minStockLevel: 300, unitPrice: 65, supplier: 'Schletter SG' },
    { name: 'String Inverter 50kW', category: 'Inverters', unit: 'pcs', stockQty: 18, minStockLevel: 8, unitPrice: 4200, supplier: 'SMA Singapore' },
    { name: 'MC4 Connector Pair', category: 'MC4Connectors', unit: 'pair', stockQty: 4200, minStockLevel: 1500, unitPrice: 2.5, supplier: 'Multi-Contact' },
    { name: 'M8 Stainless Bolt & Nut', category: 'Bolts', unit: 'pcs', stockQty: 12000, minStockLevel: 5000, unitPrice: 0.8, supplier: 'Fastenal SG' },
    { name: 'Cable Tie 200mm', category: 'Other', unit: 'pcs', stockQty: 25000, minStockLevel: 8000, unitPrice: 0.15, supplier: 'Panduit' },
    { name: 'Earthing Kit', category: 'Other', unit: 'set', stockQty: 45, minStockLevel: 20, unitPrice: 85, supplier: 'ABB' },
    { name: 'Mono PV Panel 450W', category: 'SolarPanels', unit: 'pcs', stockQty: 1200, minStockLevel: 500, unitPrice: 175, supplier: 'Trina Solar' },
  ]
  for (const m of materials) {
    await db.material.create({ data: m })
  }
  console.log(`Created ${materials.length} materials`)

  const matList = await db.material.findMany()
  for (const m of matList) {
    for (let i = 0; i < 4; i++) {
      const type = ['Add', 'Issue', 'Issue', 'Return'][i]
      const qty = Math.floor(Math.random() * 80) + 10
      const proj = [tuas, jurong, woodlands][Math.floor(Math.random()*3)]
      await db.materialTransaction.create({
        data: {
          materialId: m.id, projectId: type === 'Issue' ? proj.id : null,
          type, qty,
          date: new Date(now.getTime() - (i * 5 + Math.floor(Math.random()*10)) * 24*60*60*1000),
          remarks: type === 'Add' ? 'Supplier delivery' : type === 'Issue' ? 'Site issue' : 'Return from site',
        },
      })
    }
  }

  // 8. Expenses
  const expenses = [
    { date: new Date(now.getTime() - 2 * 86400000), projectId: tuas.id, category: 'Materials', description: 'Emergency DC cable purchase', amount: 14500, paidBy: 'Daniel Lee', approvalStatus: 'Approved' },
    { date: new Date(now.getTime() - 5 * 86400000), projectId: tuas.id, category: 'Transport', description: 'Lorry rental - panel delivery', amount: 2200, paidBy: 'Raj Kumar', approvalStatus: 'Approved' },
    { date: new Date(now.getTime() - 8 * 86400000), projectId: jurong.id, category: 'Tools & Equipment', description: 'Torque wrench calibration', amount: 850, paidBy: 'Sarah Wong', approvalStatus: 'Approved' },
    { date: new Date(now.getTime() - 11 * 86400000), projectId: jurong.id, category: 'Fuel', description: 'Generator diesel - Block C', amount: 1450, paidBy: 'Raj Kumar', approvalStatus: 'Approved' },
    { date: new Date(now.getTime() - 13 * 86400000), projectId: woodlands.id, category: 'Labour', description: 'Overtime for weekend works', amount: 6800, paidBy: 'Priya Menon', approvalStatus: 'Pending' },
    { date: new Date(now.getTime() - 15 * 86400000), projectId: tuas.id, category: 'Accommodation', description: 'Site office rental', amount: 3200, paidBy: 'Alex Tan', approvalStatus: 'Approved' },
    { date: new Date(now.getTime() - 18 * 86400000), projectId: jurong.id, category: 'Miscellaneous', description: 'Site signage & safety stickers', amount: 540, paidBy: 'Lim Wei Ming', approvalStatus: 'Approved' },
    { date: new Date(now.getTime() - 21 * 86400000), projectId: tuas.id, category: 'Tools & Equipment', description: 'Cordless drill set x4', amount: 1280, paidBy: 'Daniel Lee', approvalStatus: 'Pending' },
    { date: new Date(now.getTime() - 25 * 86400000), projectId: woodlands.id, category: 'Materials', description: 'Mounting rail emergency resupply', amount: 8600, paidBy: 'Daniel Lee', approvalStatus: 'Pending' },
    { date: new Date(now.getTime() - 28 * 86400000), projectId: sembcorp.id, category: 'Transport', description: 'Final handover logistics', amount: 1900, paidBy: 'Priya Menon', approvalStatus: 'Approved' },
  ]
  for (const e of expenses) {
    await db.expense.create({ data: e })
  }
  console.log(`Created ${expenses.length} expenses`)

  // 9. Safety checklists (last 14 days)
  const ppeChecks = [
    { projectId: tuas.id, helmet: true, safetyShoes: true, gloves: true, harness: false, workAreaClean: true, equipmentCondition: true, electricalSafety: true },
    { projectId: jurong.id, helmet: true, safetyShoes: true, gloves: true, harness: true, workAreaClean: true, equipmentCondition: true, electricalSafety: true },
    { projectId: woodlands.id, helmet: true, safetyShoes: false, gloves: true, harness: false, workAreaClean: true, equipmentCondition: false, electricalSafety: true },
    { projectId: tuas.id, helmet: true, safetyShoes: true, gloves: true, harness: true, workAreaClean: false, equipmentCondition: true, electricalSafety: true },
  ]
  for (let i = 0; i < 14; i++) {
    const d = new Date(now.getTime() - i * 86400000)
    if (d.getDay() === 0) continue
    const c = ppeChecks[i % ppeChecks.length]
    const totalChecks = 7
    const passedChecks = Object.values({ helmet: c.helmet, safetyShoes: c.safetyShoes, gloves: c.gloves, harness: c.harness, workAreaClean: c.workAreaClean, equipmentCondition: c.equipmentCondition, electricalSafety: c.electricalSafety }).filter(Boolean).length
    await db.safetyChecklist.create({
      data: {
        date: d, projectId: c.projectId, checklistType: 'PPE',
        ...c,
        conductedById: safety.id, conductedByName: safety.name,
        location: projects.find(p => p.id === c.projectId)?.location || '',
        compliancePct: Math.round((passedChecks / totalChecks) * 100),
        remarks: i % 4 === 0 ? 'All PPE compliant' : 'Minor non-conformity noted',
      },
    })
  }

  const incidents = [
    { date: new Date(now.getTime() - 3 * 86400000), projectId: tuas.id, type: 'NearMiss', severity: 'Low', description: 'Worker nearly slipped on wet rooftop section. No injury.', location: 'Tuas Block 2', reportedByName: 'Lim Wei Ming', status: 'Closed', actionTaken: 'Anti-slip matting installed; safety briefing conducted.' },
    { date: new Date(now.getTime() - 10 * 86400000), projectId: jurong.id, type: 'Incident', severity: 'Medium', description: 'Minor cut on hand from sharp panel edge. First aid applied.', location: 'Jurong Block C', reportedByName: 'Raj Kumar', status: 'Investigating', actionTaken: 'Gloves upgrade recommended.' },
    { date: new Date(now.getTime() - 16 * 86400000), projectId: woodlands.id, type: 'UnsafeCondition', severity: 'High', description: 'Loose mounting rail found at height 4m. Immediate cordon set up.', location: 'Woodlands rooftop', reportedByName: 'Lim Wei Ming', status: 'Closed', actionTaken: 'Rail re-torqued; all rails re-inspected.' },
    { date: new Date(now.getTime() - 22 * 86400000), projectId: tuas.id, type: 'NearMiss', severity: 'Low', description: 'Crane load swung unexpectedly due to wind gust.', location: 'Tuas laydown area', reportedByName: 'Raj Kumar', status: 'Closed', actionTaken: 'Wind speed monitor installed; work suspended above 15 m/s.' },
    { date: new Date(now.getTime() - 5 * 86400000), projectId: jurong.id, type: 'UnsafeCondition', severity: 'Medium', description: 'Exposed DC cable joint found without insulation.', location: 'Jurong inverter room', reportedByName: 'Sarah Wong', status: 'Open', actionTaken: '' },
  ]
  for (const inc of incidents) {
    await db.safetyIncident.create({
      data: { ...inc, reportedById: safety.id },
    })
  }
  console.log('Seeded safety data')

  // 10. Documents
  const docs = [
    { name: 'Tuas Rooftop Drawing Rev 3.pdf', category: 'Drawings', projectId: tuas.id, fileType: 'pdf', fileSize: 2400000, uploadedByName: 'Sarah Wong', uploadedById: engineer.id },
    { name: 'JTC Permit Application.pdf', category: 'Permits', projectId: cck.id, fileType: 'pdf', fileSize: 890000, uploadedByName: 'Priya Menon', uploadedById: pm.id },
    { name: 'Method Statement - Rooftop Installation.pdf', category: 'MethodStatements', projectId: tuas.id, fileType: 'pdf', fileSize: 1500000, uploadedByName: 'Sarah Wong', uploadedById: engineer.id },
    { name: 'Risk Assessment - Working at Height.pdf', category: 'RiskAssessments', projectId: tuas.id, fileType: 'pdf', fileSize: 1200000, uploadedByName: 'Lim Wei Ming', uploadedById: safety.id },
    { name: 'Inverter Commissioning Certificate.pdf', category: 'Certificates', projectId: jurong.id, fileType: 'pdf', fileSize: 680000, uploadedByName: 'Sarah Wong', uploadedById: engineer.id },
    { name: 'Sembcorp Final Inspection Report.pdf', category: 'Inspection', projectId: sembcorp.id, fileType: 'pdf', fileSize: 1900000, uploadedByName: 'Priya Menon', uploadedById: pm.id },
    { name: 'Tuas Site Photo - Block 2.jpg', category: 'Photos', projectId: tuas.id, fileType: 'image', fileSize: 3200000, uploadedByName: 'Raj Kumar', uploadedById: supervisor.id },
    { name: 'Jurong Weekly Progress W42.pdf', category: 'Reports', projectId: jurong.id, fileType: 'pdf', fileSize: 540000, uploadedByName: 'Priya Menon', uploadedById: pm.id },
    { name: 'Material Safety Datasheet - DC Cable.pdf', category: 'MethodStatements', projectId: null, fileType: 'pdf', fileSize: 450000, uploadedByName: 'Daniel Lee', uploadedById: store.id },
    { name: 'Tuas Block 1 Pre-installation Photo.jpg', category: 'Photos', projectId: tuas.id, fileType: 'image', fileSize: 2800000, uploadedByName: 'Raj Kumar', uploadedById: supervisor.id },
  ]
  for (const d of docs) {
    await db.document.create({
      data: {
        name: d.name, category: d.category, projectId: d.projectId,
        fileUrl: `/documents/${d.name.replace(/\s+/g, '-').toLowerCase()}`, fileType: d.fileType,
        fileSize: d.fileSize, uploadedById: d.uploadedById, uploadedByName: d.uploadedByName,
      },
    })
  }
  console.log(`Created ${docs.length} documents`)

  // 11. Notifications
  const notifs = [
    { type: 'DelayedProject', title: 'Woodlands Project Delayed', message: 'Woodlands Warehouse Solar is behind schedule by 14 days.', projectId: woodlands.id, severity: 'warning' },
    { type: 'LowStock', title: 'Low Stock: DC Cables', message: 'DC Cable stock (42 rolls) below minimum (60 rolls).', severity: 'critical' },
    { type: 'LowStock', title: 'Low Stock: Mounting Rails', message: 'Aluminium Mounting Rail stock (120 pcs) below minimum (300 pcs).', severity: 'critical' },
    { type: 'OverdueTask', title: 'Overdue: Mounting rail resupply', message: 'Woodlands mounting rail resupply task is 3 days overdue.', projectId: woodlands.id, severity: 'warning' },
    { type: 'OverdueTask', title: 'Overdue: CCK permit follow-up', message: 'Choa Chu Kang permit follow-up is 5 days overdue.', projectId: cck.id, severity: 'warning' },
    { type: 'SafetyIncident', title: 'Open Safety Incident', message: 'Exposed DC cable joint in Jurong inverter room - action required.', projectId: jurong.id, severity: 'warning' },
    { type: 'PendingApproval', title: 'Expense approval needed', message: 'Overtime expense S$6,800 awaiting approval.', projectId: woodlands.id, severity: 'info' },
    { type: 'DailyProgress', title: 'Daily progress submitted', message: 'Tuas site progress for today submitted by Raj Kumar.', projectId: tuas.id, severity: 'info' },
  ]
  for (let i = 0; i < notifs.length; i++) {
    const n = notifs[i]
    await db.notification.create({
      data: {
        ...n,
        isRead: i > 2,
        createdAt: new Date(now.getTime() - i * 3600000),
      },
    })
  }
  console.log(`Created ${notifs.length} notifications`)

  console.log('Seed complete!')
  console.log('   Demo accounts: admin@ayk.com.sg / admin123, pm@ayk.com.sg / pm123, etc.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await db.$disconnect() })
