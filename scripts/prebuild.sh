#!/bin/bash
# AYK PTE LTD — Pre-build script for Vercel
# This script ONLY switches the Prisma provider and generates the client.
# It does NOT connect to the database during build (that was causing failures).
# Database setup happens AFTER deploy via the /api/setup endpoint.

cd /home/z/my-project

echo "🔄 Loading environment from .env.production..."
if [ -f ".env.production" ]; then
  # Parse .env.production and export variables
  # Using a method that handles special characters in passwords
  while IFS='=' read -r key value || [ -n "$key" ]; do
    # Skip comments and empty lines
    case "$key" in
      \#*|"") continue ;;
    esac
    # Remove quotes from value
    value="${value#\"}"
    value="${value%\"}"
    export "$key=$value"
  done < .env.production
  echo "✓ Loaded environment from .env.production"
fi

# Auto-detect Vercel URL
if [ -n "$VERCEL_URL" ]; then
  export NEXTAUTH_URL="https://$VERCEL_URL"
  export NEXT_PUBLIC_APP_URL="https://$VERCEL_URL"
  echo "✓ Auto-detected URL: https://$VERCEL_URL"
fi

# Switch Prisma to PostgreSQL if DATABASE_URL is set and starts with postgresql://
if echo "$DATABASE_URL" | grep -q "^postgresql://\|^postgres://"; then
  echo "🔄 PostgreSQL detected — switching Prisma provider to postgresql"
  sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma
  echo "✓ Schema provider set to postgresql"
elif [ -z "$DATABASE_URL" ]; then
  echo "⚠️ DATABASE_URL not set — using SQLite (local dev)"
else
  echo "🔄 SQLite database detected — keeping provider as sqlite"
fi

# Generate Prisma client (no database connection needed)
echo "🔄 Generating Prisma client..."
npx prisma generate
echo "✓ Prisma client generated"

echo "✓ Pre-build complete (no database connection required during build)"
