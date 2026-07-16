#!/bin/bash
# Trading Dashboard - PostgreSQL Backup Script
# Usage: ./scripts/backup.sh [output_dir]
# Default output: ./backups/

set -e

OUTPUT_DIR="${1:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="trading_dashboard_${TIMESTAMP}.sql"
mkdir -p "$OUTPUT_DIR"

echo "Backing up trading_dashboard database..."
docker exec trading-db pg_dump -U trading trading_dashboard > "${OUTPUT_DIR}/${FILENAME}"

echo "Backup saved: ${OUTPUT_DIR}/${FILENAME}"
gzip "${OUTPUT_DIR}/${FILENAME}"
echo "Compressed: ${OUTPUT_DIR}/${FILENAME}.gz"
