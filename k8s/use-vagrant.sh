#!/bin/bash
# Helper script to use the Vagrant k3s cluster
export KUBECONFIG=$(dirname "$0")/kubeconfig-vagrant-local
echo "Using Vagrant k3s cluster"
echo "KUBECONFIG=$KUBECONFIG"
echo ""
kubectl get nodes
