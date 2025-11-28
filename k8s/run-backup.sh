#!/bin/bash

# run-backup.sh - Helper script to manually trigger database backup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="educard-prod"
CRONJOB_NAME="postgres-backup"

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}  PostgreSQL Manual Backup${NC}"
echo -e "${BLUE}=====================================${NC}"
echo

# Check prerequisites
if ! command -v kubectl >/dev/null 2>&1; then
    echo -e "${RED}❌ kubectl not found${NC}"
    exit 1
fi

# Check if CronJob exists
echo -e "${BLUE}[1/5] Checking CronJob...${NC}"
if ! kubectl get cronjob "$CRONJOB_NAME" -n "$NAMESPACE" &>/dev/null; then
    echo -e "${RED}❌ CronJob not found: $CRONJOB_NAME${NC}"
    echo "Please run: kubectl apply -f k8s/backup-cronjob.yaml"
    exit 1
fi
echo -e "${GREEN}✓ CronJob exists${NC}"
echo

# Generate job name
JOB_NAME="manual-backup-$(date +%Y%m%d-%H%M%S)"

echo -e "${BLUE}[2/5] Creating manual backup job...${NC}"
echo "Job name: $JOB_NAME"

# Create job from cronjob
if kubectl create job --from=cronjob/"$CRONJOB_NAME" "$JOB_NAME" -n "$NAMESPACE"; then
    echo -e "${GREEN}✓ Job created${NC}"
else
    echo -e "${RED}❌ Failed to create job${NC}"
    exit 1
fi
echo

# Wait for job to start
echo -e "${BLUE}[3/5] Waiting for job to start...${NC}"
sleep 3

POD_NAME=$(kubectl get pods -n "$NAMESPACE" -l job-name="$JOB_NAME" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")

if [ -z "$POD_NAME" ]; then
    echo -e "${YELLOW}⚠️  Pod not found yet, waiting...${NC}"
    sleep 5
    POD_NAME=$(kubectl get pods -n "$NAMESPACE" -l job-name="$JOB_NAME" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
fi

if [ -n "$POD_NAME" ]; then
    echo -e "${GREEN}✓ Pod started: $POD_NAME${NC}"
else
    echo -e "${RED}❌ Pod did not start${NC}"
    exit 1
fi
echo

# Follow logs
echo -e "${BLUE}[4/5] Following backup logs...${NC}"
echo -e "${BLUE}=========================================${NC}"
echo

kubectl logs -n "$NAMESPACE" -f "$POD_NAME" 2>/dev/null || {
    echo -e "${YELLOW}⚠️  Could not follow logs, waiting for pod...${NC}"
    sleep 5
    kubectl logs -n "$NAMESPACE" "$POD_NAME"
}

echo
echo -e "${BLUE}=========================================${NC}"

# Check job status
echo
echo -e "${BLUE}[5/5] Checking backup status...${NC}"

JOB_STATUS=$(kubectl get job "$JOB_NAME" -n "$NAMESPACE" -o jsonpath='{.status.conditions[0].type}' 2>/dev/null || echo "Unknown")

if [ "$JOB_STATUS" = "Complete" ]; then
    echo -e "${GREEN}✓ Backup completed successfully${NC}"
    
    # List backup files
    echo
    echo -e "${BLUE}Recent backup files:${NC}"
    kubectl exec -it -n "$NAMESPACE" postgres-0 -- sh -c "ls -lht /backups/backup-*.sql.gz 2>/dev/null | head -5" || echo "  (Could not list files)"
    
    echo
    echo -e "${BLUE}Disk usage:${NC}"
    kubectl exec -it -n "$NAMESPACE" postgres-0 -- df -h /backups | tail -1 || echo "  (Could not check disk usage)"
    
elif [ "$JOB_STATUS" = "Failed" ]; then
    echo -e "${RED}❌ Backup failed${NC}"
    echo
    echo -e "${YELLOW}View logs with:${NC}"
    echo "  kubectl logs -n $NAMESPACE $POD_NAME"
    exit 1
else
    echo -e "${YELLOW}⚠️  Job status: $JOB_STATUS${NC}"
    echo
    echo "Monitor with:"
    echo "  kubectl get job $JOB_NAME -n $NAMESPACE -w"
fi

echo
echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}  Backup Commands${NC}"
echo -e "${BLUE}=====================================${NC}"
echo
echo "View job status:"
echo "  kubectl get job $JOB_NAME -n $NAMESPACE"
echo
echo "View logs:"
echo "  kubectl logs -n $NAMESPACE $POD_NAME"
echo
echo "List backup files:"
echo "  kubectl exec -it -n $NAMESPACE postgres-0 -- ls -lh /backups"
echo
echo "Delete job:"
echo "  kubectl delete job $JOB_NAME -n $NAMESPACE"
echo
