#!/usr/bin/env bash

# deploy-app.sh - Deploy Educard Application to Kubernetes
# This script helps push the Docker image and deploy the application

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="educard"
IMAGE_TAG="v1.0.0"
LOCAL_IMAGE="educard:prod"
NAMESPACE="educard-prod"

echo -e "${BLUE}=== Educard Application Deployment ===${NC}\n"

# Check if local image exists
if ! docker images | grep -q "^educard\s*prod"; then
    echo -e "${RED}Error: Local image 'educard:prod' not found${NC}"
    echo "Please build the production image first:"
    echo "  docker build -f Dockerfile.production -t educard:prod ."
    exit 1
fi

# Get Docker Hub username
echo -e "${YELLOW}Step 1: Docker Hub Configuration${NC}"
echo "Enter your Docker Hub username:"
read -r DOCKER_USERNAME

if [[ -z "$DOCKER_USERNAME" ]]; then
    echo -e "${RED}Error: Docker Hub username is required${NC}"
    exit 1
fi

FULL_IMAGE="${DOCKER_USERNAME}/${IMAGE_NAME}:${IMAGE_TAG}"
echo -e "${GREEN}Will push to: ${FULL_IMAGE}${NC}\n"

# Check Docker login
echo -e "${YELLOW}Step 2: Docker Hub Login${NC}"
if ! docker info 2>/dev/null | grep -q "Username: ${DOCKER_USERNAME}"; then
    echo "Not logged in to Docker Hub. Logging in..."
    docker login
else
    echo -e "${GREEN}Already logged in to Docker Hub${NC}"
fi
echo

# Tag the image
echo -e "${YELLOW}Step 3: Tagging Image${NC}"
echo "Tagging ${LOCAL_IMAGE} as ${FULL_IMAGE}..."
docker tag "${LOCAL_IMAGE}" "${FULL_IMAGE}"
echo -e "${GREEN}✓ Image tagged${NC}\n"

# Push to Docker Hub
echo -e "${YELLOW}Step 4: Pushing to Docker Hub${NC}"
echo "Pushing ${FULL_IMAGE}..."
docker push "${FULL_IMAGE}"
echo -e "${GREEN}✓ Image pushed successfully${NC}\n"

# Update deployment manifest
echo -e "${YELLOW}Step 5: Updating Deployment Manifest${NC}"
DEPLOYMENT_FILE="$(dirname "$0")/app-deployment.yaml"
if [[ -f "$DEPLOYMENT_FILE" ]]; then
    # Create backup
    cp "$DEPLOYMENT_FILE" "${DEPLOYMENT_FILE}.backup"
    
    # Replace placeholder with actual image
    sed -i.tmp "s|<your-dockerhub-username>/educard:v1.0.0|${FULL_IMAGE}|g" "$DEPLOYMENT_FILE"
    rm -f "${DEPLOYMENT_FILE}.tmp"
    
    echo -e "${GREEN}✓ Deployment manifest updated${NC}\n"
else
    echo -e "${RED}Error: Deployment file not found: ${DEPLOYMENT_FILE}${NC}"
    exit 1
fi

# Deploy to Kubernetes
echo -e "${YELLOW}Step 6: Deploying to Kubernetes${NC}"
echo "Applying deployment to namespace ${NAMESPACE}..."
kubectl apply -f "$DEPLOYMENT_FILE" -n "$NAMESPACE"
echo

# Wait for rollout
echo -e "${YELLOW}Step 7: Waiting for Rollout${NC}"
echo "Waiting for deployment to complete..."
kubectl rollout status deployment/educard-app -n "$NAMESPACE" --timeout=5m
echo

# Show deployment status
echo -e "${YELLOW}Step 8: Deployment Status${NC}"
kubectl get deployment educard-app -n "$NAMESPACE"
echo
kubectl get pods -n "$NAMESPACE" -l app=educard
echo

# Show logs from one pod
echo -e "${YELLOW}Step 9: Application Logs${NC}"
POD_NAME=$(kubectl get pods -n "$NAMESPACE" -l app=educard -o jsonpath='{.items[0].metadata.name}')
if [[ -n "$POD_NAME" ]]; then
    echo "Logs from ${POD_NAME}:"
    kubectl logs "$POD_NAME" -n "$NAMESPACE" --tail=30
    echo
fi

echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo
echo "Useful commands:"
echo "  # View all resources"
echo "  kubectl get all -n ${NAMESPACE}"
echo
echo "  # View application logs"
echo "  kubectl logs -n ${NAMESPACE} -l app=educard --tail=50 -f"
echo
echo "  # Check pod details"
echo "  kubectl describe pods -n ${NAMESPACE} -l app=educard"
echo
echo "  # Execute command in pod"
echo "  kubectl exec -it \$(kubectl get pod -n ${NAMESPACE} -l app=educard -o jsonpath='{.items[0].metadata.name}') -- sh"
echo
