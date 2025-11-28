#!/bin/bash

# run-restore.sh - Helper script to restore database from backup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="educard-prod"
POSTGRES_POD="postgres-0"

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}  PostgreSQL Database Restore${NC}"
echo -e "${BLUE}=====================================${NC}"
echo

# Check prerequisites
if ! command -v kubectl >/dev/null 2>&1; then
    echo -e "${RED}❌ kubectl not found${NC}"
    exit 1
fi

# Get backup file from argument or show list
BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
    echo -e "${YELLOW}No backup file specified${NC}"
    echo
    echo "Available backups:"
    echo
    
    if kubectl exec -n "$NAMESPACE" "$POSTGRES_POD" -- test -d /backups 2>/dev/null; then
        kubectl exec -n "$NAMESPACE" "$POSTGRES_POD" -- ls -lht /backups/backup-*.sql.gz 2>/dev/null | head -10 || echo "  (No backups found)"
    else
        echo "  (Backup storage not accessible from postgres pod)"
        echo "  Check backup-pvc and ensure it's mounted"
    fi
    
    echo
    echo "Usage:"
    echo "  $0 <backup-file>"
    echo
    echo "Example:"
    echo "  $0 /backups/backup-20251128-020000.sql.gz"
    exit 1
fi

# Normalize path
if [[ "$BACKUP_FILE" != /backups/* ]]; then
    BACKUP_FILE="/backups/$BACKUP_FILE"
fi

echo -e "${BLUE}Restore Configuration:${NC}"
echo "  Backup file: $BACKUP_FILE"
echo "  Namespace: $NAMESPACE"
echo "  Database pod: $POSTGRES_POD"
echo

# Verify backup file exists
echo -e "${BLUE}[1/6] Verifying backup file...${NC}"
if kubectl exec -n "$NAMESPACE" "$POSTGRES_POD" -- test -f "$BACKUP_FILE" 2>/dev/null; then
    BACKUP_SIZE=$(kubectl exec -n "$NAMESPACE" "$POSTGRES_POD" -- du -h "$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}✓ Backup file found ($BACKUP_SIZE)${NC}"
else
    echo -e "${RED}❌ Backup file not found: $BACKUP_FILE${NC}"
    echo
    echo "List available backups:"
    echo "  ./k8s/list-backups.sh"
    exit 1
fi
echo

# WARNING
echo -e "${RED}=====================================${NC}"
echo -e "${RED}  WARNING: DESTRUCTIVE OPERATION${NC}"
echo -e "${RED}=====================================${NC}"
echo -e "${YELLOW}This will:${NC}"
echo -e "${YELLOW}  1. STOP the application${NC}"
echo -e "${YELLOW}  2. DROP all existing database tables${NC}"
echo -e "${YELLOW}  3. RESTORE from backup${NC}"
echo -e "${YELLOW}  4. Restart the application${NC}"
echo
echo -e "${YELLOW}ALL CURRENT DATA WILL BE LOST!${NC}"
echo -e "${RED}=====================================${NC}"
echo
read -p "Are you ABSOLUTELY SURE you want to continue? (type 'yes' to proceed): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}Restore cancelled${NC}"
    exit 0
fi

echo

# Scale down application
echo -e "${BLUE}[2/6] Stopping application...${NC}"
ORIGINAL_REPLICAS=$(kubectl get deployment educard-app -n "$NAMESPACE" -o jsonpath='{.spec.replicas}')
kubectl scale deployment educard-app -n "$NAMESPACE" --replicas=0
echo -e "${GREEN}✓ Application stopped (was $ORIGINAL_REPLICAS replicas)${NC}"
echo

# Wait for pods to terminate
echo "Waiting for pods to terminate..."
sleep 5
echo

# Get database credentials
echo -e "${BLUE}[3/6] Getting database credentials...${NC}"
DB_NAME=$(kubectl get configmap educard-config -n "$NAMESPACE" -o jsonpath='{.data.DB_NAME}')
DB_USER=$(kubectl get secret educard-secrets -n "$NAMESPACE" -o jsonpath='{.data.DB_USER}' | base64 -d)
DB_PASSWORD=$(kubectl get secret educard-secrets -n "$NAMESPACE" -o jsonpath='{.data.DB_PASSWORD}' | base64 -d)

echo -e "${GREEN}✓ Credentials retrieved${NC}"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo

# Verify backup integrity
echo -e "${BLUE}[4/6] Verifying backup integrity...${NC}"
if kubectl exec -n "$NAMESPACE" "$POSTGRES_POD" -- gunzip -t "$BACKUP_FILE" 2>/dev/null; then
    echo -e "${GREEN}✓ Backup file is valid${NC}"
else
    echo -e "${RED}❌ Backup file is corrupted${NC}"
    echo "Restoring application..."
    kubectl scale deployment educard-app -n "$NAMESPACE" --replicas="$ORIGINAL_REPLICAS"
    exit 1
fi
echo

# Perform restore
echo -e "${BLUE}[5/6] Restoring database...${NC}"
echo "This may take several minutes..."
echo

# Drop existing schema and restore
kubectl exec -i -n "$NAMESPACE" "$POSTGRES_POD" -- sh -c "
export PGPASSWORD='$DB_PASSWORD'

echo 'Dropping existing schema...'
psql -U '$DB_USER' -d '$DB_NAME' -c '
DO \$\$ DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = '\''public'\'') LOOP
    EXECUTE '\''DROP TABLE IF EXISTS '\'' || quote_ident(r.tablename) || '\'' CASCADE'\'';
  END LOOP;
END \$\$;
' 2>&1 || true

echo
echo 'Restoring from backup...'
gunzip -c '$BACKUP_FILE' | psql -U '$DB_USER' -d '$DB_NAME' 2>&1

echo
echo 'Verifying restoration...'
TABLE_COUNT=\$(psql -U '$DB_USER' -d '$DB_NAME' -t -c \"SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';\" | tr -d ' ')
echo \"Tables restored: \$TABLE_COUNT\"

if [ \"\$TABLE_COUNT\" -eq \"0\" ]; then
  echo 'ERROR: No tables found after restore'
  exit 1
fi
"

RESTORE_EXIT_CODE=$?

if [ $RESTORE_EXIT_CODE -ne 0 ]; then
    echo
    echo -e "${RED}❌ Database restore failed${NC}"
    echo "Restoring application..."
    kubectl scale deployment educard-app -n "$NAMESPACE" --replicas="$ORIGINAL_REPLICAS"
    exit 1
fi

echo
echo -e "${GREEN}✓ Database restored successfully${NC}"
echo

# Restart application
echo -e "${BLUE}[6/6] Restarting application...${NC}"
kubectl scale deployment educard-app -n "$NAMESPACE" --replicas="$ORIGINAL_REPLICAS"
echo -e "${GREEN}✓ Application starting ($ORIGINAL_REPLICAS replicas)${NC}"
echo

# Wait for pods to be ready
echo "Waiting for pods to be ready..."
kubectl wait --for=condition=ready pod -l app=educard -n "$NAMESPACE" --timeout=60s 2>/dev/null || {
    echo -e "${YELLOW}⚠️  Pods not ready yet, check status with:${NC}"
    echo "  kubectl get pods -n $NAMESPACE -l app=educard"
}

echo
echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}  Restore Summary${NC}"
echo -e "${BLUE}=====================================${NC}"
echo
echo "Backup file: $BACKUP_FILE"
echo "Backup size: $BACKUP_SIZE"
echo "Database: $DB_NAME"
echo
echo -e "${GREEN}✓ Restore completed successfully${NC}"
echo
echo "Next steps:"
echo "  1. Verify application is working"
echo "  2. Test data integrity"
echo "  3. Check application logs if needed"
echo
echo "Commands:"
echo "  kubectl get pods -n $NAMESPACE"
echo "  kubectl logs -n $NAMESPACE -l app=educard"
echo
