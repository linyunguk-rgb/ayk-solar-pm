#!/bin/bash
# AYK PTE LTD — Production Startup Script
# Use this to run the app in production mode.
#
# Usage: bash start-prod.sh
#
# Prerequisites:
# 1. Run `bun run build` first
# 2. Set environment variables in .env (DATABASE_URL, NEXTAUTH_SECRET, etc.)
# 3. Run `bun run db:push` to create/migrate the database schema

set -e

cd /home/z/my-project

echo "=========================================="
echo "AYK PTE LTD — Solar PM (Production)"
echo "=========================================="
echo ""

# Check if build exists
if [ ! -d ".next/standalone" ]; then
  echo "ERROR: Production build not found."
  echo "Run 'bun run build' first."
  exit 1
fi

# Check if database exists
DB_PATH="${DATABASE_URL#file:}"
if [ -z "$DB_PATH" ] || [ "$DB_PATH" = "$DATABASE_URL" ]; then
  DB_PATH="db/custom.db"
fi

if [ ! -f "$DB_PATH" ]; then
  echo "WARNING: Database not found at $DB_PATH"
  echo "Running db:push to create schema..."
  bun run db:push
fi

# Set production env
export NODE_ENV=production
export PORT=${PORT:-3000}

echo "Starting production server on port $PORT..."
echo "Database: $DB_PATH"
echo ""

# Start the standalone server
exec node .next/standalone/server.js
