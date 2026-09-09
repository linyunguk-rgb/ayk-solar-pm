import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Seed trigger (only seeds if database is empty)
export async function POST() {
  const count = await db.user.count()
  if (count > 0) {
    return NextResponse.json({ message: 'Database already seeded', count })
  }
  // Tell client to run the seed script
  return NextResponse.json({ message: 'Database empty. Run: bun run scripts/seed.ts', count: 0 }, { status: 200 })
}

export async function GET() {
  const counts = {
    users: await db.user.count(),
    projects: await db.project.count(),
    tasks: await db.task.count(),
    workers: await db.worker.count(),
    materials: await db.material.count(),
    documents: await db.document.count(),
  }
  return NextResponse.json({ counts })
}
