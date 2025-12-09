# Task 5.10 - Database Seed Job Summary

**Completion Date:** November 27, 2025  
**Status:** ✅ Completed Successfully

## Overview
Created a Kubernetes Job to automatically seed initial data (forum categories) into the database, providing a ready-to-use forum structure for the Educard application.

## Job Configuration

### Basic Details
- **Name:** educard-seed
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

### Command Override
The Job runs Sequelize seeders:

```bash
npx sequelize-cli db:seed:all \
  --config /app/src/config/database.js \
  --seeders-path /app/src/seeders \
  --env production
```

### Environment Variables
**From ConfigMap (educard-config):**
1. NODE_ENV=production
2. DB_HOST=postgres-service
3. DB_PORT=5432
4. DB_NAME=educard_prod

**From Secrets (educard-secrets):**
1. DB_USER=educard
2. DB_PASSWORD=[secure]

## Package.json Updates

### New Scripts Added
```json
{
  "scripts": {
    "db:seed": "npx sequelize-cli db:seed:all",
    "db:seed:undo": "npx sequelize-cli db:seed:undo:all"
  }
}
```

**Usage:**
```bash
# Run all seeders
npm run db:seed

# Undo all seeders (delete seeded data)
npm run db:seed:undo
```

## Seeder Details

### Existing Seeder File
**File:** `src/seeders/20251113142453-demo-categories.js`

**Creates 6 Forum Categories:**

1. **Announcements** (announcements)
   - Important announcements and updates from the Educard team
   - Display order: 0

2. **General Discussion** (general-discussion)
   - General topics and conversations about education and learning
   - Display order: 1

3. **Questions & Answers** (questions-answers)
   - Ask questions and get help from the community
   - Display order: 2

4. **Study Groups** (study-groups)
   - Find and organize study groups with other learners
   - Display order: 3

5. **Resources** (resources)
   - Share and discover educational resources and materials
   - Display order: 4

6. **Off-Topic** (off-topic)
   - Casual conversations and topics unrelated to education
   - Display order: 5

### Seeder Structure
```javascript
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('categories', [
      {
        name: 'Announcements',
        description: 'Important announcements...',
        slug: 'announcements',
        display_order: 0,
        created_at: new Date()
      },
      // ... more categories
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('categories', null, {});
  }
};
```

## Seeding Process

### Step 1: Job Creation
```bash
$ kubectl apply -f k8s/seed-job.yaml
job.batch/educard-seed created
```

### Step 2: Pod Execution
```bash
$ kubectl get pods -n educard-prod -l app=educard-seed
NAME                   READY   STATUS      RESTARTS   AGE
educard-seed-5dz4j     0/1     Completed   0          20s
```

### Step 3: Job Completion
Job completed successfully in ~20 seconds and auto-deleted via TTL.

### Step 4: Data Verification
```bash
$ kubectl exec -n educard-prod postgres-0 -- psql -U educard -d educard_prod \
  -c "SELECT name, slug, display_order FROM categories ORDER BY display_order;"

        name         |        slug        | display_order 
---------------------+--------------------+---------------
 Announcements       | announcements      |             0
 General Discussion  | general-discussion |             1
 Questions & Answers | questions-answers  |             2
 Study Groups        | study-groups       |             3
 Resources           | resources          |             4
 Off-Topic           | off-topic          |             5
(6 rows)
```

## Seeded Data Details

### Categories Table
All records include complete data:

```sql
SELECT * FROM categories ORDER BY display_order;
```

**Fields:**
- `id` - Auto-generated primary key
- `name` - Display name of the category
- `description` - Detailed description
- `slug` - URL-friendly identifier
- `display_order` - Sort order (0-5)
- `created_at` - Timestamp of creation
- `updated_at` - Last update timestamp (NULL initially)

### Data Integrity
✅ All 6 categories created successfully  
✅ Unique slugs for URL routing  
✅ Sequential display order  
✅ Descriptive text for each category  
✅ Proper timestamps

## Files Created

### 1. k8s/seed-job.yaml (2.5KB)
```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: educard-seed
  namespace: educard-prod
spec:
  ttlSecondsAfterFinished: 100
  backoffLimit: 3
  template:
    spec:
      restartPolicy: Never
      containers:
      - name: seed
        image: tyifan/educard:v1.0.0
        command:
        - sh
        - -c
        - |
          npx sequelize-cli db:seed:all \
            --config /app/src/config/database.js \
            --seeders-path /app/src/seeders \
            --env production
        env:
        - name: NODE_ENV
          value: "production"
        # ... ConfigMap and Secret references
```

### 2. k8s/run-seed.sh (4.2KB)
Automated helper script that:
- ✅ Checks existing data (warns about duplicates)
- ✅ Prompts before seeding if data exists
- ✅ Checks if Job already exists
- ✅ Applies Job manifest
- ✅ Waits for pod creation
- ✅ Follows seeding logs in real-time
- ✅ Displays seeded categories
- ✅ Shows record count
- ✅ Provides useful commands

**Usage:**
```bash
./k8s/run-seed.sh
```

### 3. Updated package.json
Added seed-related npm scripts for local development and CI/CD integration.

## Important: Non-Idempotent Behavior

### Warning
⚠️ **Sequelize seeders are NOT idempotent by default**

Running the seed Job multiple times will create duplicate records:
```sql
-- First run: 6 categories
-- Second run: 12 categories (6 duplicates)
-- Third run: 18 categories (12 duplicates)
```

### Prevention
The `run-seed.sh` helper script includes duplicate detection:

```bash
Checking existing data...
Current categories in database: 6
Warning: Database already has categories
Running this seed will add duplicate data
Do you want to continue? (y/n)
```

### Manual Check
```bash
# Check category count before seeding
kubectl exec -n educard-prod postgres-0 -- \
  psql -U educard -d educard_prod -tAc "SELECT COUNT(*) FROM categories;"
```

### Cleanup (if duplicates created)
```bash
# Delete all categories
kubectl exec -n educard-prod postgres-0 -- \
  psql -U educard -d educard_prod -c "DELETE FROM categories;"

# Then re-run seed Job
kubectl apply -f k8s/seed-job.yaml
```

## Use Cases

### 1. Fresh Deployment
**Scenario:** New environment with empty database

**Process:**
1. Deploy infrastructure (database, ConfigMap, Secrets)
2. Run migration Job (create tables)
3. Run seed Job (add initial categories)
4. Deploy application
5. Verify categories visible in UI

### 2. Development/Staging Setup
**Scenario:** Setting up test environment

**Process:**
1. Clone production schema (via migrations)
2. Seed with test data
3. Optionally add additional test users/threads

### 3. Production Initialization
**Scenario:** First-time production deployment

**Process:**
1. Run migrations to create schema
2. Run seed Job for categories
3. Manually create admin user (if needed)
4. Deploy application
5. Verify forum is functional

### 4. Data Reset
**Scenario:** Resetting environment to clean state

**Process:**
1. Delete all user-generated content
2. Keep or recreate categories
3. Re-seed if needed

## Integration Points

### Application Integration
The application automatically uses seeded categories:

**Homepage:**
- Lists all categories ordered by `display_order`
- Shows category names and descriptions
- Displays thread counts per category

**Category Pages:**
- URL routing via slugs: `/category/announcements`
- Filter threads by category
- Show category details

**Thread Creation:**
- Dropdown list of available categories
- Required field for new threads
- Foreign key relationship

### Database Schema
```sql
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  slug VARCHAR(255) UNIQUE NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP
);

-- Foreign key from threads table
ALTER TABLE threads 
  ADD CONSTRAINT fk_category 
  FOREIGN KEY (category_id) 
  REFERENCES categories(id);
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
```yaml
allowPrivilegeEscalation: false
```

### 4. Credentials Management
Database credentials from Kubernetes Secrets (not hardcoded).

## Monitoring

### Job Success Indicators
- ✅ Job status: Complete
- ✅ Pod status: Succeeded
- ✅ Exit code: 0
- ✅ Categories count: 6

### Verification Commands
```bash
# Check Job status
kubectl get jobs educard-seed -n educard-prod

# View Job logs
kubectl logs -n educard-prod -l app=educard-seed

# Check Job events
kubectl get events -n educard-prod | grep seed

# Verify seeded data
kubectl exec -n educard-prod postgres-0 -- \
  psql -U educard -d educard_prod -c "SELECT COUNT(*) FROM categories;"
```

## Troubleshooting

### Issue 1: Duplicate Categories
**Symptom:** More than 6 categories in database  
**Cause:** Seed Job run multiple times  
**Solution:**
```bash
# Delete duplicates
kubectl exec -n educard-prod postgres-0 -- \
  psql -U educard -d educard_prod -c "DELETE FROM categories WHERE id > 6;"

# Or delete all and re-seed
kubectl exec -n educard-prod postgres-0 -- \
  psql -U educard -d educard_prod -c "DELETE FROM categories;"
kubectl apply -f k8s/seed-job.yaml
```

### Issue 2: Foreign Key Constraint
**Symptom:** Cannot delete categories (threads reference them)  
**Cause:** Threads exist in those categories  
**Solution:**
```bash
# Check thread count per category
kubectl exec -n educard-prod postgres-0 -- \
  psql -U educard -d educard_prod -c \
  "SELECT c.name, COUNT(t.id) FROM categories c 
   LEFT JOIN threads t ON c.id = t.category_id 
   GROUP BY c.name;"

# Delete threads first (if needed)
# Or use CASCADE delete
```

### Issue 3: Job Fails to Complete
**Symptom:** Job stays in Running/Pending state  
**Cause:** Database connection issue or seeder error  
**Solution:**
```bash
# Check pod logs
kubectl logs -n educard-prod -l app=educard-seed

# Check pod events
kubectl describe pod -n educard-prod -l app=educard-seed

# Verify database is accessible
kubectl exec -n educard-prod postgres-0 -- psql -U educard -l
```

## Useful Commands

### Run Seed Job
```bash
# Using helper script (recommended - includes checks)
./k8s/run-seed.sh

# Manual application
kubectl apply -f k8s/seed-job.yaml
```

### View Seeded Data
```bash
# List all categories
kubectl exec -n educard-prod postgres-0 -- \
  psql -U educard -d educard_prod -c \
  "SELECT * FROM categories ORDER BY display_order;"

# Count categories
kubectl exec -n educard-prod postgres-0 -- \
  psql -U educard -d educard_prod -tAc \
  "SELECT COUNT(*) FROM categories;"

# View specific category
kubectl exec -n educard-prod postgres-0 -- \
  psql -U educard -d educard_prod -c \
  "SELECT * FROM categories WHERE slug='announcements';"
```

### Cleanup
```bash
# Delete all categories (careful - breaks threads!)
kubectl exec -n educard-prod postgres-0 -- \
  psql -U educard -d educard_prod -c "DELETE FROM categories;"

# Delete Job manually
kubectl delete job educard-seed -n educard-prod

# Undo seeding (if seeder supports down migration)
# Note: Requires manual implementation
```

## Best Practices

### 1. Run Order
✅ Migrations first, then seeds:
```bash
# Correct order
./k8s/run-migration.sh  # Create tables
./k8s/run-seed.sh       # Add initial data
```

### 2. Environment Separation
✅ Different seeds for different environments:
- **Development:** Full test dataset with users/threads
- **Staging:** Production-like categories only
- **Production:** Minimal essential data (categories only)

### 3. Data Validation
✅ Always verify after seeding:
```bash
# Check count
SELECT COUNT(*) FROM categories;

# Verify no nulls
SELECT * FROM categories WHERE slug IS NULL;

# Check for duplicates
SELECT slug, COUNT(*) FROM categories GROUP BY slug HAVING COUNT(*) > 1;
```

### 4. Backup Before Seeding
✅ Backup before running in production:
```bash
# Backup database
kubectl exec -n educard-prod postgres-0 -- \
  pg_dump -U educard educard_prod > backup.sql
```

## Future Enhancements

### 1. Idempotent Seeders
Modify seeders to check for existing data:
```javascript
async up(queryInterface, Sequelize) {
  const existing = await queryInterface.sequelize.query(
    "SELECT COUNT(*) FROM categories WHERE slug='announcements'"
  );
  
  if (existing[0][0].count === '0') {
    // Only insert if not exists
    await queryInterface.bulkInsert('categories', [...]);
  }
}
```

### 2. Admin User Seeder
Create additional seeder for admin account:
```bash
# New file: src/seeders/20251127-admin-user.js
# Creates default admin with secure password
```

### 3. Conditional Seeding
Seed based on environment:
```javascript
if (process.env.NODE_ENV === 'production') {
  // Production seeds only
} else {
  // Development seeds (more data)
}
```

### 4. Seed Status Tracking
Track which seeds have been applied:
```sql
CREATE TABLE seed_meta (
  name VARCHAR(255) PRIMARY KEY,
  applied_at TIMESTAMP DEFAULT NOW()
);
```

## Conclusion

Task 5.10 completed successfully with:
- ✅ Kubernetes Job manifest created
- ✅ Job executed successfully (~20s completion)
- ✅ 6 forum categories seeded
- ✅ All data verified in database
- ✅ Auto-cleanup via TTL (100 seconds)
- ✅ Helper script with duplicate detection
- ✅ Package.json updated with seed commands
- ✅ Security best practices applied

The seed Job provides initial forum structure, making the Educard application immediately usable after deployment. Users can start creating threads in the pre-configured categories without manual setup.

**Key Benefits:**
- 🚀 Automated data initialization
- 📋 Ready-to-use forum categories
- 🔒 Secure execution (non-root, secrets-based)
- 🧹 Self-cleaning (TTL auto-delete)
- 🛡️ Duplicate detection (via helper script)
- 📊 Observable (logs, events, verification)
- 🛠️ Easy to use and extend
