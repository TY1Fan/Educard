# Database Backup and Restore Guide

## Overview

This guide covers the automated backup system for the PostgreSQL database in the Educard application, including daily automated backups, manual backup procedures, and database restoration.

## Table of Contents

1. [Architecture](#architecture)
2. [Installation](#installation)
3. [Automated Backups](#automated-backups)
4. [Manual Backups](#manual-backups)
5. [Listing Backups](#listing-backups)
6. [Restore Procedures](#restore-procedures)
7. [Monitoring](#monitoring)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

## Architecture

### Components

**Backup PVC (`backup-pvc`)**
- Storage: 20 GB
- Access Mode: ReadWriteOnce
- Storage Class: local-path
- Purpose: Store compressed database backups
- Retention: 30 days

**Backup CronJob (`postgres-backup`)**
- Schedule: Daily at 2:00 AM UTC
- Image: postgres:15-alpine
- Method: pg_dump with gzip compression
- Cleanup: Automatic deletion of backups older than 30 days
- History: Keeps last 3 successful jobs, 1 failed job

**Restore Job (`postgres-restore`)**
- Type: Manual Kubernetes Job
- Image: postgres:15-alpine
- Method: psql restore from compressed backup
- Safety: Requires explicit backup file specification

### Backup Process

```
1. CronJob triggers at 2:00 AM UTC
        ↓
2. Pod created with postgres:15-alpine image
        ↓
3. Test database connection
        ↓
4. Run pg_dump to export database
        ↓
5. Compress output with gzip
        ↓
6. Store in /backups/backup-YYYYMMDD-HHMMSS.sql.gz
        ↓
7. Verify backup integrity (gzip test)
        ↓
8. Cleanup backups older than 30 days
        ↓
9. Report summary and disk usage
        ↓
10. Pod terminates (auto-cleanup after 24 hours)
```

### Restore Process

```
1. Stop application (scale to 0)
        ↓
2. Verify backup file exists and is valid
        ↓
3. Drop existing database schema
        ↓
4. Restore from backup file
        ↓
5. Verify table count
        ↓
6. Restart application
```

## Installation

### Prerequisites

- Kubernetes cluster running
- PostgreSQL StatefulSet deployed (Task 5.6)
- kubectl configured
- Sufficient storage for backups

### Deploy Backup System

#### Step 1: Create Backup PVC

```bash
# Set kubeconfig
export KUBECONFIG=/Users/tohyifan/Desktop/Educard/k8s/kubeconfig-vagrant-local

# Create PVC
kubectl apply -f k8s/backup-pvc.yaml

# Verify
kubectl get pvc -n educard-prod backup-pvc
```

Expected output:
```
NAME         STATUS   VOLUME                                     CAPACITY   ACCESS MODES
backup-pvc   Bound    pvc-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx   20Gi       RWO
```

#### Step 2: Deploy Backup CronJob

```bash
# Deploy CronJob
kubectl apply -f k8s/backup-cronjob.yaml

# Verify
kubectl get cronjob -n educard-prod postgres-backup
```

Expected output:
```
NAME              SCHEDULE      SUSPEND   ACTIVE   LAST SCHEDULE   AGE
postgres-backup   0 2 * * *     False     0        <none>          10s
```

#### Step 3: Test Backup

```bash
# Trigger manual backup
./k8s/run-backup.sh

# Or manually:
kubectl create job --from=cronjob/postgres-backup manual-backup-1 -n educard-prod
```

#### Step 4: Verify Backup Created

```bash
# List backups
./k8s/list-backups.sh

# Or manually check:
kubectl get jobs -n educard-prod
kubectl logs -n educard-prod -l app=postgres-backup
```

## Automated Backups

### Schedule

**Default Schedule:** Daily at 2:00 AM UTC

To change the schedule, edit `k8s/backup-cronjob.yaml`:

```yaml
spec:
  schedule: "0 2 * * *"  # minute hour day month weekday
```

**Examples:**
- Every 6 hours: `"0 */6 * * *"`
- Every day at 3 AM: `"0 3 * * *"`
- Twice daily (2 AM and 2 PM): `"0 2,14 * * *"`
- Weekly (Sunday 2 AM): `"0 2 * * 0"`

After editing:
```bash
kubectl apply -f k8s/backup-cronjob.yaml
```

### Retention Policy

**Default:** 30 days

Backups older than 30 days are automatically deleted during each backup run.

To change retention, edit the CronJob:

```yaml
# Find this line in the backup script:
RETENTION_DAYS=30  # Change to desired days
```

### Monitoring Automated Backups

```bash
# View CronJob status
kubectl get cronjob -n educard-prod postgres-backup

# View recent jobs
kubectl get jobs -n educard-prod -l app=postgres-backup

# View job logs
kubectl logs -n educard-prod -l app=postgres-backup --tail=100

# Check last successful backup
kubectl get jobs -n educard-prod -l app=postgres-backup --sort-by=.status.completionTime | tail -1
```

### Backup Notifications

To receive notifications on backup failures, integrate with monitoring systems:

**Option 1: Check Job Status Regularly**
```bash
# List failed jobs
kubectl get jobs -n educard-prod -l app=postgres-backup --field-selector status.successful=0
```

**Option 2: Monitoring Integration**
Set up alerts in Prometheus/Grafana to monitor:
- Job completion status
- Backup file creation
- Disk usage on backup PVC

## Manual Backups

### Using Helper Script (Recommended)

```bash
cd /Users/tohyifan/Desktop/Educard
./k8s/run-backup.sh
```

The script will:
1. ✅ Create a job from the CronJob
2. ✅ Wait for pod to start
3. ✅ Follow backup logs in real-time
4. ✅ Check completion status
5. ✅ Show backup files and disk usage

### Manual Method

```bash
export KUBECONFIG=/Users/tohyifan/Desktop/Educard/k8s/kubeconfig-vagrant-local

# Create job
kubectl create job --from=cronjob/postgres-backup manual-backup-$(date +%Y%m%d-%H%M%S) -n educard-prod

# Watch jobs
kubectl get jobs -n educard-prod -w

# View logs
JOB_NAME=manual-backup-XXXXXX  # Replace with actual job name
POD_NAME=$(kubectl get pods -n educard-prod -l job-name=$JOB_NAME -o jsonpath='{.items[0].metadata.name}')
kubectl logs -n educard-prod -f $POD_NAME
```

### Backup Before Major Changes

Always create a backup before:
- Database schema migrations
- Application updates
- Configuration changes
- Testing restore procedures

```bash
./k8s/run-backup.sh
```

## Listing Backups

### Using Helper Script

```bash
./k8s/list-backups.sh
```

Output:
```
=====================================
  Available Database Backups
=====================================

Checking backup storage...
✓ Backup storage mounted

Backup files:
Found 5 backup(s)

-rw-r--r-- 1 999 999 2.3M Nov 28 02:00 backup-20251128-020000.sql.gz
-rw-r--r-- 1 999 999 2.3M Nov 27 02:00 backup-20251127-020000.sql.gz
-rw-r--r-- 1 999 999 2.2M Nov 26 02:00 backup-20251126-020000.sql.gz
-rw-r--r-- 1 999 999 2.2M Nov 25 02:00 backup-20251125-020000.sql.gz
-rw-r--r-- 1 999 999 2.1M Nov 24 02:00 backup-20251124-020000.sql.gz

Disk usage:
/dev/sda1  20G  12M  20G   1% /backups
```

### Manual Method

```bash
# List all backups
kubectl exec -n educard-prod postgres-0 -- ls -lh /backups

# List recent backups (last 10)
kubectl exec -n educard-prod postgres-0 -- ls -lht /backups/backup-*.sql.gz | head -10

# Check disk usage
kubectl exec -n educard-prod postgres-0 -- df -h /backups

# Count backups
kubectl exec -n educard-prod postgres-0 -- sh -c "ls -1 /backups/backup-*.sql.gz | wc -l"
```

### Download Backup

```bash
# Download to local machine
kubectl cp educard-prod/postgres-0:/backups/backup-20251128-020000.sql.gz ./local-backup.sql.gz

# Verify downloaded backup
gunzip -t local-backup.sql.gz
```

## Restore Procedures

### ⚠️ WARNING: Destructive Operation

Database restoration will:
- **Stop the application**
- **Delete all current data**
- **Restore from backup**
- **Restart the application**

### Prerequisites

1. ✅ Identify the backup file to restore
2. ✅ Verify backup file integrity
3. ✅ Have a recent backup of current data (just in case)
4. ✅ Notify users of downtime
5. ✅ Test restore in dev environment first (if possible)

### Using Helper Script (Recommended)

```bash
# List available backups
./k8s/list-backups.sh

# Restore from specific backup
./k8s/run-restore.sh /backups/backup-20251128-020000.sql.gz
```

The script will:
1. ✅ Verify backup file exists
2. ✅ Show warning and require confirmation
3. ✅ Stop application
4. ✅ Drop existing schema
5. ✅ Restore from backup
6. ✅ Verify restoration
7. ✅ Restart application

### Manual Restore Procedure

```bash
export KUBECONFIG=/Users/tohyifan/Desktop/Educard/k8s/kubeconfig-vagrant-local

# Step 1: Scale down application
kubectl scale deployment educard-app -n educard-prod --replicas=0

# Step 2: Verify backup file
BACKUP_FILE="/backups/backup-20251128-020000.sql.gz"
kubectl exec -n educard-prod postgres-0 -- test -f "$BACKUP_FILE" && echo "Backup exists"
kubectl exec -n educard-prod postgres-0 -- gunzip -t "$BACKUP_FILE" && echo "Backup is valid"

# Step 3: Get database credentials
DB_NAME=$(kubectl get configmap educard-config -n educard-prod -o jsonpath='{.data.DB_NAME}')
DB_USER=$(kubectl get secret educard-secrets -n educard-prod -o jsonpath='{.data.DB_USER}' | base64 -d)
DB_PASSWORD=$(kubectl get secret educard-secrets -n educard-prod -o jsonpath='{.data.DB_PASSWORD}' | base64 -d)

# Step 4: Drop existing schema and restore
kubectl exec -i -n educard-prod postgres-0 -- sh -c "
export PGPASSWORD='$DB_PASSWORD'

# Drop existing tables
psql -U '$DB_USER' -d '$DB_NAME' -c '
DO \$\$ DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = '\''public'\'') LOOP
    EXECUTE '\''DROP TABLE IF EXISTS '\'' || quote_ident(r.tablename) || '\'' CASCADE'\'';
  END LOOP;
END \$\$;
'

# Restore from backup
gunzip -c '$BACKUP_FILE' | psql -U '$DB_USER' -d '$DB_NAME'
"

# Step 5: Scale up application
kubectl scale deployment educard-app -n educard-prod --replicas=2

# Step 6: Wait for pods to be ready
kubectl wait --for=condition=ready pod -l app=educard -n educard-prod --timeout=60s

# Step 7: Verify application
curl https://yourdomain.com/health
```

### Point-in-Time Recovery

To restore to a specific date/time:

```bash
# List backups with dates
./k8s/list-backups.sh

# Choose backup closest to desired time
# Backup filename format: backup-YYYYMMDD-HHMMSS.sql.gz
# Example: backup-20251128-020000.sql.gz = Nov 28, 2025, 2:00 AM

# Restore
./k8s/run-restore.sh /backups/backup-20251128-020000.sql.gz
```

### Restore Testing

Regularly test restore procedures to ensure:
- Backups are valid
- Restore process works
- Team knows the procedure
- Downtime is minimized

**Test Restore (Recommended Monthly):**
1. Create test backup
2. Scale down application
3. Restore test backup
4. Verify application works
5. Document any issues

## Monitoring

### Backup Health Checks

```bash
# Check CronJob is not suspended
kubectl get cronjob postgres-backup -n educard-prod -o jsonpath='{.spec.suspend}'
# Should return: false

# Check recent backup jobs
kubectl get jobs -n educard-prod -l app=postgres-backup --sort-by=.status.completionTime | tail -5

# Check for failed backups
kubectl get jobs -n educard-prod -l app=postgres-backup --field-selector status.successful=0

# View last backup logs
LAST_JOB=$(kubectl get jobs -n educard-prod -l app=postgres-backup --sort-by=.status.completionTime -o jsonpath='{.items[-1].metadata.name}')
kubectl logs -n educard-prod -l job-name=$LAST_JOB
```

### Disk Usage Monitoring

```bash
# Check backup PVC usage
kubectl exec -n educard-prod postgres-0 -- df -h /backups

# Check PVC capacity
kubectl get pvc backup-pvc -n educard-prod -o jsonpath='{.status.capacity.storage}'

# Count backup files
kubectl exec -n educard-prod postgres-0 -- sh -c "ls -1 /backups/backup-*.sql.gz | wc -l"

# Calculate total backup size
kubectl exec -n educard-prod postgres-0 -- sh -c "du -sh /backups"
```

### Alert on Issues

Set up alerts for:
- ✅ Backup job failures
- ✅ No backup in last 25 hours
- ✅ Disk usage > 80%
- ✅ Backup file size anomalies

## Troubleshooting

### Issue 1: Backup Job Fails

**Symptoms:**
- Job status shows Failed
- No backup file created

**Debug:**
```bash
# Check job status
kubectl get jobs -n educard-prod -l app=postgres-backup

# View logs
kubectl logs -n educard-prod -l app=postgres-backup --tail=100

# Check database connection
kubectl exec -n educard-prod postgres-0 -- psql -U <user> -d educard_prod -c "SELECT 1"
```

**Common Causes:**
1. **Database not ready**
   - Solution: Wait for PostgreSQL to be ready
   - Check: `kubectl get pods -n educard-prod postgres-0`

2. **Incorrect credentials**
   - Solution: Verify ConfigMap and Secret
   - Check: `kubectl get configmap educard-config -n educard-prod`

3. **No space left**
   - Solution: Increase PVC size or reduce retention
   - Check: `kubectl exec -n educard-prod postgres-0 -- df -h /backups`

### Issue 2: PVC Not Mounted

**Symptoms:**
- Backup job fails with "No such file or directory"
- Cannot access /backups

**Debug:**
```bash
# Check PVC status
kubectl get pvc backup-pvc -n educard-prod

# Check pod volume mounts
kubectl describe job <job-name> -n educard-prod | grep -A 5 Volumes
```

**Solution:**
```bash
# Ensure PVC is Bound
kubectl get pvc backup-pvc -n educard-prod

# If not bound, check storage class
kubectl get storageclass

# Recreate PVC if needed
kubectl delete pvc backup-pvc -n educard-prod
kubectl apply -f k8s/backup-pvc.yaml
```

### Issue 3: Backup File Corrupted

**Symptoms:**
- gunzip -t fails
- Restore fails with decompression error

**Debug:**
```bash
# Test backup integrity
kubectl exec -n educard-prod postgres-0 -- gunzip -t /backups/backup-XXXXXX.sql.gz

# Check file size
kubectl exec -n educard-prod postgres-0 -- ls -lh /backups/backup-XXXXXX.sql.gz
```

**Solution:**
- Use a different backup file
- Trigger new backup: `./k8s/run-backup.sh`
- Check disk for errors

### Issue 4: Restore Fails

**Symptoms:**
- Restore job completes but no tables
- Application shows database errors

**Debug:**
```bash
# Check table count after restore
kubectl exec -n educard-prod postgres-0 -- psql -U <user> -d educard_prod -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"

# Check restore logs
kubectl logs -n educard-prod -l app=postgres-restore --tail=100

# View application logs
kubectl logs -n educard-prod -l app=educard --tail=50
```

**Solution:**
1. Verify backup file is valid
2. Check database credentials
3. Ensure backup is from same PostgreSQL version
4. Try restoring older backup

### Issue 5: Disk Full

**Symptoms:**
- Backup fails with "No space left on device"
- PVC at 100% capacity

**Debug:**
```bash
# Check disk usage
kubectl exec -n educard-prod postgres-0 -- df -h /backups

# Count backups
kubectl exec -n educard-prod postgres-0 -- ls -1 /backups/backup-*.sql.gz | wc -l

# Check individual file sizes
kubectl exec -n educard-prod postgres-0 -- du -h /backups/backup-*.sql.gz
```

**Solutions:**

**Option 1: Reduce Retention**
```yaml
# Edit backup-cronjob.yaml
RETENTION_DAYS=15  # Reduce from 30 to 15 days
```

**Option 2: Increase PVC Size**
```bash
# Edit backup-pvc.yaml
storage: 50Gi  # Increase from 20Gi

# Apply (requires storage class that supports expansion)
kubectl apply -f k8s/backup-pvc.yaml
```

**Option 3: Manual Cleanup**
```bash
# Delete old backups manually
kubectl exec -n educard-prod postgres-0 -- sh -c "
  find /backups -name 'backup-*.sql.gz' -type f -mtime +15 -delete
"
```

## Best Practices

### Backup Strategy

1. **Regular Backups**
   - Daily automated backups minimum
   - Before any major changes
   - Before/after migrations

2. **Testing**
   - Test restore monthly
   - Verify backup integrity
   - Document restore time

3. **Retention**
   - Keep 30 days minimum
   - Longer for compliance requirements
   - Consider archiving old backups

4. **Monitoring**
   - Alert on backup failures
   - Monitor disk usage
   - Track backup sizes

### Storage Management

1. **Capacity Planning**
   - Monitor growth rate
   - Plan for 3x current database size
   - Set up alerts at 70% full

2. **Backup Optimization**
   - Use compression (gzip)
   - Consider incremental backups for large databases
   - Archive old backups to cheaper storage

3. **Off-site Backups**
   - Copy backups to external storage
   - Use cloud storage (S3, GCS, Azure Blob)
   - Test recovery from off-site backups

### Security

1. **Access Control**
   - Limit access to backup PVC
   - Use RBAC for backup operations
   - Audit backup/restore actions

2. **Encryption**
   - Enable encryption at rest
   - Encrypt backups before off-site transfer
   - Secure database credentials

3. **Compliance**
   - Follow data retention policies
   - Document backup procedures
   - Regular restore testing

### Operational Procedures

1. **Backup Checklist**
   - [ ] Daily automated backup running
   - [ ] Backup verification passing
   - [ ] Disk usage under 70%
   - [ ] No failed jobs in last 24 hours
   - [ ] Restore tested in last 30 days

2. **Pre-Maintenance Checklist**
   - [ ] Create manual backup
   - [ ] Verify backup integrity
   - [ ] Download backup locally
   - [ ] Document restore procedure
   - [ ] Have rollback plan

3. **Post-Restore Checklist**
   - [ ] Verify table count
   - [ ] Test application functionality
   - [ ] Check data integrity
   - [ ] Review application logs
   - [ ] Notify users of restoration

## Advanced Topics

### Incremental Backups

For large databases, consider incremental backups using WAL archiving:

```yaml
# Enable WAL archiving in postgres configuration
archive_mode = on
archive_command = 'test ! -f /backups/wal/%f && cp %p /backups/wal/%f'
```

### Backup to S3

Modify backup script to upload to S3:

```bash
# Install AWS CLI in backup pod
apk add aws-cli

# Upload after backup
aws s3 cp $BACKUP_FILE s3://my-bucket/postgres-backups/
```

### Encrypted Backups

Add encryption to backup script:

```bash
# Encrypt backup
pg_dump ... | gzip | openssl enc -aes-256-cbc -salt -k "$ENCRYPTION_KEY" > $BACKUP_FILE

# Decrypt for restore
openssl enc -d -aes-256-cbc -k "$ENCRYPTION_KEY" -in $BACKUP_FILE | gunzip | psql ...
```

### Multiple Backup Destinations

Store backups in multiple locations:

```bash
# Local PVC
pg_dump ... | gzip > /backups/backup.sql.gz

# S3
pg_dump ... | gzip | aws s3 cp - s3://bucket/backup.sql.gz

# Remote server via SSH
pg_dump ... | gzip | ssh backup-server "cat > /backups/backup.sql.gz"
```

## Summary

✅ **Backup System Checklist:**

- [ ] backup-pvc deployed (20 GB)
- [ ] postgres-backup CronJob deployed
- [ ] restore-job template created
- [ ] Manual backup tested
- [ ] Restore procedure tested
- [ ] Helper scripts working
- [ ] Monitoring in place
- [ ] Team trained on procedures

## Resources

- [PostgreSQL Backup Documentation](https://www.postgresql.org/docs/current/backup.html)
- [Kubernetes CronJob Documentation](https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/)
- [pg_dump Reference](https://www.postgresql.org/docs/current/app-pgdump.html)
- [psql Reference](https://www.postgresql.org/docs/current/app-psql.html)

## Support

For issues or questions:
1. Check troubleshooting section
2. Review backup job logs
3. Verify database connectivity
4. Test with manual backup

**Quick Commands:**
```bash
# Backup
./k8s/run-backup.sh

# List
./k8s/list-backups.sh

# Restore
./k8s/run-restore.sh /backups/backup-YYYYMMDD-HHMMSS.sql.gz

# Monitor
kubectl get jobs -n educard-prod -l app=postgres-backup
```
