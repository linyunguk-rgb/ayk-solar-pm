#!/bin/bash
# AYK PTE LTD — Pre-build script for Vercel
# Auto-switches Prisma from SQLite to PostgreSQL when a DATABASE_URL starting with postgresql:// is detected.
# This lets you develop with SQLite locally and deploy to Supabase/PostgreSQL on Vercel with zero manual config.

cd /home/z/my-project

if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  DATABASE_URL not set, using .env file"
fi

# Check if DATABASE_URL is PostgreSQL
if echo "$DATABASE_URL" | grep -q "^postgresql://\|^postgres://"; then
  echo "🔄 PostgreSQL database detected — switching Prisma provider to postgresql"
  sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma
  echo "✓ Schema provider set to postgresql"
  
  # Generate Prisma client
  echo "🔄 Generating Prisma client..."
  npx prisma generate
  
  # Push schema to database
  echo "🔄 Pushing schema to PostgreSQL database..."
  npx prisma db push --accept-data-loss
  echo "✓ Database schema pushed"
else
  echo "🔄 SQLite database detected — keeping provider as sqlite"
  sed -i 's/provider = "postgresql"/provider = "sqlite"/' prisma/schema.prisma
  npx prisma generate
fi

echo "✓ Pre-build database setup complete"
