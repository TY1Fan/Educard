# Deployment Guide

This document provides comprehensive instructions for deploying Educard to production environments.

## Table of Contents

1. [Production Checklist](#production-checklist)
2. [Environment Configuration](#environment-configuration)
3. [Database Setup](#database-setup)
4. [Application Deployment](#application-deployment)
5. [Reverse Proxy Configuration](#reverse-proxy-configuration)
6. [SSL/TLS Configuration](#ssltls-configuration)
7. [Monitoring & Logging](#monitoring--logging)
8. [Backup Strategy](#backup-strategy)
9. [Scaling Considerations](#scaling-considerations)
10. [Troubleshooting](#troubleshooting)

---

## Production Checklist

Before deploying to production, ensure all these items are completed:

### Security
- [ ] Set strong `SESSION_SECRET` (32+ character random string)
- [ ] Change all default passwords
- [ ] Enable HTTPS/TLS with valid SSL certificate
- [ ] Configure firewall rules (allow only necessary ports)
- [ ] Review and test rate limiting settings
- [ ] Enable security headers (helmet.js configured)
- [ ] Set `NODE_ENV=production`
- [ ] Disable source maps in production
- [ ] Review CORS settings if API is exposed

### Database
- [ ] Use production database with strong credentials
- [ ] Configure regular automated backups
- [ ] Set up connection pooling
- [ ] Test database restore process
- [ ] Enable query logging for monitoring
- [ ] Optimize database indexes

### Application
- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Update all dependencies to stable versions
- [ ] Test with production-like data volume
- [ ] Configure error tracking (e.g., Sentry)
- [ ] Set up log aggregation
- [ ] Configure CDN for static assets (optional)
- [ ] Test rollback procedure

### Infrastructure
- [ ] Set up monitoring and alerts
- [ ] Configure auto-restart on crashes
- [ ] Set resource limits (CPU, memory)
- [ ] Test disaster recovery plan
- [ ] Document deployment process
- [ ] Set up staging environment for testing

---

## Environment Configuration

### Required Environment Variables

Create a `.env` file in production with the following variables:

```bash
# Server Configuration
NODE_ENV=production
PORT=3000

# Database Configuration
DB_HOST=your-production-db-host
DB_PORT=5432
DB_NAME=educard_prod
DB_USER=educard_prod_user
DB_PASSWORD=<strong_password_here>

# Session Configuration
# Generate with: openssl rand -base64 32
SESSION_SECRET=<32_character_random_string>
SESSION_MAX_AGE=86400000

# Application Settings
APP_NAME=Educard
APP_URL=https://your-domain.com

# Optional: Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Optional: File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./public/uploads

# Optional: Email Configuration (for notifications)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASSWORD=<email_password>
```

### Security Best Practices

1. **Never commit `.env` files to version control**
2. **Use strong, unique passwords for each environment**
3. **Rotate SESSION_SECRET periodically**
4. **Limit database user permissions to minimum required**
5. **Use environment-specific configurations**

---

## Database Setup

### PostgreSQL Installation (Ubuntu/Debian)

```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
psql --version
```

### Database Creation

```bash
# Switch to postgres user
sudo -u postgres psql

# Create production database and user
CREATE DATABASE educard_prod;
CREATE USER educard_prod_user WITH ENCRYPTED PASSWORD 'your_strong_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE educard_prod TO educard_prod_user;

# Exit psql
\q
```

### Run Migrations

```bash
# Set environment to production
export NODE_ENV=production

# Run migrations
npm run db:migrate

# Verify migrations
npm run db:migrate:status
```

### Database Connection Pooling

For production, configure Sequelize connection pooling in `src/config/database.js`:

```javascript
module.exports = {
  production: {
    // ... other config
    pool: {
      max: 10,      // Maximum connections
      min: 2,       // Minimum connections
      acquire: 30000,
      idle: 10000
    }
  }
};
```

---

## Application Deployment

### Method 1: Direct Deployment (Node.js)

#### Install Dependencies

```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

#### Deploy Application

```bash
# Clone repository
git clone <your-repo-url> /var/www/educard
cd /var/www/educard

# Install dependencies (production only)
npm ci --production

# Set up environment
cp .env.example .env
# Edit .env with production values
nano .env

# Run migrations
npm run db:migrate

# Start application
npm start
```

#### Process Manager (PM2)

Use PM2 to manage the application process:

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start application with PM2
pm2 start server.js --name educard

# Configure PM2 to restart on reboot
pm2 startup systemd
pm2 save

# Useful PM2 commands
pm2 status          # Check status
pm2 logs educard    # View logs
pm2 restart educard # Restart app
pm2 stop educard    # Stop app
pm2 delete educard  # Remove from PM2
```

### Method 2: Docker Deployment

#### Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose

# Verify installation
docker --version
docker-compose --version
```

#### Build and Deploy

```bash
# Clone repository
git clone <your-repo-url> /var/www/educard
cd /var/www/educard

# Create production docker-compose.override.yml
cat > docker-compose.override.yml <<EOF
version: '3.8'
services:
  app:
    restart: always
    environment:
      NODE_ENV: production
  db:
    restart: always
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./backups:/backups

volumes:
  postgres-data:
EOF

# Build and start containers
docker-compose up -d --build

# Run migrations
docker-compose exec app npm run db:migrate

# View logs
docker-compose logs -f
```

---

## Reverse Proxy Configuration

### Nginx Configuration

Install and configure Nginx as a reverse proxy:

```bash
# Install Nginx
sudo apt install nginx

# Create site configuration
sudo nano /etc/nginx/sites-available/educard
```

Add the following configuration:

```nginx
upstream educard_backend {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options SAMEORIGIN always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/educard_access.log;
    error_log /var/log/nginx/educard_error.log;

    # Client body size (for file uploads)
    client_max_body_size 10M;

    # Proxy settings
    location / {
        proxy_pass http://educard_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://educard_backend;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/educard /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## SSL/TLS Configuration

### Let's Encrypt (Free SSL)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

Certbot will automatically:
- Obtain SSL certificate
- Update Nginx configuration
- Set up auto-renewal

---

## Monitoring & Logging

### Application Logging

Configure Winston for production logging:

```bash
# Install Winston (if not already installed)
npm install winston
```

Create `src/utils/logger.js`:

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    // Write errors to error.log
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    // Write all logs to combined.log
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

### System Monitoring

#### Using PM2 Monitoring

```bash
# Monitor with PM2
pm2 monit

# Generate status page
pm2 web
```

#### Basic Server Monitoring

```bash
# Monitor resource usage
htop

# Monitor disk space
df -h

# Monitor database connections
sudo -u postgres psql -d educard_prod -c "SELECT count(*) FROM pg_stat_activity;"
```

### Log Rotation

Configure logrotate for application logs:

```bash
# Create logrotate configuration
sudo nano /etc/logrotate.d/educard
```

Add:

```
/var/www/educard/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

---

## Backup Strategy

### Database Backups

#### Automated Daily Backup Script

Create `/usr/local/bin/backup-educard-db.sh`:

```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/var/backups/educard"
DB_NAME="educard_prod"
DB_USER="educard_prod_user"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Perform backup
PGPASSWORD=$DB_PASSWORD pg_dump -h localhost -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/educard_backup_$TIMESTAMP.sql.gz

# Remove old backups
find $BACKUP_DIR -name "educard_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: educard_backup_$TIMESTAMP.sql.gz"
```

Make executable and add to cron:

```bash
# Make script executable
sudo chmod +x /usr/local/bin/backup-educard-db.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e

# Add this line:
0 2 * * * /usr/local/bin/backup-educard-db.sh >> /var/log/educard-backup.log 2>&1
```

#### Database Restore

```bash
# Restore from backup
gunzip < /var/backups/educard/educard_backup_YYYYMMDD_HHMMSS.sql.gz | \
  psql -h localhost -U educard_prod_user -d educard_prod
```

### Application Backups

```bash
# Backup uploaded files
tar -czf /var/backups/educard/uploads_$(date +%Y%m%d).tar.gz /var/www/educard/public/uploads

# Backup configuration
tar -czf /var/backups/educard/config_$(date +%Y%m%d).tar.gz /var/www/educard/.env /var/www/educard/src/config
```

---

## Scaling Considerations

### Horizontal Scaling

For high-traffic deployments:

1. **Load Balancer:** Use Nginx or HAProxy to distribute traffic across multiple app instances

2. **Session Store:** Use Redis for shared session storage:

```bash
# Install Redis
sudo apt install redis-server

# Configure in application
npm install connect-redis redis
```

Update session configuration:

```javascript
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const redis = require('redis');

const redisClient = redis.createClient({
  host: 'localhost',
  port: 6379
});

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));
```

3. **Database Read Replicas:** Configure PostgreSQL replication for read-heavy workloads

4. **CDN:** Use CloudFlare, AWS CloudFront, or similar for static assets

### Vertical Scaling

Optimize single-server performance:

1. **Increase Node.js memory:**
```bash
NODE_OPTIONS=--max-old-space-size=4096 node server.js
```

2. **Database tuning:**
```sql
-- Increase shared_buffers in postgresql.conf
shared_buffers = 256MB
effective_cache_size = 1GB
```

3. **Enable Gzip compression** (already configured in Express)

---

## Troubleshooting

### Common Issues

#### Application Won't Start

```bash
# Check logs
pm2 logs educard
# Or
docker-compose logs app

# Check if port is in use
sudo lsof -i :3000

# Check environment variables
pm2 env 0
```

#### Database Connection Issues

```bash
# Test database connection
psql -h localhost -U educard_prod_user -d educard_prod

# Check PostgreSQL is running
sudo systemctl status postgresql

# Check database logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

#### High Memory Usage

```bash
# Check Node.js memory usage
pm2 monit

# Restart application
pm2 restart educard

# Check for memory leaks (use production profiling tools)
```

#### SSL Certificate Issues

```bash
# Check certificate expiry
sudo certbot certificates

# Renew certificate manually
sudo certbot renew

# Test SSL configuration
openssl s_client -connect your-domain.com:443
```

### Performance Monitoring

```bash
# Check application response time
curl -w "@curl-format.txt" -o /dev/null -s https://your-domain.com

# Check database query performance
sudo -u postgres psql -d educard_prod -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"

# Monitor system resources
htop
iotop
```

---

## Deployment Workflow

### Standard Deployment Process

1. **Test in staging environment**
2. **Backup database and files**
3. **Put application in maintenance mode** (optional)
4. **Pull latest code**
5. **Install dependencies** (`npm ci --production`)
6. **Run migrations** (`npm run db:migrate`)
7. **Restart application**
8. **Verify deployment**
9. **Monitor for errors**

### Zero-Downtime Deployment with PM2

```bash
# Deploy with zero downtime
pm2 reload educard --update-env
```

### Rollback Procedure

```bash
# Revert to previous version
git checkout <previous-commit>
npm ci --production

# Revert migrations if needed
npm run db:migrate:undo

# Restart application
pm2 restart educard
```

---

## Support

For deployment issues:
- Check [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)
- Review application logs
- Check system resource usage
- Consult [SECURITY.md](./SECURITY.md) for security concerns

---

**Last Updated:** November 2025
**Version:** 1.0.0
