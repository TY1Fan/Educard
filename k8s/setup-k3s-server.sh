#!/bin/bash

# K3s Server Setup Script for Educard
# Run this script on your Linux server

set -e

echo "=================================="
echo "Educard K3s Server Setup"
echo "=================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
   echo "Please run as root or with sudo"
   exit 1
fi

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    VER=$VERSION_ID
    echo "Detected OS: $OS $VER"
else
    echo "Cannot detect OS. Please install manually."
    exit 1
fi

# Update system
echo ""
echo "Step 1: Updating system packages..."
if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    apt-get update
    apt-get upgrade -y
    apt-get install -y curl wget git nano
elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ]; then
    yum update -y
    yum install -y curl wget git nano
else
    echo "Unsupported OS: $OS"
    exit 1
fi

# Configure firewall
echo ""
echo "Step 2: Configuring firewall..."
if command -v ufw &> /dev/null; then
    echo "Configuring UFW firewall..."
    ufw allow 22/tcp comment 'SSH'
    ufw allow 80/tcp comment 'HTTP'
    ufw allow 443/tcp comment 'HTTPS'
    ufw allow 6443/tcp comment 'K3s API'
    ufw --force enable
    echo "Firewall configured"
elif command -v firewall-cmd &> /dev/null; then
    echo "Configuring firewalld..."
    firewall-cmd --permanent --add-port=22/tcp
    firewall-cmd --permanent --add-port=80/tcp
    firewall-cmd --permanent --add-port=443/tcp
    firewall-cmd --permanent --add-port=6443/tcp
    firewall-cmd --reload
    echo "Firewall configured"
else
    echo "No firewall detected. Please configure manually."
fi

# Install K3s
echo ""
echo "Step 3: Installing K3s..."
curl -sfL https://get.k3s.io | sh -

# Wait for K3s to be ready
echo "Waiting for K3s to be ready..."
sleep 10

# Check K3s status
echo ""
echo "Step 4: Verifying K3s installation..."
systemctl status k3s --no-pager

# Test K3s
echo ""
echo "Step 5: Testing K3s..."
k3s kubectl get nodes

# Display kubeconfig
echo ""
echo "=================================="
echo "K3s Installation Complete!"
echo "=================================="
echo ""
echo "K3s version:"
k3s --version
echo ""
echo "To access from your local machine, copy this kubeconfig:"
echo "---"
cat /etc/rancher/k3s/k3s.yaml
echo "---"
echo ""
echo "IMPORTANT: Replace '127.0.0.1' with your server's public IP!"
echo ""
echo "Server Information:"
echo "  - Public IP: $(curl -s ifconfig.me)"
echo "  - K3s API: https://$(curl -s ifconfig.me):6443"
echo ""
echo "Next Steps:"
echo "  1. Copy the kubeconfig above to ~/.kube/config-educard on your local machine"
echo "  2. Replace 127.0.0.1 with $(curl -s ifconfig.me) in the config"
echo "  3. Run: export KUBECONFIG=~/.kube/config-educard"
echo "  4. Test: kubectl get nodes"
echo ""
echo "=================================="
