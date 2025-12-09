# Container Registry Setup

This document explains how to set up and use Docker Hub as the container registry for Educard.

## Overview

We use **Docker Hub** as the container registry because:
- Free for public repositories
- Simple setup and authentication
- Widely supported in Kubernetes
- No additional infrastructure needed

## Setup Instructions

### 1. Create Docker Hub Account

1. Go to [https://hub.docker.com/signup](https://hub.docker.com/signup)
2. Create a free account (or use existing account)
3. Verify your email address
4. Choose a username (this will be part of your image name)

### 2. Create Repository

1. Login to Docker Hub: [https://hub.docker.com](https://hub.docker.com)
2. Click "Create Repository"
3. Repository name: `educard` (or `educard-forum`)
4. Visibility: 
   - **Public**: Anyone can pull (free)
   - **Private**: Only you can pull (1 free private repo)
5. Click "Create"

Your repository URL will be: `docker.io/<username>/educard`

### 3. Login to Docker Hub Locally

```bash
# Login with your Docker Hub credentials
docker login

# You'll be prompted for:
# Username: <your-dockerhub-username>
# Password: <your-dockerhub-password>

# Verify login
docker info | grep Username
```

### 4. Test Registry Access

```bash
# Pull a test image
docker pull hello-world

# Tag it for your registry
docker tag hello-world <username>/educard:test

# Push to your registry
docker push <username>/educard:test

# Delete local image
docker rmi <username>/educard:test

# Pull from registry to verify
docker pull <username>/educard:test
```

## Usage with Kubernetes

### Public Repository (Recommended for Development)

If using a **public** repository, no special configuration needed:

```yaml
# In your deployment.yaml
spec:
  containers:
  - name: educard
    image: docker.io/<username>/educard:v1.0.0
```

### Private Repository (More Secure)

If using a **private** repository, create an ImagePullSecret:

#### Option 1: Using Docker Config File (Recommended)

```bash
# After docker login, create Kubernetes secret
kubectl create secret generic dockerhub-secret \
  --from-file=.dockerconfigjson=$HOME/.docker/config.json \
  --type=kubernetes.io/dockerconfigjson
```

#### Option 2: Using Credentials Directly

```bash
kubectl create secret docker-registry dockerhub-secret \
  --docker-server=docker.io \
  --docker-username=<username> \
  --docker-password=<password> \
  --docker-email=<email>
```

#### Option 3: Using YAML File

Create `k8s/dockerhub-secret.yaml`:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: dockerhub-secret
  namespace: default
type: kubernetes.io/dockerconfigjson
data:
  .dockerconfigjson: <base64-encoded-docker-config>
```

To generate the base64 encoded config:

```bash
cat ~/.docker/config.json | base64
```

Then apply:

```bash
kubectl apply -f k8s/dockerhub-secret.yaml
```

#### Use in Deployment

```yaml
# In your deployment.yaml
spec:
  imagePullSecrets:
  - name: dockerhub-secret
  containers:
  - name: educard
    image: docker.io/<username>/educard:v1.0.0
```

## Image Naming Convention

Use semantic versioning for all images:

```bash
# Format
<registry>/<username>/<repository>:<tag>

# Examples
docker.io/johndoe/educard:v1.0.0      # Stable release
docker.io/johndoe/educard:v1.0.1      # Bug fix
docker.io/johndoe/educard:v1.1.0      # New feature
docker.io/johndoe/educard:latest      # Latest build (avoid in production)
docker.io/johndoe/educard:dev         # Development build
```

## Common Commands

### Building and Pushing

```bash
# Build image
docker build -t educard:v1.0.0 -f Dockerfile.production .

# Tag for registry
docker tag educard:v1.0.0 <username>/educard:v1.0.0
docker tag educard:v1.0.0 <username>/educard:latest

# Push to registry
docker push <username>/educard:v1.0.0
docker push <username>/educard:latest
```

### Pulling and Running

```bash
# Pull specific version
docker pull <username>/educard:v1.0.0

# Run container
docker run -d -p 3000:3000 --name educard <username>/educard:v1.0.0

# View logs
docker logs educard
```

### Managing Images

```bash
# List local images
docker images | grep educard

# Remove local image
docker rmi <username>/educard:v1.0.0

# Remove all educard images
docker rmi $(docker images '<username>/educard' -q)

# View image size
docker images <username>/educard
```

## Security Best Practices

### 1. Use Access Tokens (Recommended)

Instead of using your password, create an access token:

1. Login to Docker Hub
2. Go to Account Settings → Security
3. Click "New Access Token"
4. Name: "k3s-cluster" (or similar)
5. Permissions: Read, Write, Delete
6. Copy the token (you won't see it again!)
7. Use token as password when running `docker login`

```bash
docker login -u <username>
# Password: <paste-access-token>
```

### 2. Secure Credentials Storage

**Never commit credentials to git!**

Store credentials securely:

- Use password manager (1Password, Bitwarden, LastPass)
- Use environment variables
- Use Kubernetes secrets for cluster access
- Rotate tokens regularly

### 3. Image Security

- Scan images for vulnerabilities: `docker scan <username>/educard:v1.0.0`
- Use minimal base images (alpine)
- Don't include secrets in images
- Run containers as non-root user
- Keep images updated

## Troubleshooting

### Login Failed

```bash
# Check Docker daemon is running
docker ps

# Clear stored credentials
rm ~/.docker/config.json

# Try login again
docker login
```

### Push Permission Denied

- Verify repository exists on Docker Hub
- Verify you're logged in: `docker info | grep Username`
- Verify image name matches repository: `<username>/educard`

### Pull Rate Limit

Docker Hub has rate limits:
- Anonymous: 100 pulls per 6 hours
- Authenticated: 200 pulls per 6 hours
- Pro: Unlimited

Solution: Always authenticate with `docker login`

### Kubernetes Pull Failed

Check ImagePullSecret:

```bash
# List secrets
kubectl get secrets

# Describe secret
kubectl describe secret dockerhub-secret

# Check pod events
kubectl describe pod <pod-name> | grep -A 5 Events
```

## Registry Configuration Summary

**Registry:** Docker Hub  
**URL:** `docker.io`  
**Repository:** `<username>/educard`  
**Authentication:** Username + Password (or Access Token)  
**Kubernetes Secret:** `dockerhub-secret` (for private repos only)

## Next Steps

After registry setup:

1. ✅ Registry configured and accessible
2. ➡️ Create production Dockerfile (Task 5.3)
3. ➡️ Build and push images
4. ➡️ Create Kubernetes manifests (Task 5.4)
5. ➡️ Deploy to k3s cluster

## References

- [Docker Hub Documentation](https://docs.docker.com/docker-hub/)
- [Kubernetes Image Pull Secrets](https://kubernetes.io/docs/tasks/configure-pod-container/pull-image-private-registry/)
- [Docker CLI Reference](https://docs.docker.com/engine/reference/commandline/cli/)
