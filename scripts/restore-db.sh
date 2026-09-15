#!/bin/bash
# AYK PTE LTD - Database Restore Script
# Restores a gzipped SQLite backup.
# Usage: bash scripts/restore-db.sh <backup-file.gz>
# Example: bash scripts/restore-db.sh backups/ayk-backup-20250912-100000.db.gz

set -e

if [ -z "$1" ]; then
  echo "Usage: bash scripts/restore-db.sh <backup-file.gz>"
  echo ""
  echo "Available backups:"
  ls -lht backups/ayk-backup-*.db.gz 2>/dev/null | head -10 || echo "  No backups found in ./backups/"
  exit 1
fi

BACKUP_FILE="$1"
DB_PATH="${DATABASE_URL#file:}"
if [ -z "$DB_PATH" ] || [ "$DB_PATH" = "$DATABASE_URL" ]; then
  DB_PATH="db/custom.db"
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "ERROR: Backup file not found: $BACKUP_FILE"
  exit 1
fi

# Safety: create a pre-restore backup of the current DB
if [ -f "$DB_PATH" ]; then
  PRE_RESTORE="backups/pre-restore-$(date +%Y%m%d-%H%M%S).db"
  mkdir -p backups
  cp "$DB_PATH" "$PRE_RESTORE"
  echo "✓ Current DB backed up to $PRE_RESTORE before restore"
fi

echo "Restoring $BACKUP_FILE → $DB_PATH"

# Stop the app first (optional — comment out if running manually)
# pkill -f "next-server" 2>/dev/null || true

# Decompress and restore
gunzip -c "$BACKUP_FILE" > "$DB_PATH"
echo "✓ Database restored successfully"
echo ""
echo "Restart your application to use the restored database."
