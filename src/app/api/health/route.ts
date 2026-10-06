import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Health check + database keep-alive endpoint.
// Vercel Cron calls this every 10 minutes to prevent Supabase from pausing.
// You can also call it manually: https://your-app.vercel.app/api/health
export async function GET() {
  try {
    // Simple query to keep the database connection alive
    const result = await db.$queryRaw`SELECT COUNT(*)::int as count FROM users`
    const userCount = (result as any[])[0]?.count || 0
    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      users: userCount,
      timestamp: new Date().toISOString(),
    })
  } catch (e: any) {
    return NextResponse.json({
      status: 'unhealthy',
      database: 'disconnected',
      error: e.message?.slice(0, 100),
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}
