#!/bin/bash

# K3s Local Setup Script for Educard
# Run this script on your LOCAL machine (macOS/Linux)

set -e

echo "=================================="
echo "Educard K3s Local Setup"
echo "=================================="
echo ""

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo "kubectl not found. Installing..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            echo "Installing kubectl via Homebrew..."
            brew install kubectl
        else
            echo "Installing kubectl via curl..."
            curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/darwin/arm64/kubectl"
            chmod +x kubectl
            sudo mv kubectl /usr/local/bin/
        fi
    else
        # Linux
        echo "Installing kubectl via curl..."
        curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
        chmod +x kubectl
        sudo mv kubectl /usr/local/bin/
    fi
    
    echo "kubectl installed successfully"
else
    echo "✓ kubectl already installed: $(kubectl version --client --short 2>/dev/null || kubectl version --client)"
fi

# Check if helm is installed
echo ""
if ! command -v helm &> /dev/null; then
    echo "helm not found. Installing..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            echo "Installing helm via Homebrew..."
            brew install helm
        else
            echo "Installing helm via script..."
            curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
        fi
    else
        # Linux
        echo "Installing helm via script..."
        curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
    fi
    
    echo "helm installed successfully"
else
    echo "✓ helm already installed: $(helm version --short)"
fi

# Create kube directory
echo ""
echo "Creating .kube directory..."
mkdir -p ~/.kube

# Check if config already exists
if [ -f ~/.kube/config-educard ]; then
    echo ""
    echo "⚠️  Warning: ~/.kube/config-educard already exists"
    read -p "Do you want to overwrite it? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Keeping existing config"
        SKIP_CONFIG=true
    fi
fi

if [ -z "$SKIP_CONFIG" ]; then
    echo ""
    echo "Now you need to get the kubeconfig from your server."
    echo ""
    read -p "Enter your server's SSH address (user@ip): " SSH_ADDRESS
    
    if [ -z "$SSH_ADDRESS" ]; then
        echo "No SSH address provided. Skipping kubeconfig download."
        echo "You can manually copy it later using:"
        echo "  ssh user@server 'sudo cat /etc/rancher/k3s/k3s.yaml' > ~/.kube/config-educard"
    else
        echo ""
        echo "Fetching kubeconfig from server..."
        ssh "$SSH_ADDRESS" 'sudo cat /etc/rancher/k3s/k3s.yaml' > ~/.kube/config-educard
        
        # Get server's public IP
        echo "Getting server's public IP..."
        SERVER_IP=$(ssh "$SSH_ADDRESS" 'curl -s ifconfig.me')
        
        echo "Server IP: $SERVER_IP"
        
        # Replace 127.0.0.1 with server IP in config
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s/127.0.0.1:6443/${SERVER_IP}:6443/g" ~/.kube/config-educard
        else
            sed -i "s/127.0.0.1:6443/${SERVER_IP}:6443/g" ~/.kube/config-educard
        fi
        
        echo "✓ Kubeconfig saved and configured"
    fi
fi

# Set KUBECONFIG
echo ""
echo "Setting up environment..."

SHELL_RC=""
if [ -n "$ZSH_VERSION" ]; then
    SHELL_RC="$HOME/.zshrc"
elif [ -n "$BASH_VERSION" ]; then
    SHELL_RC="$HOME/.bashrc"
fi

if [ -n "$SHELL_RC" ]; then
    if ! grep -q "KUBECONFIG.*config-educard" "$SHELL_RC"; then
        echo "" >> "$SHELL_RC"
        echo "# Educard K3s cluster" >> "$SHELL_RC"
        echo "export KUBECONFIG=~/.kube/config-educard" >> "$SHELL_RC"
        echo "✓ Added KUBECONFIG to $SHELL_RC"
    else
        echo "✓ KUBECONFIG already in $SHELL_RC"
    fi
fi

# Export for current session
export KUBECONFIG=~/.kube/config-educard

# Test connection if config exists
if [ -f ~/.kube/config-educard ]; then
    echo ""
    echo "Testing connection to cluster..."
    if kubectl get nodes 2>/dev/null; then
        echo ""
        echo "=================================="
        echo "✓ Setup Complete!"
        echo "=================================="
        echo ""
        echo "Your k3s cluster is ready. You can now run:"
        echo "  kubectl get nodes"
        echo "  kubectl get pods -A"
        echo "  kubectl cluster-info"
        echo ""
        echo "Don't forget to reload your shell or run:"
        echo "  export KUBECONFIG=~/.kube/config-educard"
        echo ""
    else
        echo ""
        echo "⚠️  Could not connect to cluster."
        echo "Please check:"
        echo "  1. Server IP is correct in ~/.kube/config-educard"
        echo "  2. Port 6443 is open on the server"
        echo "  3. K3s is running: ssh $SSH_ADDRESS 'sudo systemctl status k3s'"
        echo ""
    fi
else
    echo ""
    echo "=================================="
    echo "Setup Complete (kubectl and helm)"
    echo "=================================="
    echo ""
    echo "To complete setup, copy kubeconfig from your server:"
    echo "  ssh user@server 'sudo cat /etc/rancher/k3s/k3s.yaml' > ~/.kube/config-educard"
    echo ""
    echo "Then edit ~/.kube/config-educard and replace 127.0.0.1 with your server's IP"
    echo ""
    echo "Finally, export the config:"
    echo "  export KUBECONFIG=~/.kube/config-educard"
    echo ""
fi
