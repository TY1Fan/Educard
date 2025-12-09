# Kubernetes Secrets Management

## Overview

This document explains how Kubernetes Secrets are managed for the Educard application.

## Secrets Created

### educard-secrets

The `educard-secrets` Secret contains sensitive configuration data:

**Contents:**
- `DB_USER`: PostgreSQL username
- `DB_PASSWORD`: PostgreSQL password (64-char random hex)
- `SESSION_SECRET`: Express session secret (64-char random hex)

**Type:** Opaque  
**Namespace:** educard-prod

## Security Best Practices

### ✅ DO:
- Use strong randomly generated passwords (32+ bytes)
- Store credentials in a secure password manager
- Use `stringData` for plain text (auto-encoded to base64)
- Add secret files to `.gitignore`
- Rotate secrets regularly
- Use helper scripts for consistent generation
- Document secret recreation process
- Limit secret access via RBAC

### ❌ DON'T:
- Commit secrets to git
- Share secrets via insecure channels
- Use weak or predictable passwords
- Store secrets in plain text on disk
- Log secret values
- Include secrets in container images
- Reuse secrets across environments

## Creating Secrets

### Option 1: Using Helper Script (Recommended)

```bash
./k8s/create-secrets.sh
```

**What it does:**
1. Checks kubectl and cluster connection
2. Generates strong random credentials
3. Creates secret.yaml file
4. Applies secret to cluster
5. Verifies secret creation
6. Prompts to save credentials

### Option 2: Manual Creation

```bash
# Generate credentials
DB_PASSWORD=$(openssl rand -hex 32)
SESSION_SECRET=$(openssl rand -hex 32)

# Create secret file
cat > k8s/secret.yaml <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: educard-secrets
  namespace: educard-prod
  labels:
    app: educard
    component: secrets
type: Opaque
stringData:
  DB_USER: "educard"
  DB_PASSWORD: "$DB_PASSWORD"
  SESSION_SECRET: "$SESSION_SECRET"
EOF

# Apply to cluster
kubectl apply -f k8s/secret.yaml

# Save credentials securely!
```

### Option 3: Using kubectl directly

```bash
kubectl create secret generic educard-secrets \
  --namespace=educard-prod \
  --from-literal=DB_USER=educard \
  --from-literal=DB_PASSWORD=$(openssl rand -hex 32) \
  --from-literal=SESSION_SECRET=$(openssl rand -hex 32)
```

## Using Secrets in Pods

### Method 1: Environment Variables (Recommended)

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: educard-app
spec:
  containers:
  - name: educard
    image: educard:prod
    env:
      # Individual secret values
      - name: DB_USER
        valueFrom:
          secretKeyRef:
            name: educard-secrets
            key: DB_USER
      - name: DB_PASSWORD
        valueFrom:
          secretKeyRef:
            name: educard-secrets
            key: DB_PASSWORD
      - name: SESSION_SECRET
        valueFrom:
          secretKeyRef:
            name: educard-secrets
            key: SESSION_SECRET
```

### Method 2: All Secrets as Environment Variables

```yaml
spec:
  containers:
  - name: educard
    image: educard:prod
    envFrom:
      - secretRef:
          name: educard-secrets
```

### Method 3: Volume Mount (for files)

```yaml
spec:
  containers:
  - name: educard
    image: educard:prod
    volumeMounts:
      - name: secrets
        mountPath: "/etc/secrets"
        readOnly: true
  volumes:
    - name: secrets
      secret:
        secretName: educard-secrets
```

## Management Commands

### View Secrets

```bash
# List all secrets in namespace
kubectl get secrets -n educard-prod

# View secret metadata (no values)
kubectl describe secret educard-secrets -n educard-prod

# View secret with base64 values
kubectl get secret educard-secrets -n educard-prod -o yaml

# Decode a specific value
kubectl get secret educard-secrets -n educard-prod -o jsonpath='{.data.DB_PASSWORD}' | base64 -d
```

### Update Secrets

```bash
# Method 1: Edit directly
kubectl edit secret educard-secrets -n educard-prod

# Method 2: Delete and recreate
kubectl delete secret educard-secrets -n educard-prod
./k8s/create-secrets.sh

# Method 3: Patch specific value
kubectl patch secret educard-secrets -n educard-prod \
  -p '{"stringData":{"DB_PASSWORD":"new-password"}}'

# Restart pods to pick up changes
kubectl rollout restart deployment educard-app -n educard-prod
```

### Delete Secrets

```bash
# Delete secret
kubectl delete secret educard-secrets -n educard-prod

# Delete secret file (be careful!)
rm k8s/secret.yaml
```

## Password Generation

### OpenSSL (Recommended)

```bash
# 32-byte hex (64 characters)
openssl rand -hex 32

# 32-byte base64 (44 characters)
openssl rand -base64 32
```

### Node.js

```bash
# 32-byte hex
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 32-byte base64
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Python

```bash
# 32-byte hex
python3 -c "import secrets; print(secrets.token_hex(32))"

# 32-byte base64
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

## Credential Storage

### Store credentials securely:

1. **Password Manager** (Recommended)
   - 1Password
   - Bitwarden
   - LastPass
   - KeePassXC

2. **Team Secret Management**
   - HashiCorp Vault
   - AWS Secrets Manager
   - Azure Key Vault
   - Google Secret Manager

3. **Emergency Recovery**
   - Encrypted backup file
   - Printed copy in safe
   - Split secrets across team members

## Git Protection

### Verify secrets are protected:

```bash
# Check .gitignore
grep secret .gitignore

# Should include:
# k8s/secret.yaml
# k8s/*-secret.yaml
```

### Verify secret not tracked:

```bash
git status k8s/secret.yaml
# Should show: not tracked or ignored
```

### Remove secret from git if committed:

```bash
# Remove from current commit
git rm --cached k8s/secret.yaml

# Remove from history (if committed)
git filter-branch --index-filter \
  'git rm --cached --ignore-unmatch k8s/secret.yaml' HEAD
```

## Secret Rotation

### Rotate secrets periodically:

```bash
# 1. Generate new credentials
NEW_PASSWORD=$(openssl rand -hex 32)
NEW_SESSION=$(openssl rand -hex 32)

# 2. Update database password
# (Connect to database and change password first)

# 3. Update secret
kubectl patch secret educard-secrets -n educard-prod \
  -p "{\"stringData\":{\"DB_PASSWORD\":\"$NEW_PASSWORD\",\"SESSION_SECRET\":\"$NEW_SESSION\"}}"

# 4. Restart application
kubectl rollout restart deployment educard-app -n educard-prod

# 5. Save new credentials securely
```

## Troubleshooting

### Secret Not Found

```bash
# Check if secret exists
kubectl get secret educard-secrets -n educard-prod

# Recreate if missing
./k8s/create-secrets.sh
```

### Application Can't Access Secret

```bash
# Check pod environment variables
kubectl exec -n educard-prod <pod-name> -- env | grep DB

# Check secret is mounted
kubectl describe pod <pod-name> -n educard-prod | grep -A 5 "Mounts:"
```

### Invalid Base64 Encoding

```bash
# When using data: instead of stringData:, encode values:
echo -n "my-password" | base64

# Decode to verify:
echo "bXktcGFzc3dvcmQ=" | base64 -d
```

## Production Considerations

### Sealed Secrets

For GitOps workflows, use [Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets):

```bash
# Install sealed-secrets controller
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.18.0/controller.yaml

# Create sealed secret
echo -n "my-password" | kubectl create secret generic test \
  --dry-run=client --from-file=password=/dev/stdin -o yaml | \
  kubeseal -o yaml > sealed-secret.yaml

# Commit sealed-secret.yaml to git (safe!)
```

### External Secrets Operator

Use [External Secrets Operator](https://external-secrets.io/) to sync from external vaults:

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: educard-secrets
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: vault-backend
    kind: SecretStore
  target:
    name: educard-secrets
  data:
  - secretKey: DB_PASSWORD
    remoteRef:
      key: secret/data/educard
      property: db_password
```

## Audit and Compliance

### Track secret access:

```bash
# Enable audit logging in k3s
# Edit /etc/rancher/k3s/config.yaml

# View secret access logs
kubectl logs -n kube-system -l component=kube-apiserver | grep educard-secrets
```

## Reference

- [Kubernetes Secrets](https://kubernetes.io/docs/concepts/configuration/secret/)
- [Secrets Best Practices](https://kubernetes.io/docs/concepts/security/secrets-good-practices/)
- [Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets)
- [External Secrets Operator](https://external-secrets.io/)
