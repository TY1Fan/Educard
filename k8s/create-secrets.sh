#!/bin/bash

# Create Kubernetes Secret for Educard
# This script generates secure credentials and creates the secret

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================"
echo "Educard - Create Kubernetes Secret"
echo -e "========================================${NC}"
echo ""

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl not found${NC}"
    exit 1
fi

# Check if openssl is available
if ! command -v openssl &> /dev/null; then
    echo -e "${RED}❌ openssl not found (needed for password generation)${NC}"
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

# Check if namespace exists
if ! kubectl get namespace educard-prod &> /dev/null; then
    echo -e "${RED}❌ Namespace 'educard-prod' not found${NC}"
    echo ""
    echo "Create namespace first:"
    echo "  ./k8s/apply-base-resources.sh"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Namespace 'educard-prod' exists${NC}"
echo ""

# Check if secret already exists
if kubectl get secret educard-secrets -n educard-prod &> /dev/null; then
    echo -e "${YELLOW}⚠️  Secret 'educard-secrets' already exists${NC}"
    read -p "Do you want to delete and recreate it? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kubectl delete secret educard-secrets -n educard-prod
        echo -e "${GREEN}✅ Deleted existing secret${NC}"
        echo ""
    else
        echo "Keeping existing secret. Exiting."
        exit 0
    fi
fi

# Generate secure credentials
echo -e "${BLUE}🔐 Generating secure credentials...${NC}"
echo ""

DB_USER="educard"
DB_PASSWORD=$(openssl rand -hex 32)
SESSION_SECRET=$(openssl rand -hex 32)

echo -e "${YELLOW}Generated credentials (SAVE THESE SECURELY):${NC}"
echo ""
echo "DB_USER:        $DB_USER"
echo "DB_PASSWORD:    $DB_PASSWORD"
echo "SESSION_SECRET: $SESSION_SECRET"
echo ""
echo -e "${RED}⚠️  IMPORTANT: Save these credentials in a secure password manager!${NC}"
echo ""
read -p "Press Enter after you've saved the credentials..."
echo ""

# Create secret file
SECRET_FILE="k8s/secret.yaml"
echo -e "${BLUE}📝 Creating secret file...${NC}"

cat > $SECRET_FILE <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: educard-secrets
  namespace: educard-prod
  labels:
    app: educard
    component: secrets
type: Opaque
stringData:
  DB_USER: "$DB_USER"
  DB_PASSWORD: "$DB_PASSWORD"
  SESSION_SECRET: "$SESSION_SECRET"
EOF

echo -e "${GREEN}✅ Secret file created: $SECRET_FILE${NC}"
echo ""

# Apply secret to cluster
echo -e "${BLUE}🚀 Applying secret to cluster...${NC}"
kubectl apply -f $SECRET_FILE
echo ""

# Verify secret
echo -e "${BLUE}🔍 Verifying secret...${NC}"
kubectl get secret educard-secrets -n educard-prod
echo ""

# Show secret details (without values)
kubectl describe secret educard-secrets -n educard-prod
echo ""

echo -e "${GREEN}✅ Secret created successfully!${NC}"
echo ""
echo -e "${BLUE}========================================"
echo "Security Notes"
echo -e "========================================${NC}"
echo "1. Secret file: k8s/secret.yaml (NOT committed to git)"
echo "2. Save credentials in password manager"
echo "3. Delete secret file if desired: rm k8s/secret.yaml"
echo "4. Secret can be recreated from saved credentials"
echo ""
echo "View secret values (careful!):"
echo "  kubectl get secret educard-secrets -n educard-prod -o yaml"
echo ""
echo "Next steps:"
echo "  - Deploy PostgreSQL database (Task 5.6)"
echo "  - Deploy application (Task 5.7)"
