#!/bin/bash

# Build and Push Script for Educard Production Image
# This script builds the production Docker image and pushes it to Docker Hub

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================"
echo "Educard Production Image Builder"
echo -e "========================================${NC}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker is running${NC}"

# Check if logged into Docker Hub
if ! docker info | grep -q "Username"; then
    echo -e "${RED}❌ Not logged into Docker Hub.${NC}"
    echo ""
    echo "Please login first:"
    echo "  docker login"
    echo ""
    exit 1
fi

DOCKER_USERNAME=$(docker info | grep Username | awk '{print $2}')
echo -e "${GREEN}✅ Logged into Docker Hub as: ${DOCKER_USERNAME}${NC}"
echo ""

# Get version from user or use default
read -p "Enter version tag (default: v1.0.0): " VERSION
VERSION=${VERSION:-v1.0.0}

# Confirm build
echo ""
echo -e "${YELLOW}Will build and tag:${NC}"
echo "  - educard:prod"
echo "  - ${DOCKER_USERNAME}/educard:${VERSION}"
echo "  - ${DOCKER_USERNAME}/educard:latest"
echo ""
read -p "Continue? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo -e "${BLUE}📦 Building production image...${NC}"
docker build -f Dockerfile.production -t educard:prod .

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Build successful!${NC}"
echo ""

# Show image size
echo -e "${BLUE}Image size:${NC}"
docker images educard:prod --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
echo ""

# Tag for registry
echo -e "${BLUE}🏷️  Tagging image...${NC}"
docker tag educard:prod ${DOCKER_USERNAME}/educard:${VERSION}
docker tag educard:prod ${DOCKER_USERNAME}/educard:latest
echo -e "${GREEN}✅ Tagged successfully${NC}"
echo ""

# Push to registry
echo -e "${BLUE}☁️  Pushing to Docker Hub...${NC}"
echo ""
docker push ${DOCKER_USERNAME}/educard:${VERSION}
docker push ${DOCKER_USERNAME}/educard:latest

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Push failed!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Push successful!${NC}"
echo ""
echo -e "${BLUE}========================================"
echo "Build Complete!"
echo -e "========================================${NC}"
echo ""
echo "Images available at:"
echo "  - ${DOCKER_USERNAME}/educard:${VERSION}"
echo "  - ${DOCKER_USERNAME}/educard:latest"
echo ""
echo "View on Docker Hub:"
echo "  https://hub.docker.com/r/${DOCKER_USERNAME}/educard/tags"
echo ""
echo "Use in Kubernetes:"
echo "  image: docker.io/${DOCKER_USERNAME}/educard:${VERSION}"
echo ""
echo -e "${GREEN}Ready for deployment! 🚀${NC}"
