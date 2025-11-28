# Ingress Configuration Guide

## Overview

This guide covers the Ingress configuration for the Educard application, including SSL/TLS certificate management via cert-manager and Let's Encrypt.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [DNS Configuration](#dns-configuration)
3. [Email Configuration](#email-configuration)
4. [Ingress Deployment](#ingress-deployment)
5. [Certificate Issuance](#certificate-issuance)
6. [Testing & Verification](#testing--verification)
7. [Troubleshooting](#troubleshooting)
8. [Security Considerations](#security-considerations)

## Prerequisites

Before deploying the Ingress:

### Required Components
- ✅ Kubernetes cluster (K3s with Traefik)
- ✅ Application deployed (Task 5.7)
- ✅ Service created (Task 5.8)
- ✅ cert-manager installed (Task 5.11)

### Required External Resources
- 🔴 **Domain name** - You must own a domain
- 🔴 **DNS access** - Ability to create A records
- 🔴 **Valid email** - For certificate notifications
- 🔴 **Port 80/443 open** - Accessible from internet

### Check Prerequisites

```bash
# Verify cert-manager is running
kubectl get pods -n cert-manager

# Check ClusterIssuers exist
kubectl get clusterissuer

# Verify application service
kubectl get svc -n educard-prod educard-service

# Check Traefik ingress controller
kubectl get pods -n kube-system -l app.kubernetes.io/name=traefik
```

## DNS Configuration

### Overview

Let's Encrypt requires valid DNS to issue certificates. You must create DNS records **before** deploying the Ingress.

### Steps

#### 1. Get Your Server IP

**Option A: From Vagrant VM**
```bash
# Get VM IP
cd /Users/tohyifan/Desktop/Educard
vagrant ssh -c "ip addr show eth1 | grep 'inet ' | awk '{print \$2}' | cut -d/ -f1"
```

**Option B: From Kubernetes**
```bash
export KUBECONFIG=/Users/tohyifan/Desktop/Educard/k8s/kubeconfig-vagrant-local
kubectl get nodes -o wide
# Look at EXTERNAL-IP or INTERNAL-IP column
```

**Option C: Public IP (if using cloud)**
```bash
# Get public IP from cloud provider
curl ifconfig.me
```

#### 2. Create DNS A Record

Go to your domain registrar or DNS provider (GoDaddy, Cloudflare, Route53, etc.) and create:

**For Root Domain:**
| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | YOUR.SERVER.IP | 3600 |

**For WWW Subdomain:**
| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | www | YOUR.SERVER.IP | 3600 |

**Alternative: Use CNAME for WWW**
| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | YOUR.SERVER.IP | 3600 |
| CNAME | www | yourdomain.com | 3600 |

#### 3. Verify DNS Propagation

```bash
# Check DNS resolution
dig yourdomain.com +short
dig www.yourdomain.com +short

# Alternative with host command
host yourdomain.com
host www.yourdomain.com

# Check from multiple locations (online tool)
# Visit: https://www.whatsmydns.net/#A/yourdomain.com
```

**Expected Output:**
```
$ dig educard.example.com +short
203.0.113.42
```

### DNS Propagation Time

- **Registrar Update:** 5-15 minutes
- **Global Propagation:** 1-48 hours (typically 2-4 hours)
- **Low TTL Values:** Faster propagation

**💡 Tip:** Set low TTL (300-600) before making changes, then increase after verification.

## Email Configuration

### Why Email is Required

Let's Encrypt requires a valid email address for:
- 📧 Certificate expiry notifications (30, 14, 7 days)
- 📧 Rate limit warnings
- 📧 Security advisories
- 📧 Account recovery

### Update Email in ClusterIssuers

#### Option 1: Use Helper Script (Recommended)
```bash
cd /Users/tohyifan/Desktop/Educard
./k8s/setup-cert-manager.sh
```

The script will:
1. Check current email configuration
2. Prompt for your email if using placeholder
3. Update both ClusterIssuers (staging + prod)
4. Apply changes and verify

#### Option 2: Manual Edit

```bash
# Edit the file
vi k8s/cert-manager-issuer.yaml

# Find and replace (do this for BOTH issuers):
email: your-email@example.com
# Change to:
email: youremail@domain.com

# Apply changes
kubectl apply -f k8s/cert-manager-issuer.yaml

# Verify
kubectl describe clusterissuer letsencrypt-prod | grep Email
```

#### Option 3: Command Line

**macOS:**
```bash
sed -i '' 's/your-email@example.com/youremail@domain.com/g' k8s/cert-manager-issuer.yaml
kubectl apply -f k8s/cert-manager-issuer.yaml
```

**Linux:**
```bash
sed -i 's/your-email@example.com/youremail@domain.com/g' k8s/cert-manager-issuer.yaml
kubectl apply -f k8s/cert-manager-issuer.yaml
```

### Verify Email Configuration

```bash
# Check ClusterIssuer email
kubectl get clusterissuer letsencrypt-prod -o jsonpath='{.spec.acme.email}'

# Check ClusterIssuer ready status
kubectl get clusterissuer

# Expected output:
# NAME                  READY   AGE
# letsencrypt-prod      True    10m
# letsencrypt-staging   True    10m
```

## Ingress Deployment

### Overview

The Ingress resource configures external access to your application with automatic SSL/TLS certificates.

### Files

- **k8s/ingress.yaml** - Ingress manifest
- **k8s/deploy-ingress.sh** - Automated deployment script

### Configuration

#### 1. Update Domain in Ingress Manifest

```bash
# Edit k8s/ingress.yaml
vi k8s/ingress.yaml

# Replace 'yourdomain.com' with your actual domain
# Update in 2 places:
#   - tls.hosts section
#   - rules section (both root and www)
```

**Example:**
```yaml
spec:
  tls:
  - hosts:
    - educard.example.com        # Replace this
    - www.educard.example.com    # And this
    secretName: educard-tls
  rules:
  - host: educard.example.com    # Replace this
    http:
      paths: ...
  - host: www.educard.example.com  # And this
    http:
      paths: ...
```

#### 2. Choose Certificate Issuer

The Ingress uses `letsencrypt-prod` by default. For testing, use staging:

```yaml
annotations:
  cert-manager.io/cluster-issuer: "letsencrypt-staging"  # For testing
  # OR
  cert-manager.io/cluster-issuer: "letsencrypt-prod"     # For production
```

**Staging vs Production:**

| Aspect | Staging | Production |
|--------|---------|------------|
| **Rate Limit** | 30,000/week | 50/week per domain |
| **Trusted** | ❌ Browser warning | ✅ Trusted |
| **Use Case** | Testing | Production |
| **Cost** | Free | Free |

**💡 Recommendation:** Start with staging, verify everything works, then switch to production.

### Deployment Methods

#### Method 1: Use Helper Script (Recommended)

```bash
cd /Users/tohyifan/Desktop/Educard
./k8s/deploy-ingress.sh
```

The script will:
1. ✅ Check prerequisites (cert-manager, ClusterIssuer)
2. ✅ Verify email configuration
3. ✅ Check DNS resolution
4. ✅ Update domain if needed
5. ✅ Deploy Ingress
6. ✅ Monitor certificate issuance
7. ✅ Show next steps

#### Method 2: Manual Deployment

```bash
# Set kubeconfig
export KUBECONFIG=/Users/tohyifan/Desktop/Educard/k8s/kubeconfig-vagrant-local

# Apply Ingress
kubectl apply -f k8s/ingress.yaml

# Verify
kubectl get ingress -n educard-prod
kubectl describe ingress educard-ingress -n educard-prod
```

### Verify Ingress Creation

```bash
# List Ingress resources
kubectl get ingress -n educard-prod

# Expected output:
# NAME               CLASS     HOSTS                              ADDRESS         PORTS     AGE
# educard-ingress    traefik   educard.example.com,www.educard... 203.0.113.42    80, 443   30s

# Detailed status
kubectl describe ingress educard-ingress -n educard-prod
```

## Certificate Issuance

### How It Works

```
1. Ingress created with cert-manager annotation
        ↓
2. cert-manager detects Ingress and TLS config
        ↓
3. Creates Certificate resource
        ↓
4. Certificate Controller creates CertificateRequest
        ↓
5. CertificateRequest creates ACME Order
        ↓
6. Order creates HTTP-01 Challenge
        ↓
7. Challenge Controller creates temporary Ingress for /.well-known/acme-challenge/
        ↓
8. Let's Encrypt makes HTTP request to verify domain ownership
        ↓
9. If valid, certificate is issued
        ↓
10. Certificate stored in Secret (educard-tls)
        ↓
11. Ingress uses Secret for TLS termination
        ↓
12. Application accessible via HTTPS
```

### Timeline

- **Certificate Resource:** Created immediately (< 5 seconds)
- **ACME Challenge:** 10-30 seconds
- **Domain Validation:** 30-60 seconds
- **Certificate Issuance:** 1-2 minutes
- **Total Time:** 1-5 minutes typically

### Monitor Certificate Issuance

#### Watch Certificate Status
```bash
# Watch certificate (updates in real-time)
kubectl get certificate -n educard-prod -w

# Expected progression:
# NAME          READY   SECRET        AGE
# educard-tls   False   educard-tls   10s
# educard-tls   False   educard-tls   45s
# educard-tls   True    educard-tls   2m
```

#### Check Certificate Details
```bash
# Get certificate status
kubectl get certificate -n educard-prod educard-tls

# Detailed information
kubectl describe certificate -n educard-prod educard-tls

# Look for:
#   Status.Conditions.Type: Ready
#   Status.Conditions.Status: True
#   Events: Certificate issued successfully
```

#### Check CertificateRequest
```bash
# List certificate requests
kubectl get certificaterequest -n educard-prod

# Describe specific request
kubectl describe certificaterequest -n educard-prod <name>
```

#### Check ACME Challenges
```bash
# List challenges (only present during validation)
kubectl get challenge -n educard-prod

# If stuck, describe the challenge
kubectl describe challenge -n educard-prod <name>

# Check challenge logs
kubectl logs -n cert-manager -l app=cert-manager | grep -i challenge
```

#### View cert-manager Logs
```bash
# Follow cert-manager logs
kubectl logs -n cert-manager -l app=cert-manager -f

# Filter for specific domain
kubectl logs -n cert-manager -l app=cert-manager | grep yourdomain.com

# Check for errors
kubectl logs -n cert-manager -l app=cert-manager | grep -i error
```

### Certificate Secret

Once issued, the certificate is stored in a Kubernetes Secret:

```bash
# View certificate secret
kubectl get secret -n educard-prod educard-tls

# Check certificate details
kubectl get secret educard-tls -n educard-prod -o jsonpath='{.data.tls\.crt}' | base64 -d | openssl x509 -text -noout

# Check expiry date
kubectl get secret educard-tls -n educard-prod -o jsonpath='{.data.tls\.crt}' | base64 -d | openssl x509 -noout -enddate

# Verify certificate chain
kubectl get secret educard-tls -n educard-prod -o jsonpath='{.data.tls\.crt}' | base64 -d | openssl x509 -noout -issuer -subject
```

## Testing & Verification

### 1. Test HTTP Redirect

HTTP requests should automatically redirect to HTTPS:

```bash
# Test HTTP (should return 301/302 redirect)
curl -I http://yourdomain.com

# Expected output:
# HTTP/1.1 308 Permanent Redirect
# Location: https://yourdomain.com/
```

### 2. Test HTTPS Access

```bash
# Test HTTPS (should return 200)
curl -I https://yourdomain.com

# Expected output:
# HTTP/2 200
# content-type: text/html; charset=utf-8
```

### 3. Test Application Health

```bash
# Check health endpoint
curl https://yourdomain.com/health

# Expected output:
# {"status":"OK","timestamp":"2025-11-28T..."}
```

### 4. Test Certificate Validity

```bash
# Check SSL certificate with OpenSSL
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com < /dev/null 2>/dev/null | openssl x509 -noout -text

# Or just check issuer and expiry
echo | openssl s_client -connect yourdomain.com:443 -servername yourdomain.com 2>/dev/null | openssl x509 -noout -issuer -dates

# Expected issuer (production):
# issuer=C = US, O = Let's Encrypt, CN = R3

# Expected issuer (staging):
# issuer=C = US, O = (STAGING) Let's Encrypt, CN = (STAGING) Ersatz Edamame E1
```

### 5. Test WWW Subdomain

```bash
# Test www subdomain
curl -I https://www.yourdomain.com

# Should work the same as root domain
```

### 6. Browser Testing

Open in browser:
- https://yourdomain.com
- https://www.yourdomain.com
- http://yourdomain.com (should redirect to HTTPS)

**Check Certificate:**
1. Click lock icon in address bar
2. View certificate details
3. Verify:
   - ✅ Issued by: Let's Encrypt (or STAGING Let's Encrypt)
   - ✅ Valid dates
   - ✅ Domain matches
   - ✅ Green padlock (production only)

### 7. Security Headers

Test security headers:

```bash
curl -I https://yourdomain.com | grep -E "X-Frame-Options|X-Content-Type-Options|X-XSS-Protection|Strict-Transport-Security"
```

### 8. SSL Labs Test

For production, run a comprehensive SSL test:
1. Visit: https://www.ssllabs.com/ssltest/
2. Enter your domain
3. Wait for analysis
4. Aim for A+ rating

## Troubleshooting

### Issue 1: DNS Not Resolving

**Symptoms:**
- `dig yourdomain.com` returns nothing
- Certificate challenge fails

**Debug:**
```bash
# Test DNS
dig yourdomain.com +short
nslookup yourdomain.com

# Check from multiple DNS servers
dig @8.8.8.8 yourdomain.com +short  # Google DNS
dig @1.1.1.1 yourdomain.com +short  # Cloudflare DNS
```

**Solutions:**
- Verify A record created correctly
- Wait for DNS propagation (up to 48 hours)
- Check with DNS provider
- Use online DNS checker: https://www.whatsmydns.net/

### Issue 2: ClusterIssuer Not Ready

**Symptoms:**
- `kubectl get clusterissuer` shows READY=False
- Certificate not being issued

**Debug:**
```bash
# Check ClusterIssuer status
kubectl describe clusterissuer letsencrypt-prod

# Look for error in Conditions section
```

**Common Causes:**
1. **Invalid email** (example.com domain)
   - Solution: Update email in k8s/cert-manager-issuer.yaml
   
2. **Network connectivity**
   - Solution: Check cluster has internet access
   
3. **ACME server unreachable**
   - Solution: Verify firewall rules

### Issue 3: Certificate Stuck in Pending

**Symptoms:**
- Certificate READY stays False for > 5 minutes
- No certificate issued

**Debug:**
```bash
# Check certificate
kubectl describe certificate educard-tls -n educard-prod

# Check certificate request
kubectl get certificaterequest -n educard-prod
kubectl describe certificaterequest <name> -n educard-prod

# Check challenges
kubectl get challenge -n educard-prod
kubectl describe challenge <name> -n educard-prod

# Check cert-manager logs
kubectl logs -n cert-manager -l app=cert-manager --tail=100
```

**Common Causes:**

1. **DNS not pointing to cluster**
   - Solution: Verify DNS with `dig yourdomain.com`
   
2. **Port 80 not accessible**
   - Solution: Check firewall, security groups
   - Test: `curl http://yourdomain.com/.well-known/acme-challenge/test`
   
3. **Ingress controller not running**
   - Solution: Check Traefik pods
   - `kubectl get pods -n kube-system -l app.kubernetes.io/name=traefik`
   
4. **Rate limit hit**
   - Solution: Wait 1 week or use staging issuer
   - Check: https://crt.sh/?q=yourdomain.com

### Issue 4: HTTP-01 Challenge Failed

**Symptoms:**
- Challenge stays in "pending" or "invalid"
- Error: "Connection refused" or "404 Not Found"

**Debug:**
```bash
# Check challenge
kubectl describe challenge <name> -n educard-prod

# Look for "Presented" status
# If false, check:

# 1. Test HTTP access manually
curl http://yourdomain.com/.well-known/acme-challenge/test

# 2. Check temporary challenge ingress
kubectl get ingress -n educard-prod

# 3. Check Traefik logs
kubectl logs -n kube-system -l app.kubernetes.io/name=traefik
```

**Solutions:**
- Ensure port 80 is open and accessible
- Verify no conflicting Ingress rules
- Check firewall/security groups
- Verify DNS resolves correctly
- Wait for DNS propagation

### Issue 5: Certificate Invalid in Browser

**Symptoms:**
- Browser shows security warning
- Certificate not trusted

**Possible Causes:**

1. **Using staging issuer**
   - Expected behavior for letsencrypt-staging
   - Solution: Switch to letsencrypt-prod
   
2. **Old certificate cached**
   - Solution: Clear browser cache, restart browser
   
3. **Certificate not yet issued**
   - Solution: Wait 1-5 minutes, refresh page

**Verify Certificate:**
```bash
# Check which issuer was used
kubectl get certificate educard-tls -n educard-prod -o jsonpath='{.spec.issuerRef.name}'

# Should be: letsencrypt-prod (not staging)
```

### Issue 6: 502 Bad Gateway

**Symptoms:**
- Ingress accessible but returns 502
- HTTPS works but application doesn't load

**Debug:**
```bash
# Check backend service
kubectl get svc -n educard-prod educard-service

# Check endpoints
kubectl get endpoints -n educard-prod educard-service

# Check application pods
kubectl get pods -n educard-prod -l app=educard

# Test service directly
kubectl port-forward -n educard-prod svc/educard-service 8080:80
curl http://localhost:8080/health
```

**Solutions:**
- Verify service selector matches pod labels
- Check application pods are Running
- Verify service port (should be 80)
- Check application logs

### Issue 7: Rate Limit Exceeded

**Symptoms:**
- Error: "too many certificates already issued"
- Certificate issuance fails

**Check Rate Limits:**
```bash
# Check certificates issued for domain
curl -s "https://crt.sh/?q=yourdomain.com&output=json" | jq '. | length'
```

**Limits:**
- Production: 50 certificates per registered domain per week
- Staging: 30,000 per week (effectively unlimited)

**Solutions:**
- Use staging issuer for testing
- Wait 1 week for rate limit reset
- Check for duplicate issuances

## Security Considerations

### 1. Certificate Storage

Certificates are stored in Kubernetes Secrets:
- Secret name: `educard-tls`
- Namespace: `educard-prod`
- Contains: `tls.crt` (certificate) and `tls.key` (private key)

**Backup Certificate:**
```bash
kubectl get secret educard-tls -n educard-prod -o yaml > educard-tls-backup.yaml
```

### 2. ACME Account Keys

Let's Encrypt account private keys stored in:
- `letsencrypt-staging` (cert-manager namespace)
- `letsencrypt-prod` (cert-manager namespace)

**Backup Account Keys:**
```bash
kubectl get secret letsencrypt-prod -n cert-manager -o yaml > letsencrypt-prod-backup.yaml
```

### 3. HTTPS Redirect

The Ingress forces HTTPS redirect:
```yaml
annotations:
  traefik.ingress.kubernetes.io/redirect-entry-point: https
  traefik.ingress.kubernetes.io/redirect-permanent: "true"
```

**Test:**
```bash
curl -I http://yourdomain.com
# Should return 308 Permanent Redirect
```

### 4. Security Headers

Add custom security headers (optional):
```yaml
annotations:
  traefik.ingress.kubernetes.io/custom-response-headers: |
    X-Frame-Options:DENY||
    X-Content-Type-Options:nosniff||
    X-XSS-Protection:1; mode=block||
    Strict-Transport-Security:max-age=31536000; includeSubDomains
```

### 5. Certificate Renewal

cert-manager automatically renews certificates:
- **Renewal Trigger:** 30 days before expiry (60 days into 90-day lifetime)
- **Process:** Automatic, no manual intervention
- **Monitoring:** Check cert-manager logs

**Check Renewal Status:**
```bash
# View certificate renewal time
kubectl get certificate educard-tls -n educard-prod -o jsonpath='{.status.renewalTime}'

# Check expiry date
kubectl get secret educard-tls -n educard-prod -o jsonpath='{.data.tls\.crt}' | base64 -d | openssl x509 -noout -enddate
```

### 6. Network Security

**Required Ports:**
- Port 80 (HTTP): Required for Let's Encrypt HTTP-01 challenge
- Port 443 (HTTPS): Application access

**Firewall Rules:**
```bash
# Allow HTTP (required for cert challenges)
sudo ufw allow 80/tcp

# Allow HTTPS (application access)
sudo ufw allow 443/tcp
```

## Advanced Configuration

### Custom Domain Validation

Use DNS-01 challenge instead of HTTP-01 (for wildcard certs or when port 80 unavailable):

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-dns
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: youremail@domain.com
    privateKeySecretRef:
      name: letsencrypt-dns
    solvers:
    - dns01:
        cloudflare:  # or other DNS provider
          apiTokenSecretRef:
            name: cloudflare-api-token
            key: api-token
```

### Wildcard Certificates

```yaml
spec:
  tls:
  - hosts:
    - "*.yourdomain.com"
    - yourdomain.com
    secretName: wildcard-tls
```

Note: Wildcard certificates require DNS-01 challenge.

### Multiple Domains

```yaml
spec:
  tls:
  - hosts:
    - domain1.com
    - www.domain1.com
    secretName: domain1-tls
  - hosts:
    - domain2.com
    - www.domain2.com
    secretName: domain2-tls
  rules:
  - host: domain1.com
    # ...
  - host: domain2.com
    # ...
```

## Maintenance

### Update Domain

```bash
# 1. Update DNS A record
# 2. Update k8s/ingress.yaml
# 3. Delete old certificate
kubectl delete certificate educard-tls -n educard-prod
# 4. Reapply Ingress
kubectl apply -f k8s/ingress.yaml
# 5. Wait for new certificate
kubectl get certificate -n educard-prod -w
```

### Switch Issuer (Staging to Production)

```bash
# 1. Edit ingress
kubectl edit ingress educard-ingress -n educard-prod
# Change: cert-manager.io/cluster-issuer: "letsencrypt-prod"

# 2. Delete staging certificate and secret
kubectl delete certificate educard-tls -n educard-prod
kubectl delete secret educard-tls -n educard-prod

# 3. Wait for new production certificate
kubectl get certificate -n educard-prod -w
```

### Manual Certificate Renewal

```bash
# Force renewal (not normally needed)
kubectl delete certificate educard-tls -n educard-prod

# Reapply will trigger new issuance
kubectl apply -f k8s/ingress.yaml
```

## Monitoring

### Certificate Expiry

```bash
# Check all certificates
kubectl get certificate -n educard-prod

# Check expiry dates
kubectl get certificate -n educard-prod -o custom-columns=NAME:.metadata.name,READY:.status.conditions[0].status,EXPIRY:.status.notAfter
```

### Set Up Alerts

Monitor for:
- Certificate approaching expiry (< 30 days)
- Certificate renewal failures
- Challenge failures
- Ingress errors

### Logs to Monitor

```bash
# cert-manager
kubectl logs -n cert-manager -l app=cert-manager -f

# Traefik (Ingress Controller)
kubectl logs -n kube-system -l app.kubernetes.io/name=traefik -f

# Application
kubectl logs -n educard-prod -l app=educard -f
```

## Summary

✅ **Ingress Configuration Checklist:**

- [ ] DNS A record created and propagated
- [ ] Email configured in ClusterIssuers
- [ ] ClusterIssuers showing READY=True
- [ ] Domain updated in k8s/ingress.yaml
- [ ] Ingress deployed successfully
- [ ] Certificate issued (READY=True)
- [ ] HTTPS accessible in browser
- [ ] HTTP redirects to HTTPS
- [ ] Certificate trusted (green padlock)
- [ ] Application accessible via domain

## Next Steps

After Ingress is configured:
1. Set up database backups (Task 5.13)
2. Configure monitoring and alerting
3. Set up log aggregation
4. Implement rate limiting
5. Add WAF (Web Application Firewall)

## Resources

- [cert-manager Documentation](https://cert-manager.io/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Traefik Ingress](https://doc.traefik.io/traefik/providers/kubernetes-ingress/)
- [Kubernetes Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/)
- [SSL Labs Test](https://www.ssllabs.com/ssltest/)
