# K3s Deployment Guide

Complete guide for deploying the Educard application on Kubernetes using K3s.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Setup](#server-setup)
3. [K3s Installation](#k3s-installation)
4. [kubectl Configuration](#kubectl-configuration)
5. [Container Registry Setup](#container-registry-setup)
6. [Application Deployment](#application-deployment)
7. [Post-Deployment](#post-deployment)
8. [Verification](#verification)

## Prerequisites

### Server Requirements

**Minimum Specifications:**
- **OS:** Linux (Ubuntu 20.04+ / Debian 11+ / CentOS 8+)
- **CPU:** 2 cores
- **RAM:** 2GB
- **Disk:** 20GB
- **Network:** Stable internet connection

**Recommended Specifications:**
- **CPU:** 4 cores
- **RAM:** 4GB
- **Disk:** 50GB
- **Network:** Public IP with open ports

**Required Ports:**
- `22` - SSH
- `80` - HTTP
- `443` - HTTPS
- `6443` - Kubernetes API

### Local Machine Requirements

- kubectl installed
- Docker installed (for building images)
- SSH client
- Git

### Installation of Tools

**kubectl (macOS):**
```bash
brew install kubectl
```

**kubectl (Linux):**
```bash
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
```

**Docker (macOS):**
```bash
brew install --cask docker
```

**Docker (Linux):**
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

## Server Setup

### Option 1: Cloud Provider VPS

**Recommended Providers:**

| Provider | Plan | Cost | Specs |
|----------|------|------|-------|
| DigitalOcean | Droplet | $12/month | 2GB RAM, 2 CPU, 50GB SSD |
| Linode | Shared CPU | $12/month | 2GB RAM, 1 CPU, 50GB SSD |
| Vultr | Cloud Compute | $12/month | 2GB RAM, 1 CPU, 55GB SSD |
| Hetzner | CX21 | €5.83/month | 4GB RAM, 2 CPU, 40GB SSD |
| AWS EC2 | t3.small | ~$15/month | 2GB RAM, 2 CPU, 20GB EBS |

**Setup Steps:**
1. Create new VPS instance
2. Choose Ubuntu 22.04 LTS
3. Add SSH key
4. Note the public IP address
5. Configure firewall rules

### Option 2: Vagrant (Local Development)

**For local testing:**
```bash
cd /Users/tohyifan/Desktop/Educard
vagrant up
vagrant ssh
```

See [VAGRANT.md](../k8s/VAGRANT.md) for details.

### Initial Server Configuration

**Connect to server:**
```bash
ssh root@YOUR_SERVER_IP
# or
ssh -i ~/.ssh/your-key user@YOUR_SERVER_IP
```

**Update system:**
```bash
sudo apt update && sudo apt upgrade -y
```

**Install required packages:**
```bash
sudo apt install -y curl wget git nano ufw
```

**Configure firewall:**
```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow Kubernetes API
sudo ufw allow 6443/tcp

# Enable firewall
sudo ufw --force enable

# Check status
sudo ufw status
```

## K3s Installation

### Install K3s

**On the server, run:**
```bash
curl -sfL https://get.k3s.io | sh -
```

This will:
- Install K3s binary
- Configure systemd service
- Start K3s automatically
- Install kubectl (as `k3s kubectl`)

**Verify installation:**
```bash
# Check service status
sudo systemctl status k3s

# Check version
sudo k3s --version

# Check node
sudo k3s kubectl get nodes
```

Expected output:
```
NAME       STATUS   ROLES                  AGE   VERSION
hostname   Ready    control-plane,master   1m    v1.28.x+k3s1
```

### K3s Configuration

**Configuration file:** `/etc/rancher/k3s/config.yaml`

K3s comes with:
- ✅ Traefik ingress controller
- ✅ Local-path storage provisioner
- ✅ CoreDNS
- ✅ Metrics-server
- ✅ Service load balancer

**Verify components:**
```bash
sudo k3s kubectl get pods -n kube-system
```

### K3s Service Management

```bash
# Start K3s
sudo systemctl start k3s

# Stop K3s
sudo systemctl stop k3s

# Restart K3s
sudo systemctl restart k3s

# Enable auto-start
sudo systemctl enable k3s

# Check status
sudo systemctl status k3s

# View logs
sudo journalctl -u k3s -f
```

## kubectl Configuration

### Get kubeconfig from Server

**On the server:**
```bash
sudo cat /etc/rancher/k3s/k3s.yaml
```

**Copy the output** - you'll need it on your local machine.

### Configure Local kubectl

**On your local machine:**

1. **Create kubeconfig file:**
```bash
mkdir -p ~/.kube
nano ~/.kube/config-educard
```

2. **Paste the kubeconfig** from the server

3. **Edit the server IP:**
```yaml
# Change this line:
server: https://127.0.0.1:6443

# To your server's public IP:
server: https://YOUR_SERVER_PUBLIC_IP:6443
```

4. **Set KUBECONFIG environment variable:**
```bash
export KUBECONFIG=~/.kube/config-educard
```

5. **Make it permanent:**
```bash
# For zsh (macOS default)
echo 'export KUBECONFIG=~/.kube/config-educard' >> ~/.zshrc
source ~/.zshrc

# For bash
echo 'export KUBECONFIG=~/.kube/config-educard' >> ~/.bashrc
source ~/.bashrc
```

### Verify Connection

```bash
# From local machine
kubectl get nodes
kubectl cluster-info
kubectl get pods -A
```

Expected output:
```
NAME       STATUS   ROLES                  AGE   VERSION
hostname   Ready    control-plane,master   5m    v1.28.x+k3s1
```

## Container Registry Setup

### Option 1: Docker Hub (Recommended for Production)

See [QUICKSTART-REGISTRY.md](../k8s/QUICKSTART-REGISTRY.md) for detailed setup.

**Quick setup:**
```bash
# Create Docker Hub account at https://hub.docker.com
# Create repository: educard

# Login
docker login

# Tag and push
docker tag educard:latest yourusername/educard:latest
docker push yourusername/educard:latest
```

### Option 2: Local Registry (For Development)

**Start local registry:**
```bash
docker run -d -p 5000:5000 --name registry registry:2
```

**Configure K3s to use insecure registry:**
```bash
# On K3s server
sudo mkdir -p /etc/rancher/k3s
sudo nano /etc/rancher/k3s/registries.yaml
```

Add:
```yaml
mirrors:
  "localhost:5000":
    endpoint:
      - "http://YOUR_LOCAL_IP:5000"
configs:
  "localhost:5000":
    tls:
      insecure_skip_verify: true
```

**Restart K3s:**
```bash
sudo systemctl restart k3s
```

## Application Deployment

### Step 1: Build and Push Application Image

**On your local machine:**

```bash
cd /Users/tohyifan/Desktop/Educard

# Build image
docker build -f docker/Dockerfile.prod -t educard:latest .

# Tag for registry
docker tag educard:latest localhost:5000/educard:latest

# Push to registry
docker push localhost:5000/educard:latest
```

### Step 2: Create Namespace

```bash
kubectl apply -f k8s/namespace.yaml
```

Verify:
```bash
kubectl get namespace educard-prod
```

### Step 3: Create Secrets

**Create secrets file (do NOT commit to git):**
```bash
cp k8s/secrets.yaml.example k8s/secrets.yaml
nano k8s/secrets.yaml
```

**Edit with your actual values:**
```yaml
stringData:
  DB_USER: "educard"
  DB_PASSWORD: "your-secure-password"  # Change this!
  JWT_SECRET: "your-jwt-secret"         # Change this!
```

**Apply secrets:**
```bash
kubectl apply -f k8s/secrets.yaml
```

### Step 4: Create ConfigMap

```bash
kubectl apply -f k8s/configmap.yaml
```

### Step 5: Deploy Database

**Create database storage:**
```bash
kubectl apply -f k8s/postgres-pvc.yaml
```

**Deploy PostgreSQL:**
```bash
kubectl apply -f k8s/postgres-statefulset.yaml
kubectl apply -f k8s/postgres-service.yaml
```

**Wait for database to be ready:**
```bash
kubectl wait --for=condition=ready pod postgres-0 -n educard-prod --timeout=120s
```

### Step 6: Deploy Application

```bash
kubectl apply -f k8s/app-deployment.yaml
kubectl apply -f k8s/app-service.yaml
```

**Wait for application pods:**
```bash
kubectl wait --for=condition=ready pod -l app=educard -n educard-prod --timeout=120s
```

### Step 7: Deploy Backup System

```bash
kubectl apply -f k8s/backup-pvc.yaml
kubectl apply -f k8s/backup-cronjob.yaml
```

### Step 8: Deploy Ingress (Optional)

**If you have a domain:**
```bash
# Follow instructions in INGRESS.md
./k8s/deploy-ingress.sh
```

### All-in-One Deployment

**Or use the deployment script:**
```bash
./k8s/deploy.sh
```

## Post-Deployment

### 1. Verify All Pods Running

```bash
kubectl get pods -n educard-prod
```

Expected:
```
NAME                           READY   STATUS    RESTARTS   AGE
educard-app-xxxxxxxxxx-xxxxx   1/1     Running   0          2m
educard-app-xxxxxxxxxx-xxxxx   1/1     Running   0          2m
postgres-0                     1/1     Running   0          3m
```

### 2. Check Services

```bash
kubectl get svc -n educard-prod
```

Expected:
```
NAME               TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
educard-service    ClusterIP   10.43.xxx.xxx   <none>        80/TCP     2m
postgres-service   ClusterIP   None            <none>        5432/TCP   3m
```

### 3. Check Storage

```bash
kubectl get pvc -n educard-prod
```

Expected:
```
NAME           STATUS   VOLUME                                     CAPACITY   ACCESS MODES   AGE
postgres-pvc   Bound    pvc-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx   10Gi       RWO            3m
backup-pvc     Bound    pvc-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx   20Gi       RWO            2m
```

### 4. Run Health Check

```bash
./k8s/check-metrics.sh
```

### 5. Run Tests

```bash
./k8s/test-deployment.sh all
```

## Verification

### Access Application

**Via Port Forward:**
```bash
kubectl port-forward -n educard-prod svc/educard-service 8080:80
```

Open browser: `http://localhost:8080`

**Via Ingress (if configured):**
```
https://yourdomain.com
```

### Test Database Connection

```bash
kubectl exec -it -n educard-prod postgres-0 -- psql -U educard -d educard_prod
```

### View Logs

```bash
# Application logs
kubectl logs -n educard-prod -l app=educard --tail=100

# Database logs
kubectl logs -n educard-prod postgres-0 --tail=100
```

### Test Backup System

```bash
# Run manual backup
./k8s/run-backup.sh

# List backups
./k8s/list-backups.sh
```

## Post-Deployment Checklist

- [ ] All pods running and ready
- [ ] All services have endpoints
- [ ] All PVCs bound
- [ ] Application accessible
- [ ] Database connection working
- [ ] Backups scheduled and working
- [ ] Monitoring functional
- [ ] Tests passing
- [ ] SSL/TLS configured (if using Ingress)
- [ ] Documentation reviewed

## Troubleshooting Common Issues

### Pods Not Starting

```bash
# Check pod details
kubectl describe pod <pod-name> -n educard-prod

# Check events
kubectl get events -n educard-prod --sort-by='.lastTimestamp'

# Check logs
kubectl logs <pod-name> -n educard-prod
```

### Image Pull Errors

```bash
# Check if image exists
docker pull localhost:5000/educard:latest

# Check registry configuration
sudo cat /etc/rancher/k3s/registries.yaml

# Restart k3s
sudo systemctl restart k3s
```

### Database Connection Issues

```bash
# Check database pod
kubectl get pod postgres-0 -n educard-prod

# Test connection
kubectl exec -it postgres-0 -n educard-prod -- pg_isready -U educard

# Check secrets
kubectl get secret educard-secrets -n educard-prod -o yaml
```

### Storage Issues

```bash
# Check PVC status
kubectl get pvc -n educard-prod

# Check PV status
kubectl get pv

# Describe PVC
kubectl describe pvc postgres-pvc -n educard-prod
```

See [TROUBLESHOOTING.md](../docs/TROUBLESHOOTING.md) for comprehensive troubleshooting.

## Updating the Deployment

### Update Application

```bash
# Build new image
docker build -f docker/Dockerfile.prod -t educard:v1.0.1 .
docker tag educard:v1.0.1 localhost:5000/educard:v1.0.1
docker push localhost:5000/educard:v1.0.1

# Update deployment
kubectl set image deployment/educard-app -n educard-prod educard=localhost:5000/educard:v1.0.1

# Watch rollout
kubectl rollout status deployment/educard-app -n educard-prod
```

### Rollback

```bash
# Rollback to previous version
kubectl rollout undo deployment/educard-app -n educard-prod

# Rollback to specific revision
kubectl rollout undo deployment/educard-app -n educard-prod --to-revision=2
```

## Scaling

### Scale Application

```bash
# Scale to 3 replicas
kubectl scale deployment/educard-app -n educard-prod --replicas=3

# Verify
kubectl get deployment educard-app -n educard-prod
```

### Autoscaling

```bash
# Create HPA (Horizontal Pod Autoscaler)
kubectl autoscale deployment educard-app -n educard-prod --cpu-percent=70 --min=2 --max=10

# Check HPA
kubectl get hpa -n educard-prod
```

## Backup and Restore

### Automated Backups

Backups run daily at 2 AM UTC automatically.

```bash
# Check CronJob
kubectl get cronjob -n educard-prod

# View recent jobs
kubectl get jobs -n educard-prod -l app=postgres-backup
```

### Manual Backup

```bash
./k8s/run-backup.sh
```

### Restore from Backup

```bash
./k8s/run-restore.sh
```

See [BACKUP_RESTORE.md](../docs/BACKUP_RESTORE.md) for details.

## Maintenance

### Regular Tasks

**Daily:**
- Check cluster health: `./k8s/check-metrics.sh`
- Review logs for errors
- Verify backups completed

**Weekly:**
- Run tests: `./k8s/test-deployment.sh all`
- Review resource usage
- Check for security updates

**Monthly:**
- Update K3s
- Review and adjust resource limits
- Test disaster recovery

### Updating K3s

```bash
# On K3s server
curl -sfL https://get.k3s.io | sh -

# Or specific version
curl -sfL https://get.k3s.io | INSTALL_K3S_VERSION=v1.28.5+k3s1 sh -
```

## Security Best Practices

1. **Keep secrets secure:**
   - Never commit secrets to git
   - Use strong passwords
   - Rotate credentials regularly

2. **Update regularly:**
   - Keep K3s updated
   - Keep OS updated
   - Update container images

3. **Monitor access:**
   - Review kubectl access
   - Monitor API access logs
   - Use RBAC properly

4. **Backup regularly:**
   - Verify backups daily
   - Test restore procedures
   - Store backups securely

5. **Network security:**
   - Use firewall rules
   - Limit API access
   - Use TLS/SSL everywhere

## Additional Resources

- [K3s Documentation](https://docs.k3s.io/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [OPERATIONS_RUNBOOK.md](./OPERATIONS_RUNBOOK.md)
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- [MONITORING.md](./MONITORING.md)

## Support

For issues or questions:
1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Review logs: `kubectl logs -n educard-prod <pod-name>`
3. Check events: `kubectl get events -n educard-prod`
4. Run diagnostics: `./k8s/check-metrics.sh`

---

**Last Updated:** November 28, 2025  
**Version:** 1.0  
**Status:** Production Ready ✅
