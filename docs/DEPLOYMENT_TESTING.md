# Kubernetes Deployment Testing Guide

## Overview

This guide provides comprehensive testing procedures for the Educard application deployed on K3s. It covers automated infrastructure tests, manual feature testing, resilience testing, and validation procedures.

## Table of Contents

1. [Pre-Testing Setup](#pre-testing-setup)
2. [Automated Infrastructure Tests](#automated-infrastructure-tests)
3. [Manual Feature Testing](#manual-feature-testing)
4. [Pod Resilience Testing](#pod-resilience-testing)
5. [Database Persistence Testing](#database-persistence-testing)
6. [Rolling Update Testing](#rolling-update-testing)
7. [Performance Testing](#performance-testing)
8. [Security Testing](#security-testing)
9. [Test Results Template](#test-results-template)
10. [Troubleshooting](#troubleshooting)

## Pre-Testing Setup

### Requirements

- K3s cluster running
- Application deployed (educard-app)
- Database deployed (PostgreSQL)
- Services configured
- Ingress ready (optional for external testing)
- kubectl configured with correct context

### Environment Check

```bash
# Set kubeconfig
export KUBECONFIG=/Users/tohyifan/Desktop/Educard/k8s/kubeconfig-vagrant-local

# Check cluster
kubectl cluster-info

# Check namespace
kubectl get all -n educard-prod

# Check pod status
kubectl get pods -n educard-prod

# Quick health check
./k8s/check-metrics.sh
```

### Expected Starting State

```
✅ All pods running and ready
✅ Services have endpoints
✅ PVCs bound
✅ No warning events
✅ Node healthy (low CPU/memory usage)
```

## Automated Infrastructure Tests

### Run Automated Test Suite

```bash
# Execute test script
./k8s/test-deployment.sh

# Or run individual tests
./k8s/test-deployment.sh --health-only
./k8s/test-deployment.sh --resilience-only
```

### Test Categories

1. **Health Checks**
   - Cluster connectivity
   - Pod status (running, ready)
   - Service endpoints
   - Storage (PVCs)
   - Recent events

2. **Service Connectivity**
   - Application service reachable
   - Database service reachable
   - Port forwarding test
   - Health endpoint test

3. **Pod Resilience**
   - Pod deletion and auto-recovery
   - Deployment replica management
   - StatefulSet recovery

4. **Database Persistence**
   - Create test data
   - Delete database pod
   - Verify data survives restart

5. **Resource Usage**
   - CPU usage reasonable
   - Memory usage reasonable
   - Disk usage acceptable

## Manual Feature Testing

### Access Application

**Option 1: Port Forward (Local Testing)**
```bash
# Forward application port
kubectl port-forward -n educard-prod svc/educard-service 8080:80

# Access at: http://localhost:8080
```

**Option 2: Ingress (If Configured)**
```bash
# Access at: https://yourdomain.com
```

### Feature Testing Checklist

#### 1. Homepage & Navigation ✓

- [ ] Homepage loads without errors
- [ ] Navigation menu displays correctly
- [ ] Links work (About, Features, etc.)
- [ ] Footer displays correctly
- [ ] Responsive on mobile devices
- [ ] No console errors in browser

**Test:**
```bash
# Port forward if needed
kubectl port-forward -n educard-prod svc/educard-service 8080:80

# Open browser to http://localhost:8080
```

**Expected Result:**
- Homepage loads in < 2 seconds
- All assets load (CSS, JS, images)
- No 404 errors
- Clean console (no JavaScript errors)

#### 2. User Registration ✓

- [ ] Registration form displays
- [ ] Can submit registration with valid data
- [ ] Email validation works
- [ ] Password requirements enforced
- [ ] Username uniqueness checked
- [ ] Success message/redirect after registration
- [ ] User created in database

**Test Steps:**
1. Navigate to registration page
2. Fill out form:
   - Username: `testuser_[timestamp]`
   - Email: `test_[timestamp]@example.com`
   - Password: `SecurePass123!`
3. Submit form
4. Verify success message
5. Verify redirect to login/dashboard

**Validation:**
```bash
# Check database
kubectl exec -it -n educard-prod postgres-0 -- psql -U educard_user -d educard_prod -c "SELECT username, email, created_at FROM users WHERE username LIKE 'testuser_%' ORDER BY created_at DESC LIMIT 5;"
```

#### 3. User Login ✓

- [ ] Login form displays
- [ ] Can login with valid credentials
- [ ] Invalid credentials rejected
- [ ] Session created after login
- [ ] Redirect to dashboard/home
- [ ] User menu displays username
- [ ] Logout works

**Test Steps:**
1. Navigate to login page
2. Enter credentials (from registration)
3. Submit form
4. Verify successful login
5. Check user menu shows username
6. Click logout
7. Verify session cleared

#### 4. Thread Creation ✓

- [ ] Create thread form accessible
- [ ] Can enter thread title
- [ ] Can enter thread content
- [ ] Can submit new thread
- [ ] Thread appears in list
- [ ] Thread saved to database
- [ ] Can view created thread

**Test Steps:**
1. Login if not already
2. Navigate to "Create Thread" or similar
3. Enter thread details:
   - Title: `Test Thread [timestamp]`
   - Content: `This is a test thread for deployment validation.`
4. Submit form
5. Verify thread appears in list
6. Click thread to view details

**Validation:**
```bash
# Check database
kubectl exec -it -n educard-prod postgres-0 -- psql -U educard_user -d educard_prod -c "SELECT id, title, created_at, user_id FROM threads WHERE title LIKE 'Test Thread%' ORDER BY created_at DESC LIMIT 5;"
```

#### 5. Post/Reply Creation ✓

- [ ] Reply form displays in thread
- [ ] Can enter reply content
- [ ] Can submit reply
- [ ] Reply appears in thread
- [ ] Reply saved to database
- [ ] Reply count updates

**Test Steps:**
1. Open an existing thread
2. Find reply/post form
3. Enter content: `Test reply [timestamp]`
4. Submit form
5. Verify reply appears
6. Check reply count incremented

**Validation:**
```bash
# Check database
kubectl exec -it -n educard-prod postgres-0 -- psql -U educard_user -d educard_prod -c "SELECT id, content, created_at, thread_id, user_id FROM posts WHERE content LIKE 'Test reply%' ORDER BY created_at DESC LIMIT 5;"
```

#### 6. Content Editing ✓

- [ ] Edit button visible on own posts
- [ ] Edit form pre-populated with content
- [ ] Can modify content
- [ ] Can save changes
- [ ] Updated content displays
- [ ] Database updated
- [ ] Edit timestamp recorded (if implemented)

**Test Steps:**
1. Find your own post/thread
2. Click edit button
3. Modify content: `[EDITED] Original content`
4. Save changes
5. Verify updated content displays

#### 7. Content Deletion ✓

- [ ] Delete button visible on own posts
- [ ] Confirmation prompt displays
- [ ] Can confirm deletion
- [ ] Content removed from view
- [ ] Database updated (soft or hard delete)
- [ ] Thread still accessible if posts deleted

**Test Steps:**
1. Find your own post
2. Click delete button
3. Confirm deletion
4. Verify post removed from view

**Validation:**
```bash
# Check soft delete
kubectl exec -it -n educard-prod postgres-0 -- psql -U educard_user -d educard_prod -c "SELECT id, deleted_at FROM posts WHERE id = [post_id];"
```

#### 8. User Profile ✓

- [ ] Can access own profile
- [ ] Username displayed
- [ ] Email displayed (or hidden for privacy)
- [ ] Join date displayed
- [ ] Post count displayed (if implemented)
- [ ] Can edit profile (if implemented)

**Test Steps:**
1. Click user menu
2. Navigate to profile
3. Verify information displays correctly

#### 9. Search Functionality ✓

*If implemented:*

- [ ] Search form accessible
- [ ] Can enter search query
- [ ] Results display
- [ ] Results are relevant
- [ ] Can click result to view

**Test Steps:**
1. Find search box
2. Enter query (e.g., "Test Thread")
3. Submit search
4. Review results
5. Click a result

#### 10. Admin Features ✓

*If implemented:*

- [ ] Admin panel accessible (admin only)
- [ ] Can view all users
- [ ] Can manage content
- [ ] Can moderate threads/posts
- [ ] Admin actions logged

### Browser Testing

Test in multiple browsers:
- [ ] Chrome/Chromium (latest)
- [ ] Firefox (latest)
- [ ] Safari (macOS)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

### Responsive Testing

Test at different screen sizes:
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

## Pod Resilience Testing

### Test 1: Application Pod Deletion

**Purpose:** Verify application pods restart automatically when deleted.

```bash
# List current pods
kubectl get pods -n educard-prod -l app=educard

# Delete one pod (gracefully)
POD_NAME=$(kubectl get pods -n educard-prod -l app=educard -o jsonpath='{.items[0].metadata.name}')
echo "Deleting pod: $POD_NAME"
kubectl delete pod -n educard-prod $POD_NAME

# Watch recovery
kubectl get pods -n educard-prod -l app=educard -w

# Wait for all pods to be ready (should be automatic)
kubectl wait --for=condition=ready pod -l app=educard -n educard-prod --timeout=60s
```

**Expected Result:**
- Pod terminates gracefully
- New pod created automatically
- New pod becomes ready within 60 seconds
- Application remains accessible (other pod handles requests)
- No data loss

**Validation:**
```bash
# Check pod status
kubectl get pods -n educard-prod -l app=educard

# Check service endpoints
kubectl get endpoints -n educard-prod educard-service

# Test application
kubectl port-forward -n educard-prod svc/educard-service 8080:80 &
sleep 2
curl -s http://localhost:8080/health || echo "Health check failed"
```

### Test 2: Database Pod Deletion

**Purpose:** Verify database pod restarts and data persists.

**⚠️ Warning:** This test involves deleting the database pod. Ensure no critical operations are running.

```bash
# Note current database pod
kubectl get pod -n educard-prod postgres-0

# Create test data first (via application or SQL)
kubectl exec -it -n educard-prod postgres-0 -- psql -U educard_user -d educard_prod -c "CREATE TABLE IF NOT EXISTS test_resilience (id SERIAL PRIMARY KEY, test_data VARCHAR(255), created_at TIMESTAMP DEFAULT NOW());"
kubectl exec -it -n educard-prod postgres-0 -- psql -U educard_user -d educard_prod -c "INSERT INTO test_resilience (test_data) VALUES ('Pre-deletion data');"

# Verify data exists
kubectl exec -it -n educard-prod postgres-0 -- psql -U educard_user -d educard_prod -c "SELECT * FROM test_resilience;"

# Delete database pod
kubectl delete pod -n educard-prod postgres-0

# Watch recovery (StatefulSet will recreate)
kubectl get pods -n educard-prod -w

# Wait for pod to be ready
kubectl wait --for=condition=ready pod postgres-0 -n educard-prod --timeout=120s

# Verify data still exists
kubectl exec -it -n educard-prod postgres-0 -- psql -U educard_user -d educard_prod -c "SELECT * FROM test_resilience;"
```

**Expected Result:**
- Pod terminates
- StatefulSet recreates pod with same name (postgres-0)
- Pod mounts same PVC (data persists)
- Pod becomes ready within 120 seconds
- All data intact after restart

**Cleanup:**
```bash
# Remove test table
kubectl exec -it -n educard-prod postgres-0 -- psql -U educard_user -d educard_prod -c "DROP TABLE IF EXISTS test_resilience;"
```

### Test 3: Forced Pod Deletion

**Purpose:** Verify system handles ungraceful termination.

```bash
# Force delete a pod
POD_NAME=$(kubectl get pods -n educard-prod -l app=educard -o jsonpath='{.items[0].metadata.name}')
kubectl delete pod -n educard-prod $POD_NAME --grace-period=0 --force

# Watch recovery
kubectl get pods -n educard-prod -w
```

**Expected Result:**
- Pod terminates immediately
- New pod created within seconds
- Application recovers normally

### Test 4: Multiple Pod Deletion

**Purpose:** Verify deployment maintains desired replica count.

```bash
# Delete all application pods
kubectl delete pods -n educard-prod -l app=educard

# Watch recovery
kubectl get pods -n educard-prod -l app=educard -w

# Verify replica count restored
DESIRED=$(kubectl get deployment educard-app -n educard-prod -o jsonpath='{.spec.replicas}')
READY=$(kubectl get deployment educard-app -n educard-prod -o jsonpath='{.status.readyReplicas}')
echo "Desired: $DESIRED, Ready: $READY"
```

**Expected Result:**
- All pods terminate
- Deployment recreates desired number of pods (2)
- All pods become ready
- Service maintains availability

## Database Persistence Testing

### Test 1: Data Survives Pod Restart

**Already covered in Pod Resilience Testing above.**

### Test 2: PVC Persistence

**Purpose:** Verify PVC retains data across pod deletions.

```bash
# Check PVC
kubectl get pvc -n educard-prod postgres-pvc

# Check volume
PV=$(kubectl get pvc -n educard-prod postgres-pvc -o jsonpath='{.spec.volumeName}')
echo "Persistent Volume: $PV"
kubectl get pv $PV

# Delete pod
kubectl delete pod -n educard-prod postgres-0

# Wait for recreation
kubectl wait --for=condition=ready pod postgres-0 -n educard-prod --timeout=120s

# Verify same PVC mounted
kubectl get pod postgres-0 -n educard-prod -o jsonpath='{.spec.volumes[?(@.persistentVolumeClaim.claimName=="postgres-pvc")].persistentVolumeClaim.claimName}'
```

**Expected Result:**
- PVC remains bound during pod deletion
- New pod mounts same PVC
- All data accessible

### Test 3: Database Integrity Check

```bash
# Run PostgreSQL integrity checks
kubectl exec -it -n educard-prod postgres-0 -- psql -U educard_user -d educard_prod -c "SELECT pg_size_pretty(pg_database_size('educard_prod'));"

# Check for table corruption
kubectl exec -it -n educard-prod postgres-0 -- psql -U educard_user -d educard_prod -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public';"

# Verify user data
kubectl exec -it -n educard-prod postgres-0 -- psql -U educard_user -d educard_prod -c "SELECT COUNT(*) FROM users;"
kubectl exec -it -n educard-prod postgres-0 -- psql -U educard_user -d educard_prod -c "SELECT COUNT(*) FROM threads;"
kubectl exec -it -n educard-prod postgres-0 -- psql -U educard_user -d educard_prod -c "SELECT COUNT(*) FROM posts;"
```

## Rolling Update Testing

### Test 1: Rolling Update Without Downtime

**Purpose:** Verify application can be updated with zero downtime.

**Prerequisites:**
- Build new image version (or use existing for test)
- Push to registry (local or remote)

```bash
# Check current image
kubectl get deployment educard-app -n educard-prod -o jsonpath='{.spec.template.spec.containers[0].image}'

# Start monitoring in separate terminal
# Terminal 1:
kubectl get pods -n educard-prod -l app=educard -w

# Terminal 2: Monitor application availability
while true; do
  kubectl port-forward -n educard-prod svc/educard-service 8080:80 2>/dev/null &
  PF_PID=$!
  sleep 1
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health 2>/dev/null || echo "FAIL")
  echo "$(date '+%H:%M:%S') - Status: $STATUS"
  kill $PF_PID 2>/dev/null
  sleep 2
done

# Terminal 3: Trigger update
# Option A: Update with same image (test rollout mechanism)
kubectl rollout restart deployment educard-app -n educard-prod

# Option B: Update to new image version
# kubectl set image deployment/educard-app -n educard-prod educard=localhost:5000/educard:v1.0.1

# Watch rollout status
kubectl rollout status deployment/educard-app -n educard-prod

# Check rollout history
kubectl rollout history deployment/educard-app -n educard-prod
```

**Expected Result:**
- Pods updated one at a time (rolling strategy)
- At least 1 pod always ready during update
- No failed health checks in monitoring
- Rollout completes successfully
- All pods on new version

**Validation:**
```bash
# Check all pods running
kubectl get pods -n educard-prod -l app=educard

# Verify image version
kubectl get pods -n educard-prod -l app=educard -o jsonpath='{.items[*].spec.containers[0].image}'

# Check no errors
kubectl get events -n educard-prod --field-selector type=Warning --sort-by='.lastTimestamp' | tail -10
```

### Test 2: Rollback

**Purpose:** Verify can rollback to previous version if update fails.

```bash
# View rollout history
kubectl rollout history deployment/educard-app -n educard-prod

# Rollback to previous version
kubectl rollout undo deployment/educard-app -n educard-prod

# Watch rollback
kubectl rollout status deployment/educard-app -n educard-prod

# Rollback to specific revision (optional)
# kubectl rollout undo deployment/educard-app -n educard-prod --to-revision=1
```

**Expected Result:**
- Rollback completes successfully
- Pods running previous version
- Application functional

## Performance Testing

### Response Time Testing

```bash
# Test application response time
kubectl port-forward -n educard-prod svc/educard-service 8080:80 &
sleep 2

# Single request
time curl -s http://localhost:8080/ > /dev/null

# Multiple requests
for i in {1..10}; do
  time curl -s http://localhost:8080/ > /dev/null
done

# Health endpoint
for i in {1..20}; do
  time curl -s http://localhost:8080/health > /dev/null
done
```

**Expected Result:**
- Homepage: < 500ms
- Health endpoint: < 100ms
- Consistent response times

### Load Testing (Basic)

**Using Apache Bench (if installed):**
```bash
# Install ab (if needed)
# macOS: brew install apr-util
# Linux: apt install apache2-utils

# Port forward
kubectl port-forward -n educard-prod svc/educard-service 8080:80 &
sleep 2

# Run load test (100 requests, 10 concurrent)
ab -n 100 -c 10 http://localhost:8080/

# Health endpoint load test
ab -n 1000 -c 50 http://localhost:8080/health
```

**Expected Result:**
- No failed requests
- Average response time reasonable
- Application stable under load

### Resource Usage Under Load

```bash
# Monitor resources during load test
watch -n 1 'kubectl top pods -n educard-prod'

# Or use monitoring script
./k8s/check-metrics.sh
```

**Expected Result:**
- CPU usage increases but stays under limits
- Memory usage stable
- No pod restarts

## Security Testing

### SSL/TLS Testing (If Ingress Configured)

```bash
# Test SSL certificate
curl -v https://yourdomain.com/ 2>&1 | grep -i "SSL\|TLS"

# Check certificate expiry
echo | openssl s_client -servername yourdomain.com -connect yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates

# Verify HTTPS redirect
curl -I http://yourdomain.com/
```

**Expected Result:**
- Valid SSL certificate
- Certificate not expired
- HTTP redirects to HTTPS
- TLS 1.2 or higher

### Network Policy Testing (If Implemented)

```bash
# Test pod-to-pod communication
kubectl exec -it -n educard-prod <app-pod> -- nc -zv postgres-service 5432

# Test external access restrictions
kubectl exec -it -n educard-prod <app-pod> -- curl -s https://google.com
```

### Secret Security

```bash
# Check secrets exist
kubectl get secrets -n educard-prod

# Verify secrets not in plain text in manifests
grep -r "password:" k8s/ | grep -v "<YOUR_"
```

**Expected Result:**
- Secrets properly encoded
- No plain text passwords in files
- Proper RBAC for secret access

## Test Results Template

### Infrastructure Tests

```
Date: [DATE]
Tester: [NAME]
Environment: K3s v[VERSION]

Health Checks: ✅/❌
- Cluster connectivity: ✅/❌
- Pod status: ✅/❌
- Service endpoints: ✅/❌
- Storage: ✅/❌

Pod Resilience: ✅/❌
- App pod deletion: ✅/❌
- DB pod deletion: ✅/❌
- Forced deletion: ✅/❌
- Multiple deletion: ✅/❌

Database Persistence: ✅/❌
- Data survives restart: ✅/❌
- PVC persistence: ✅/❌
- Integrity check: ✅/❌

Rolling Updates: ✅/❌
- Zero downtime update: ✅/❌
- Rollback: ✅/❌

Notes:
[Any observations or issues]
```

### Feature Tests

```
Date: [DATE]
Tester: [NAME]

Homepage & Navigation: ✅/❌
User Registration: ✅/❌
User Login: ✅/❌
Thread Creation: ✅/❌
Post/Reply Creation: ✅/❌
Content Editing: ✅/❌
Content Deletion: ✅/❌
User Profile: ✅/❌
Search Functionality: ✅/❌
Admin Features: ✅/❌

Browser Testing:
- Chrome: ✅/❌
- Firefox: ✅/❌
- Safari: ✅/❌
- Mobile: ✅/❌

Responsive Testing:
- Desktop: ✅/❌
- Tablet: ✅/❌
- Mobile: ✅/❌

Issues Found:
1. [Description]
2. [Description]
```

### Performance Tests

```
Date: [DATE]

Response Times:
- Homepage: [X]ms
- Health endpoint: [X]ms
- Average: [X]ms

Load Test Results:
- Total requests: [N]
- Failed requests: [N]
- Requests/sec: [N]
- Average time: [X]ms

Resource Usage:
- CPU: [X]%
- Memory: [X]Mi
- Stable: ✅/❌

Notes:
[Any observations]
```

## Troubleshooting

### Application Not Accessible

```bash
# Check pods
kubectl get pods -n educard-prod

# Check service
kubectl get svc educard-service -n educard-prod

# Check endpoints
kubectl get endpoints educard-service -n educard-prod

# Check events
kubectl get events -n educard-prod --sort-by='.lastTimestamp' | tail -20

# View logs
kubectl logs -n educard-prod -l app=educard --tail=50
```

### Database Connection Issues

```bash
# Check database pod
kubectl get pod postgres-0 -n educard-prod

# Test connection from app
kubectl exec -it -n educard-prod <app-pod> -- nc -zv postgres-service 5432

# Check database logs
kubectl logs -n educard-prod postgres-0 --tail=100

# Verify credentials
kubectl get secret educard-secrets -n educard-prod -o jsonpath='{.data.DB_PASSWORD}' | base64 -d
```

### Pod Won't Start

```bash
# Describe pod
kubectl describe pod <pod-name> -n educard-prod

# Check events
kubectl get events -n educard-prod --field-selector involvedObject.name=<pod-name>

# Check logs (may be empty if pod never started)
kubectl logs <pod-name> -n educard-prod --previous

# Check resource limits
kubectl get pod <pod-name> -n educard-prod -o jsonpath='{.spec.containers[0].resources}'
```

### Slow Performance

```bash
# Check resource usage
kubectl top pods -n educard-prod
kubectl top nodes

# Check for resource throttling
kubectl describe pod <pod-name> -n educard-prod | grep -i "cpu\|memory"

# Check database performance
kubectl exec -it -n educard-prod postgres-0 -- psql -U educard_user -d educard_prod -c "SELECT pid, usename, state, query FROM pg_stat_activity WHERE state != 'idle';"

# Check for errors
kubectl logs -n educard-prod -l app=educard --tail=100 | grep -i error
```

### Data Loss After Restart

```bash
# Verify PVC still bound
kubectl get pvc -n educard-prod

# Check PV status
kubectl get pv

# Check pod using correct PVC
kubectl get pod postgres-0 -n educard-prod -o jsonpath='{.spec.volumes[*].persistentVolumeClaim.claimName}'

# Check mount path
kubectl exec -it -n educard-prod postgres-0 -- df -h /var/lib/postgresql/data
```

## Best Practices

1. **Test in Isolation**: Don't run multiple destructive tests simultaneously
2. **Document Results**: Record all test outcomes for future reference
3. **Regular Testing**: Run tests after any significant changes
4. **Automated Testing**: Use scripts for repeatable tests
5. **Monitor During Tests**: Watch logs and metrics during testing
6. **Clean Up**: Remove test data after testing
7. **Version Control**: Keep test scripts in version control
8. **Test on Staging**: Test on staging environment before production

## Summary

This testing guide covers:
- ✅ Automated infrastructure testing
- ✅ Manual feature testing
- ✅ Pod resilience and recovery
- ✅ Database persistence
- ✅ Rolling updates and rollbacks
- ✅ Performance testing
- ✅ Security testing

All tests should pass before considering deployment production-ready.

For automated testing, use:
```bash
./k8s/test-deployment.sh
```

For quick health check:
```bash
./k8s/check-metrics.sh
```

## References

- [Kubernetes Testing Best Practices](https://kubernetes.io/docs/concepts/cluster-administration/manage-deployment/)
- [Rolling Updates](https://kubernetes.io/docs/tutorials/kubernetes-basics/update/update-intro/)
- [StatefulSet Deployment](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/)
- [Deployment Testing docs/MONITORING.md](../MONITORING.md)
