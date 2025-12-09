#!/usr/bin/env bash

# run-migration.sh - Run Database Migrations via Kubernetes Job
# This script creates and monitors a Kubernetes Job to run database migrations

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="educard-prod"
JOB_NAME="educard-migration"
JOB_FILE="$(dirname "$0")/migration-job.yaml"

echo -e "${BLUE}=== Educard Database Migration ===${NC}\n"

# Check if Job file exists
if [[ ! -f "$JOB_FILE" ]]; then
    echo -e "${RED}Error: Migration job file not found: ${JOB_FILE}${NC}"
    exit 1
fi

# Check if Job already exists
if kubectl get job "$JOB_NAME" -n "$NAMESPACE" &>/dev/null; then
    echo -e "${YELLOW}Migration Job already exists${NC}"
    echo "Do you want to delete and recreate it? (y/n)"
    read -r answer
    if [[ "$answer" == "y" ]]; then
        echo "Deleting existing Job..."
        kubectl delete job "$JOB_NAME" -n "$NAMESPACE"
        echo -e "${GREEN}✓ Job deleted${NC}\n"
        sleep 2
    else
        echo "Checking status of existing Job..."
        kubectl get job "$JOB_NAME" -n "$NAMESPACE"
        exit 0
    fi
fi

# Apply migration Job
echo -e "${YELLOW}Step 1: Creating Migration Job${NC}"
kubectl apply -f "$JOB_FILE"
echo -e "${GREEN}✓ Job created${NC}\n"

# Wait for pod to be created
echo -e "${YELLOW}Step 2: Waiting for Pod${NC}"
echo "Waiting for migration pod to start..."
for i in {1..30}; do
    POD_NAME=$(kubectl get pods -n "$NAMESPACE" -l app=educard-migration -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
    if [[ -n "$POD_NAME" ]]; then
        echo -e "${GREEN}✓ Pod created: ${POD_NAME}${NC}\n"
        break
    fi
    sleep 1
    echo -n "."
done

if [[ -z "$POD_NAME" ]]; then
    echo -e "\n${RED}Error: Pod not created after 30 seconds${NC}"
    kubectl describe job "$JOB_NAME" -n "$NAMESPACE"
    exit 1
fi

# Wait for pod to complete
echo -e "${YELLOW}Step 3: Running Migrations${NC}"
echo "Waiting for migrations to complete..."

# Follow logs while job is running
kubectl logs -n "$NAMESPACE" -f "$POD_NAME" 2>/dev/null || true

# Wait for completion
for i in {1..60}; do
    STATUS=$(kubectl get pod "$POD_NAME" -n "$NAMESPACE" -o jsonpath='{.status.phase}' 2>/dev/null || echo "Unknown")
    
    if [[ "$STATUS" == "Succeeded" ]]; then
        echo -e "${GREEN}✓ Migrations completed successfully${NC}\n"
        break
    elif [[ "$STATUS" == "Failed" ]]; then
        echo -e "${RED}✗ Migrations failed${NC}\n"
        echo "Pod logs:"
        kubectl logs -n "$NAMESPACE" "$POD_NAME"
        exit 1
    fi
    
    sleep 2
done

# Get Job status
echo -e "${YELLOW}Step 4: Job Status${NC}"
kubectl get job "$JOB_NAME" -n "$NAMESPACE"
echo

# Show migration results
echo -e "${YELLOW}Step 5: Migration Results${NC}"
echo "Database tables:"
kubectl exec -n "$NAMESPACE" postgres-0 -- psql -U educard -d educard_prod -c "\dt" 2>/dev/null || echo "Could not query database"
echo

# Show applied migrations
echo "Applied migrations:"
kubectl exec -n "$NAMESPACE" postgres-0 -- psql -U educard -d educard_prod -c "SELECT name FROM \"SequelizeMeta\" ORDER BY name;" 2>/dev/null || echo "Could not query SequelizeMeta"
echo

echo -e "${GREEN}=== Migration Complete ===${NC}"
echo
echo "The Job will be automatically deleted after 100 seconds (TTL)."
echo
echo "Useful commands:"
echo "  # Check Job status"
echo "  kubectl get job $JOB_NAME -n $NAMESPACE"
echo
echo "  # View Job logs"
echo "  kubectl logs -n $NAMESPACE -l app=educard-migration"
echo
echo "  # Manually delete Job"
echo "  kubectl delete job $JOB_NAME -n $NAMESPACE"
echo
echo "  # Run migrations again"
echo "  ./k8s/run-migration.sh"
echo
