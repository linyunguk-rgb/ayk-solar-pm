# Task ID 8 — Tasks + Manpower Pages Builder

## Files Created
- `src/components/pages/tasks-page.tsx` — `TasksPage` (kanban + table)
- `src/components/pages/manpower-page.tsx` — `ManpowerPage` (workers + attendance + productivity)

## Tasks Page Features
- PageHeader with emerald "New Task" button
- Overdue banner (red-50) at top when overdue count > 0; clicking button sets status filter to Delayed
- Filter bar: Project, Status, Priority, Assignee selects + Board/List view toggle + clear filters
- Board view: 4 status columns (To Do, In Progress, Completed, Delayed), each with header dot, label, count badge, scrollable list. Each task card shows overdue dot, title, project, priority dot, PriorityBadge, assignee avatar, due date, progress bar, hover edit/delete buttons
- List view: Table with sticky header, columns Title/Project/Assignee/Priority/Status/Progress/Due Date/Actions; overdue rows highlighted red-50
- New/Edit dialog with title, description, project, assignedTo (resolves name from users), team, priority, status, progress (Slider 0-100), startDate, dueDate, remarks; POST `/api/tasks`, PUT `/api/tasks/[id]`
- Delete: AlertDialog confirm → DELETE → refetch + toast
- Loading skeleton cards, empty state
- Uses `useFetch`, `apiPost`, `apiPut`, `apiDelete`, Zustand `useAppStore`, constants `TASK_STATUSES/TASK_STATUS_LABELS/TASK_PRIORITIES/formatDate`

## Manpower Page Features
- PageHeader with emerald "Add Worker" button (only rendered for Admin / ProjectManager)
- 4 StatCards: Workers On Site (today present), Workers Absent (Active, not present today), Total Workers, Total Man-hours (last 7 days from `/api/attendance?from=&to=`)
- Team Productivity card: recharts BarChart aggregating workingHours by worker.team for last 7 days
- Filter bar: Project, Team (derived from workers), Status (Active/OnLeave/Inactive) + Clear
- Tabs: Workers | Attendance Log
- Workers table (ScrollArea max-h-96, sticky header): Emp ID, Name, Role, Team, Project, Skill (badge), Status (StatusBadge), Phone, Today's hours, Actions (Check-in/Check-out + edit + delete for managers)
  - Check-in disabled if already checked in today; Check-out disabled if not checked in or already checked out
  - POST `/api/workers/[id]` body `{ action }` for check-in/out → toast + refetch
- Add/Edit Worker dialog: name, employeeId, role (Select 6 options), team (Select from existing teams), project, phone, skillLevel, status; POST `/api/workers`, PUT `/api/workers/[id]`
- Attendance Log tab: Table from `/api/attendance?from=&to=` records: Date, Worker, Team, Check-in (formatDateTime), Check-out, Working Hours, Overtime badge, Status badge; ScrollArea max-h-96
- Delete worker: AlertDialog → DELETE → refetch + toast
- Loading skeleton, empty state

## Decisions
- Both files are `'use client'`
- Only the two files were created; no other files modified
- Used `useState` (not react-hook-form) for forms per design pattern
- Used `Slider` for task progress with 5-step increments
- "Workers Absent" = Active workers without a Present attendance record today (rather than attendance with Absent status — many will not have a record at all)
- Today's hours: uses attendance.workingHours if checked out, else computes elapsed time from checkIn to now
- Team productivity chart capped to top 10 teams to avoid x-axis clutter
- Action buttons only visible/enabled for Admin/ProjectManager (`canManage`)
- ESLint: no new errors in either file
- Dev log: pre-existing module-not-found errors for other pages (projects/progress/materials/expenses/safety/documents/reports/settings/mobile/daily-entry) remain — those pages are owned by other agents, not this task

## API Surface Used
- GET `/api/tasks?projectId=&status=&assignedToId=` + POST + PUT `/api/tasks/[id]` + DELETE
- GET `/api/workers?projectId=&team=&status=` + POST + PUT `/api/workers/[id]` + POST `/api/workers/[id]` (checkin/checkout) + DELETE
- GET `/api/attendance?from=&to=&workerId=`
- GET `/api/projects`
- GET `/api/users`
