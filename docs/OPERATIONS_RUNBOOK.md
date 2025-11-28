# Operations Runbook

Daily operations, common tasks, and procedures for managing the Educard Kubernetes deployment.

## Table of Contents

1. [Daily Operations](#daily-operations)
2. [Common Tasks](#common-tasks)
3. [Application Management](#application-management)
4. [Database Operations](#database-operations)
5. [Backup Operations](#backup-operations)
6. [Monitoring & Logging](#monitoring--logging)
7. [Scaling](#scaling)
8. [Updates & Rollbacks](#updates--rollbacks)
9. [Emergency Procedures](#emergency-procedures)

## Daily Operations

### Morning Checklist

```bash
# Set kubeconfig
export KUBECONFIG=/Users/tohyifan/Desktop/Educard/k8s/kubeconfig-vagrant-local

# 1. Quick health check
./k8s/check-metrics.sh

# 2. Check pod status
kubectl get pods -n educard-prod

# 3. Check for warning events
kubectl get events -n educard-prod --field-selector type=Warning --sort-by='.lastTimestamp' | tail -10

# 4. Check resource usage
kubectl top pods -n educard-prod
kubectl top nodes

# 5. Verify backup completed
kubectl get jobs -n educard-prod -l app=postgres-backup --sort-by='.status.completionTime' | head -5
```

**Expected Results:**
- ✅ All pods Running and Ready
- ✅ No warning events
- ✅ Resource usage normal (CPU < 80%, Memory < 80%)
- ✅ Last night's backup completed successfully

###  End of Day Checklist

```bash
# 1. Review application logs for errors
kubectl logs -n educard-prod -l app=educard --since=24h | grep -i error

# 2. Check backup status
./k8s/list-backups.sh

# 3. Review resource trends
kubectl top pods -n educard-prod

# 4. Check for pending updates
kubectl get deployment -n educard-prod -o wide
```

## Common Tasks

### View Logs

**Application logs:**
```bash
# All application pods
kubectl logs -n educard-prod -l app=educard --tail=100

# Follow logs (live tail)
kubectl logs -n educard-prod -l app=educard -f

# Specific pod
kubectl logs -n educard-prod <pod-name>

# Previous pod instance (after crash)
kubectl logs -n educard-prod <pod-name> --previous

# Last 24 hours with errors
kubectl logs -n educard-prod -l app=educard --since=24h | grep -i error

# Save logs to file
kubectl logs -n educard-prod -l app=educard --tail=1000 > app-logs.txt
```

**Database logs:**
```bash
# PostgreSQL logs
kubectl logs -n educard-prod postgres-0 --tail=100

# Follow database logs
kubectl logs -n educard-prod postgres-0 -f

# Save database logs
kubectl logs -n educard-prod postgres-0 --tail=1000 > db-logs.txt
```

**Backup job logs:**
```bash
# Latest backup job
LATEST_JOB=$(kubectl get jobs -n educard-prod -l app=postgres-backup --sort-by='.status.completionTime' -o jsonpath='{.items[-1:].metadata.name}')
kubectl logs -n educard-prod job/$LATEST_JOB

# All backup jobs
kubectl get jobs -n educard-prod -l app=postgres-backup
```

### Access Pods

**Get shell in application pod:**
```bash
# List pods
kubectl get pods -n educard-prod -l app=educard

# Execute shell
kubectl exec -it -n educard-prod <pod-name> -- sh

# Run single command
kubectl exec -n educard-prod <pod-name> -- ls -la /app
```

**Access database:**
```bash
# PostgreSQL CLI
kubectl exec -it -n educard-prod postgres-0 -- psql -U educard -d educard_prod

# Run SQL query
kubectl exec -it -n educard-prod postgres-0 -- psql -U educard -d educard_prod -c "SELECT COUNT(*) FROM users;"

# Database stats
kubectl exec -it -n educard-prod postgres-0 -- psql -U educard -d educard_prod -c "
  SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
  FROM pg_tables 
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"
```

### Port Forwarding

**Forward application port:**
```bash
# Forward to local port 8080
kubectl port-forward -n educard-prod svc/educard-service 8080:80

# Access at: http://localhost:8080
```

**Forward database port:**
```bash
# Forward to local port 5432
kubectl port-forward -n educard-prod svc/postgres-service 5432:5432

# Connect with: psql -h localhost -U educard -d educard_prod
```

**Background port forward:**
```bash
# Start in background
kubectl port-forward -n educard-prod svc/educard-service 8080:80 &

# Get PID
jobs

# Kill when done
kill %1
```

### Check Resource Status

**Pods:**
```bash
# List all pods
kubectl get pods -n educard-prod

# Detailed view
kubectl get pods -n educard-prod -o wide

# Watch pods (live updates)
kubectl get pods -n educard-prod -w

# Pod resource usage
kubectl top pods -n educard-prod

# Pod details
kubectl describe pod <pod-name> -n educard-prod
```

**Services:**
```bash
# List services
kubectl get svc -n educard-prod

# Service endpoints
kubectl get endpoints -n educard-prod

# Service details
kubectl describe svc educard-service -n educard-prod
```

**Storage:**
```bash
# List PVCs
kubectl get pvc -n educard-prod

# List PVs
kubectl get pv

# PVC details
kubectl describe pvc postgres-pvc -n educard-prod

# Check disk usage in pod
kubectl exec -n educard-prod postgres-0 -- df -h
```

## Application Management

### Restart Application

**Graceful restart (rolling):**
```bash
# Restart all pods gradually
kubectl rollout restart deployment/educard-app -n educard-prod

# Watch progress
kubectl rollout status deployment/educard-app -n educard-prod

# Verify all pods running
kubectl get pods -n educard-prod -l app=educard
```

**Force restart (delete pods):**
```bash
# Delete all application pods (deployment recreates them)
kubectl delete pods -n educard-prod -l app=educard

# Or delete specific pod
kubectl delete pod <pod-name> -n educard-prod
```

### View Application Configuration

**Environment variables:**
```bash
# View from pod
kubectl exec -n educard-prod <pod-name> -- env

# View ConfigMap
kubectl get configmap educard-config -n educard-prod -o yaml

# View Secrets (base64 encoded)
kubectl get secret educard-secrets -n educard-prod -o yaml
```

**Deployment configuration:**
```bash
# View deployment
kubectl get deployment educard-app -n educard-prod -o yaml

# Edit deployment (use with caution)
kubectl edit deployment educard-app -n educard-prod
```

### Check Application Health

**Health endpoint:**
```bash
# Via port forward
kubectl port-forward -n educard-prod svc/educard-service 8080:80 &
curl http://localhost:8080/health

# From within cluster
kubectl run test-curl --rm -it --image=curlimages/curl --restart=Never -- curl -s http://educard-service.educard-prod.svc.cluster.local/health
```

**Check readiness:**
```bash
# Pod readiness status
kubectl get pods -n educard-prod -o custom-columns=NAME:.metadata.name,READY:.status.conditions[?(@.type==\"Ready\")].status
```

## Database Operations

### Database Health Checks

```bash
# Check if database is ready
kubectl exec -n educard-prod postgres-0 -- pg_isready -U educard

# Connection test
kubectl exec -it -n educard-prod postgres-0 -- psql -U educard -d educard_prod -c "SELECT 1;"

# Database size
kubectl exec -it -n educard-prod postgres-0 -- psql -U educard -d educard_prod -c "SELECT pg_size_pretty(pg_database_size('educard_prod'));"

# Connection count
kubectl exec -it -n educard-prod postgres-0 -- psql -U educard -d educard_prod -c "SELECT count(*) as connections FROM pg_stat_activity;"

# Active queries
kubectl exec -it -n educard-prod postgres-0 -- psql -U educard -d educard_prod -c "SELECT pid, usename, application_name, state, query FROM pg_stat_activity WHERE state != 'idle';"
```

### Database Maintenance

**Vacuum database:**
```bash
kubectl exec -it -n educard-prod postgres-0 -- psql -U educard -d educard_prod -c "VACUUM ANALYZE;"
```

**Check table sizes:**
```bash
kubectl exec -it -n educard-prod postgres-0 -- psql -U educard -d educard_prod -c "
  SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS index_size
  FROM pg_tables 
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"
```

**Check for slow queries:**
```bash
kubectl exec -it -n educard-prod postgres-0 -- psql -U educard -d educard_prod -c "
  SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
  FROM pg_stat_activity 
  WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes' 
  AND state = 'active';
"
```

### Database Restart

```bash
# Delete pod (StatefulSet recreates it)
kubectl delete pod postgres-0 -n educard-prod

# Watch recovery
kubectl get pods -n educard-prod -w

# Wait for ready
kubectl wait --for=condition=ready pod postgres-0 -n educard-prod --timeout=120s

# Verify database accessible
kubectl exec -it -n educard-prod postgres-0 -- pg_isready -U educard
```

## Backup Operations

### Manual Backup

```bash
# Run manual backup
./k8s/run-backup.sh

# Or create job directly
kubectl create job --from=cronjob/postgres-backup manual-backup-$(date +%Y%m%d-%H%M%S) -n educard-prod

# Watch job
kubectl get jobs -n educard-prod -w

# View logs
kubectl logs -n educard-prod -l app=postgres-backup --tail=100
```

### List Backups

```bash
# List all backups
./k8s/list-backups.sh

# Or view directly
kubectl exec -n educard-prod postgres-0 -- ls -lh /backups/

# Check backup sizes
kubectl exec -n educard-prod postgres-0 -- du -sh /backups/*
```

### Verify Backup

```bash
# Check latest backup integrity
LATEST_BACKUP=$(kubectl exec -n educard-prod postgres-0 -- ls -t /backups/ | head -1)
kubectl exec -n educard-prod postgres-0 -- gunzip -t /backups/$LATEST_BACKUP
```

### Restore from Backup

```bash
# Interactive restore
./k8s/run-restore.sh

# Follow prompts to select backup and confirm
```

**⚠️ Warning:** Restore will drop all current data!

See [BACKUP_RESTORE.md](./BACKUP_RESTORE.md) for detailed procedures.

## Monitoring & Logging

### Resource Monitoring

```bash
# Quick health check
./k8s/check-metrics.sh

# Node resources
kubectl top nodes

# Pod resources
kubectl top pods -n educard-prod

# Container resources
kubectl top pods -n educard-prod --containers

# Sort by CPU
kubectl top pods -n educard-prod --sort-by=cpu

# Sort by memory
kubectl top pods -n educard-prod --sort-by=memory
```

### Event Monitoring

```bash
# All events
kubectl get events -n educard-prod

# Recent events
kubectl get events -n educard-prod --sort-by='.lastTimestamp' | tail -20

# Warning events only
kubectl get events -n educard-prod --field-selector type=Warning

# Watch events live
kubectl get events -n educard-prod --watch
```

### Log Aggregation

**Multi-pod log tailing:**
```bash
# Install stern (if not installed)
brew install stern

# Tail all application pods
stern -n educard-prod educard

# With color and timestamps
stern -n educard-prod -t educard
```

## Scaling

### Manual Scaling

**Scale application:**
```bash
# Scale to 3 replicas
kubectl scale deployment/educard-app -n educard-prod --replicas=3

# Verify
kubectl get deployment educard-app -n educard-prod

# Check pods
kubectl get pods -n educard-prod -l app=educard
```

**Scale back:**
```bash
# Scale to 2 replicas
kubectl scale deployment/educard-app -n educard-prod --replicas=2
```

### Auto-scaling

**Create Horizontal Pod Autoscaler:**
```bash
# Autoscale based on CPU (target 70%)
kubectl autoscale deployment educard-app -n educard-prod --cpu-percent=70 --min=2 --max=10

# Check HPA
kubectl get hpa -n educard-prod

# Describe HPA
kubectl describe hpa educard-app -n educard-prod
```

**Delete HPA:**
```bash
kubectl delete hpa educard-app -n educard-prod
```

## Updates & Rollbacks

### Update Application

**Update image:**
```bash
# Build and push new image first
docker build -f docker/Dockerfile.prod -t educard:v1.0.1 .
docker tag educard:v1.0.1 localhost:5000/educard:v1.0.1
docker push localhost:5000/educard:v1.0.1

# Update deployment
kubectl set image deployment/educard-app -n educard-prod educard=localhost:5000/educard:v1.0.1

# Watch rollout
kubectl rollout status deployment/educard-app -n educard-prod

# Check rollout history
kubectl rollout history deployment/educard-app -n educard-prod
```

**Monitor update:**
```bash
# Watch pods during update
kubectl get pods -n educard-prod -l app=educard -w

# Check events
kubectl get events -n educard-prod --sort-by='.lastTimestamp' | tail -20

# Test application
kubectl port-forward -n educard-prod svc/educard-service 8080:80
curl http://localhost:8080/health
```

### Rollback

**Rollback to previous version:**
```bash
# Undo last rollout
kubectl rollout undo deployment/educard-app -n educard-prod

# Watch rollback
kubectl rollout status deployment/educard-app -n educard-prod
```

**Rollback to specific revision:**
```bash
# View history
kubectl rollout history deployment/educard-app -n educard-prod

# Rollback to specific revision
kubectl rollout undo deployment/educard-app -n educard-prod --to-revision=2
```

### Pause/Resume Rollout

```bash
# Pause rollout (stop auto-updates)
kubectl rollout pause deployment/educard-app -n educard-prod

# Resume rollout
kubectl rollout resume deployment/educard-app -n educard-prod
```

## Emergency Procedures

### Application Down

**Quick diagnosis:**
```bash
# 1. Check pods
kubectl get pods -n educard-prod

# 2. Check recent events
kubectl get events -n educard-prod --sort-by='.lastTimestamp' | tail -20

# 3. Check logs
kubectl logs -n educard-prod -l app=educard --tail=50

# 4. Check service endpoints
kubectl get endpoints -n educard-prod educard-service
```

**Quick fixes:**
```bash
# Restart application
kubectl rollout restart deployment/educard-app -n educard-prod

# Or rollback if recent update
kubectl rollout undo deployment/educard-app -n educard-prod
```

### Database Issues

**Quick diagnosis:**
```bash
# 1. Check database pod
kubectl get pod postgres-0 -n educard-prod

# 2. Check database logs
kubectl logs -n educard-prod postgres-0 --tail=100

# 3. Test connection
kubectl exec -it -n educard-prod postgres-0 -- pg_isready -U educard

# 4. Check disk space
kubectl exec -n educard-prod postgres-0 -- df -h
```

**Quick fixes:**
```bash
# Restart database
kubectl delete pod postgres-0 -n educard-prod

# Wait for recovery
kubectl wait --for=condition=ready pod postgres-0 -n educard-prod --timeout=120s
```

### High Resource Usage

**Check resource usage:**
```bash
# Node resources
kubectl top nodes

# Pod resources
kubectl top pods -n educard-prod --sort-by=memory

# Identify resource-heavy pod
kubectl describe pod <pod-name> -n educard-prod
```

**Actions:**
```bash
# Scale up
kubectl scale deployment/educard-app -n educard-prod --replicas=3

# Or increase resource limits
kubectl edit deployment educard-app -n educard-prod
# Adjust resources.limits.memory and resources.limits.cpu

# Restart to apply
kubectl rollout restart deployment/educard-app -n educard-prod
```

### Disk Space Issues

**Check disk usage:**
```bash
# Node disk space (via SSH)
df -h

# Pod disk usage
kubectl exec -n educard-prod postgres-0 -- df -h

# Backup volume usage
kubectl exec -n educard-prod postgres-0 -- du -sh /backups
```

**Clean up:**
```bash
# Remove old completed jobs
kubectl delete jobs -n educard-prod --field-selector status.successful=1

# Remove old backup files (keep last 30 days)
kubectl exec -n educard-prod postgres-0 -- find /backups -name "backup-*.sql.gz" -type f -mtime +30 -delete

# Remove old pods
kubectl delete pods -n educard-prod --field-selector status.phase=Succeeded
```

### Complete Restart

**⚠️ Causes downtime - use only if necessary:**

```bash
# 1. Delete all application pods
kubectl delete pods -n educard-prod -l app=educard

# 2. Delete database pod
kubectl delete pod postgres-0 -n educard-prod

# 3. Wait for recovery
kubectl wait --for=condition=ready pod -l app=educard -n educard-prod --timeout=120s
kubectl wait --for=condition=ready pod postgres-0 -n educard-prod --timeout=120s

# 4. Verify
./k8s/check-metrics.sh
```

## Certificate Renewal

**Check certificates:**
```bash
# List certificates
kubectl get certificates -n educard-prod

# Certificate details
kubectl describe certificate educard-tls -n educard-prod

# Check expiry
kubectl get certificate educard-tls -n educard-prod -o jsonpath='{.status.notAfter}'
```

**Manual renewal:**
```bash
# Delete certificate (cert-manager recreates)
kubectl delete certificate educard-tls -n educard-prod

# Watch renewal
kubectl get certificate -n educard-prod -w
```

See [INGRESS.md](../k8s/INGRESS.md) for details.

## Useful Aliases

Add to `~/.zshrc` or `~/.bashrc`:

```bash
# Kubeconfig
export KUBECONFIG=/Users/tohyifan/Desktop/Educard/k8s/kubeconfig-vagrant-local

# Aliases
alias k='kubectl'
alias kgp='kubectl get pods -n educard-prod'
alias kgs='kubectl get svc -n educard-prod'
alias kl='kubectl logs -n educard-prod'
alias kx='kubectl exec -it -n educard-prod'
alias kpf='kubectl port-forward -n educard-prod'
alias kdesc='kubectl describe -n educard-prod'

# Functions
klog() {
  kubectl logs -n educard-prod -l app=educard --tail=100 -f
}

khealth() {
  /Users/tohyifan/Desktop/Educard/k8s/check-metrics.sh
}
```

## Additional Resources

- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Problem solving guide
- [MONITORING.md](./MONITORING.md) - Detailed monitoring procedures
- [BACKUP_RESTORE.md](./BACKUP_RESTORE.md) - Backup and restore procedures
- [K3S_DEPLOYMENT.md](./K3S_DEPLOYMENT.md) - Complete deployment guide
- [DEPLOYMENT_TESTING.md](./DEPLOYMENT_TESTING.md) - Testing procedures

---

**Last Updated:** November 28, 2025  
**Version:** 1.0  
**Status:** Production Ready ✅
