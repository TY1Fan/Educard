# Educard Administrator Guide

**Version:** 1.0.0  
**Last Updated:** December 9, 2024  
**Audience:** System Administrators, Moderators

This guide provides instructions for administrators and moderators managing the Educard forum platform.

---

## Table of Contents

1. [Overview](#overview)
2. [Access and Permissions](#access-and-permissions)
3. [Admin Dashboard](#admin-dashboard)
4. [User Management](#user-management)
5. [Content Moderation](#content-moderation)
6. [System Monitoring](#system-monitoring)
7. [Database Management](#database-management)
8. [Security Management](#security-management)
9. [Backup and Recovery](#backup-and-recovery)
10. [Troubleshooting](#troubleshooting)
11. [Best Practices](#best-practices)

---

## Overview

### Administrator Roles

**Super Administrator:**
- Full system access
- User management (create, modify, delete)
- System configuration
- Database access
- Security settings

**Moderator:**
- Content moderation
- User warnings and suspensions
- Report handling
- Limited user management

**Support Staff:**
- View-only dashboard access
- Handle user inquiries
- Basic troubleshooting

### Key Responsibilities

✅ **User Management:** Monitor and manage user accounts  
✅ **Content Moderation:** Review and moderate content  
✅ **System Health:** Monitor performance and uptime  
✅ **Security:** Maintain security measures  
✅ **Support:** Respond to user issues  
✅ **Backups:** Ensure regular data backups  

---

## Access and Permissions

### Accessing Admin Dashboard

1. **Login as Administrator**
   - Use admin credentials
   - Navigate to `/admin` or `/dashboard`

2. **Verify Admin Access**
   - Admin menu appears in navigation
   - Dashboard link available

**Admin Dashboard URL:**
```
http://localhost:3000/admin
```

### Setting Up Admin Accounts

**Method 1: Database Direct (Initial Setup)**
```sql
-- Connect to database
docker exec -it educard_db psql -U postgres -d educard

-- Update user role to admin
UPDATE users 
SET role = 'admin' 
WHERE username = 'your_username';

-- Verify
SELECT id, username, email, role FROM users WHERE role = 'admin';
```

**Method 2: Via Existing Admin (Preferred)**
1. Login as existing admin
2. Navigate to User Management
3. Find user to promote
4. Change role to "Admin" or "Moderator"
5. Save changes

### Permission Levels

| Action | Super Admin | Moderator | Support |
|--------|-------------|-----------|---------|
| View Dashboard | ✅ | ✅ | ✅ |
| User Management | ✅ | Limited | ❌ |
| Delete Users | ✅ | ❌ | ❌ |
| Content Moderation | ✅ | ✅ | ❌ |
| System Settings | ✅ | ❌ | ❌ |
| Database Access | ✅ | ❌ | ❌ |
| View Logs | ✅ | ✅ | Limited |
| Ban Users | ✅ | ✅ | ❌ |

---

## Admin Dashboard

### Dashboard Overview

The admin dashboard provides at-a-glance system information:

**Key Metrics:**
- Total Users (active, new today)
- Total Threads (created today)
- Total Posts (created today)
- Active Sessions (current online users)
- System Health (CPU, memory, database)
- Recent Activity Feed

**Quick Actions:**
- View Reported Content
- Ban/Unban Users
- View Logs
- System Settings
- Backup Database

### Dashboard Sections

**1. Statistics Panel**
```
┌─────────────────────────────────────┐
│ Users: 1,234 (+15 today)           │
│ Threads: 5,678 (+42 today)         │
│ Posts: 23,456 (+203 today)         │
│ Active Now: 87 users               │
└─────────────────────────────────────┘
```

**2. Recent Activity**
- New user registrations
- New threads created
- Reported content
- User bans/unbans
- System events

**3. System Health**
- Application uptime
- Database connection status
- Memory usage
- CPU usage
- Disk space
- Error rate

**4. Alerts**
- High error rate warnings
- Database connection issues
- Disk space warnings
- Security alerts
- Suspicious activity

---

## User Management

### Viewing Users

1. **Navigate to Users Section**
   - Click "Users" in admin menu
   - View user list with filters

2. **Search and Filter**
   - Search by username, email
   - Filter by role (user, moderator, admin)
   - Filter by status (active, banned, suspended)
   - Sort by registration date, activity

3. **User List Columns:**
   - ID
   - Username
   - Email
   - Role
   - Status
   - Registration Date
   - Last Activity
   - Post Count
   - Actions

### Viewing User Details

1. **Click on Username**
2. **View User Profile:**
   - Basic information
   - Account status
   - Statistics (threads, posts, votes)
   - Recent activity
   - Login history
   - Moderation history

### Editing Users

1. **Find User** in user list
2. **Click "Edit" Button**
3. **Modify Fields:**
   - Email address
   - Role (user, moderator, admin)
   - Status (active, suspended, banned)
   - Password reset (if needed)

4. **Save Changes**
5. **User receives notification** (if enabled)

### Banning Users

**When to Ban:**
- Spam accounts
- Repeated violations
- Malicious behavior
- Illegal content
- Harassment

**How to Ban:**
1. **Navigate to User Profile**
2. **Click "Ban User" Button**
3. **Provide Reason:**
   - Spam
   - Harassment
   - Illegal content
   - Other (explain)

4. **Set Duration:**
   - Permanent
   - Temporary (specify days)

5. **Confirm Ban**

**What Happens:**
- User cannot login
- All content remains visible (unless deleted)
- User receives ban notification email
- Ban reason recorded in logs

### Unbanning Users

1. **Navigate to User Profile**
2. **Click "Unban User" Button**
3. **Confirm Unban**
4. **User can login again**

### Deleting Users

⚠️ **Warning:** User deletion is permanent and cannot be undone.

**When to Delete:**
- User requests account deletion (GDPR)
- Spam accounts with no valuable content
- Legal requirements

**How to Delete:**
1. **Navigate to User Profile**
2. **Click "Delete User" Button**
3. **Select Delete Options:**
   - Delete user only (keep content, mark as [deleted])
   - Delete user and all content (threads, posts)

4. **Type Username to Confirm**
5. **Confirm Deletion**

**What Gets Deleted:**
- User account
- Profile information
- Session data
- (Optionally) All threads and posts

### Bulk User Operations

**Export Users:**
```bash
# Export to CSV
docker-compose exec app node scripts/export-users.js > users.csv
```

**Bulk Ban (Security Breach):**
```sql
-- Ban multiple users by pattern
UPDATE users 
SET status = 'banned', 
    ban_reason = 'Security breach investigation'
WHERE created_at > '2024-01-01' 
  AND post_count = 0;
```

---

## Content Moderation

### Reviewing Reported Content

1. **Navigate to "Reports" Section**
2. **View Report Queue:**
   - Thread reports
   - Post reports
   - User reports
   - Sorted by date/severity

3. **Review Each Report:**
   - Original content
   - Report reason
   - Reporter information
   - Previous reports on same content

4. **Take Action:**
   - Dismiss report (no action needed)
   - Edit content (remove offensive parts)
   - Delete content
   - Warn user
   - Suspend/ban user

### Deleting Content

**Delete a Thread:**
1. Navigate to the thread
2. Click "Admin: Delete Thread"
3. Confirm deletion
4. Thread and all replies removed
5. Action logged

**Delete a Post:**
1. Navigate to the post
2. Click "Admin: Delete Post"
3. Confirm deletion
4. Post removed, replies remain
5. Action logged

### Editing Content

1. **Navigate to Content**
2. **Click "Admin: Edit"**
3. **Modify Content:**
   - Remove offensive language
   - Remove personal information
   - Remove illegal content
   - Add admin note

4. **Save Changes**
5. **"Edited by Admin" note added**

### Pinning Important Threads

1. **Navigate to Thread**
2. **Click "Pin Thread" Button**
3. **Thread appears at top** of category
4. **Unpin anytime** with "Unpin Thread"

### Locking Threads

**When to Lock:**
- Thread resolved, no more discussion needed
- Thread getting off-topic or heated
- Thread violates guidelines but has valuable info

**How to Lock:**
1. Navigate to thread
2. Click "Lock Thread" Button
3. Optionally add lock reason
4. Users can view but not reply

**How to Unlock:**
1. Navigate to locked thread
2. Click "Unlock Thread" Button

---

## System Monitoring

### Real-Time Monitoring

**Application Health:**
```bash
# Check application status
curl http://localhost:3000/health

# Response:
{
  "status": "ok",
  "uptime": 86400,
  "database": "connected",
  "memoryUsage": "245MB/512MB",
  "version": "1.0.0"
}
```

**View Application Logs:**
```bash
# Real-time logs
docker logs -f educard_app

# Last 100 lines
docker logs --tail 100 educard_app

# Logs from last hour
docker logs --since 1h educard_app
```

**Database Monitoring:**
```bash
# Database status
docker exec educard_db psql -U postgres -c "SELECT version();"

# Active connections
docker exec educard_db psql -U postgres -d educard -c "
  SELECT count(*) FROM pg_stat_activity;
"

# Database size
docker exec educard_db psql -U postgres -d educard -c "
  SELECT pg_size_pretty(pg_database_size('educard'));
"
```

### Performance Monitoring

**Key Metrics to Monitor:**

1. **Response Time**
   - Target: < 200ms for most pages
   - Alert: > 1000ms

2. **Error Rate**
   - Target: < 0.1%
   - Alert: > 1%

3. **Database Queries**
   - Target: < 50ms average
   - Alert: > 500ms

4. **Memory Usage**
   - Target: < 80% of available
   - Alert: > 90%

5. **CPU Usage**
   - Target: < 70%
   - Alert: > 85%

**Monitoring Tools:**
```bash
# System resources
docker stats educard_app educard_db

# Disk space
df -h

# Memory usage
free -h
```

### Activity Logs

**View User Activity:**
```sql
-- Recent logins
SELECT username, last_login_at 
FROM users 
ORDER BY last_login_at DESC 
LIMIT 20;

-- Active users (last 24 hours)
SELECT COUNT(*) 
FROM users 
WHERE last_active_at > NOW() - INTERVAL '24 hours';
```

**View Content Activity:**
```sql
-- Threads created today
SELECT COUNT(*) 
FROM threads 
WHERE created_at > CURRENT_DATE;

-- Posts created today
SELECT COUNT(*) 
FROM posts 
WHERE created_at > CURRENT_DATE;
```

**View Moderation Actions:**
```sql
-- Recent bans
SELECT u.username, u.ban_reason, u.banned_at 
FROM users u 
WHERE status = 'banned' 
ORDER BY banned_at DESC 
LIMIT 20;
```

---

## Database Management

### Database Access

```bash
# Access PostgreSQL shell
docker exec -it educard_db psql -U postgres -d educard

# Run query from command line
docker exec educard_db psql -U postgres -d educard -c "SELECT COUNT(*) FROM users;"
```

### Common Database Tasks

**View Table Sizes:**
```sql
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(tablename::text))
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename::text) DESC;
```

**Find Largest Posts:**
```sql
SELECT id, LENGTH(content), created_at
FROM posts
ORDER BY LENGTH(content) DESC
LIMIT 10;
```

**User Statistics:**
```sql
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as new_this_week,
  COUNT(CASE WHEN last_active_at > NOW() - INTERVAL '24 hours' THEN 1 END) as active_today
FROM users;
```

**Content Statistics:**
```sql
SELECT 
  (SELECT COUNT(*) FROM threads) as total_threads,
  (SELECT COUNT(*) FROM posts) as total_posts,
  (SELECT COUNT(*) FROM categories) as total_categories,
  (SELECT COUNT(*) FROM tags) as total_tags;
```

### Database Optimization

**Analyze Tables:**
```sql
ANALYZE users;
ANALYZE threads;
ANALYZE posts;
```

**Rebuild Indexes:**
```sql
REINDEX TABLE users;
REINDEX TABLE threads;
REINDEX TABLE posts;
```

**Vacuum Database:**
```bash
# Vacuum and analyze (reclaim space, update statistics)
docker exec educard_db psql -U postgres -d educard -c "VACUUM ANALYZE;"
```

---

## Security Management

### Security Monitoring

**Check Failed Login Attempts:**
```bash
# View authentication logs
docker logs educard_app | grep "Failed login"

# Count failed attempts by IP
docker logs educard_app | grep "Failed login" | awk '{print $X}' | sort | uniq -c | sort -nr
```

**Check for Suspicious Activity:**
- Multiple failed logins from same IP
- Rapid content creation (potential spam)
- Unusual database queries
- High error rates
- Unexpected admin actions

### Rate Limiting

**Current Rate Limits:**
- Login attempts: 5 per 15 minutes
- Registration: 3 per hour per IP
- Thread creation: 10 per hour
- Post creation: 30 per hour
- Search queries: 100 per hour

**Adjust Rate Limits:**
Edit `src/middleware/rateLimiting.js`

### Security Headers

**Verify Security Headers:**
```bash
curl -I http://localhost:3000

# Should include:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# X-XSS-Protection: 1; mode=block
# Strict-Transport-Security: max-age=31536000
# Content-Security-Policy: default-src 'self'
```

### SSL/TLS Management

**Production SSL Certificate:**
```bash
# Check certificate expiration
openssl s_client -connect educard.example.com:443 | openssl x509 -noout -dates

# Auto-renewal with certbot
certbot renew --dry-run
```

### Security Audits

**Run Security Audit:**
```bash
# Check dependencies for vulnerabilities
npm audit

# Fix automatically (if possible)
npm audit fix

# Update dependencies
npm update
```

**Manual Security Checks:**
- [ ] All passwords hashed (bcrypt)
- [ ] CSRF protection enabled
- [ ] XSS protection active
- [ ] SQL injection prevention (Sequelize ORM)
- [ ] Rate limiting configured
- [ ] Security headers present
- [ ] HTTPS enabled (production)
- [ ] Session secrets strong and unique
- [ ] File upload restrictions in place

---

## Backup and Recovery

### Database Backups

**Manual Backup:**
```bash
# Backup entire database
docker exec educard_db pg_dump -U postgres educard > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup specific tables
docker exec educard_db pg_dump -U postgres -t users -t threads -t posts educard > backup_content.sql
```

**Automated Backups:**
```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
docker exec educard_db pg_dump -U postgres educard > $BACKUP_DIR/educard_$DATE.sql
# Keep only last 7 days
find $BACKUP_DIR -name "educard_*.sql" -mtime +7 -delete
EOF

chmod +x backup.sh

# Add to cron (daily at 2 AM)
crontab -e
# Add line:
0 2 * * * /path/to/backup.sh
```

### Database Restore

**From Backup File:**
```bash
# Stop application
docker-compose stop app

# Restore database
docker exec -i educard_db psql -U postgres educard < backup_20241209.sql

# Restart application
docker-compose start app
```

**Point-in-Time Recovery:**
See [BACKUP_RESTORE.md](./BACKUP_RESTORE.md) for detailed instructions.

### File Backups

**Backup Uploaded Files:**
```bash
# Backup uploads directory
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz public/uploads/

# Copy to safe location
cp uploads_backup_*.tar.gz /path/to/backup/location/
```

**Restore Uploads:**
```bash
# Extract backup
tar -xzf uploads_backup_20241209.tar.gz -C public/
```

---

## Troubleshooting

### Common Issues

**Issue: Application Won't Start**

**Symptoms:**
- Docker container exits immediately
- Error: "Port already in use"

**Solutions:**
```bash
# Check if port is in use
lsof -i :3000

# Kill process using port
kill -9 <PID>

# Or change port in .env
PORT=3001
```

**Issue: Database Connection Failed**

**Symptoms:**
- "Cannot connect to database"
- Application crashes on startup

**Solutions:**
```bash
# Check database is running
docker ps | grep educard_db

# Check database logs
docker logs educard_db

# Restart database
docker-compose restart db

# Verify credentials in .env match database
```

**Issue: High Memory Usage**

**Symptoms:**
- Application slow
- Out of memory errors

**Solutions:**
```bash
# Check memory usage
docker stats educard_app

# Clear cache
docker-compose exec app node -e "require('./src/utils/cache').clear()"

# Restart application
docker-compose restart app

# Increase memory limit in docker-compose.yml
```

**Issue: Slow Queries**

**Symptoms:**
- Pages load slowly
- High database CPU usage

**Solutions:**
```sql
-- Find slow queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active' AND now() - pg_stat_activity.query_start > interval '1 second';

-- Check missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public' AND n_distinct > 100
ORDER BY abs(correlation) DESC;

-- Analyze tables
ANALYZE;
```

**Issue: Users Can't Login**

**Check:**
1. Session secret configured?
2. Database connection working?
3. User account active (not banned)?
4. Cookies enabled in browser?
5. CSRF token issues?

**Solution:**
```bash
# Clear sessions
docker exec educard_db psql -U postgres -d educard -c "TRUNCATE TABLE sessions;"

# Restart application
docker-compose restart app
```

### Emergency Procedures

**Application Crash:**
1. Check logs: `docker logs educard_app`
2. Check database: `docker exec educard_db psql -U postgres -c "SELECT 1;"`
3. Restart: `docker-compose restart`
4. If persist: Restore from backup

**Database Corruption:**
1. Stop application immediately
2. Don't write any more data
3. Restore from most recent backup
4. Investigate root cause
5. Implement prevention measures

**Security Breach:**
1. Take application offline immediately
2. Review logs for unauthorized access
3. Change all passwords and secrets
4. Review and patch vulnerability
5. Restore from clean backup if needed
6. Notify users if data compromised

---

## Best Practices

### Daily Tasks

- [ ] Check dashboard for alerts
- [ ] Review reported content
- [ ] Monitor error logs
- [ ] Check system health metrics
- [ ] Respond to user support requests

### Weekly Tasks

- [ ] Review user growth and activity
- [ ] Analyze performance metrics
- [ ] Check backup completion
- [ ] Update documentation if needed
- [ ] Review security logs

### Monthly Tasks

- [ ] Full security audit
- [ ] Database optimization (VACUUM, ANALYZE)
- [ ] Review and update dependencies
- [ ] Test backup restoration
- [ ] Review and archive old content (if policy)
- [ ] Generate activity reports

### Moderation Guidelines

**Content Review:**
- Review context before action
- Be consistent with policies
- Document decisions
- Communicate with users when appropriate
- Escalate complex cases

**User Management:**
- Warning before ban (when appropriate)
- Document reasons for actions
- Review ban appeals fairly
- Check for repeat offenders
- Consider rehabilitation

**Communication:**
- Be professional and respectful
- Explain decisions clearly
- Provide policy references
- Allow users to respond
- Keep records of conversations

---

## Emergency Contacts

**Technical Issues:**
- DevOps Team: devops@educard.example.com
- Database Admin: dba@educard.example.com

**Security Issues:**
- Security Team: security@educard.example.com
- Emergency Hotline: +1-XXX-XXX-XXXX

**Legal/Compliance:**
- Legal Team: legal@educard.example.com
- Privacy Officer: privacy@educard.example.com

---

## Additional Resources

- [User Guide](./USER_GUIDE.md) - End-user documentation
- [Troubleshooting Guide](./TROUBLESHOOTING.md) - Detailed troubleshooting
- [Security Guide](./SECURITY-GUIDE.md) - Security best practices
- [Deployment Guide](./K3S_DEPLOYMENT.md) - Production deployment
- [Database Documentation](./DATABASE.md) - Database schema and queries
- [Operations Runbook](./OPERATIONS_RUNBOOK.md) - Operational procedures

---

**Document Version:** 1.0.0  
**Last Updated:** December 9, 2024  
**Maintained By:** Educard Admin Team  
**Feedback:** admin-docs@educard.example.com
