# Task 5.1: K3s Cluster Setup - Quick Start

## What You Need

1. **A Linux Server/VPS** with:
   - Ubuntu 20.04+ or Debian 11+
   - 2GB RAM minimum (4GB recommended)
   - Public IP address
   - Root or sudo access

2. **Your Local Machine** (macOS/Linux) with:
   - SSH access to the server
   - Terminal access

## Quick Setup (3 Steps)

### Step 1: Get a Server

Choose one of these options:

**Option A: DigitalOcean (Recommended for beginners)**
1. Go to [DigitalOcean](https://www.digitalocean.com/)
2. Create a Droplet:
   - Image: Ubuntu 22.04 LTS
   - Plan: Basic ($12/month - 2GB RAM)
   - Add your SSH key
3. Note the IP address

**Option B: Other Providers**
- Linode: $12/month
- Vultr: $12/month  
- Hetzner: €4-8/month (cheaper, EU-based)
- AWS EC2: t3.small instance

**Option C: Local Server**
- Any Linux machine with public IP
- Home lab with port forwarding

### Step 2: Setup K3s on Server

SSH into your server:
```bash
ssh root@YOUR_SERVER_IP
```

Download and run the setup script:
```bash
curl -sfL https://raw.githubusercontent.com/TY1Fan/Educard/main/k8s/setup-k3s-server.sh | sudo bash
```

Or manually:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install k3s
curl -sfL https://get.k3s.io | sh -

# Wait for it to start
sleep 10

# Verify
sudo k3s kubectl get nodes
```

The script will:
- Update system packages
- Configure firewall (ports 22, 80, 443, 6443)
- Install k3s
- Display the kubeconfig

**Save the output!** You'll need the kubeconfig and server IP.

### Step 3: Setup Local Access

On your local machine (macOS), run:

```bash
cd ~/Desktop/Educard
./k8s/setup-local.sh
```

The script will:
1. Install kubectl (if needed)
2. Install helm (if needed)
3. Download kubeconfig from your server
4. Configure it with correct IP
5. Test the connection

**Manual Alternative:**
```bash
# Install kubectl (if not installed)
brew install kubectl

# Install helm (if not installed)
brew install helm

# Get kubeconfig from server
ssh root@YOUR_SERVER_IP 'sudo cat /etc/rancher/k3s/k3s.yaml' > ~/.kube/config-educard

# Edit the file and replace 127.0.0.1 with YOUR_SERVER_IP
nano ~/.kube/config-educard

# Export the config
export KUBECONFIG=~/.kube/config-educard

# Add to shell profile
echo 'export KUBECONFIG=~/.kube/config-educard' >> ~/.zshrc

# Test connection
kubectl get nodes
```

## Verification

Run these commands to verify everything works:

```bash
# Should show your node
kubectl get nodes

# Should show k3s system pods
kubectl get pods -A

# Should show cluster info
kubectl cluster-info

# Should show local-path storage class
kubectl get storageclass
```

Expected output for `kubectl get nodes`:
```
NAME       STATUS   ROLES                  AGE   VERSION
hostname   Ready    control-plane,master   2m    v1.28.x+k3s1
```

## Troubleshooting

### Cannot connect to server

**Check firewall on server:**
```bash
ssh root@YOUR_SERVER_IP
sudo ufw status
sudo ufw allow 6443/tcp
```

**Verify k3s is running:**
```bash
ssh root@YOUR_SERVER_IP
sudo systemctl status k3s
```

**Check kubeconfig server IP:**
```bash
grep server ~/.kube/config-educard
# Should show: server: https://YOUR_SERVER_IP:6443
```

### kubectl command not found

**Install kubectl:**
```bash
brew install kubectl
```

### Permission denied

**Check file permissions:**
```bash
chmod 600 ~/.kube/config-educard
```

## What's Next?

After completing Task 5.1, you should have:
- ✅ K3s cluster running on your server
- ✅ kubectl installed locally
- ✅ helm installed locally  
- ✅ Local machine can connect to cluster
- ✅ Storage provisioner available

Now proceed to **Task 5.2: Container Registry Setup**

## Useful Commands

```bash
# View all resources
kubectl get all -A

# View nodes with details
kubectl get nodes -o wide

# View storage
kubectl get storageclass
kubectl get pv

# View system pods
kubectl get pods -n kube-system

# Get cluster info
kubectl cluster-info

# Test with a pod
kubectl run test --image=nginx:alpine --rm -it -- sh
```

## Cost Estimate

- **DigitalOcean:** $12/month
- **Linode:** $12/month
- **Vultr:** $12/month
- **Hetzner:** €4-8/month (~$5-9/month)

## Security Notes

1. Use SSH keys, not passwords
2. Keep the server updated: `sudo apt update && sudo apt upgrade`
3. Configure firewall properly
4. Consider fail2ban for SSH protection
5. Keep kubeconfig file secure (don't commit to git!)

## Support

If you encounter issues:
1. Check the detailed guide: `k8s/README.md`
2. Review k3s logs: `ssh root@YOUR_SERVER_IP 'sudo journalctl -u k3s -f'`
3. Check k3s documentation: https://docs.k3s.io/

---

**Status:** Task 5.1 Quick Start Guide  
**Last Updated:** November 27, 2025
