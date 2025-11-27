#!/bin/bash

# Deploy PostgreSQL Database for Educard
# This script deploys PostgreSQL with persistent storage

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================"
echo "Educard - Deploy PostgreSQL Database"
echo -e "========================================${NC}"
echo ""

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl not found${NC}"
    exit 1
fi

# Set kubeconfig
export KUBECONFIG=$(pwd)/k8s/kubeconfig-vagrant-local

# Check cluster connection
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}❌ Cannot connect to cluster${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Connected to cluster${NC}"
echo ""

# Check if namespace exists
if ! kubectl get namespace educard-prod &> /dev/null; then
    echo -e "${RED}❌ Namespace 'educard-prod' not found${NC}"
    echo "Run: ./k8s/apply-base-resources.sh"
    exit 1
fi

echo -e "${GREEN}✅ Namespace 'educard-prod' exists${NC}"
echo ""

# Check if secrets exist
if ! kubectl get secret educard-secrets -n educard-prod &> /dev/null; then
    echo -e "${RED}❌ Secret 'educard-secrets' not found${NC}"
    echo "Run: ./k8s/create-secrets.sh"
    exit 1
fi

echo -e "${GREEN}✅ Secrets exist${NC}"
echo ""

# Apply PostgreSQL resources
echo -e "${BLUE}📦 Deploying PostgreSQL...${NC}"
echo ""

echo "1. Creating PersistentVolumeClaim..."
kubectl apply -f k8s/postgres-pvc.yaml
echo ""

echo "2. Creating Service..."
kubectl apply -f k8s/postgres-service.yaml
echo ""

echo "3. Creating StatefulSet..."
kubectl apply -f k8s/postgres-statefulset.yaml
echo ""

# Wait for pod to be ready
echo -e "${BLUE}⏳ Waiting for PostgreSQL pod to be ready...${NC}"
kubectl wait --for=condition=ready pod/postgres-0 -n educard-prod --timeout=120s
echo ""

# Show resources
echo -e "${BLUE}🔍 Verifying resources...${NC}"
echo ""
echo -e "${YELLOW}PersistentVolumeClaim:${NC}"
kubectl get pvc -n educard-prod
echo ""
echo -e "${YELLOW}StatefulSet:${NC}"
kubectl get statefulset -n educard-prod
echo ""
echo -e "${YELLOW}Service:${NC}"
kubectl get service postgres-service -n educard-prod
echo ""
echo -e "${YELLOW}Pod:${NC}"
kubectl get pod postgres-0 -n educard-prod
echo ""

# Get database password from secret
echo -e "${BLUE}🔐 Getting database credentials...${NC}"
DB_PASSWORD=$(kubectl get secret educard-secrets -n educard-prod -o jsonpath='{.data.DB_PASSWORD}' | base64 -d)
echo ""

# Test connection
echo -e "${BLUE}🧪 Testing database connection...${NC}"
kubectl run -it --rm psql-test --image=postgres:15-alpine --restart=Never -n educard-prod \
  --env="PGPASSWORD=$DB_PASSWORD" \
  -- psql -h postgres-service -U educard -d educard_prod -c "SELECT version();"
echo ""

echo -e "${GREEN}✅ PostgreSQL deployed successfully!${NC}"
echo ""
echo -e "${BLUE}========================================"
echo "Database Information"
echo -e "========================================${NC}"
echo "Host: postgres-service"
echo "Port: 5432"
echo "Database: educard_prod"
echo "User: educard"
echo "Connection string (internal):"
echo "  postgresql://educard:<password>@postgres-service:5432/educard_prod"
echo ""
echo "Connect from pod:"
echo "  kubectl exec -it postgres-0 -n educard-prod -- psql -U educard -d educard_prod"
echo ""
echo "View logs:"
echo "  kubectl logs -n educard-prod postgres-0"
echo ""
echo "Next steps:"
echo "  - Deploy application (Task 5.7)"
echo "  - Run database migrations"
