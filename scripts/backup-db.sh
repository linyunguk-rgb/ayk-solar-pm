#!/bin/bash
# AYK PTE LTD - Database Backup Script
# Creates a timestamped backup of the SQLite database.
# Usage: bash scripts/backup-db.sh [backup-dir]
# Default backup dir: ./backups

set -e

DB_PATH="${DATABASE_URL#file:}"
if [ -z "$DB_PATH" ] || [ "$DB_PATH" = "$DATABASE_URL" ]; then
  DB_PATH="db/custom.db"
fi

BACKUP_DIR="${1:-./backups}"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
BACKUP_FILE="$BACKUP_DIR/ayk-backup-$TIMESTAMP.db"

mkdir -p "$BACKUP_DIR"

if [ ! -f "$DB_PATH" ]; then
  echo "ERROR: Database file not found at $DB_PATH"
  exit 1
fi

echo "Backing up $DB_PATH → $BACKUP_FILE"

# Use sqlite3 .backup for a consistent snapshot (safe even if DB is in use)
if command -v sqlite3 &> /dev/null; then
  sqlite3 "$DB_PATH" ".backup '$BACKUP_FILE'"
else
  # Fall back to cp if sqlite3 CLI is not installed
  cp "$DB_PATH" "$BACKUP_FILE"
fi

# Compress the backup
gzip -f "$BACKUP_FILE"
echo "✓ Backup created: ${BACKUP_FILE}.gz ($(du -h ${BACKUP_FILE}.gz | cut -f1))"

# Clean up backups older than 30 days
find "$BACKUP_DIR" -name "ayk-backup-*.db.gz" -mtime +30 -delete 2>/dev/null || true
echo "✓ Old backups cleaned (older than 30 days)"

# List recent backups
echo ""
echo "Recent backups:"
ls -lht "$BACKUP_DIR"/ayk-backup-*.db.gz 2>/dev/null | head -5
