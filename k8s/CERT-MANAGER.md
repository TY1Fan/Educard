# cert-manager ClusterIssuer Configuration Guide

## Overview
This directory contains ClusterIssuer configurations for automatic SSL/TLS certificate management using Let's Encrypt and cert-manager.

## Files
- `cert-manager-issuer.yaml` - Contains both staging and production ClusterIssuers

## Before Applying

### 1. Update Email Address
**IMPORTANT:** Edit `cert-manager-issuer.yaml` and replace `your-email@example.com` with your actual email address in BOTH issuers:

```yaml
spec:
  acme:
    email: your-actual-email@domain.com  # <-- CHANGE THIS
```

This email will receive:
- Certificate expiry notifications
- Important updates from Let's Encrypt
- Account-related information

### 2. Verify DNS Configuration
Before requesting certificates, ensure your domain points to your cluster:

```bash
# Check DNS A record
dig yourdomain.com +short

# Should return your server's IP address
```

## Installation Steps

### Step 1: Install cert-manager
cert-manager should already be installed (Task 5.11). Verify:

```bash
kubectl get pods -n cert-manager
```

Expected output: 3 running pods
- cert-manager
- cert-manager-cainjector
- cert-manager-webhook

### Step 2: Create ClusterIssuers

#### Option A: Use Staging First (Recommended)
Test with staging issuer to avoid rate limits:

```bash
# Apply the issuers
kubectl apply -f k8s/cert-manager-issuer.yaml

# Verify issuers are created
kubectl get clusterissuer

# Check status
kubectl describe clusterissuer letsencrypt-staging
```

#### Option B: Production Only
If you're confident in your setup:

```bash
kubectl apply -f k8s/cert-manager-issuer.yaml
```

### Step 3: Verify ClusterIssuer Status

```bash
# List all ClusterIssuers
kubectl get clusterissuer

# Expected output:
# NAME                  READY   AGE
# letsencrypt-staging   True    1m
# letsencrypt-prod      True    1m

# Check detailed status
kubectl describe clusterissuer letsencrypt-staging
kubectl describe clusterissuer letsencrypt-prod
```

Look for:
- `Status: True` - Issuer is ready
- `Registered: true` - ACME account registered

## Usage

### In Ingress Resources
Add annotation to use cert-manager:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: educard-ingress
  annotations:
    # Use staging for testing
    cert-manager.io/cluster-issuer: "letsencrypt-staging"
    # Switch to prod after testing
    # cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - yourdomain.com
    secretName: educard-tls-staging  # or educard-tls-prod
  rules:
  - host: yourdomain.com
    # ... rest of ingress config
```

### Certificate Process
1. Create Ingress with cert-manager annotation
2. cert-manager automatically creates Certificate resource
3. Certificate controller requests cert from Let's Encrypt
4. ACME HTTP-01 challenge is solved via temporary ingress
5. Certificate is issued and stored in Secret
6. Ingress uses certificate from Secret for TLS

## Staging vs Production

### Staging Issuer (`letsencrypt-staging`)
**Use for:**
- Initial testing
- Development environments
- Configuration verification

**Characteristics:**
- Higher rate limits (30,000 certs/week)
- Certificates NOT trusted by browsers
- Test entire flow without production limits

**Browser Warning:**
You'll see "Not Secure" because staging certs use untrusted root CA.

### Production Issuer (`letsencrypt-prod`)
**Use for:**
- Production deployments
- After successful staging test

**Characteristics:**
- Rate limited (50 certs/week per domain)
- Certificates trusted by all browsers
- Valid for 90 days, auto-renewed

**Rate Limits:**
- 50 certificates per registered domain per week
- 5 duplicate certificates per week
- 300 new orders per account per 3 hours

## Testing Certificate Issuance

### 1. Create Test Certificate
```bash
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: test-cert
  namespace: educard-prod
spec:
  secretName: test-cert-tls
  issuerRef:
    name: letsencrypt-staging
    kind: ClusterIssuer
  dnsNames:
  - yourdomain.com
EOF
```

### 2. Check Certificate Status
```bash
# View certificate
kubectl get certificate -n educard-prod

# Describe certificate (shows status and events)
kubectl describe certificate test-cert -n educard-prod

# Check certificate request
kubectl get certificaterequest -n educard-prod

# View challenge (if stuck)
kubectl get challenge -n educard-prod
```

### 3. Check Certificate Secret
```bash
# Certificate should be stored in secret
kubectl get secret test-cert-tls -n educard-prod

# View certificate details
kubectl get secret test-cert-tls -n educard-prod -o jsonpath='{.data.tls\.crt}' | base64 -d | openssl x509 -text -noout
```

### 4. Cleanup Test Certificate
```bash
kubectl delete certificate test-cert -n educard-prod
kubectl delete secret test-cert-tls -n educard-prod
```

## Troubleshooting

### Issue: ClusterIssuer Not Ready
**Check:**
```bash
kubectl describe clusterissuer letsencrypt-staging
```

**Look for:**
- ACME registration errors
- Network connectivity issues
- Invalid email format

### Issue: Certificate Pending
**Check:**
```bash
kubectl describe certificate <cert-name> -n educard-prod
kubectl get certificaterequest -n educard-prod
kubectl describe certificaterequest <request-name> -n educard-prod
```

**Common causes:**
- DNS not pointing to cluster
- Ingress not accessible from internet
- Firewall blocking HTTP/HTTPS

### Issue: Challenge Failed
**Check:**
```bash
kubectl get challenge -n educard-prod
kubectl describe challenge <challenge-name> -n educard-prod
```

**Common causes:**
- Port 80 not accessible (HTTP-01 needs this)
- Ingress controller not routing correctly
- Domain doesn't resolve to correct IP

### Issue: Rate Limited
**Symptoms:**
- Error message about rate limit exceeded

**Solutions:**
- Wait for rate limit window to reset
- Use staging issuer for testing
- Check rate limit status: https://crt.sh/?q=yourdomain.com

## Switching from Staging to Production

### Step 1: Test with Staging
```bash
# Use staging issuer in your ingress
cert-manager.io/cluster-issuer: "letsencrypt-staging"
```

### Step 2: Verify Certificate Works
```bash
# Check certificate is issued
kubectl get certificate -n educard-prod

# Test HTTPS (expect browser warning)
curl -k https://yourdomain.com
```

### Step 3: Switch to Production
```bash
# Update ingress annotation
cert-manager.io/cluster-issuer: "letsencrypt-prod"

# Update secret name (optional but recommended)
secretName: educard-tls-prod

# Delete old staging certificate
kubectl delete secret educard-tls-staging -n educard-prod

# Apply updated ingress
kubectl apply -f k8s/ingress.yaml
```

### Step 4: Verify Production Certificate
```bash
# Wait for new cert (usually 1-2 minutes)
kubectl get certificate -n educard-prod -w

# Test HTTPS (should work without warnings)
curl https://yourdomain.com
```

## Security Best Practices

### 1. Protect Private Keys
ACME account private keys are stored in secrets:
- `letsencrypt-staging` (in cert-manager namespace)
- `letsencrypt-prod` (in cert-manager namespace)

**Backup these secrets!**

```bash
kubectl get secret letsencrypt-prod -n cert-manager -o yaml > letsencrypt-prod-backup.yaml
```

### 2. Email Notifications
Use a monitored email address to receive:
- Certificate expiry warnings
- Rate limit notifications
- Security alerts

### 3. Certificate Rotation
cert-manager automatically renews certificates:
- Renewal starts 30 days before expiry
- Should complete within hours
- Monitor renewal process

```bash
# Check certificate expiry
kubectl get certificate -n educard-prod -o wide
```

## Monitoring

### Check cert-manager Logs
```bash
# Main controller
kubectl logs -n cert-manager -l app=cert-manager

# Webhook
kubectl logs -n cert-manager -l app=webhook

# CA injector
kubectl logs -n cert-manager -l app=cainjector
```

### Check Certificate Status
```bash
# All certificates
kubectl get certificate --all-namespaces

# Specific certificate details
kubectl describe certificate <name> -n <namespace>
```

### Check Secrets
```bash
# List TLS secrets
kubectl get secrets -n educard-prod | grep tls
```

## Reference

### Let's Encrypt Environments
- **Staging:** https://acme-staging-v02.api.letsencrypt.org/directory
- **Production:** https://acme-v02.api.letsencrypt.org/directory

### Rate Limits
- **Staging:** 30,000 certificates per week
- **Production:** 50 certificates per registered domain per week

### Documentation
- cert-manager: https://cert-manager.io/docs/
- Let's Encrypt: https://letsencrypt.org/docs/
- ACME protocol: https://tools.ietf.org/html/rfc8555

## Next Steps

After setting up ClusterIssuers:
1. **Task 5.12:** Create Ingress with TLS
2. Configure DNS to point to your cluster
3. Test certificate issuance with staging
4. Switch to production issuer
5. Verify HTTPS works correctly
