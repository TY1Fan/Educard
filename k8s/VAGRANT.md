# Vagrant VM Setup for K3s

## Overview

This guide helps you set up a local Vagrant VM for testing the Educard k3s deployment before deploying to a production server.

## Prerequisites

### 1. Install VirtualBox

Download and install VirtualBox:
- **macOS:** [Download VirtualBox for macOS](https://www.virtualbox.org/wiki/Downloads)
- Or use Homebrew: `brew install --cask virtualbox`

### 2. Install Vagrant

Download and install Vagrant:
- **macOS:** [Download Vagrant](https://www.vagrantup.com/downloads)
- Or use Homebrew: `brew install --cask vagrant`

### 3. Verify Installation

```bash
# Check VirtualBox
VBoxManage --version

# Check Vagrant
vagrant --version
```

## Quick Start

### 1. Start the VM

From the Educard project directory:

```bash
cd ~/Desktop/Educard

# Start the VM (first time takes 5-10 minutes)
vagrant up
```

This will:
- Download Ubuntu 22.04 image (first time only)
- Create a VM with 4GB RAM and 2 CPUs
- Install k3s automatically
- Configure networking
- Set up kubectl access

### 2. Verify K3s is Running

#### Option A: From Host Machine

```bash
# Set kubeconfig
export KUBECONFIG=./k8s/kubeconfig-vagrant

# Test connection
kubectl get nodes

# View all pods
kubectl get pods -A
```

#### Option B: SSH into VM

```bash
# SSH into the VM
vagrant ssh

# Inside VM, run kubectl
kubectl get nodes
kubectl get pods -A

# Exit VM
exit
```

### 3. Access Services

Once deployed, services will be accessible at:
- **HTTP:** http://localhost:8080 (forwarded from VM port 80)
- **HTTPS:** https://localhost:8443 (forwarded from VM port 443)
- **K3s API:** https://192.168.56.10:6443

## VM Management

### Common Commands

```bash
# Start the VM
vagrant up

# Stop the VM (saves state)
vagrant halt

# Restart the VM
vagrant reload

# Restart and re-provision
vagrant reload --provision

# SSH into VM
vagrant ssh

# Check VM status
vagrant status

# Destroy VM (deletes everything)
vagrant destroy

# Destroy and recreate
vagrant destroy -f && vagrant up
```

### VM Information

- **IP Address:** 192.168.56.10
- **Hostname:** educard-k3s
- **RAM:** 4GB
- **CPUs:** 2 cores
- **OS:** Ubuntu 22.04 LTS

### Port Forwarding

| Service | VM Port | Host Port | Access URL |
|---------|---------|-----------|------------|
| HTTP | 80 | 8080 | http://localhost:8080 |
| HTTPS | 443 | 8443 | https://localhost:8443 |
| K3s API | 6443 | 6443 | https://192.168.56.10:6443 |

## Using kubectl from Host

### Setup kubeconfig

```bash
# Export kubeconfig (add to ~/.zshrc for persistence)
export KUBECONFIG=$(pwd)/k8s/kubeconfig-vagrant

# Or create an alias
alias kubectl-vagrant='KUBECONFIG=$(pwd)/k8s/kubeconfig-vagrant kubectl'
```

### Test Commands

```bash
# Get nodes
kubectl get nodes

# Get all resources
kubectl get all -A

# Get storage classes
kubectl get storageclass

# View system pods
kubectl get pods -n kube-system
```

## Deployment Testing

Now you can test the full deployment on this VM:

### 1. Continue with Task 5.2

```bash
# With the VM running, proceed to Task 5.2
# The VM acts as your "production" server
```

### 2. Deploy Database

```bash
# Apply PostgreSQL StatefulSet
kubectl apply -f k8s/postgres-pvc.yaml
kubectl apply -f k8s/postgres-statefulset.yaml
kubectl apply -f k8s/postgres-service.yaml
```

### 3. Deploy Application

```bash
# Apply application manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/app-deployment.yaml
kubectl apply -f k8s/app-service.yaml
```

### 4. Test Locally

Access the application at:
- http://localhost:8080
- https://localhost:8443 (after ingress setup)

## Troubleshooting

### VM won't start

**Check VirtualBox:**
```bash
VBoxManage --version
```

**Try:**
```bash
vagrant destroy -f
vagrant up
```

### kubectl can't connect

**Check kubeconfig:**
```bash
cat k8s/kubeconfig-vagrant | grep server
# Should show: https://192.168.56.10:6443
```

**Verify VM is running:**
```bash
vagrant status
vagrant ssh -c "sudo systemctl status k3s"
```

### Not enough resources

**Edit Vagrantfile to reduce resources:**
```ruby
vb.memory = "2048"  # Reduce to 2GB
vb.cpus = 1         # Reduce to 1 CPU
```

Then:
```bash
vagrant reload
```

### Can't access services on localhost

**Check port forwarding:**
```bash
vagrant port
```

**Verify services are running in VM:**
```bash
vagrant ssh -c "kubectl get svc -A"
```

## Development Workflow

### Iterative Testing

1. Make changes to Kubernetes manifests
2. Apply changes:
   ```bash
   kubectl apply -f k8s/your-manifest.yaml
   ```
3. Test in VM
4. Iterate

### Reset Everything

```bash
# Destroy and recreate VM
vagrant destroy -f && vagrant up

# Or just reset k3s
vagrant ssh -c "sudo systemctl restart k3s"
```

### View Logs

```bash
# From host
kubectl logs -n educard-prod -l app=educard

# From VM
vagrant ssh
kubectl logs -n educard-prod -l app=educard
```

## Advantages of Vagrant VM

✅ **Local Testing:** Test full deployment locally  
✅ **Cost-Free:** No cloud costs during development  
✅ **Reproducible:** Consistent environment  
✅ **Safe:** Experiment without affecting production  
✅ **Fast Iteration:** Quick destroy/recreate cycles  
✅ **Offline:** Works without internet (after initial setup)  

## When to Use Production Server

After testing in Vagrant, deploy to real server when:
- ✅ All manifests work correctly
- ✅ Database persistence tested
- ✅ Application deploys successfully
- ✅ Ready for public access with domain name
- ✅ Need better performance
- ✅ Need external access (not localhost)

## Cleanup

### Stop VM (keep disk)
```bash
vagrant halt
```

### Remove VM completely
```bash
vagrant destroy -f
```

### Remove Vagrant box
```bash
vagrant box remove ubuntu/jammy64
```

## Resource Usage

The VM uses:
- **Disk:** ~2-3GB for Ubuntu + k3s
- **RAM:** 4GB (configurable)
- **CPU:** 2 cores (configurable)

VirtualBox Manager shows real-time resource usage.

## Next Steps

1. ✅ Start VM: `vagrant up`
2. ✅ Verify k3s: `kubectl get nodes`
3. ➡️ Continue with Task 5.2: Container Registry Setup
4. ➡️ Continue with Task 5.3: Production Dockerfile
5. ➡️ Test full deployment in VM
6. ➡️ Deploy to production server when ready

## Useful Vagrant Plugins (Optional)

```bash
# Auto-update VirtualBox Guest Additions
vagrant plugin install vagrant-vbguest

# Better /vagrant folder performance
vagrant plugin install vagrant-vbguest
```

## References

- [Vagrant Documentation](https://www.vagrantup.com/docs)
- [VirtualBox Manual](https://www.virtualbox.org/manual/)
- [K3s Documentation](https://docs.k3s.io/)

---

**Status:** Vagrant VM Setup Guide  
**Last Updated:** November 27, 2025  
**VM Status:** Ready for deployment testing
