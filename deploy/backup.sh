#!/bin/bash
# Ежедневный бэкап SQLite-базы IT Team API
# Установка: chmod +x deploy/backup.sh && cp deploy/backup.sh /opt/itteam-api/backup.sh
# Cron: 0 3 * * * /opt/itteam-api/backup.sh

set -e

BACKUP_DIR="/opt/itteam-api/backups"
DB_PATH="/opt/itteam-api/repo/backend/itteam.db"

mkdir -p "$BACKUP_DIR"

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/itteam_db_$DATE.sqlite3"

if [ ! -f "$DB_PATH" ]; then
  echo "Database not found: $DB_PATH" >&2
  exit 1
fi

cp "$DB_PATH" "$BACKUP_FILE"
gzip "$BACKUP_FILE"

find "$BACKUP_DIR" -name "*.gz" -mtime +30 -delete

ls -tp "$BACKUP_DIR"/*.gz 2>/dev/null | grep -v '/$' | tail -n +8 | xargs -r rm --

echo "Backup created: ${BACKUP_FILE}.gz"
