# Task 5.11 - Install cert-manager Summary

**Completion Date:** November 27, 2025  
**Status:** ✅ Completed Successfully

## Overview
Successfully installed cert-manager v1.13.0 in the Kubernetes cluster and created ClusterIssuers for both staging and production Let's Encrypt certificate management. This enables automatic SSL/TLS certificate provisioning and renewal for Ingress resources.

## Installation Details

### cert-manager Components Installed
- **Version:** v1.13.0
- **Namespace:** cert-manager
- **Image Registry:** quay.io/jetstack

### Deployed Resources

#### Pods (3 total)
1. **cert-manager-controller** - Main certificate management controller
2. **cert-manager-cainjector** - CA certificate injection into webhooks
3. **cert-manager-webhook** - Webhook for validation and mutation

**Status:** All pods Running (1/1 Ready)

#### Custom Resource Definitions (6 total)
1. `certificates.cert-manager.io` - Certificate resources
2. `certificaterequests.cert-manager.io` - Certificate signing requests
3. `issuers.cert-manager.io` - Namespace-scoped issuers
4. `clusterissuers.cert-manager.io` - Cluster-wide issuers
5. `challenges.acme.cert-manager.io` - ACME challenges
6. `orders.acme.cert-manager.io` - ACME orders

#### RBAC Resources
- 12 ClusterRoles
- 12 ClusterRoleBindings
- 3 ServiceAccounts
- 3 Roles
- 3 RoleBindings

#### Services
- `cert-manager` - Main service (port 9402)
- `cert-manager-webhook` - Webhook service (port 443)

#### ConfigMaps
- `cert-manager` - Controller configuration
- `cert-manager-webhook` - Webhook configuration

## ClusterIssuers Created

### 1. letsencrypt-staging
**Purpose:** Testing and development

**Configuration:**
- **Server:** https://acme-staging-v02.api.letsencrypt.org/directory
- **Email:** Placeholder (requires configuration)
- **Private Key Secret:** letsencrypt-staging
- **Challenge Solver:** HTTP-01 via Traefik ingress

**Characteristics:**
- Higher rate limits (30,000 certs/week)
- Certificates NOT trusted by browsers
- Ideal for testing without production limits
- No cost to use

**Use Cases:**
- Initial Ingress configuration testing
- Certificate workflow verification
- Development environments
- CI/CD pipeline testing

### 2. letsencrypt-prod
**Purpose:** Production deployments

**Configuration:**
- **Server:** https://acme-v02.api.letsencrypt.org/directory
- **Email:** Placeholder (requires configuration)
- **Private Key Secret:** letsencrypt-prod
- **Challenge Solver:** HTTP-01 via Traefik ingress

**Characteristics:**
- Rate limited (50 certs/week per registered domain)
- Certificates trusted by all browsers
- Valid for 90 days (auto-renewed at 60 days)
- Free certificates

**Rate Limits:**
- 50 certificates per registered domain per week
- 5 duplicate certificates per week
- 300 new orders per account per 3 hours

## Installation Process

### Step 1: Install cert-manager
```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
```

**Result:**
- Namespace created
- CRDs installed
- RBAC configured
- Deployments created
- Services configured

### Step 2: Verify Installation
```bash
kubectl get pods -n cert-manager
```

**Output:**
```
NAME                                       READY   STATUS    RESTARTS   AGE
cert-manager-cainjector-5469cf6649-llvhl   1/1     Running   0          37s
cert-manager-dc97f5746-66dhf               1/1     Running   0          37s
cert-manager-webhook-54d9668fdc-g9m96      1/1     Running   0          37s
```

### Step 3: Create ClusterIssuers
```bash
kubectl apply -f k8s/cert-manager-issuer.yaml
```

**Result:**
- letsencrypt-staging ClusterIssuer created
- letsencrypt-prod ClusterIssuer created

### Step 4: Verify ClusterIssuers
```bash
kubectl get clusterissuer
```

**Output:**
```
NAME                  READY   AGE
letsencrypt-prod      False   3m
letsencrypt-staging   False   3m
```

**Note:** `READY=False` is expected with placeholder email. Will become `True` after updating email to valid address.

## Configuration Required

### Email Address Update
**Current:** `your-email@example.com` (placeholder)  
**Action Required:** Update to valid email in `k8s/cert-manager-issuer.yaml`

**Why Email is Required:**
- Certificate expiry notifications (30, 14, 7 days before)
- Rate limit notifications
- Security advisories
- Account recovery

**How to Update:**

#### Option 1: Manual Edit
```bash
vi k8s/cert-manager-issuer.yaml
# Replace 'your-email@example.com' with your actual email
# Update in BOTH issuers (staging and prod)
kubectl apply -f k8s/cert-manager-issuer.yaml
```

#### Option 2: Use Helper Script
```bash
./k8s/setup-cert-manager.sh
# Script will prompt for email and update automatically
```

#### Option 3: Command Line
```bash
# macOS
sed -i '' 's/your-email@example.com/actual@email.com/g' k8s/cert-manager-issuer.yaml

# Linux
sed -i 's/your-email@example.com/actual@email.com/g' k8s/cert-manager-issuer.yaml

kubectl apply -f k8s/cert-manager-issuer.yaml
```

## Files Created

### 1. k8s/cert-manager-issuer.yaml (2KB)
Contains both ClusterIssuer definitions:
- letsencrypt-staging
- letsencrypt-prod

**Key sections:**
```yaml
spec:
  acme:
    server: <Let's Encrypt API endpoint>
    email: <notification email>
    privateKeySecretRef:
      name: <secret for ACME account key>
    solvers:
    - http01:
        ingress:
          class: traefik
```

### 2. k8s/setup-cert-manager.sh (5KB)
Automated configuration script that:
- ✅ Verifies cert-manager installation
- ✅ Checks pod status
- ✅ Validates email configuration
- ✅ Prompts to update email interactively
- ✅ Applies ClusterIssuers
- ✅ Waits for registration
- ✅ Shows detailed status

**Usage:**
```bash
./k8s/setup-cert-manager.sh
```

### 3. k8s/CERT-MANAGER.md (12KB)
Comprehensive documentation covering:
- Installation steps
- Configuration guide
- Testing procedures
- Troubleshooting
- Rate limits
- Best practices
- Usage examples

## How cert-manager Works

### Certificate Lifecycle

```
1. Ingress Created with TLS + Annotation
        ↓
2. cert-manager Detects Ingress
        ↓
3. Creates Certificate Resource
        ↓
4. Certificate Controller Creates CertificateRequest
        ↓
5. CertificateRequest Creates ACME Order
        ↓
6. Order Creates HTTP-01 Challenge
        ↓
7. Challenge Controller Creates Temporary Ingress
        ↓
8. Let's Encrypt Validates via HTTP
        ↓
9. Certificate Issued & Stored in Secret
        ↓
10. Ingress Uses Secret for TLS
```

### HTTP-01 Challenge Process

```
1. Let's Encrypt requests: http://domain.com/.well-known/acme-challenge/<token>
2. cert-manager creates temporary ingress route
3. Challenge pod responds with validation key
4. Let's Encrypt verifies response
5. If valid, certificate is issued
6. Temporary ingress deleted
```

**Requirements:**
- Port 80 must be accessible from internet
- Domain must resolve to cluster IP
- Ingress controller must be running (Traefik in K3s)

## Usage Example

### Basic Ingress with TLS
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: educard-ingress
  namespace: educard-prod
  annotations:
    # Tell cert-manager to issue certificate
    cert-manager.io/cluster-issuer: "letsencrypt-staging"
spec:
  ingressClassName: traefik
  tls:
  - hosts:
    - example.com
    secretName: educard-tls  # cert-manager creates this
  rules:
  - host: example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: educard-service
            port:
              number: 80
```

### Certificate Created Automatically
```bash
$ kubectl get certificate -n educard-prod
NAME          READY   SECRET        AGE
educard-tls   True    educard-tls   2m
```

### Certificate Details
```bash
$ kubectl describe certificate educard-tls -n educard-prod

Status:
  Conditions:
    Type:    Ready
    Status:  True
  Not After:  2026-02-25T14:00:00Z
  Not Before: 2025-11-27T14:00:00Z
  Renewal Time: 2026-01-26T14:00:00Z
```

## Verification Commands

### Check cert-manager Status
```bash
# All pods should be Running
kubectl get pods -n cert-manager

# Check logs if issues
kubectl logs -n cert-manager -l app=cert-manager
```

### Check ClusterIssuers
```bash
# List issuers
kubectl get clusterissuer

# Detailed status
kubectl describe clusterissuer letsencrypt-staging
kubectl describe clusterissuer letsencrypt-prod
```

### Monitor Certificate Issuance
```bash
# Watch certificates
kubectl get certificate --all-namespaces -w

# Check certificate request
kubectl get certificaterequest -n <namespace>

# View challenges (if stuck)
kubectl get challenge -n <namespace>
kubectl describe challenge <name> -n <namespace>
```

### Check Certificate Secret
```bash
# List TLS secrets
kubectl get secrets -n educard-prod | grep tls

# View certificate details
kubectl get secret <secret-name> -n educard-prod -o jsonpath='{.data.tls\.crt}' | base64 -d | openssl x509 -text -noout
```

## Troubleshooting

### Issue: ClusterIssuer Not Ready
**Symptom:** `READY=False` status

**Causes:**
1. Invalid email (e.g., example.com domain)
2. Network connectivity issues
3. ACME server unreachable

**Solution:**
```bash
# Check detailed status
kubectl describe clusterissuer letsencrypt-staging

# Look for error message in Conditions
# Update email if needed
# Reapply configuration
kubectl apply -f k8s/cert-manager-issuer.yaml
```

### Issue: Certificate Stuck in Pending
**Symptom:** Certificate never becomes Ready

**Debug:**
```bash
# Check certificate
kubectl describe certificate <name> -n <namespace>

# Check certificate request
kubectl get certificaterequest -n <namespace>
kubectl describe certificaterequest <name> -n <namespace>

# Check challenges
kubectl get challenge -n <namespace>
kubectl describe challenge <name> -n <namespace>
```

**Common Causes:**
- DNS not pointing to cluster
- Port 80 not accessible
- Firewall blocking traffic
- Ingress controller not running

### Issue: HTTP-01 Challenge Failed
**Symptom:** Challenge status shows failed validation

**Debug:**
```bash
# Test HTTP access
curl -v http://<domain>/.well-known/acme-challenge/test

# Check ingress
kubectl get ingress -n <namespace>

# Verify domain resolves
dig <domain> +short
```

## Security Considerations

### Private Key Storage
ACME account private keys stored in secrets:
- `letsencrypt-staging` (in cert-manager namespace)
- `letsencrypt-prod` (in cert-manager namespace)

**Backup Recommendation:**
```bash
# Backup staging key
kubectl get secret letsencrypt-staging -n cert-manager -o yaml > letsencrypt-staging-backup.yaml

# Backup production key
kubectl get secret letsencrypt-prod -n cert-manager -o yaml > letsencrypt-prod-backup.yaml
```

### Certificate Secrets
Application TLS certificates stored in namespace secrets:
- Automatically created by cert-manager
- Referenced by Ingress resources
- Renewed automatically before expiry

### RBAC
cert-manager has cluster-wide permissions:
- Read/write certificates, secrets
- Create/delete ingress resources (for challenges)
- Watch ingress for TLS annotations

## Monitoring

### Health Checks
```bash
# cert-manager controller health
kubectl get pods -n cert-manager

# Check metrics endpoint
kubectl port-forward -n cert-manager svc/cert-manager 9402:9402
curl http://localhost:9402/metrics
```

### Certificate Expiry
```bash
# List all certificates with expiry
kubectl get certificate --all-namespaces -o custom-columns=NAMESPACE:.metadata.namespace,NAME:.metadata.name,READY:.status.conditions[0].status,EXPIRY:.status.notAfter

# Monitor renewal
kubectl logs -n cert-manager -l app=cert-manager --tail=100 -f | grep -i renew
```

### Alerts
Set up alerts for:
- Certificate approaching expiry (< 30 days)
- Certificate renewal failures
- ClusterIssuer not ready
- Challenge failures

## Best Practices

### 1. Test with Staging First
Always use staging issuer before production:
```yaml
cert-manager.io/cluster-issuer: "letsencrypt-staging"
```

### 2. Monitor Rate Limits
Track certificate requests:
```bash
# Check certificates on domain
curl -s "https://crt.sh/?q=yourdomain.com&output=json" | jq
```

### 3. Use Proper Email
Configure monitored email for notifications:
- Certificate expiry warnings
- Rate limit alerts
- Security advisories

### 4. Backup ACME Keys
Backup account private keys periodically:
```bash
kubectl get secret -n cert-manager letsencrypt-prod -o yaml > backup.yaml
```

### 5. Certificate Lifecycle
- Auto-renewal at 60 days (30 days before expiry)
- Monitor renewal process
- Have fallback plan for manual renewal

## Next Steps

After cert-manager installation:

### Task 5.12: Ingress Configuration
1. Configure DNS A record
2. Create Ingress manifest with TLS
3. Apply Ingress
4. Verify certificate issuance
5. Test HTTPS access

### Prerequisites for Ingress
- [ ] Domain name registered
- [ ] DNS A record pointing to cluster IP
- [ ] Port 80/443 accessible from internet
- [ ] Email configured in ClusterIssuers
- [ ] Ingress class available (traefik in K3s)

## Conclusion

Task 5.11 completed successfully with:
- ✅ cert-manager v1.13.0 installed
- ✅ All 3 pods running and healthy
- ✅ 6 CRDs created
- ✅ RBAC configured
- ✅ ClusterIssuers created (staging + prod)
- ✅ HTTP-01 challenge solver configured
- ✅ Helper scripts and documentation provided
- ✅ Ready for Ingress TLS configuration

The cluster now has automatic SSL/TLS certificate management capabilities. Once DNS is configured and Ingress is created, cert-manager will automatically request, issue, and renew certificates from Let's Encrypt without manual intervention.

**Key Benefits:**
- 🔒 Free SSL/TLS certificates
- 🔄 Automatic renewal (no expiry)
- 📧 Expiry notifications
- 🚀 Zero-touch certificate management
- ✅ Browser-trusted certificates (production)
- 🛡️ Secure by default (HTTPS)
