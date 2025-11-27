# Environment Variables Reference

Complete documentation of all environment variables used in Educard.

## Table of Contents

1. [Overview](#overview)
2. [Required Variables](#required-variables)
3. [Optional Variables](#optional-variables)
4. [Environment-Specific Settings](#environment-specific-settings)
5. [Security Best Practices](#security-best-practices)
6. [Example Configurations](#example-configurations)

---

## Overview

Environment variables control application behavior across different environments (development, production, testing). They are stored in `.env` files and loaded via the `dotenv` package.

### Setup

1. **Copy template:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your values**

3. **Never commit `.env` to version control** (it's in `.gitignore`)

---

## Required Variables

These variables MUST be set for the application to run.

### NODE_ENV

**Type:** String  
**Default:** `development`  
**Valid Values:** `development`, `production`, `test`  
**Description:** Determines the application environment

**Example:**
```bash
NODE_ENV=production
```

**Impact:**
- **development:** Verbose logging, detailed error pages, auto-reload
- **production:** Minimal logging, generic error pages, optimizations
- **test:** Test database, mock services

---

### PORT

**Type:** Integer  
**Default:** `3000`  
**Description:** Port the application listens on

**Example:**
```bash
PORT=3000
```

**Notes:**
- Ports below 1024 require root/admin privileges
- Check port is not in use: `lsof -i :3000`

---

### Database Configuration

#### DB_HOST

**Type:** String  
**Default:** `localhost`  
**Description:** PostgreSQL server hostname or IP

**Example:**
```bash
# Local development
DB_HOST=localhost

# Docker Compose (use service name)
DB_HOST=db

# Remote server
DB_HOST=db.example.com
```

#### DB_PORT

**Type:** Integer  
**Default:** `5432`  
**Description:** PostgreSQL server port

**Example:**
```bash
DB_PORT=5432
```

#### DB_NAME

**Type:** String  
**Default:** `educard_dev`  
**Description:** Database name

**Example:**
```bash
# Development
DB_NAME=educard_dev

# Production
DB_NAME=educard_prod

# Testing
DB_NAME=educard_test
```

#### DB_USER

**Type:** String  
**Default:** `educard`  
**Description:** Database username

**Example:**
```bash
DB_USER=educard
```

**Security Notes:**
- Use different usernames for each environment
- Grant minimum required privileges
- Avoid using `postgres` superuser

#### DB_PASSWORD

**Type:** String  
**Default:** `educard_dev_password`  
**Description:** Database user password

**Example:**
```bash
DB_PASSWORD=your_secure_password_here
```

**Security Requirements:**
- Minimum 16 characters for production
- Include uppercase, lowercase, numbers, symbols
- Never use default passwords in production
- Rotate regularly (quarterly recommended)

---

### SESSION_SECRET

**Type:** String  
**Default:** None (MUST be set)  
**Description:** Secret key for signing session cookies

**Example:**
```bash
# Generate with: openssl rand -base64 32
SESSION_SECRET=vK8xG2pL9qW4nR7tY3mF5hJ6sD1aE8bN
```

**Security Requirements:**
- Minimum 32 characters
- Random, unpredictable value
- Different for each environment
- Rotate periodically (annually recommended)
- Never share between applications

**How to generate:**
```bash
# OpenSSL
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

### APP_URL

**Type:** String  
**Default:** `http://localhost:3000`  
**Description:** Base URL of the application

**Example:**
```bash
# Development
APP_URL=http://localhost:3000

# Production
APP_URL=https://forum.example.com
```

**Usage:**
- Generating absolute URLs in emails
- OAuth redirect URIs
- Sitemap generation
- Open Graph meta tags

---

## Optional Variables

These variables have sensible defaults but can be customized.

### APP_NAME

**Type:** String  
**Default:** `Educard`  
**Description:** Application display name

**Example:**
```bash
APP_NAME=My Forum
```

**Usage:**
- Page titles: `<title><%= APP_NAME %> - Home</title>`
- Email subjects
- Navigation header

---

### SESSION_MAX_AGE

**Type:** Integer (milliseconds)  
**Default:** `86400000` (24 hours)  
**Description:** Session expiration time

**Example:**
```bash
# 24 hours (default)
SESSION_MAX_AGE=86400000

# 7 days
SESSION_MAX_AGE=604800000

# 30 days
SESSION_MAX_AGE=2592000000
```

**Conversion:**
- 1 hour = 3,600,000 ms
- 1 day = 86,400,000 ms
- 1 week = 604,800,000 ms

**Security Considerations:**
- Shorter = more secure, but users re-login more often
- Longer = more convenient, but higher risk if session stolen
- Balance security with user experience

---

### Rate Limiting

#### RATE_LIMIT_WINDOW_MS

**Type:** Integer (milliseconds)  
**Default:** `900000` (15 minutes)  
**Description:** Time window for rate limiting

**Example:**
```bash
# 15 minutes (default)
RATE_LIMIT_WINDOW_MS=900000

# 1 hour
RATE_LIMIT_WINDOW_MS=3600000
```

#### RATE_LIMIT_MAX_REQUESTS

**Type:** Integer  
**Default:** `100`  
**Description:** Maximum requests per window

**Example:**
```bash
# 100 requests per window (default)
RATE_LIMIT_MAX_REQUESTS=100

# More strict (50)
RATE_LIMIT_MAX_REQUESTS=50

# More lenient (200)
RATE_LIMIT_MAX_REQUESTS=200
```

**Tuning:**
- Too strict: Legitimate users get blocked
- Too lenient: Vulnerable to attacks
- Monitor logs to find optimal values

---

### File Upload

#### MAX_FILE_SIZE

**Type:** Integer (bytes)  
**Default:** `5242880` (5 MB)  
**Description:** Maximum file upload size

**Example:**
```bash
# 5 MB (default)
MAX_FILE_SIZE=5242880

# 10 MB
MAX_FILE_SIZE=10485760

# 2 MB
MAX_FILE_SIZE=2097152
```

**Conversion:**
- 1 MB = 1,048,576 bytes
- 5 MB = 5,242,880 bytes
- 10 MB = 10,485,760 bytes

**Considerations:**
- Larger files = more storage, bandwidth, processing time
- Check server upload limits (Nginx `client_max_body_size`)
- Validate file types, not just size

#### UPLOAD_DIR

**Type:** String (path)  
**Default:** `./public/uploads`  
**Description:** Directory for uploaded files

**Example:**
```bash
UPLOAD_DIR=./public/uploads
```

**Requirements:**
- Directory must exist and be writable
- Serve via web server or CDN
- Back up regularly

---

### Logging

#### LOG_LEVEL

**Type:** String  
**Default:** `info`  
**Valid Values:** `error`, `warn`, `info`, `verbose`, `debug`  
**Description:** Logging verbosity

**Example:**
```bash
# Production (minimal)
LOG_LEVEL=error

# Development (detailed)
LOG_LEVEL=debug

# Standard
LOG_LEVEL=info
```

---

### Email Configuration (Optional)

If email notifications are implemented:

#### SMTP_HOST

**Type:** String  
**Description:** SMTP server hostname

**Example:**
```bash
SMTP_HOST=smtp.gmail.com
```

#### SMTP_PORT

**Type:** Integer  
**Default:** `587` (TLS) or `465` (SSL)  
**Description:** SMTP server port

**Example:**
```bash
SMTP_PORT=587
```

#### SMTP_USER

**Type:** String  
**Description:** SMTP authentication username

**Example:**
```bash
SMTP_USER=noreply@example.com
```

#### SMTP_PASSWORD

**Type:** String  
**Description:** SMTP authentication password

**Example:**
```bash
SMTP_PASSWORD=your_smtp_password
```

**Security:**
- Use app-specific passwords (Gmail, Outlook)
- Never commit to version control
- Consider using SendGrid, Mailgun, or similar

#### EMAIL_FROM

**Type:** String  
**Description:** Default "From" address

**Example:**
```bash
EMAIL_FROM="Educard <noreply@example.com>"
```

---

## Environment-Specific Settings

### Development Environment

```bash
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=educard_dev
DB_USER=educard
DB_PASSWORD=educard_dev_password
SESSION_SECRET=dev_secret_change_in_production
SESSION_MAX_AGE=86400000
APP_NAME=Educard (Dev)
APP_URL=http://localhost:3000
LOG_LEVEL=debug
RATE_LIMIT_MAX_REQUESTS=1000
```

### Production Environment

```bash
NODE_ENV=production
PORT=3000
DB_HOST=db.production.example.com
DB_PORT=5432
DB_NAME=educard_prod
DB_USER=educard_prod_user
DB_PASSWORD=Str0ng!Pr0duct1on#P@ssw0rd123
SESSION_SECRET=<32_character_random_string>
SESSION_MAX_AGE=86400000
APP_NAME=Educard
APP_URL=https://forum.example.com
LOG_LEVEL=error
RATE_LIMIT_MAX_REQUESTS=100
MAX_FILE_SIZE=5242880
```

### Docker Environment

```bash
NODE_ENV=production
PORT=3000
DB_HOST=db                    # Docker Compose service name
DB_PORT=5432
DB_NAME=educard_prod
DB_USER=educard
DB_PASSWORD=secure_password
SESSION_SECRET=<random_secret>
APP_URL=http://localhost:3000
```

---

## Security Best Practices

### 1. Never Commit Secrets

```bash
# .gitignore should include:
.env
.env.local
.env.production
.env.*.local
```

### 2. Use Strong Passwords

**Bad:**
```bash
DB_PASSWORD=password
SESSION_SECRET=secret123
```

**Good:**
```bash
DB_PASSWORD=mK9$xP2!vL8@qW5#nR4^tY7
SESSION_SECRET=vK8xG2pL9qW4nR7tY3mF5hJ6sD1aE8bN
```

### 3. Environment Isolation

- Different credentials for each environment
- Never use production data in development
- Separate database servers

### 4. Rotate Secrets Regularly

| Secret Type | Rotation Frequency |
|-------------|-------------------|
| SESSION_SECRET | Annually |
| DB_PASSWORD | Quarterly |
| API Keys | After compromise |
| JWT Secrets | Annually |

### 5. Principle of Least Privilege

```sql
-- Bad: Using superuser
DB_USER=postgres

-- Good: Limited permissions
CREATE USER educard_prod_user WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE educard_prod TO educard_prod_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO educard_prod_user;
```

### 6. Secure Storage

**Development:**
- `.env` file (never committed)

**Production:**
- Environment variables (systemd, PM2)
- Secret management service (AWS Secrets Manager, HashiCorp Vault)
- Kubernetes Secrets
- Docker Secrets

### 7. Validate Configuration

```javascript
// In server.js or config validation
function validateEnv() {
  const required = [
    'NODE_ENV',
    'PORT',
    'DB_HOST',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
    'SESSION_SECRET'
  ];

  for (const envVar of required) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }

  // Validate SESSION_SECRET length
  if (process.env.SESSION_SECRET.length < 32) {
    throw new Error('SESSION_SECRET must be at least 32 characters');
  }
}

validateEnv();
```

---

## Example Configurations

### Minimal .env (Development)

```bash
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_NAME=educard_dev
DB_USER=educard
DB_PASSWORD=dev_password
SESSION_SECRET=dev_secret_at_least_32_chars_long
APP_URL=http://localhost:3000
```

### Complete .env (Production)

```bash
# Environment
NODE_ENV=production
PORT=3000

# Database
DB_HOST=postgres.production.internal
DB_PORT=5432
DB_NAME=educard_prod
DB_USER=educard_prod_user
DB_PASSWORD=<strong_password_here>

# Session
SESSION_SECRET=<32_character_random_string>
SESSION_MAX_AGE=86400000

# Application
APP_NAME=Educard Community Forum
APP_URL=https://forum.example.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Uploads
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./public/uploads

# Logging
LOG_LEVEL=error

# Email (Optional)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=<sendgrid_api_key>
EMAIL_FROM="Educard <noreply@example.com>"
```

### Docker Compose Override

Instead of `.env`, you can set environment in `docker-compose.override.yml`:

```yaml
version: '3.8'
services:
  app:
    environment:
      NODE_ENV: production
      DB_HOST: db
      DB_NAME: educard_prod
      DB_USER: educard
      DB_PASSWORD: secure_password
      SESSION_SECRET: random_32_char_string
```

---

## Troubleshooting

### Variable Not Loading

**Check:**
1. `.env` file exists in project root
2. Variable name matches exactly (case-sensitive)
3. No quotes needed: `VAR=value` not `VAR="value"`
4. Restart application after changing `.env`

### Database Connection Fails

**Check:**
1. `DB_HOST`, `DB_PORT`, `DB_NAME` are correct
2. `DB_USER` and `DB_PASSWORD` are correct
3. Database server is running
4. Firewall allows connections

### Session Issues

**Check:**
1. `SESSION_SECRET` is set and at least 32 characters
2. `SESSION_MAX_AGE` is a number (milliseconds)
3. Cookies are enabled in browser
4. `secure: true` only with HTTPS

---

**Last Updated:** November 2025  
**Version:** 1.0.0
