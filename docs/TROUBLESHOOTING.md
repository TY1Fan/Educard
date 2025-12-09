# Troubleshooting Guide

This guide helps you diagnose and resolve common issues with Educard in both development and Kubernetes deployment environments.

## Table of Contents

### Development Environment
1. [Installation Issues](#installation-issues)
2. [Database Issues (Development)](#database-issues-development)
3. [Authentication Issues](#authentication-issues)
4. [Application Errors](#application-errors)
5. [Performance Issues (Development)](#performance-issues-development)
6. [Docker Issues](#docker-issues)

### Kubernetes Deployment
7. [Pod Issues](#pod-issues)
8. [Application Issues (K8s)](#application-issues-k8s)
9. [Database Issues (K8s)](#database-issues-k8s)
10. [Network Issues](#network-issues)
11. [Storage Issues](#storage-issues)
12. [Performance Issues (K8s)](#performance-issues-k8s)
13. [Resource Issues](#resource-issues)
14. [Backup Issues](#backup-issues)

### General
15. [Production Issues](#production-issues)
16. [Debugging Tips](#debugging-tips)
17. [Getting Help](#getting-help)

---

# Development Environment Troubleshooting

---

## Installation Issues

### npm install fails

**Problem:** `npm install` returns errors or fails to complete.

**Solutions:**

1. **Clear npm cache:**
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

2. **Check Node.js version:**
```bash
node --version  # Should be 18.x or higher
npm --version
```

3. **Update npm:**
```bash
npm install -g npm@latest
```

4. **Check for native dependencies:**
```bash
# On Ubuntu/Debian, install build tools
sudo apt-get install build-essential python3

# On macOS, install Xcode command line tools
xcode-select --install
```

### bcrypt installation fails

**Problem:** `bcrypt` package fails to compile during installation.

**Solutions:**

1. **Install Python and build tools** (bcrypt requires native compilation):
```bash
# Ubuntu/Debian
sudo apt-get install python3 build-essential

# macOS
brew install python
xcode-select --install
```

2. **Use pre-built binaries:**
```bash
npm install bcrypt --build-from-source=false
```

---

## Database Issues (Development)

### Cannot connect to database

**Problem:** Application fails to start with database connection error.

**Error Message:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solutions:**

1. **Check PostgreSQL is running:**
```bash
# Check status
sudo systemctl status postgresql  # Linux
brew services list  # macOS

# Start PostgreSQL
sudo systemctl start postgresql  # Linux
brew services start postgresql  # macOS
```

2. **Verify database credentials in `.env`:**
```bash
# Check .env file
cat .env | grep DB_

# Test connection manually
psql -h localhost -U educard -d educard_dev
```

3. **Check Docker container (if using Docker):**
```bash
# Check if db container is running
docker-compose ps

# Check db logs
docker-compose logs db

# Restart db container
docker-compose restart db
```

4. **Verify database exists:**
```bash
# List databases
psql -U postgres -l

# Create database if missing
createdb -U postgres educard_dev
```

### Database migrations fail

**Problem:** `npm run db:migrate` fails with errors.

**Solutions:**

1. **Check migration status:**
```bash
npx sequelize-cli db:migrate:status
```

2. **Undo last migration and retry:**
```bash
npm run db:migrate:undo
npm run db:migrate
```

3. **Check database permissions:**
```sql
-- Connect as postgres user
sudo -u postgres psql

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE educard_dev TO educard;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO educard;
```

4. **Reset database (CAUTION: Deletes all data):**
```bash
# Drop and recreate database
dropdb educard_dev
createdb educard_dev
npm run db:migrate
```

### "relation does not exist" error

**Problem:** SQL error: `relation "users" does not exist`.

**Solutions:**

1. **Run migrations:**
```bash
npm run db:migrate
```

2. **Check migration status:**
```bash
npx sequelize-cli db:migrate:status
```

3. **Verify database schema:**
```bash
psql -U educard -d educard_dev -c "\dt"
```

---

## Authentication Issues

### Cannot login with correct credentials

**Problem:** Login fails even with correct username/password.

**Solutions:**

1. **Check user exists in database:**
```sql
psql -U educard -d educard_dev
SELECT username, email, is_active, is_banned FROM users WHERE username = 'your_username';
```

2. **Check if user is banned:**
```sql
SELECT username, is_banned, ban_reason FROM users WHERE username = 'your_username';
```

3. **Reset user password:**
```javascript
// In Node.js console or create a script
const bcrypt = require('bcrypt');
const password = await bcrypt.hash('newpassword', 10);
// Update in database
UPDATE users SET password = 'hashed_password' WHERE username = 'your_username';
```

4. **Check session configuration:**
```bash
# Verify SESSION_SECRET is set in .env
cat .env | grep SESSION_SECRET
```

### Session expires immediately

**Problem:** User is logged out immediately after login.

**Solutions:**

1. **Check SESSION_SECRET is set:**
```bash
# Must be set in .env
SESSION_SECRET=your_secret_key_here
```

2. **Check session store:**
```javascript
// In src/app.js, verify session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,  // Set to true only with HTTPS
    maxAge: 86400000  // 24 hours
  }
}));
```

3. **Clear browser cookies and try again**

4. **Check if using HTTPS:**
```javascript
// If using HTTPS, set secure: true in cookie config
cookie: {
  secure: true,  // Only with HTTPS
  httpOnly: true,
  sameSite: 'lax'
}
```

### CSRF token mismatch

**Problem:** Forms fail with "CSRF token mismatch" error.

**Solutions:**

1. **Ensure CSRF token is included in forms:**
```html
<form method="POST">
  <input type="hidden" name="_csrf" value="<%= csrfToken %>">
  <!-- form fields -->
</form>
```

2. **Check CSRF middleware is configured:**
```javascript
// In src/app.js
const csrf = require('csurf');
app.use(csrf());
```

3. **Verify token is passed to views:**
```javascript
// In routes
res.render('page', { csrfToken: req.csrfToken() });
```

---

## Application Errors

### Port already in use

**Problem:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solutions:**

1. **Find and kill process using the port:**
```bash
# Find process
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use npx
npx kill-port 3000
```

2. **Change port in .env:**
```bash
PORT=3001
```

3. **Stop all Node processes:**
```bash
pkillall node
```

### 500 Internal Server Error

**Problem:** Application returns 500 error on certain pages.

**Solutions:**

1. **Check application logs:**
```bash
# If using PM2
pm2 logs educard

# If using Docker
docker-compose logs app

# If running directly
# Check terminal output
```

2. **Enable detailed error logging:**
```javascript
// In src/app.js (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send(err.stack);
  });
}
```

3. **Check database connection**
4. **Verify all environment variables are set**

### File upload fails

**Problem:** Image/file uploads return errors.

**Solutions:**

1. **Check upload directory exists and is writable:**
```bash
# Create uploads directory
mkdir -p public/uploads
chmod 755 public/uploads
```

2. **Check file size limits:**
```javascript
// In .env
MAX_FILE_SIZE=5242880  # 5MB in bytes
```

3. **Verify multer configuration:**
```javascript
// Check middleware configuration
const upload = multer({
  dest: 'public/uploads/',
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 }
});
```

4. **Check disk space:**
```bash
df -h
```

### Markdown/code highlighting not working

**Problem:** Markdown is not rendered or code is not highlighted.

**Solutions:**

1. **Verify dependencies are installed:**
```bash
npm list marked highlight.js dompurify jsdom
```

2. **Check if libraries are loaded in views:**
```html
<!-- In layout -->
<link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/default.min.css">
<script src="//cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js"></script>
```

3. **Initialize highlight.js:**
```javascript
// In public/js/main.js
document.addEventListener('DOMContentLoaded', () => {
  hljs.highlightAll();
});
```

---

## Performance Issues (Development)

### Slow page load times

**Problem:** Pages take several seconds to load.

**Solutions:**

1. **Enable database query logging to find slow queries:**
```javascript
// In src/config/database.js
logging: console.log  // Enable in development
```

2. **Check for N+1 queries:**
```javascript
// Use eager loading
const threads = await Thread.findAll({
  include: [
    { model: User, attributes: ['id', 'username'] },
    { model: Category, attributes: ['id', 'name', 'slug'] }
  ]
});
```

3. **Add pagination:**
```javascript
// Limit results
const limit = 20;
const offset = (page - 1) * limit;
const threads = await Thread.findAll({ limit, offset });
```

4. **Enable caching:**
```javascript
// Check if caching is enabled for frequently accessed data
const cache = require('../utils/cache');
const categories = cache.get('categories') || await Category.findAll();
```

5. **Check database indexes:**
```sql
-- List indexes
SELECT indexname, indexdef FROM pg_indexes 
WHERE tablename = 'threads';
```

### High memory usage

**Problem:** Application uses excessive memory.

**Solutions:**

1. **Check for memory leaks with PM2:**
```bash
pm2 monit
```

2. **Increase Node.js memory limit:**
```bash
NODE_OPTIONS=--max-old-space-size=4096 node server.js
```

3. **Clear cache periodically:**
```javascript
// Clear cache every hour
setInterval(() => {
  cache.flushAll();
}, 3600000);
```

4. **Limit query result sizes with pagination**

5. **Check for unclosed database connections**

### Database connection pool exhausted

**Problem:** `TimeoutError: ResourceRequest timed out`

**Solutions:**

1. **Increase pool size:**
```javascript
// In src/config/database.js
pool: {
  max: 20,      // Increase max connections
  min: 5,
  acquire: 30000,
  idle: 10000
}
```

2. **Check for connection leaks:**
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity WHERE datname = 'educard_prod';
```

3. **Ensure connections are properly closed:**
```javascript
// Always close transactions
try {
  const transaction = await sequelize.transaction();
  // operations
  await transaction.commit();
} catch (error) {
  await transaction.rollback();
  throw error;
}
```

---

## Docker Issues

### Docker container won't start

**Problem:** `docker-compose up` fails or containers exit immediately.

**Solutions:**

1. **Check Docker logs:**
```bash
docker-compose logs app
docker-compose logs db
```

2. **Verify Docker is running:**
```bash
docker --version
docker ps
```

3. **Rebuild containers:**
```bash
docker-compose down
docker-compose up --build
```

4. **Check for port conflicts:**
```bash
# Check if ports 3000 or 5432 are in use
lsof -i :3000
lsof -i :5432
```

5. **Remove all containers and volumes (CAUTION: Deletes data):**
```bash
docker-compose down -v
docker-compose up
```

### Cannot access application in Docker

**Problem:** Application runs in Docker but can't access from browser.

**Solutions:**

1. **Check container is running:**
```bash
docker-compose ps
```

2. **Verify port mapping:**
```bash
# Check docker-compose.yml
ports:
  - "3000:3000"
```

3. **Check firewall settings**

4. **Try accessing localhost:3000 instead of 127.0.0.1:3000**

### Database persists old data after rebuild

**Problem:** Changes not reflected after rebuilding containers.

**Solutions:**

1. **Remove volumes when rebuilding:**
```bash
docker-compose down -v
docker-compose up --build
```

2. **Run migrations in container:**
```bash
docker-compose exec app npm run db:migrate
```

---

# Kubernetes Deployment Troubleshooting

> For comprehensive Kubernetes troubleshooting, see:
> - [OPERATIONS_RUNBOOK.md](./OPERATIONS_RUNBOOK.md) - Daily operations and common tasks
> - [K3S_DEPLOYMENT.md](./K3S_DEPLOYMENT.md) - Deployment procedures

## Quick Kubernetes Diagnostics

```bash
# Set kubeconfig
export KUBECONFIG=/Users/tohyifan/Desktop/Educard/k8s/kubeconfig-vagrant-local

# Quick health check
./k8s/check-metrics.sh

# Check all pods
kubectl get pods -n educard-prod

# View logs
kubectl logs -n educard-prod -l app=educard --tail=100

# Check events
kubectl get events -n educard-prod --sort-by='.lastTimestamp' | tail -20

# Test deployment
./k8s/test-deployment.sh
```

## Pod Issues

### Pod Not Starting
- **Image Pull Error**: Rebuild and push image to registry
- **Insufficient Resources**: Check `kubectl top nodes`
- **ConfigMap/Secret Missing**: Apply with `kubectl apply -f k8s/`
- **Database Connection**: Test with `kubectl exec -it postgres-0 -- pg_isready -U educard`

### Pod Crashing
```bash
# Check logs
kubectl logs <pod-name> -n educard-prod --previous

# Describe pod for events
kubectl describe pod <pod-name> -n educard-prod

# Restart deployment
kubectl rollout restart deployment/educard-app -n educard-prod
```

## Database Issues (K8s)

### Database Not Ready
```bash
# Restart database
kubectl delete pod postgres-0 -n educard-prod
kubectl wait --for=condition=ready pod postgres-0 -n educard-prod --timeout=120s
```

### Authentication Failed
```bash
# Check credentials
kubectl get secret educard-secrets -n educard-prod -o jsonpath='{.data.DB_USER}' | base64 -d

# Test connection
kubectl exec -it postgres-0 -n educard-prod -- psql -U educard -d educard_prod -c "SELECT 1;"
```

## Network Issues

### Cannot Access Application
```bash
# Port forward for testing
kubectl port-forward -n educard-prod svc/educard-service 8080:80

# Check service endpoints
kubectl get endpoints educard-service -n educard-prod
```

## Performance Issues (K8s)

### High Resource Usage
```bash
# Check usage
kubectl top pods -n educard-prod

# Scale up
kubectl scale deployment/educard-app -n educard-prod --replicas=3

# Enable autoscaling
kubectl autoscale deployment educard-app -n educard-prod --cpu-percent=70 --min=2 --max=10
```

## Emergency Procedures

### Complete Restart
```bash
# Restart all components
kubectl delete pods -n educard-prod -l app=educard
kubectl delete pod postgres-0 -n educard-prod

# Wait for recovery
kubectl wait --for=condition=ready pod -l app=educard -n educard-prod --timeout=120s
kubectl wait --for=condition=ready pod postgres-0 -n educard-prod --timeout=120s

# Verify
./k8s/check-metrics.sh
```

### Rollback Deployment
```bash
# Rollback to previous version
kubectl rollout undo deployment/educard-app -n educard-prod

# Watch rollback
kubectl rollout status deployment/educard-app -n educard-prod
```

### Restore Database
```bash
# List available backups
./k8s/list-backups.sh

# Run restore (interactive)
./k8s/run-restore.sh
```

For detailed Kubernetes troubleshooting procedures, see [OPERATIONS_RUNBOOK.md](./OPERATIONS_RUNBOOK.md#emergency-procedures).

---

## Production Issues

### Application crashes in production

**Problem:** Application works in development but crashes in production.

**Solutions:**

1. **Check logs:**
```bash
pm2 logs educard --lines 100
```

2. **Verify NODE_ENV is set:**
```bash
echo $NODE_ENV  # Should be "production"
```

3. **Check all environment variables are set:**
```bash
pm2 env 0  # Check environment of first process
```

4. **Enable error logging:**
```javascript
// Add Winston logger in production
const winston = require('winston');
const logger = winston.createLogger({
  level: 'error',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' })
  ]
});
```

### SSL/HTTPS issues

**Problem:** HTTPS not working or certificate errors.

**Solutions:**

1. **Check certificate files exist:**
```bash
ls -l /etc/letsencrypt/live/your-domain.com/
```

2. **Verify Nginx configuration:**
```bash
sudo nginx -t
```

3. **Check certificate expiry:**
```bash
sudo certbot certificates
```

4. **Renew certificate:**
```bash
sudo certbot renew
```

### Rate limiting blocking legitimate users

**Problem:** Users are being rate limited unexpectedly.

**Solutions:**

1. **Adjust rate limits in `.env`:**
```bash
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=200  # Increase limit
```

2. **Whitelist trusted IPs:**
```javascript
// In src/middleware/rateLimiter.js
const limiter = rateLimit({
  skip: (req) => {
    const trustedIPs = ['192.168.1.1'];
    return trustedIPs.includes(req.ip);
  }
});
```

3. **Check reverse proxy configuration:**
```nginx
# In Nginx config
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

---

## Debugging Tips

### Enable debug mode

```bash
# Set debug environment variable
DEBUG=* node server.js

# Or with PM2
DEBUG=* pm2 start server.js
```

### View SQL queries

```javascript
// In src/config/database.js
logging: console.log  // Enable query logging
```

### Inspect request/response

```javascript
// Add debugging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  console.log('Body:', req.body);
  console.log('Query:', req.query);
  console.log('Session:', req.session);
  next();
});
```

### Check environment variables

```bash
# Print all environment variables
env

# Check specific variable
echo $NODE_ENV
echo $DB_HOST
```

### Test database connection

```javascript
// Create test script: test-db.js
const { sequelize } = require('./src/config/database');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
  process.exit();
})();

// Run: node test-db.js
```

### Browser Developer Tools

1. **Check Console for JavaScript errors** (F12 → Console)
2. **Check Network tab for failed requests** (F12 → Network)
3. **Inspect cookies and session data** (F12 → Application → Cookies)
4. **Check for CORS errors** (F12 → Console)

---

## Getting Help

If you've tried the solutions above and still have issues:

1. **Check existing GitHub issues:** Search for similar problems
2. **Review documentation:** Check README.md, DEPLOYMENT.md, and specs/
3. **Enable debug logging:** Get detailed error messages
4. **Create a GitHub issue:** Include:
   - Error message (full stack trace)
   - Steps to reproduce
   - Environment (OS, Node version, PostgreSQL version)
   - Relevant configuration (sanitized, no secrets)
   - What you've already tried

---

## Additional Resources

### Development
- [README.md](../README.md) - Project overview and setup
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Development deployment guide

### Kubernetes
- [K3S_DEPLOYMENT.md](./K3S_DEPLOYMENT.md) - Complete K8s deployment guide
- [OPERATIONS_RUNBOOK.md](./OPERATIONS_RUNBOOK.md) - Daily operations and procedures
- [MONITORING.md](./MONITORING.md) - Monitoring and metrics
- [BACKUP_RESTORE.md](./BACKUP_RESTORE.md) - Backup and restore procedures
- [DEPLOYMENT_TESTING.md](./DEPLOYMENT_TESTING.md) - Testing procedures

---

**Last Updated:** November 28, 2025  
**Version:** 2.0.0 (includes Kubernetes troubleshooting)  
**Status:** Production Ready ✅
