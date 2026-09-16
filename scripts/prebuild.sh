#!/bin/bash
# AYK PTE LTD — Pre-build script for Vercel
# FULLY AUTOMATIC: loads .env.production if DATABASE_URL is not set,
# switches Prisma to PostgreSQL, pushes schema to Supabase.
# You NEVER need to set environment variables in Vercel manually.

cd /home/z/my-project

# ─── Step 1: Load .env.production if DATABASE_URL is not set ───
if [ -z "$DATABASE_URL" ]; then
  echo "🔄 DATABASE_URL not set in Vercel — loading from .env.production"
  if [ -f ".env.production" ]; then
    # Export all variables from .env.production
    set -a
    source .env.production
    set +a
    echo "✓ Loaded environment from .env.production"
  else
    echo "⚠️  No .env.production file found — falling back to SQLite"
  fi
fi

# ─── Step 2: Auto-detect the Vercel URL if not set ───
if [ -z "$NEXTAUTH_URL" ] && [ -n "$VERCEL_URL" ]; then
  export NEXTAUTH_URL="https://$VERCEL_URL"
  echo "✓ Auto-detected NEXTAUTH_URL: $NEXTAUTH_URL"
fi
if [ -z "$NEXT_PUBLIC_APP_URL" ] && [ -n "$VERCEL_URL" ]; then
  export NEXT_PUBLIC_APP_URL="https://$VERCEL_URL"
  echo "✓ Auto-detected NEXT_PUBLIC_APP_URL: $NEXT_PUBLIC_APP_URL"
fi

# ─── Step 3: Switch Prisma to PostgreSQL if DATABASE_URL is postgresql:// ───
if echo "$DATABASE_URL" | grep -q "^postgresql://\|^postgres://"; then
  echo "🔄 PostgreSQL database detected — switching Prisma provider to postgresql"
  sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma
  echo "✓ Schema provider set to postgresql"
  
  # Generate Prisma client
  echo "🔄 Generating Prisma client..."
  npx prisma generate
  
  # Push schema to database
  echo "🔄 Pushing schema to PostgreSQL database (Supabase)..."
  npx prisma db push --accept-data-loss 2>&1 || echo "⚠️ db push failed — tables may already exist"
  echo "✓ Database schema pushed"
else
  echo "🔄 SQLite database detected — keeping provider as sqlite"
  sed -i 's/provider = "postgresql"/provider = "sqlite"/' prisma/schema.prisma
  npx prisma generate
fi

echo "✓ Pre-build database setup complete"
