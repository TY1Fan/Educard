#!/bin/bash

# Create Kubernetes ImagePullSecret for Docker Hub
# This script helps create the secret for pulling private images

set -e

echo "========================================"
echo "Docker Hub ImagePullSecret Setup"
echo "========================================"
echo ""

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl not found. Please install kubectl first."
    exit 1
fi

# Check if logged into Docker Hub
if ! docker info | grep -q "Username"; then
    echo "❌ Not logged into Docker Hub."
    echo ""
    echo "Please login first:"
    echo "  docker login"
    echo ""
    exit 1
fi

DOCKER_USERNAME=$(docker info | grep Username | awk '{print $2}')
echo "✅ Logged into Docker Hub as: $DOCKER_USERNAME"
echo ""

# Get cluster info
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Cannot connect to Kubernetes cluster."
    echo ""
    echo "Please ensure kubectl is configured:"
    echo "  export KUBECONFIG=\$(pwd)/k8s/kubeconfig-vagrant-local"
    echo "  # or"
    echo "  source k8s/use-vagrant.sh"
    echo ""
    exit 1
fi

echo "✅ Connected to Kubernetes cluster"
kubectl get nodes
echo ""

# Check if secret already exists
if kubectl get secret dockerhub-secret &> /dev/null; then
    echo "⚠️  Secret 'dockerhub-secret' already exists."
    read -p "Do you want to delete and recreate it? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kubectl delete secret dockerhub-secret
        echo "✅ Deleted existing secret"
    else
        echo "Keeping existing secret. Exiting."
        exit 0
    fi
fi

echo ""
echo "Creating ImagePullSecret from Docker config..."
echo ""

# Create secret from docker config
kubectl create secret generic dockerhub-secret \
  --from-file=.dockerconfigjson=$HOME/.docker/config.json \
  --type=kubernetes.io/dockerconfigjson

echo ""
echo "✅ ImagePullSecret created successfully!"
echo ""
echo "Verify with:"
echo "  kubectl get secret dockerhub-secret"
echo "  kubectl describe secret dockerhub-secret"
echo ""
echo "Use in your deployment:"
echo "---"
echo "spec:"
echo "  imagePullSecrets:"
echo "  - name: dockerhub-secret"
echo "  containers:"
echo "  - name: educard"
echo "    image: docker.io/$DOCKER_USERNAME/educard:v1.0.0"
echo "---"
echo ""
echo "Done! 🚀"
