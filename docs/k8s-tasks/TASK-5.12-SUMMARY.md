# Task 5.12 - Ingress Configuration Summary

**Completion Date:** November 28, 2025  
**Status:** ✅ Ready for Deployment  

## Overview

Task 5.12 creates the Ingress resource to expose the Educard application externally with automatic SSL/TLS certificate management via cert-manager and Let's Encrypt. This enables secure HTTPS access to the application using a custom domain.

## Prerequisites Completed

✅ **Infrastructure:**
- Kubernetes cluster (K3s) running
- Traefik Ingress Controller (built into K3s)
- Application deployed (2 replicas)
- Service configured (educard-service)
- cert-manager installed (v1.13.0)

🔴 **User Action Required:**
- Domain name ownership
- DNS configuration (A record)
- Valid email in ClusterIssuers

## Files Created

### 1. k8s/ingress.yaml
**Purpose:** Ingress manifest for external access with TLS

**Configuration:**
- **Resource:** Ingress (networking.k8s.io/v1)
- **Name:** educard-ingress
- **Namespace:** educard-prod
- **Ingress Class:** traefik (K3s default)
- **TLS Secret:** educard-tls (auto-created by cert-manager)

**Features:**
- 🔒 Automatic SSL/TLS certificates from Let's Encrypt
- 🔄 HTTP to HTTPS redirect (permanent 308)
- 🌐 Support for both root domain and www subdomain
- ✅ cert-manager integration via annotations

**Annotations:**
```yaml
cert-manager.io/cluster-issuer: "letsencrypt-prod"
traefik.ingress.kubernetes.io/redirect-entry-point: https
traefik.ingress.kubernetes.io/redirect-permanent: "true"
```

**Routing:**
- Root domain (yourdomain.com) → educard-service:80
- WWW subdomain (www.yourdomain.com) → educard-service:80
- Backend: educard-service (ClusterIP)
- Port mapping: 80 → 3000 (application)

**Security:**
- Enforces HTTPS for all traffic
- Automatic certificate renewal (90-day certs, renewed at 60 days)
- Let's Encrypt trusted certificates (browser-trusted)

**Note:** Replace `yourdomain.com` with actual domain before deployment.

### 2. k8s/deploy-ingress.sh
**Purpose:** Interactive deployment script with validation

**Capabilities:**
- ✅ Prerequisite checks (kubectl, cert-manager, ClusterIssuer)
- ✅ Email validation in ClusterIssuers
- ✅ DNS resolution checking
- ✅ Domain configuration prompts
- ✅ Automated Ingress deployment
- ✅ Certificate issuance monitoring
- ✅ Comprehensive status reporting

**Workflow:**
1. Check prerequisites (cert-manager, ClusterIssuer)
2. Verify email configuration (not placeholder)
3. Extract domain from ingress.yaml
4. Check DNS resolution (if dig available)
5. Deploy Ingress to cluster
6. Monitor certificate creation
7. Display verification commands

**Usage:**
```bash
cd /Users/tohyifan/Desktop/Educard
./k8s/deploy-ingress.sh
```

**Permissions:** Executable (`chmod +x`)

### 3. k8s/INGRESS.md (14KB)
**Purpose:** Comprehensive configuration and troubleshooting guide

**Sections:**
1. **Prerequisites** - Required components and resources
2. **DNS Configuration** - A record setup, propagation, verification
3. **Email Configuration** - ClusterIssuer email update methods
4. **Ingress Deployment** - Deployment methods and verification
5. **Certificate Issuance** - Timeline, monitoring, troubleshooting
6. **Testing & Verification** - HTTP redirect, HTTPS, health checks
7. **Troubleshooting** - Common issues and solutions
8. **Security Considerations** - Certificate storage, renewal, headers
9. **Advanced Configuration** - DNS-01, wildcards, multiple domains
10. **Maintenance** - Updates, issuer switching, manual renewal

**Key Topics:**
- DNS propagation (1-48 hours)
- Certificate issuance process (1-5 minutes)
- HTTP-01 challenge requirements (port 80)
- Rate limits (50 certs/week production, 30k/week staging)
- Troubleshooting certificate issues
- Security best practices

## Architecture

### Request Flow

```
Internet Traffic
      ↓
   Port 443 (HTTPS)
      ↓
Traefik Ingress Controller (K3s)
      ↓
  Ingress: educard-ingress
  - TLS termination (educard-tls secret)
  - Routing rules
      ↓
Service: educard-service (ClusterIP)
  - Port 80
  - Session affinity (ClientIP)
  - Load balancing (2 endpoints)
      ↓
Pods: educard-app (2 replicas)
  - Container port 3000
  - Health checks
  - Application logic
```

### Certificate Management

```
Ingress with cert-manager annotation
      ↓
cert-manager Controller detects Ingress
      ↓
Creates Certificate resource
      ↓
Certificate Controller creates CertificateRequest
      ↓
ACME Order created with Let's Encrypt
      ↓
HTTP-01 Challenge issued
      ↓
Temporary Ingress for /.well-known/acme-challenge/
      ↓
Let's Encrypt validates domain (HTTP request)
      ↓
Certificate issued (valid 90 days)
      ↓
Stored in Secret: educard-tls
      ↓
Ingress uses Secret for TLS termination
      ↓
Auto-renewal at 60 days (30 days before expiry)
```

## Deployment Steps

### Prerequisites

#### 1. Configure Email in ClusterIssuers
```bash
# Option A: Use helper script
./k8s/setup-cert-manager.sh

# Option B: Manual edit
vi k8s/cert-manager-issuer.yaml
# Replace: your-email@example.com
kubectl apply -f k8s/cert-manager-issuer.yaml

# Verify
kubectl get clusterissuer
# Both should show READY=True
```

#### 2. Configure DNS
```bash
# Get server IP
kubectl get nodes -o wide

# Create A record at DNS provider:
# Type: A
# Name: @ (for root) or yourdomain.com
# Value: <server-ip>
# TTL: 3600

# Also create www subdomain:
# Type: A
# Name: www
# Value: <server-ip>

# Verify DNS propagation
dig yourdomain.com +short
dig www.yourdomain.com +short
```

#### 3. Update Domain in Ingress
```bash
# Edit k8s/ingress.yaml
vi k8s/ingress.yaml

# Replace ALL occurrences of 'yourdomain.com' with actual domain
# Should be in 4 places:
#   1. tls.hosts[0]
#   2. tls.hosts[1] (www)
#   3. rules[0].host
#   4. rules[1].host (www)
```

### Deployment

#### Method 1: Automated (Recommended)
```bash
cd /Users/tohyifan/Desktop/Educard
./k8s/deploy-ingress.sh
```

The script handles:
- All prerequisite checks
- Domain configuration
- Deployment
- Monitoring

#### Method 2: Manual
```bash
# Set kubeconfig
export KUBECONFIG=/Users/tohyifan/Desktop/Educard/k8s/kubeconfig-vagrant-local

# Deploy Ingress
kubectl apply -f k8s/ingress.yaml

# Verify
kubectl get ingress -n educard-prod
kubectl describe ingress educard-ingress -n educard-prod
```

## Validation Commands

### 1. Verify Ingress Created
```bash
kubectl get ingress -n educard-prod

# Expected:
# NAME               CLASS     HOSTS                      ADDRESS         PORTS     AGE
# educard-ingress    traefik   yourdomain.com,www.you...  203.0.113.42    80, 443   30s
```

### 2. Check Certificate Status
```bash
# Watch certificate creation
kubectl get certificate -n educard-prod -w

# Check details
kubectl describe certificate educard-tls -n educard-prod

# Verify secret created
kubectl get secret educard-tls -n educard-prod
```

### 3. Monitor Certificate Issuance
```bash
# Watch progress
kubectl get certificate -n educard-prod educard-tls -w

# Check certificate request
kubectl get certificaterequest -n educard-prod

# View challenges (during validation)
kubectl get challenge -n educard-prod

# Check cert-manager logs
kubectl logs -n cert-manager -l app=cert-manager -f
```

### 4. Test HTTP Redirect
```bash
# Should return 308 redirect to HTTPS
curl -I http://yourdomain.com

# Expected:
# HTTP/1.1 308 Permanent Redirect
# Location: https://yourdomain.com/
```

### 5. Test HTTPS Access
```bash
# Should return 200
curl -I https://yourdomain.com

# Expected:
# HTTP/2 200
```

### 6. Test Application
```bash
# Health check
curl https://yourdomain.com/health

# Expected:
# {"status":"OK","timestamp":"..."}

# Full page
curl https://yourdomain.com
```

### 7. Verify Certificate
```bash
# Check certificate details
echo | openssl s_client -connect yourdomain.com:443 -servername yourdomain.com 2>/dev/null | openssl x509 -noout -text

# Check issuer and dates
echo | openssl s_client -connect yourdomain.com:443 -servername yourdomain.com 2>/dev/null | openssl x509 -noout -issuer -dates

# Expected issuer (production):
# issuer=C = US, O = Let's Encrypt, CN = R3

# Expected issuer (staging):
# issuer=C = US, O = (STAGING) Let's Encrypt, CN = (STAGING) Ersatz Edamame E1
```

### 8. Browser Testing
Open in browser:
- https://yourdomain.com
- https://www.yourdomain.com
- http://yourdomain.com (should redirect)

Check for:
- ✅ Green padlock (production) or warning (staging)
- ✅ Certificate details show Let's Encrypt
- ✅ Application loads correctly

## Certificate Timeline

| Time | Event |
|------|-------|
| 0s | Ingress applied |
| 1-5s | Certificate resource created |
| 5-15s | CertificateRequest created |
| 15-30s | ACME Order and Challenge created |
| 30-60s | HTTP-01 validation |
| 60-120s | Certificate issued |
| 120-180s | Secret populated, Ingress TLS active |

**Typical Total Time:** 2-3 minutes

## Troubleshooting Guide

### Issue: Certificate Not Created

**Symptoms:**
- No certificate resource after 1 minute
- Ingress deployed but no TLS

**Debug:**
```bash
# Check Ingress annotations
kubectl describe ingress educard-ingress -n educard-prod | grep -A 5 Annotations

# Verify cert-manager running
kubectl get pods -n cert-manager

# Check cert-manager logs
kubectl logs -n cert-manager -l app=cert-manager --tail=50
```

**Solutions:**
- Verify cert-manager.io/cluster-issuer annotation present
- Check ClusterIssuer exists and is ready
- Restart cert-manager pods if needed

### Issue: Certificate Stuck Pending

**Symptoms:**
- Certificate shows READY=False for > 5 minutes
- Challenge failing

**Debug:**
```bash
# Check certificate
kubectl describe certificate educard-tls -n educard-prod

# Check challenges
kubectl get challenge -n educard-prod
kubectl describe challenge <name> -n educard-prod

# Check DNS
dig yourdomain.com +short

# Test HTTP access
curl http://yourdomain.com/.well-known/acme-challenge/test
```

**Common Causes:**
1. **DNS not resolving** - Wait for propagation
2. **Port 80 blocked** - Check firewall
3. **Challenge validation failing** - Check Traefik logs
4. **Rate limit** - Use staging issuer

### Issue: ClusterIssuer Not Ready

**Symptoms:**
- kubectl get clusterissuer shows READY=False
- Email error in description

**Debug:**
```bash
kubectl describe clusterissuer letsencrypt-prod
```

**Solutions:**
- Update email (not example.com)
- Run: ./k8s/setup-cert-manager.sh
- Reapply: kubectl apply -f k8s/cert-manager-issuer.yaml

### Issue: 502 Bad Gateway

**Symptoms:**
- HTTPS works but application doesn't load
- Browser shows 502 error

**Debug:**
```bash
# Check backend service
kubectl get svc -n educard-prod educard-service
kubectl get endpoints -n educard-prod educard-service

# Check application pods
kubectl get pods -n educard-prod -l app=educard

# Test service directly
kubectl port-forward -n educard-prod svc/educard-service 8080:80
curl http://localhost:8080/health
```

**Solutions:**
- Verify application pods running
- Check service endpoints exist
- Test application directly

## Security Features

### 1. HTTPS Enforcement
- All HTTP traffic redirected to HTTPS (308 Permanent)
- TLS 1.2+ only
- Strong cipher suites

### 2. Certificate Management
- Automatic issuance and renewal
- 90-day certificates, renewed at 60 days
- Zero downtime renewals
- Let's Encrypt trusted by all browsers

### 3. Certificate Storage
- Private keys stored in Kubernetes Secrets
- Secrets encrypted at rest (if enabled)
- RBAC controls access

### 4. Best Practices
- Use production issuer for public sites
- Test with staging issuer first
- Monitor certificate expiry
- Backup certificate secrets
- Enable security headers

## Rate Limits

### Let's Encrypt Production
- **50 certificates per registered domain per week**
- 5 duplicate certificates per week
- 300 new orders per account per 3 hours

**Check issuances:**
```bash
curl -s "https://crt.sh/?q=yourdomain.com&output=json" | jq '. | length'
```

### Let's Encrypt Staging
- **30,000 certificates per week** (effectively unlimited)
- Use for testing, development, CI/CD

## Maintenance

### Update Domain
```bash
# 1. Update DNS A record
# 2. Edit k8s/ingress.yaml
# 3. Delete old certificate
kubectl delete certificate educard-tls -n educard-prod
# 4. Reapply
kubectl apply -f k8s/ingress.yaml
```

### Switch to Production Issuer
```bash
# 1. Edit Ingress
kubectl edit ingress educard-ingress -n educard-prod
# Change annotation: letsencrypt-prod

# 2. Delete staging cert
kubectl delete certificate educard-tls -n educard-prod
kubectl delete secret educard-tls -n educard-prod

# 3. Wait for production cert
kubectl get certificate -n educard-prod -w
```

### Force Certificate Renewal
```bash
# Delete certificate (will be recreated)
kubectl delete certificate educard-tls -n educard-prod

# Or delete secret
kubectl delete secret educard-tls -n educard-prod

# Wait for recreation
kubectl get certificate -n educard-prod -w
```

## Next Steps

After Ingress configuration:

### Immediate
1. ✅ Verify HTTPS access in browser
2. ✅ Test HTTP to HTTPS redirect
3. ✅ Confirm certificate validity
4. ✅ Check application functionality

### Short Term
1. Set up database backups (Task 5.13)
2. Configure monitoring (Prometheus/Grafana)
3. Set up log aggregation (ELK/Loki)
4. Implement rate limiting

### Long Term
1. Add WAF (Web Application Firewall)
2. Set up DDoS protection
3. Implement CDN (CloudFlare, CloudFront)
4. Add alerting for certificate expiry

## Summary

Task 5.12 provides complete Ingress configuration for the Educard application with:

✅ **Created Files:**
- k8s/ingress.yaml - Ingress manifest with TLS
- k8s/deploy-ingress.sh - Automated deployment script
- k8s/INGRESS.md - Comprehensive documentation

✅ **Features:**
- Automatic SSL/TLS certificates (Let's Encrypt)
- HTTP to HTTPS redirect
- Support for root and www domains
- Certificate auto-renewal
- Browser-trusted certificates

✅ **Security:**
- HTTPS enforcement
- Strong TLS configuration
- Automatic certificate management
- Private key protection

🔴 **User Action Required:**
1. Configure valid email in ClusterIssuers
2. Create DNS A record pointing to server
3. Update domain in k8s/ingress.yaml
4. Run deployment script or manual commands

📚 **Documentation:**
- Detailed setup instructions
- Troubleshooting guide
- Security best practices
- Maintenance procedures

The Ingress configuration is ready for deployment once DNS and email prerequisites are met. Follow the deployment steps in k8s/INGRESS.md for a successful setup.
