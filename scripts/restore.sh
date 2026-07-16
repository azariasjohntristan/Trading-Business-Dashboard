#!/bin/bash
# Trading Dashboard - PostgreSQL Restore Script
# Usage: ./scripts/restore.sh <backup_file>
# Example: ./scripts/restore.sh backups/trading_dashboard_20260101_120000.sql.gz

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <backup_file>"
    echo "Example: $0 backups/trading_dashboard_20260101_120000.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"

if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "Restoring from compressed backup: $BACKUP_FILE"
    gunzip -c "$BACKUP_FILE" | docker exec -i trading-db psql -U trading trading_dashboard
else
    echo "Restoring from: $BACKUP_FILE"
    docker exec -i trading-db psql -U trading trading_dashboard < "$BACKUP_FILE"
fi

echo "Restore complete."
