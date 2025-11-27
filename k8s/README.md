# Educard K3s Deployment Guide

## Overview

This guide documents the k3s (lightweight Kubernetes) deployment process for the Educard application.

## Prerequisites

### Server Requirements
- **Operating System:** Linux (Ubuntu 20.04+ or Debian 11+ recommended)
- **CPU:** 2 cores minimum (4 cores recommended)
- **RAM:** 2GB minimum (4GB recommended)
- **Disk:** 20GB minimum (50GB recommended)
- **Network:** Public IP address with open ports:
  - 22 (SSH)
  - 80 (HTTP)
  - 443 (HTTPS)
  - 6443 (Kubernetes API)

### Local Machine Requirements
- kubectl installed
- SSH access to the server
- Docker installed (for building images)

## Server Setup Options

### Option 1: Cloud Provider VPS
Popular providers:
- **DigitalOcean:** Droplet ($12/month for 2GB RAM)
- **Linode:** Nanode or Shared CPU ($12/month)
- **Vultr:** Cloud Compute ($12/month)
- **Hetzner:** Cloud Server (€4-8/month)
- **AWS EC2:** t3.small instance
- **Google Cloud:** e2-small instance

### Option 2: Local/On-Premise Server
- Any Linux server with public IP
- Home lab with port forwarding
- Bare metal server

## Installation Steps

### Step 1: Prepare the Server

SSH into your server:
```bash
ssh user@your-server-ip
```

Update system packages:
```bash
sudo apt update && sudo apt upgrade -y
```

Install required packages:
```bash
sudo apt install -y curl wget git
```

### Step 2: Install K3s

Run the k3s installation script:
```bash
curl -sfL https://get.k3s.io | sh -
```

Verify k3s is running:
```bash
sudo systemctl status k3s
```

Check k3s version:
```bash
sudo k3s --version
```

### Step 3: Configure kubectl Access

#### On the Server

Check if k3s is running:
```bash
sudo k3s kubectl get nodes
```

#### From Local Machine

Copy the kubeconfig from server to local machine:
```bash
# On server, display the config
sudo cat /etc/rancher/k3s/k3s.yaml
```

Copy the output and save it locally:
```bash
# On your local machine
mkdir -p ~/.kube
nano ~/.kube/config-educard
# Paste the config and modify the server IP
```

**Important:** Edit the config file and replace `127.0.0.1` with your server's public IP:
```yaml
# Change this:
server: https://127.0.0.1:6443

# To this:
server: https://YOUR_SERVER_PUBLIC_IP:6443
```

Set the KUBECONFIG environment variable:
```bash
export KUBECONFIG=~/.kube/config-educard
```

Add to your shell profile for persistence:
```bash
# For bash
echo 'export KUBECONFIG=~/.kube/config-educard' >> ~/.bashrc

# For zsh
echo 'export KUBECONFIG=~/.kube/config-educard' >> ~/.zshrc
```

Verify connection from local machine:
```bash
kubectl get nodes
```

Expected output:
```
NAME       STATUS   ROLES                  AGE   VERSION
hostname   Ready    control-plane,master   1m    v1.28.x+k3s1
```

### Step 4: Install Helm

On your local machine:
```bash
# macOS
brew install helm

# Or using script
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

Verify Helm installation:
```bash
helm version
```

### Step 5: Verify Storage Provisioner

K3s comes with local-path storage provisioner by default:
```bash
kubectl get storageclass
```

Expected output:
```
NAME                   PROVISIONER             RECLAIMPOLICY   VOLUMEBINDINGMODE      ALLOWVOLUMEEXPANSION   AGE
local-path (default)   rancher.io/local-path   Delete          WaitForFirstConsumer   false                  1m
```

### Step 6: Test Deployment

Create a test pod:
```bash
kubectl run test-nginx --image=nginx:alpine --port=80
```

Check pod status:
```bash
kubectl get pods
```

Clean up test pod:
```bash
kubectl delete pod test-nginx
```

## Configuration Files

The k3s configuration is located at:
- **Server:** `/etc/rancher/k3s/k3s.yaml`
- **Service:** `/etc/systemd/system/k3s.service`
- **Data:** `/var/lib/rancher/k3s`

## Managing K3s

### Start/Stop/Restart K3s
```bash
sudo systemctl start k3s
sudo systemctl stop k3s
sudo systemctl restart k3s
```

### Enable/Disable Auto-start
```bash
sudo systemctl enable k3s
sudo systemctl disable k3s
```

### View Logs
```bash
sudo journalctl -u k3s -f
```

## Troubleshooting

### Issue: Cannot connect to k3s from local machine

**Solution:**
1. Check firewall allows port 6443:
```bash
sudo ufw allow 6443/tcp
```

2. Verify k3s is listening on all interfaces:
```bash
sudo netstat -tlnp | grep 6443
```

3. Ensure kubeconfig has correct server IP

### Issue: Pods stuck in Pending state

**Solution:**
Check node resources:
```bash
kubectl describe node
kubectl top node
```

### Issue: Permission denied errors

**Solution:**
Run kubectl commands with proper permissions:
```bash
# On server
sudo k3s kubectl get pods

# Or add user to k3s group
sudo usermod -aG k3s $USER
```

## Security Recommendations

1. **Firewall Configuration:**
```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow K3s API (restrict to your IP if possible)
sudo ufw allow 6443/tcp

# Enable firewall
sudo ufw enable
```

2. **SSH Key Authentication:**
   - Disable password authentication
   - Use SSH keys only

3. **Regular Updates:**
```bash
# Update k3s
curl -sfL https://get.k3s.io | sh -

# Update system packages
sudo apt update && sudo apt upgrade -y
```

## Next Steps

After completing Task 5.1, proceed to:
- **Task 5.2:** Container Registry Setup
- **Task 5.3:** Production Dockerfile
- **Task 5.4:** Kubernetes Namespace and ConfigMap

## Useful Commands

```bash
# Check cluster info
kubectl cluster-info

# View all resources
kubectl get all -A

# View nodes
kubectl get nodes -o wide

# View system pods
kubectl get pods -n kube-system

# Describe node
kubectl describe node

# View storage classes
kubectl get storageclass

# View persistent volumes
kubectl get pv
kubectl get pvc -A
```

## References

- [K3s Documentation](https://docs.k3s.io/)
- [Kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [Helm Documentation](https://helm.sh/docs/)

---

**Status:** Task 5.1 Implementation Guide  
**Last Updated:** November 27, 2025  
**Next Task:** Task 5.2 - Container Registry Setup
