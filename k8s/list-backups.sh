#!/bin/bash

# list-backups.sh - List all available database backups

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="educard-prod"
POD_NAME="postgres-0"

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}  Available Database Backups${NC}"
echo -e "${BLUE}=====================================${NC}"
echo

# Check if pod exists
if ! kubectl get pod "$POD_NAME" -n "$NAMESPACE" &>/dev/null; then
    echo -e "${RED}❌ Pod not found: $POD_NAME${NC}"
    exit 1
fi

# Check if backup PVC is mounted
echo -e "${BLUE}Checking backup storage...${NC}"
if kubectl exec -n "$NAMESPACE" "$POD_NAME" -- test -d /backups 2>/dev/null; then
    echo -e "${GREEN}✓ Backup storage mounted${NC}"
else
    echo -e "${RED}❌ Backup storage not found at /backups${NC}"
    echo "Note: Backups are stored on backup-pvc, not on postgres pod"
    echo "Use a backup pod to list files or check the CronJob logs"
    exit 1
fi
echo

# List backups
echo -e "${BLUE}Backup files:${NC}"
BACKUP_COUNT=$(kubectl exec -n "$NAMESPACE" "$POD_NAME" -- sh -c "ls -1 /backups/backup-*.sql.gz 2>/dev/null | wc -l" | tr -d ' ')

if [ "$BACKUP_COUNT" -eq 0 ]; then
    echo -e "${YELLOW}No backups found${NC}"
    echo
    echo "To create a backup:"
    echo "  ./k8s/run-backup.sh"
else
    echo -e "${GREEN}Found $BACKUP_COUNT backup(s)${NC}"
    echo
    kubectl exec -n "$NAMESPACE" "$POD_NAME" -- ls -lh /backups/backup-*.sql.gz
    
    echo
    echo -e "${BLUE}Disk usage:${NC}"
    kubectl exec -n "$NAMESPACE" "$POD_NAME" -- df -h /backups | tail -1
    
    echo
    echo -e "${BLUE}Latest backup:${NC}"
    LATEST=$(kubectl exec -n "$NAMESPACE" "$POD_NAME" -- ls -1t /backups/backup-*.sql.gz 2>/dev/null | head -1)
    if [ -n "$LATEST" ]; then
        echo "  File: $LATEST"
        kubectl exec -n "$NAMESPACE" "$POD_NAME" -- ls -lh "$LATEST"
    fi
fi

echo
echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}  Backup Information${NC}"
echo -e "${BLUE}=====================================${NC}"
echo
echo "To restore from a backup:"
echo "  ./k8s/run-restore.sh <backup-file>"
echo
echo "To create a new backup:"
echo "  ./k8s/run-backup.sh"
echo
echo "To download a backup:"
echo "  kubectl cp $NAMESPACE/$POD_NAME:/backups/backup-YYYYMMDD-HHMMSS.sql.gz ./local-backup.sql.gz"
echo
