# Task 5.2: Container Registry Setup - Quick Start

## Overview

This guide helps you set up Docker Hub as your container registry for Educard deployment.

## Prerequisites

- ✅ Docker installed (checked: Docker 28.0.4)
- ✅ k3s cluster running (Task 5.1 complete)
- ⏳ Docker Hub account (create if you don't have one)

## Step 1: Create Docker Hub Account (5 minutes)

1. **Go to Docker Hub:** https://hub.docker.com/signup
2. **Create account:**
   - Choose a username (will be used in image names)
   - Provide email and password
   - Verify email
3. **Create Repository:**
   - Login to Docker Hub
   - Click "Create Repository"
   - Name: `educard`
   - Visibility: Choose **Public** (free) or **Private** (1 free private repo)
   - Click "Create"

Your repository will be at: `docker.io/<your-username>/educard`

## Step 2: Login to Docker Hub (2 minutes)

```bash
# Login with your credentials
docker login

# Enter your:
# Username: <your-dockerhub-username>
# Password: <your-dockerhub-password>
```

**Security Tip:** Use an Access Token instead of password:
1. Docker Hub → Account Settings → Security → New Access Token
2. Copy token
3. Use token as password when running `docker login`

Verify login:
```bash
docker info | grep Username
```

## Step 3: Test Registry Access (5 minutes)

Test that you can push and pull images:

```bash
# Pull a small test image
docker pull hello-world

# Tag it for your registry (replace <username> with your Docker Hub username)
docker tag hello-world <username>/educard:test

# Push to your registry
docker push <username>/educard:test

# Verify on Docker Hub
# Go to https://hub.docker.com/r/<username>/educard/tags
# You should see the 'test' tag

# Clean up local image
docker rmi <username>/educard:test

# Pull from registry to verify
docker pull <username>/educard:test

# Clean up test image
docker rmi <username>/educard:test
```

If all commands succeed, your registry is working! ✅

## Step 4: Configure Kubernetes (Optional - for Private Repos)

If you chose a **private repository**, create an ImagePullSecret so k3s can pull your images:

### Option A: Using Helper Script (Recommended)

```bash
# Set up kubectl access first
source k8s/use-vagrant.sh

# Create the secret
./k8s/create-dockerhub-secret.sh
```

### Option B: Manual Creation

```bash
# Set up kubectl access
source k8s/use-vagrant.sh

# Create secret from docker config
kubectl create secret generic dockerhub-secret \
  --from-file=.dockerconfigjson=$HOME/.docker/config.json \
  --type=kubernetes.io/dockerconfigjson

# Verify
kubectl get secret dockerhub-secret
```

**Note:** If you chose a **public repository**, skip this step - no secret needed!

## Step 5: Document Your Registry

Update your project documentation with registry details:

**Registry:** Docker Hub  
**Username:** `<your-username>`  
**Repository:** `docker.io/<your-username>/educard`  
**Type:** Public or Private  
**Access:** Credentials stored in password manager

## Verification Checklist

- [ ] Docker Hub account created
- [ ] Repository `educard` created (public or private)
- [ ] Logged into Docker Hub locally (`docker login`)
- [ ] Successfully pushed test image
- [ ] Successfully pulled test image
- [ ] If private repo: ImagePullSecret created in k3s
- [ ] Registry details documented

## Common Issues

### "denied: requested access to the resource is denied"

**Cause:** Image name doesn't match your repository

**Fix:** Ensure image is tagged as `<your-username>/educard:tag`

```bash
docker tag <image> <your-username>/educard:v1.0.0
```

### "unauthorized: authentication required"

**Cause:** Not logged into Docker Hub

**Fix:** Login again

```bash
docker login
```

### "no basic auth credentials"

**Cause:** Kubernetes can't pull from private registry

**Fix:** Create ImagePullSecret (Step 4 above)

## Next Steps

After completing this task:

1. ✅ **Task 5.2:** Container Registry Setup (CURRENT)
2. ➡️ **Task 5.3:** Create Production Dockerfile
3. ➡️ **Task 5.4:** Build and push production image
4. ➡️ **Task 5.5:** Create Kubernetes manifests

## Files Created

- `k8s/REGISTRY.md` - Comprehensive registry documentation
- `k8s/create-dockerhub-secret.sh` - Script to create k8s secret
- `k8s/dockerhub-secret.yaml.template` - Manual secret template
- This quick start guide

## Commands Reference

```bash
# Login
docker login

# Check login status
docker info | grep Username

# Tag image
docker tag <image-name> <username>/educard:<version>

# Push image
docker push <username>/educard:<version>

# Pull image
docker pull <username>/educard:<version>

# Create k8s secret (if private repo)
kubectl create secret generic dockerhub-secret \
  --from-file=.dockerconfigjson=$HOME/.docker/config.json \
  --type=kubernetes.io/dockerconfigjson

# List secrets
kubectl get secrets
```

## Support

For detailed documentation, see: `k8s/REGISTRY.md`
