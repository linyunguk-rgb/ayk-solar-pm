// AYK PTE LTD - Multi-tenant seed script
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
const hash = (pw: string) => `demo$${pw}`

async function main() {
  console.log('Seeding AYK PTE LTD multi-tenant database...')
  const masterAdmin = await db.user.upsert({ where: { email: 'master@ayk.com.sg' }, update: {}, create: { email: 'master@ayk.com.sg', name: 'Platform Admin', password: hash('master123'), role: 'Admin', phone: '+65 9000 0000', isMasterAdmin: true, isTenantAdmin: false, tenantId: null, setupComplete: true } })
  console.log('Master admin: master@ayk.com.sg / master123')
  const demoTenant = await db.tenant.upsert({ where: { id: 'demo-tenant' }, update: {}, create: { id: 'demo-tenant', name: 'AYK Demo', plan: 'demo', address: '1 Tuas Avenue, Singapore 639000', uen: 'DEMO2024001', isActive: true } })
  console.log(`Demo tenant: ${demoTenant.name}`)
  const users = await Promise.all([
    db.user.create({ data: { email: 'admin@ayk.com.sg', name: 'Alex Tan', password: hash('admin123'), role: 'Admin', phone: '+65 9001 0001', tenantId: demoTenant.id, isTenantAdmin: true, setupComplete: true } }),
    db.user.create({ data: { email: 'pm@ayk.com.sg', name: 'Priya Menon', password: hash('pm123'), role: 'ProjectManager', phone: '+65 9001 0002', tenantId: demoTenant.id, setupComplete: true } }),
    db.user.create({ data: { email: 'supervisor@ayk.com.sg', name: 'Raj Kumar', password: hash('super123'), role: 'SiteSupervisor', phone: '+65 9001 0003', tenantId: demoTenant.id, setupComplete: true } }),
    db.user.create({ data: { email: 'safety@ayk.com.sg', name: 'Lim Wei Ming', password: hash('safety123'), role: 'SafetyOfficer', phone: '+65 9001 0004', tenantId: demoTenant.id, setupComplete: true } }),
    db.user.create({ data: { email: 'engineer@ayk.com.sg', name: 'Sarah Wong', password: hash('eng123'), role: 'Engineer', phone: '+65 9001 0005', tenantId: demoTenant.id, setupComplete: true } }),
    db.user.create({ data: { email: 'store@ayk.com.sg', name: 'Daniel Lee', password: hash('store123'), role: 'StoreOfficer', phone: '+65 9001 0006', tenantId: demoTenant.id, setupComplete: true } }),
  ])
  const [admin, pm, supervisor, safety, engineer, store] = users
  console.log(`Created ${users.length} demo users`)
  const now = new Date()
  const projects = await Promise.all([
    db.project.create({ data: { code: 'AYK-TUAS-001', name: 'Tuas Solar Project', location: 'Tuas, Singapore', client: 'Tuas Power Ltd', totalPanels: 8400, installedPanels: 2100, capacity: '3.5 MWp', status: 'Active', startDate: new Date(2025,0,15), endDate: new Date(2025,11,30), budget: 5800000, actualCost: 2410000, managerId: pm.id, tenantId: demoTenant.id, description: 'Rooftop solar installation at Tuas.' } }),
    db.project.create({ data: { code: 'AYK-JUR-002', name: 'Jurong Industrial Solar', location: 'Jurong, Singapore', client: 'Jurong Chemicals', totalPanels: 12500, installedPanels: 8600, capacity: '5.2 MWp', status: 'Active', startDate: new Date(2025,1,1), endDate: new Date(2026,1,28), budget: 8200000, actualCost: 5870000, managerId: pm.id, tenantId: demoTenant.id, description: 'Ground-mount and rooftop hybrid.' } }),
    db.project.create({ data: { code: 'AYK-SEM-003', name: 'Sembcorp Solar Farm', location: 'Sembcorp, Singapore', client: 'Sembcorp Industries', totalPanels: 5200, installedPanels: 5200, capacity: '2.1 MWp', status: 'Completed', startDate: new Date(2025,2,10), endDate: new Date(2025,9,15), budget: 3900000, actualCost: 3720000, managerId: pm.id, tenantId: demoTenant.id, description: 'Completed solar farm.' } }),
    db.project.create({ data: { code: 'AYK-WD-004', name: 'Woodlands Warehouse Solar', location: 'Woodlands, Singapore', client: 'Woodlands Logistics', totalPanels: 3200, installedPanels: 980, capacity: '1.4 MWp', status: 'Delayed', startDate: new Date(2024,8,1), endDate: new Date(2025,5,30), budget: 2100000, actualCost: 1980000, managerId: pm.id, tenantId: demoTenant.id, description: 'Delayed due to supply chain.' } }),
    db.project.create({ data: { code: 'AYK-CCK-005', name: 'Choa Chu Kang Solar', location: 'Choa Chu Kang, Singapore', client: 'CCK Holdings', totalPanels: 6800, installedPanels: 0, capacity: '2.8 MWp', status: 'OnHold', startDate: new Date(2025,4,5), endDate: new Date(2026,3,20), budget: 4500000, actualCost: 320000, managerId: pm.id, tenantId: demoTenant.id, description: 'On hold pending permit.' } }),
  ])
  const [tuas, jurong, sembcorp, woodlands, cck] = projects
  console.log(`Created ${projects.length} projects`)
  const sw = [5,15,15,40,15,10], sn = ['Survey','Design','Procurement','Installation','Testing','Handover']
  const stageData = [
    { pcts: [100,100,80,45,20,0], sts: ['Completed','Completed','InProgress','InProgress','NotStarted','NotStarted'] },
    { pcts: [100,100,100,70,40,10], sts: ['Completed','Completed','Completed','InProgress','InProgress','InProgress'] },
    { pcts: [100,100,100,100,100,100], sts: ['Completed','Completed','Completed','Completed','Completed','Completed'] },
    { pcts: [100,100,60,30,0,0], sts: ['Completed','Completed','Delayed','Delayed','NotStarted','NotStarted'] },
    { pcts: [100,50,0,0,0,0], sts: ['Completed','InProgress','NotStarted','NotStarted','NotStarted','NotStarted'] },
  ]
  for (const [pi, p] of projects.entries()) {
    const sd = stageData[pi]
    for (let i=0;i<6;i++) {
      const td = Math.ceil((p.endDate.getTime()-p.startDate.getTime())/86400000/6)
      await db.projectStage.create({ data: { projectId: p.id, name: sn[i], order: i, plannedPct: sd.pcts[i], actualPct: sd.pcts[i], weight: sw[i], status: sd.sts[i], startDate: new Date(p.startDate.getTime()+td*i*86400000), endDate: new Date(p.startDate.getTime()+td*(i+1)*86400000) } })
    }
  }
  for (const [project, start, rate] of [[tuas,1300,28],[jurong,8200,14],[woodlands,980,5]] as any) {
    let total = start
    for (let i=29;i>=0;i--) { const d=new Date(now.getTime()-i*86400000); if(d.getDay()===0)continue; const inst=Math.round(rate*(0.7+Math.random()*0.6)); total+=inst; await db.dailyProgress.create({ data: { projectId: project.id, date: d, installedPanels: inst, totalInstalled: Math.min(total,project.totalPanels), manHours: Math.round((20+Math.random()*12)*10)/10, workers: 18+Math.floor(Math.random()*12), materialsUsed: JSON.stringify({SolarPanels:inst}), equipmentUsed: JSON.stringify(['Crane','Drill Rig']), workCompleted: `Installed ${inst} panels`, workPending: 'Cable routing', siteStatus: i%7===0?'Delay':'Normal', remarks: 'Smooth', gpsLocation: project.location, submittedById: supervisor.id, tenantId: demoTenant.id } }) }
    await db.project.update({ where: { id: project.id }, data: { installedPanels: Math.min(total, project.totalPanels) } })
  }
  const tasks = [
    { title: 'Complete Block 2 mounting rail installation', projectId: tuas.id, assignedToId: supervisor.id, priority: 'High', status: 'InProgress', progress: 60, dueOffset: 7 },
    { title: 'Procure 3,000 DC cables', projectId: tuas.id, assignedToId: store.id, priority: 'Critical', status: 'InProgress', progress: 40, dueOffset: 3 },
    { title: 'Inverter commissioning prep', projectId: tuas.id, assignedToId: engineer.id, priority: 'Medium', status: 'Todo', progress: 0, dueOffset: 14 },
    { title: 'Weekly toolbox meeting', projectId: tuas.id, assignedToId: safety.id, priority: 'Medium', status: 'Completed', progress: 100, dueOffset: -2 },
    { title: 'Jurong Block C cable testing', projectId: jurong.id, assignedToId: engineer.id, priority: 'High', status: 'InProgress', progress: 75, dueOffset: 5 },
    { title: 'Jurong final inspection prep', projectId: jurong.id, assignedToId: pm.id, priority: 'High', status: 'Todo', progress: 0, dueOffset: 21 },
    { title: 'Woodlands mounting rail resupply', projectId: woodlands.id, assignedToId: store.id, priority: 'Critical', status: 'Delayed', progress: 30, dueOffset: -3 },
    { title: 'Woodlands permit renewal', projectId: woodlands.id, assignedToId: pm.id, priority: 'High', status: 'InProgress', progress: 50, dueOffset: 10 },
    { title: 'CCK permit follow-up', projectId: cck.id, assignedToId: pm.id, priority: 'High', status: 'Delayed', progress: 20, dueOffset: -5 },
    { title: 'Monthly safety audit', projectId: tuas.id, assignedToId: safety.id, priority: 'Medium', status: 'Todo', progress: 0, dueOffset: 12 },
    { title: 'Material stock reconciliation', projectId: null, assignedToId: store.id, priority: 'Medium', status: 'InProgress', progress: 40, dueOffset: 4 },
    { title: 'Q4 budget review', projectId: null, assignedToId: pm.id, priority: 'Medium', status: 'Todo', progress: 0, dueOffset: 20 },
  ]
  for (const t of tasks) await db.task.create({ data: { title: t.title, projectId: t.projectId, assignedToId: t.assignedToId, assignedToName: users.find(u=>u.id===t.assignedToId)?.name, priority: t.priority, status: t.status, progress: t.progress, startDate: new Date(now.getTime()-14*86400000), dueDate: new Date(now.getTime()+t.dueOffset*86400000), tenantId: demoTenant.id } })
  console.log(`Created ${tasks.length} tasks`)
  const wn = ['Wong HK','Tan AL','Ravi S','Muthu K','Chen BJ','Ali R','Mohd S','Singh G','Ng PL','Lim CH','Kumar V','Das S','Yusof B','Rahman A','Ho JS','Tan BH','Lee KW','Goh TM','Phua D','Ramachandran P','Krishnan M','Subramaniam R','Selvam T','Bala K']
  const wr = ['Solar Installer','Electrician','Foreman','Technician','Helper','Crane Operator']
  const tm = ['Team Alpha','Team Bravo','Team Charlie','Team Delta']
  for (let i=0;i<wn.length;i++) { const p = i<10?tuas:i<18?jurong:i<22?woodlands:null; await db.worker.create({ data: { name: wn[i], employeeId: `AYK-${1001+i}`, role: wr[i%wr.length], team: tm[i%tm.length], projectId: p?.id, phone: `+65 9${(1000000+i*137).toString().slice(0,6)}`, skillLevel: i%5===0?'Senior':i%3===0?'Intermediate':'Junior', tenantId: demoTenant.id } }) }
  console.log(`Created ${wn.length} workers`)
  const mats = [
    { name: 'Mono PV Panel 540W', category: 'SolarPanels', unit: 'pcs', stockQty: 5800, minStockLevel: 2000, unitPrice: 210, supplier: 'JinkoSolar' },
    { name: 'DC Cable 4mm²', category: 'DCCables', unit: 'roll', stockQty: 42, minStockLevel: 60, unitPrice: 180, supplier: 'Prysmian' },
    { name: 'AC Cable 6mm²', category: 'ACCables', unit: 'roll', stockQty: 85, minStockLevel: 40, unitPrice: 220, supplier: 'Nexans' },
    { name: 'Aluminium Mounting Rail 4m', category: 'MountingRails', unit: 'pcs', stockQty: 120, minStockLevel: 300, unitPrice: 65, supplier: 'Schletter' },
    { name: 'String Inverter 50kW', category: 'Inverters', unit: 'pcs', stockQty: 18, minStockLevel: 8, unitPrice: 4200, supplier: 'SMA' },
    { name: 'MC4 Connector Pair', category: 'MC4Connectors', unit: 'pair', stockQty: 4200, minStockLevel: 1500, unitPrice: 2.5, supplier: 'Multi-Contact' },
    { name: 'M8 Bolt & Nut', category: 'Bolts', unit: 'pcs', stockQty: 12000, minStockLevel: 5000, unitPrice: 0.8, supplier: 'Fastenal' },
    { name: 'Cable Tie 200mm', category: 'Other', unit: 'pcs', stockQty: 25000, minStockLevel: 8000, unitPrice: 0.15, supplier: 'Panduit' },
    { name: 'Earthing Kit', category: 'Other', unit: 'set', stockQty: 45, minStockLevel: 20, unitPrice: 85, supplier: 'ABB' },
    { name: 'Mono PV Panel 450W', category: 'SolarPanels', unit: 'pcs', stockQty: 1200, minStockLevel: 500, unitPrice: 175, supplier: 'Trina' },
  ]
  for (const m of mats) await db.material.create({ data: { ...m, tenantId: demoTenant.id } })
  console.log(`Created ${mats.length} materials`)
  const exps = [
    { date: new Date(now.getTime()-2*86400000), projectId: tuas.id, category: 'Materials', description: 'Emergency DC cable purchase', amount: 14500, paidBy: 'Daniel Lee', approvalStatus: 'Approved' },
    { date: new Date(now.getTime()-5*86400000), projectId: tuas.id, category: 'Transport', description: 'Lorry rental', amount: 2200, paidBy: 'Raj Kumar', approvalStatus: 'Approved' },
    { date: new Date(now.getTime()-8*86400000), projectId: jurong.id, category: 'Tools & Equipment', description: 'Torque wrench calibration', amount: 850, paidBy: 'Sarah Wong', approvalStatus: 'Approved' },
    { date: new Date(now.getTime()-13*86400000), projectId: woodlands.id, category: 'Labour', description: 'Overtime', amount: 6800, paidBy: 'Priya Menon', approvalStatus: 'Pending' },
    { date: new Date(now.getTime()-21*86400000), projectId: tuas.id, category: 'Tools & Equipment', description: 'Cordless drill set', amount: 1280, paidBy: 'Daniel Lee', approvalStatus: 'Pending' },
  ]
  for (const e of exps) await db.expense.create({ data: { ...e, tenantId: demoTenant.id } })
  const ppe = [{p:tuas.id,h:true,s:true,g:true,ha:false,w:true,e:true,el:true},{p:jurong.id,h:true,s:true,g:true,ha:true,w:true,e:true,el:true},{p:woodlands.id,h:true,s:false,g:true,ha:false,w:true,e:false,el:true}]
  for (let i=0;i<14;i++) { const d=new Date(now.getTime()-i*86400000); if(d.getDay()===0)continue; const c=ppe[i%ppe.length]; const pass=Object.values({h:c.h,s:c.s,g:c.g,ha:c.ha,w:c.w,e:c.e,el:c.el}).filter(Boolean).length; await db.safetyChecklist.create({ data: { date:d, projectId:c.p, checklistType:'PPE', helmet:c.h, safetyShoes:c.s, gloves:c.g, harness:c.ha, workAreaClean:c.w, equipmentCondition:c.e, electricalSafety:c.el, conductedById:safety.id, conductedByName:safety.name, location:'Site', compliancePct:Math.round(pass/7*100), remarks:'OK', tenantId:demoTenant.id } }) }
  const incs = [
    { date: new Date(now.getTime()-3*86400000), projectId: tuas.id, type: 'NearMiss', severity: 'Low', description: 'Worker nearly slipped.', location: 'Tuas', reportedByName: 'Lim Wei Ming', status: 'Closed', actionTaken: 'Anti-slip matting.' },
    { date: new Date(now.getTime()-10*86400000), projectId: jurong.id, type: 'Incident', severity: 'Medium', description: 'Minor cut on hand.', location: 'Jurong', reportedByName: 'Raj Kumar', status: 'Investigating', actionTaken: 'Gloves upgrade.' },
    { date: new Date(now.getTime()-5*86400000), projectId: jurong.id, type: 'UnsafeCondition', severity: 'Medium', description: 'Exposed DC cable joint.', location: 'Jurong inverter room', reportedByName: 'Sarah Wong', status: 'Open', actionTaken: '' },
  ]
  for (const inc of incs) await db.safetyIncident.create({ data: { ...inc, reportedById: safety.id, tenantId: demoTenant.id } })
  const docs = [
    { name: 'Tuas Rooftop Drawing Rev 3.pdf', category: 'Drawings', projectId: tuas.id, fileType: 'pdf', fileSize: 2400000, uploadedByName: 'Sarah Wong', uploadedById: engineer.id },
    { name: 'Tuas Site Photo.jpg', category: 'Photos', projectId: tuas.id, fileType: 'image', fileSize: 3200000, uploadedByName: 'Raj Kumar', uploadedById: supervisor.id },
    { name: 'Method Statement.pdf', category: 'MethodStatements', projectId: tuas.id, fileType: 'pdf', fileSize: 1500000, uploadedByName: 'Sarah Wong', uploadedById: engineer.id },
  ]
  for (const d of docs) await db.document.create({ data: { name: d.name, category: d.category, projectId: d.projectId, fileUrl: `/documents/${d.name.replace(/\s+/g,'-').toLowerCase()}`, fileType: d.fileType, fileSize: d.fileSize, uploadedById: d.uploadedById, uploadedByName: d.uploadedByName, tenantId: demoTenant.id } })
  const notifs = [
    { type: 'DelayedProject', title: 'Woodlands Project Delayed', message: 'Behind schedule by 14 days.', projectId: woodlands.id, severity: 'warning' },
    { type: 'LowStock', title: 'Low Stock: DC Cables', message: '42 rolls below minimum 60.', severity: 'critical' },
    { type: 'LowStock', title: 'Low Stock: Mounting Rails', message: '120 pcs below minimum 300.', severity: 'critical' },
    { type: 'OverdueTask', title: 'Overdue: Mounting rail resupply', message: '3 days overdue.', projectId: woodlands.id, severity: 'warning' },
    { type: 'SafetyIncident', title: 'Open Safety Incident', message: 'Exposed DC cable joint.', projectId: jurong.id, severity: 'warning' },
    { type: 'PendingApproval', title: 'Expense approval needed', message: 'S$6,800 awaiting approval.', projectId: woodlands.id, severity: 'info' },
  ]
  for (let i=0;i<notifs.length;i++) await db.notification.create({ data: { ...notifs[i], isRead: i>2, createdAt: new Date(now.getTime()-i*3600000), tenantId: demoTenant.id } })
  await db.accessCode.create({ data: { code: 'AYK-DEMO-VIEW', label: 'Demo viewing code', plan: 'demo', maxUses: 100, usedCount: 0, isActive: true } }).catch(()=>{})
  await db.accessCode.create({ data: { code: 'AYK-NEW-ENT1', label: 'New enterprise (1 seat)', plan: 'enterprise', maxUses: 1, usedCount: 0, isActive: true } }).catch(()=>{})
  await db.accessCode.create({ data: { code: 'AYK-NEW-ENT5', label: 'New enterprise (5 seats)', plan: 'enterprise', maxUses: 5, usedCount: 0, isActive: true } }).catch(()=>{})
  console.log('Created sample access codes')
  console.log('\n✅ Seed complete!')
  console.log('Platform Admin: master@ayk.com.sg / master123')
  console.log('Demo Admin: admin@ayk.com.sg / admin123')
  console.log('Codes: AYK-DEMO-VIEW, AYK-NEW-ENT1, AYK-NEW-ENT5')
}
main().catch(e=>{console.error(e);process.exit(1)}).finally(async()=>{await db.$disconnect()})
