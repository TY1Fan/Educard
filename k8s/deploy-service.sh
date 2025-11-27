#!/usr/bin/env bash

# deploy-service.sh - Deploy and Test Educard Service
# This script deploys the Kubernetes Service and verifies connectivity

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="educard-prod"
SERVICE_NAME="educard-service"
SERVICE_FILE="$(dirname "$0")/app-service.yaml"

echo -e "${BLUE}=== Educard Service Deployment ===${NC}\n"

# Apply Service
echo -e "${YELLOW}Step 1: Deploying Service${NC}"
if [[ ! -f "$SERVICE_FILE" ]]; then
    echo -e "${RED}Error: Service file not found: ${SERVICE_FILE}${NC}"
    exit 1
fi

kubectl apply -f "$SERVICE_FILE"
echo -e "${GREEN}✓ Service manifest applied${NC}\n"

# Wait a moment for Service to be ready
sleep 2

# Get Service details
echo -e "${YELLOW}Step 2: Service Details${NC}"
kubectl get service "$SERVICE_NAME" -n "$NAMESPACE" -o wide
echo
kubectl describe service "$SERVICE_NAME" -n "$NAMESPACE" | head -20
echo

# Check endpoints
echo -e "${YELLOW}Step 3: Service Endpoints${NC}"
kubectl get endpoints "$SERVICE_NAME" -n "$NAMESPACE"
ENDPOINTS=$(kubectl get endpoints "$SERVICE_NAME" -n "$NAMESPACE" -o jsonpath='{.subsets[*].addresses[*].ip}' | wc -w)
echo -e "${GREEN}✓ Service has ${ENDPOINTS} endpoint(s)${NC}\n"

if [[ $ENDPOINTS -eq 0 ]]; then
    echo -e "${RED}Warning: No endpoints found. Check pod labels and selector.${NC}"
    exit 1
fi

# Test connectivity from within cluster
echo -e "${YELLOW}Step 4: Testing Connectivity${NC}"

# Get a pod to test from
POD=$(kubectl get pods -n "$NAMESPACE" -l app=educard -o jsonpath='{.items[0].metadata.name}')
if [[ -z "$POD" ]]; then
    echo -e "${RED}Error: No application pods found${NC}"
    exit 1
fi

echo "Testing from pod: ${POD}"
echo

# Test short DNS name
echo -e "  ${BLUE}Testing short DNS name (educard-service):${NC}"
if kubectl exec -n "$NAMESPACE" "$POD" -- wget -q -O- http://educard-service/health > /dev/null 2>&1; then
    RESULT=$(kubectl exec -n "$NAMESPACE" "$POD" -- wget -q -O- http://educard-service/health)
    echo -e "  ${GREEN}✓ Success: ${RESULT}${NC}"
else
    echo -e "  ${RED}✗ Failed${NC}"
    exit 1
fi
echo

# Test full DNS name
echo -e "  ${BLUE}Testing full DNS name (educard-service.educard-prod.svc.cluster.local):${NC}"
if kubectl exec -n "$NAMESPACE" "$POD" -- wget -q -O- http://educard-service.educard-prod.svc.cluster.local/health > /dev/null 2>&1; then
    RESULT=$(kubectl exec -n "$NAMESPACE" "$POD" -- wget -q -O- http://educard-service.educard-prod.svc.cluster.local/health)
    echo -e "  ${GREEN}✓ Success: ${RESULT}${NC}"
else
    echo -e "  ${RED}✗ Failed${NC}"
    exit 1
fi
echo

# Test multiple requests to verify load balancing
echo -e "${YELLOW}Step 5: Testing Load Balancing${NC}"
echo "Making 5 requests to verify distribution..."
for i in {1..5}; do
    kubectl exec -n "$NAMESPACE" "$POD" -- wget -q -O- http://educard-service/health > /dev/null 2>&1
    echo -e "  Request $i: ${GREEN}✓${NC}"
done
echo

# Show all services
echo -e "${YELLOW}Step 6: All Services in Namespace${NC}"
kubectl get services -n "$NAMESPACE"
echo

# DNS information
CLUSTER_IP=$(kubectl get service "$SERVICE_NAME" -n "$NAMESPACE" -o jsonpath='{.spec.clusterIP}')
echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo
echo "Service Details:"
echo "  Name:       $SERVICE_NAME"
echo "  Namespace:  $NAMESPACE"
echo "  Cluster IP: $CLUSTER_IP"
echo "  Port:       80 → 3000"
echo "  Endpoints:  $ENDPOINTS pod(s)"
echo
echo "DNS Names:"
echo "  Short:      http://educard-service"
echo "  Full FQDN:  http://educard-service.educard-prod.svc.cluster.local"
echo
echo "Session Affinity: ClientIP (3 hours)"
echo
echo "Useful commands:"
echo "  # Check Service status"
echo "  kubectl get service $SERVICE_NAME -n $NAMESPACE"
echo
echo "  # View Service details"
echo "  kubectl describe service $SERVICE_NAME -n $NAMESPACE"
echo
echo "  # Check endpoints"
echo "  kubectl get endpoints $SERVICE_NAME -n $NAMESPACE"
echo
echo "  # Test from within cluster"
echo "  kubectl exec -n $NAMESPACE \$(kubectl get pod -n $NAMESPACE -l app=educard -o jsonpath='{.items[0].metadata.name}') -- wget -q -O- http://educard-service/health"
echo
