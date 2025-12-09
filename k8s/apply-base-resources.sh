#!/bin/bash

# Apply Kubernetes Base Resources (Namespace and ConfigMap)
# This script applies the namespace and configmap for Educard

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================"
echo "Educard - Apply Base Resources"
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
    echo ""
    echo "Make sure the cluster is running:"
    echo "  vagrant status"
    echo "  vagrant up"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Connected to cluster${NC}"
echo ""

# Apply namespace
echo -e "${BLUE}📦 Creating namespace...${NC}"
kubectl apply -f k8s/namespace.yaml
echo ""

# Apply configmap
echo -e "${BLUE}⚙️  Creating ConfigMap...${NC}"
kubectl apply -f k8s/configmap.yaml
echo ""

# Verify resources
echo -e "${BLUE}🔍 Verifying resources...${NC}"
echo ""
echo -e "${YELLOW}Namespace:${NC}"
kubectl get namespace educard-prod --show-labels
echo ""
echo -e "${YELLOW}ConfigMap:${NC}"
kubectl get configmap -n educard-prod
echo ""

echo -e "${GREEN}✅ Base resources created successfully!${NC}"
echo ""
echo -e "${BLUE}========================================"
echo "Next Steps"
echo -e "========================================${NC}"
echo "1. Create secrets (Task 5.5)"
echo "2. Deploy PostgreSQL database"
echo "3. Deploy application"
echo ""
echo "View resources:"
echo "  kubectl get all -n educard-prod"
echo "  kubectl describe configmap educard-config -n educard-prod"
