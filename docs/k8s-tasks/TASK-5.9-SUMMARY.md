# Task 5.9 - Database Migration Job Summary

**Completion Date:** November 27, 2025  
**Status:** ✅ Completed Successfully

## Overview
Created a Kubernetes Job to automate database migrations, enabling safe and repeatable schema updates without manual intervention. The Job uses the same application image and runs Sequelize migrations with proper configuration.

## Job Configuration

### Basic Details
- **Name:** educard-migration
- **Namespace:** educard-prod
- **Type:** Kubernetes Job (batch/v1)
- **Image:** tyifan/educard:v1.0.0 (same as application)

### Job Specifications
- **Restart Policy:** Never (don't retry on success)
- **Backoff Limit:** 3 (retry up to 3 times on failure)
- **TTL After Finished:** 100 seconds (auto-cleanup)
- **Completion:** Single pod execution (runs once)

### Resource Configuration
**Requests:**
- Memory: 128Mi
- CPU: 100m

**Limits:**
- Memory: 256Mi
- CPU: 200m

*Note: Lower resources than application since migrations are lightweight*

### Command Override
The Job overrides the default container command to run migrations:

```bash
npx sequelize-cli db:migrate \
  --config /app/src/config/database.js \
  --migrations-path /app/src/migrations \
  --env production
```

**Why explicit paths?**
- `.sequelizerc` file not included in Docker image
- Sequelize CLI needs explicit configuration paths
- Ensures production environment is used

### Environment Variables
**From ConfigMap (educard-config):**
1. NODE_ENV=production
2. DB_HOST=postgres-service
3. DB_PORT=5432
4. DB_NAME=educard_prod

**From Secrets (educard-secrets):**
1. DB_USER=educard
2. DB_PASSWORD=[secure]

*Note: SESSION_SECRET not needed for migrations*

## Migration Process

### Step 1: Job Creation
```bash
$ kubectl apply -f k8s/migration-job.yaml
job.batch/educard-migration created
```

### Step 2: Pod Execution
```bash
$ kubectl get pods -n educard-prod -l app=educard-migration
NAME                      READY   STATUS      RESTARTS   AGE
educard-migration-qhhvr   0/1     Completed   0          20s
```

### Step 3: Migration Execution
```bash
$ kubectl logs -n educard-prod -l app=educard-migration
Loaded configuration file "src/config/database.js".
Using environment "production".
No migrations were executed, database schema was already up to date.
Migrations completed successfully
```

### Step 4: Job Completion
```bash
$ kubectl get jobs educard-migration -n educard-prod
NAME                STATUS     COMPLETIONS   DURATION   AGE
educard-migration   Complete   1/1           20s        20s
```

### Step 5: Auto-Cleanup
After 100 seconds (TTL):
```bash
$ kubectl get jobs -n educard-prod
No resources found in educard-prod namespace.
```

## Idempotency

### Why It's Safe to Run Multiple Times
Sequelize tracks applied migrations in the `SequelizeMeta` table:

```sql
SELECT name FROM "SequelizeMeta" ORDER BY name;
```

**Results:**
```
20251113141404-create-categories-table.js
20251113141433-create-threads-table.js
20251113141446-create-posts-table.js
20251113182902-create-users-table.js
20251126073749-create-post-reactions.js
20251126075023-create-notifications.js
20251126075956-add-user-roles.js
20251126081358-add-user-ban-status.js
20251126082054-create-reports.js
20251126082220-add-hidden-to-posts.js
20251127022800-add-performance-indexes.js
```

**Behavior:**
- ✅ Already applied migrations: Skipped
- ✅ New migrations: Applied
- ✅ Failed migrations: Rolled back (if transaction supported)

## Migration Tracking

### Database Schema
All tables successfully created and maintained:

```
             List of relations
 Schema |      Name      | Type  |  Owner  
--------+----------------+-------+---------
 public | SequelizeMeta  | table | educard
 public | categories     | table | educard
 public | notifications  | table | educard
 public | post_reactions | table | educard
 public | posts          | table | educard
 public | reports        | table | educard
 public | threads        | table | educard
 public | users          | table | educard
(8 rows)
```

### Migration History
Total: 11 migrations applied
- **Schema Creation:** 7 tables
- **Schema Modifications:** 4 alterations (roles, ban status, hidden flag, indexes)

## Files Created

### 1. k8s/migration-job.yaml (2.5KB)
```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: educard-migration
  namespace: educard-prod
spec:
  ttlSecondsAfterFinished: 100
  backoffLimit: 3
  template:
    spec:
      restartPolicy: Never
      containers:
      - name: migration
        image: tyifan/educard:v1.0.0
        command:
        - sh
        - -c
        - |
          npx sequelize-cli db:migrate \
            --config /app/src/config/database.js \
            --migrations-path /app/src/migrations \
            --env production
        env:
        - name: NODE_ENV
          value: "production"
        # ... ConfigMap and Secret references
```

### 2. k8s/run-migration.sh (3.8KB)
Automated helper script that:
- ✅ Checks if Job already exists (prompts to delete)
- ✅ Applies Job manifest
- ✅ Waits for pod creation
- ✅ Follows migration logs in real-time
- ✅ Displays migration results
- ✅ Shows database tables and applied migrations
- ✅ Provides useful commands for troubleshooting

**Usage:**
```bash
./k8s/run-migration.sh
```

## Use Cases

### 1. Fresh Deployment
**Scenario:** Deploying to a new environment with empty database

**Process:**
1. Deploy database (postgres)
2. Run migration Job
3. Deploy application
4. Verify schema created

### 2. Schema Updates
**Scenario:** New migration files added to codebase

**Process:**
1. Build new Docker image with updated migrations
2. Push image to registry
3. Update Job manifest with new image tag
4. Run migration Job
5. Verify new migrations applied
6. Update application deployment

### 3. Rollback Testing
**Scenario:** Testing migration rollback procedures

**Process:**
1. Note current schema state
2. Apply new migration
3. Test rollback (if supported)
4. Verify schema restored

### 4. Development/Staging Sync
**Scenario:** Syncing schema from production to staging

**Process:**
1. Export production schema
2. Apply to staging database
3. Run migrations to catch up
4. Verify parity

## Integration with CI/CD

### GitHub Actions Example
```yaml
- name: Run Database Migrations
  run: |
    kubectl apply -f k8s/migration-job.yaml
    kubectl wait --for=condition=complete --timeout=300s job/educard-migration -n educard-prod
    kubectl logs -n educard-prod -l app=educard-migration
```

### Pre-Deployment Hook
```yaml
apiVersion: batch/v1
kind: Job
metadata:
  annotations:
    helm.sh/hook: pre-install,pre-upgrade
    helm.sh/hook-delete-policy: before-hook-creation
```

## Error Handling

### Common Issues

#### Issue 1: Image Pull Failed
**Symptom:** `ImagePullBackOff` error  
**Cause:** Incorrect image name or missing registry credentials  
**Solution:**
```bash
# Verify image exists
docker pull tyifan/educard:v1.0.0

# Check deployment image
kubectl get deployment educard-app -n educard-prod -o jsonpath='{.spec.template.spec.containers[0].image}'

# Update migration-job.yaml with correct image
```

#### Issue 2: Database Connection Failed
**Symptom:** Job fails with connection timeout  
**Cause:** Database not ready or incorrect credentials  
**Solution:**
```bash
# Check database pod
kubectl get pods postgres-0 -n educard-prod

# Test connection from app pod
kubectl exec -n educard-prod <app-pod> -- wget -q -O- postgres-service:5432

# Verify credentials in ConfigMap/Secret
kubectl get configmap educard-config -n educard-prod -o yaml
kubectl get secret educard-secrets -n educard-prod -o yaml
```

#### Issue 3: Migration Syntax Error
**Symptom:** Job completes but logs show SQL errors  
**Cause:** Invalid migration file syntax  
**Solution:**
```bash
# Check migration logs
kubectl logs -n educard-prod -l app=educard-migration

# Verify migration files locally
npm run db:migrate

# Fix migration file and rebuild image
```

#### Issue 4: Job Stuck in Running
**Symptom:** Job never completes  
**Cause:** Migration hanging or very slow  
**Solution:**
```bash
# Check pod logs
kubectl logs -n educard-prod -l app=educard-migration -f

# Check database locks
kubectl exec postgres-0 -n educard-prod -- psql -U educard -d educard_prod -c "SELECT * FROM pg_locks;"

# Delete and retry
kubectl delete job educard-migration -n educard-prod
```

## Security Considerations

### 1. Non-Root User
Job runs as user 1001 (nodejs user):
```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1001
```

### 2. Capabilities Drop
All Linux capabilities dropped:
```yaml
capabilities:
  drop:
  - ALL
```

### 3. No Privilege Escalation
Prevents container from gaining additional privileges:
```yaml
allowPrivilegeEscalation: false
```

### 4. Secret Management
Database credentials stored in Kubernetes Secrets (not in manifest):
- Base64 encoded at rest
- RBAC-protected access
- Not logged in pod output

## Monitoring

### Job Metrics
```bash
# View Job history
kubectl get jobs -n educard-prod --show-labels

# Check Job events
kubectl describe job educard-migration -n educard-prod

# View pod events
kubectl get events -n educard-prod --field-selector involvedObject.name=educard-migration-xxx
```

### Success Indicators
- ✅ Job status: Complete
- ✅ Pod status: Succeeded
- ✅ Exit code: 0
- ✅ Logs contain: "Migrations completed successfully"

### Failure Indicators
- ❌ Job status: Failed
- ❌ Pod status: Error or CrashLoopBackOff
- ❌ Exit code: Non-zero
- ❌ Logs contain: "ERROR"

## Useful Commands

### Run Migration Job
```bash
# Using helper script (recommended)
./k8s/run-migration.sh

# Manual application
kubectl apply -f k8s/migration-job.yaml
```

### Monitor Job
```bash
# Watch Job status
kubectl get jobs educard-migration -n educard-prod -w

# Follow logs
kubectl logs -n educard-prod -l app=educard-migration -f

# Check pod status
kubectl get pods -n educard-prod -l app=educard-migration
```

### Verify Results
```bash
# List all tables
kubectl exec postgres-0 -n educard-prod -- psql -U educard -d educard_prod -c "\dt"

# Check applied migrations
kubectl exec postgres-0 -n educard-prod -- psql -U educard -d educard_prod -c "SELECT name FROM \"SequelizeMeta\" ORDER BY name;"

# Count tables
kubectl exec postgres-0 -n educard-prod -- psql -U educard -d educard_prod -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';"
```

### Cleanup
```bash
# Delete Job manually (if not using TTL)
kubectl delete job educard-migration -n educard-prod

# Delete all completed Jobs
kubectl delete jobs -n educard-prod --field-selector status.successful=1
```

## Best Practices

### 1. Version Control
- ✅ Commit migration files with application code
- ✅ Use meaningful migration names with timestamps
- ✅ Include rollback logic (down migrations)

### 2. Testing
- ✅ Test migrations on development/staging first
- ✅ Verify rollback procedures work
- ✅ Check for data loss or corruption

### 3. Timing
- ✅ Run migrations before deploying new app version
- ✅ Use pre-deployment hooks in CI/CD
- ✅ Schedule maintenance window for large migrations

### 4. Monitoring
- ✅ Monitor Job completion status
- ✅ Alert on migration failures
- ✅ Log migration execution times

### 5. Backup
- ✅ Backup database before migrations
- ✅ Document rollback procedures
- ✅ Test restore process

## Future Enhancements

### 1. InitContainer for Migrations
Instead of separate Job, run migrations as InitContainer:
```yaml
initContainers:
- name: run-migrations
  image: tyifan/educard:v1.0.0
  command: ["npm", "run", "db:migrate"]
```

**Pros:**
- Automatic execution before app starts
- No manual Job management

**Cons:**
- Delays pod startup
- Multiple pods may race to run migrations

### 2. Migration Lock Mechanism
Prevent concurrent migrations:
```sql
CREATE TABLE migration_lock (
  id INT PRIMARY KEY,
  locked_at TIMESTAMP
);
```

### 3. Progressive Rollout
Run migrations on canary pod first:
```yaml
spec:
  strategy:
    canary:
      steps:
      - setWeight: 10
      - pause: {duration: 10m}
```

### 4. Automated Rollback
Detect migration failure and auto-rollback:
```yaml
postSync:
  hooks:
  - name: migration-rollback
    template: migration-rollback-job
```

## Conclusion

Task 5.9 completed successfully with:
- ✅ Kubernetes Job manifest created
- ✅ Job executed successfully (idempotent)
- ✅ Database schema verified (8 tables)
- ✅ Auto-cleanup via TTL (100 seconds)
- ✅ Helper script for easy execution
- ✅ Comprehensive error handling
- ✅ Security best practices applied

The migration Job provides a reliable, automated way to manage database schema updates in Kubernetes, with proper idempotency, error handling, and cleanup. It's ready for integration into CI/CD pipelines and supports both initial deployments and ongoing schema updates.

**Key Benefits:**
- 🚀 Automated schema management
- 🔄 Idempotent execution (safe to re-run)
- 🧹 Self-cleaning (TTL auto-delete)
- 🔒 Secure (non-root, secrets-based)
- 📊 Observable (logs, events, metrics)
- 🛠️ Easy to use (helper script provided)
