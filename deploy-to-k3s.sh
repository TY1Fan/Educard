#!/bin/bash
set -e

echo "=================================="
echo "Deploying Educard to K3s"
echo "=================================="

# Set kubeconfig
export KUBECONFIG=/Users/tohyifan/Desktop/Educard/k8s/kubeconfig-local

# Create namespace
echo "Creating namespace..."
kubectl apply -f k8s/namespace.yaml

# Create ConfigMap
echo "Creating ConfigMap..."
kubectl apply -f k8s/configmap.yaml

# Deploy PostgreSQL
echo "Deploying PostgreSQL..."
kubectl apply -f k8s/postgres-pvc.yaml
kubectl apply -f k8s/postgres-statefulset.yaml
kubectl apply -f k8s/postgres-service.yaml

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
kubectl wait --for=condition=ready pod -l app=educard-postgres -n educard-prod --timeout=300s

# Run database migrations
echo "Running database migrations..."
kubectl apply -f k8s/migration-job.yaml
kubectl wait --for=condition=complete job/educard-migration -n educard-prod --timeout=300s

# Seed database
echo "Seeding database..."
kubectl apply -f k8s/seed-job.yaml
kubectl wait --for=condition=complete job/educard-seed -n educard-prod --timeout=300s

# Deploy application
echo "Deploying application..."
kubectl apply -f k8s/app-deployment.yaml
kubectl apply -f k8s/app-service.yaml

# Wait for app to be ready
echo "Waiting for application pods to be ready..."
kubectl wait --for=condition=ready pod -l app=educard -n educard-prod --timeout=300s

echo ""
echo "=================================="
echo "Deployment Complete!"
echo "=================================="
echo ""
echo "Checking status..."
kubectl get pods -n educard-prod
echo ""
echo "To access the application:"
echo "  kubectl port-forward -n educard-prod svc/educard-app 3000:80"
echo ""
echo "Then visit: http://localhost:3000"
echo ""
