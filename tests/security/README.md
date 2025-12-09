# Security Testing Suite

This directory contains automated security testing scripts for the Educard forum application.

## Test Scripts

### 1. `security-audit.sh`
Comprehensive security audit covering 10 categories of tests (34 total tests).

**What it tests:**
- ✅ Security headers (CSP, HSTS, X-Frame-Options, etc.)
- ✅ CSRF protection
- ✅ XSS prevention (4 attack vectors)
- ✅ SQL injection prevention (4 attack vectors)
- ✅ Authentication & authorization
- ✅ Password security
- ✅ Session security
- ✅ Information disclosure
- ✅ HTTP method security
- ✅ Rate limiting

**Usage:**
```bash
./tests/security/security-audit.sh
```

**Expected Output:**
```
==========================================
Security Audit Summary
==========================================

Total Tests: 34
Passed: 27
Failed: 0
Warnings: 7

Security Score: 79% - Good
```

### 2. `route-authorization-audit.sh`
Audits all route files for proper authentication and authorization.

**What it checks:**
- Authentication middleware on protected routes
- Role-based authorization
- CSRF protection on POST routes
- Critical route protection

**Usage:**
```bash
./tests/security/route-authorization-audit.sh
```

## Test Categories

### 1. Security Headers (8 tests)
Verifies that all necessary security headers are present:
- Content-Security-Policy
- X-Frame-Options (DENY)
- X-Content-Type-Options (nosniff)
- X-XSS-Protection
- Referrer-Policy
- Permissions-Policy
- X-Powered-By (should be hidden)
- Strict-Transport-Security (HSTS)

### 2. CSRF Protection (2 tests)
- CSRF token present in forms
- POST requests blocked without token

### 3. XSS Protection (4 tests)
Tests against common XSS attack vectors:
1. `<script>alert('xss')</script>`
2. `<img src=x onerror=alert('xss')>`
3. `<svg onload=alert('xss')>`
4. `javascript:alert('xss')`

### 4. SQL Injection Protection (4 tests)
Tests against common SQL injection attempts:
1. `' OR '1'='1`
2. `admin'--`
3. `' OR 1=1--`
4. `'; DROP TABLE users; --`

### 5. Authentication & Authorization (3 tests)
Verifies protected routes require authentication:
- `/profile/edit`
- `/category/general/new-thread`
- `/admin/dashboard`

### 6. Password Security (2 tests)
- bcrypt hashing verification
- Weak password rejection

### 7. Session Security (2 tests)
- HttpOnly flag on cookies
- Secure flag on cookies (HTTPS)

### 8. Information Disclosure (3 tests)
- No stack traces in errors
- .git directory not accessible
- .env file not accessible

### 9. HTTP Methods (5 tests)
- TRACE method blocked
- TRACK method blocked
- OPTIONS method blocked
- PUT method blocked
- DELETE method blocked

### 10. Rate Limiting (1 test)
- Rate limiting on authentication endpoints

## Interpreting Results

### Security Scores:
- **90%+:** Excellent - Production ready
- **75-89%:** Good - Minor improvements recommended
- **60-74%:** Needs Improvement - Address warnings
- **<60%:** Critical Issues - Do not deploy

### Result Types:
- **✓ PASS** (Green) - Test passed successfully
- **✗ FAIL** (Red) - Critical security issue
- **⚠ WARNING** (Yellow) - Recommended improvement

## Current Security Status

**Security Score:** 79% (Good)

**Passed:** 27/34 tests
**Failed:** 0/34 tests  
**Warnings:** 7/34 tests

### Warnings Explained:

1. **Weak Password Rejection** ⚠️
   - Status: Client-side validation only
   - Impact: Low (validation exists, but can be bypassed)
   - Recommendation: Add server-side password strength validation

2. **Secure Cookie Flag** ⚠️
   - Status: Not set in development
   - Impact: None for local development
   - Action: Auto-enabled in production with HTTPS

3. **HTTP Methods (TRACE, TRACK, PUT, DELETE)** ⚠️ (4 warnings)
   - Status: Return 403 but not 405
   - Impact: Low (still blocked, just different error code)
   - Action: No action needed

4. **Rate Limiting** ⚠️
   - Status: Not implemented
   - Impact: Medium (brute force attacks possible)
   - Recommendation: Implement express-rate-limit (see below)

## Recommendations

### High Priority:

#### 1. Implement Rate Limiting
```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

app.post('/auth/login', loginLimiter, authController.login);
```

#### 2. Add Server-Side Password Validation
```javascript
// In validation middleware
body('password')
  .isLength({ min: 8 })
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .withMessage('Password must contain uppercase, lowercase, number, and special character')
```

### Medium Priority:

#### 3. Set up Production Logging
Configure logging service (Winston, CloudWatch, ELK stack) to aggregate security logs.

#### 4. Configure Security Alerts
Set up alerts for critical security events:
- CSRF violations
- XSS attempts
- SQL injection attempts
- Session hijacking
- Brute force attacks

## Running Tests Manually

### Test XSS Protection:
```bash
# Try in browser registration form
<script>alert('xss')</script>

# Expected: Input sanitized, no alert shown
# Check logs: Should see XSS_ATTEMPT event
```

### Test SQL Injection:
```bash
# Try in browser login form
' OR '1'='1

# Expected: Login fails, error message shown
# Check logs: Should see SQL_INJECTION_ATTEMPT event
```

### Test CSRF Protection:
```bash
# In browser DevTools
curl -X POST http://localhost:3000/auth/login \
  -d "usernameOrEmail=test&password=test"

# Expected: 403 Forbidden
# Check logs: Should see CSRF_VIOLATION event
```

### Test Unauthorized Access:
```bash
# Without logging in
curl -I http://localhost:3000/profile/edit

# Expected: 302 Redirect to login
# Check logs: Should see UNAUTHORIZED_ACCESS event
```

## Continuous Integration

### GitHub Actions Example:
```yaml
name: Security Audit

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run security audit
        run: npm audit
      - name: Start application
        run: docker-compose up -d
      - name: Wait for app
        run: sleep 10
      - name: Run security tests
        run: ./tests/security/security-audit.sh
      - name: Check security score
        run: |
          if [ $? -eq 0 ]; then
            echo "✅ Security audit passed"
          else
            echo "❌ Security audit failed"
            exit 1
          fi
```

## Troubleshooting

### Tests Failing:
1. Ensure application is running: `docker-compose ps`
2. Check application logs: `docker-compose logs app`
3. Verify application responds: `curl http://localhost:3000`
4. Check port 3000 is not blocked by firewall

### CSRF Token Not Found:
1. Clear browser cache and cookies
2. Restart application: `docker-compose restart app`
3. Check session configuration in `src/config/session.js`

### Security Headers Missing:
1. Check `src/middleware/securityHeaders.js` exists
2. Verify middleware is loaded in `src/app.js`
3. Restart application

## Security Logging

### View Security Events:
```bash
# Development (pretty print)
docker-compose logs -f app | grep SECURITY

# View all events
docker-compose logs -f app | grep -E "SECURITY|security"

# View specific event type
docker-compose logs -f app | grep "login_failure"
```

### Security Event Types:
- `login_success` - Successful login
- `login_failure` - Failed login attempt
- `logout` - User logout
- `register` - New user registration
- `unauthorized_access` - Unauthorized route access
- `csrf_violation` - CSRF token violation
- `xss_attempt` - XSS injection attempt
- `sql_injection_attempt` - SQL injection attempt
- `rate_limit_exceeded` - Brute force detected
- `session_hijack_attempt` - Session hijacking detected
- `admin_action` - Admin/moderator action
- `permission_denied` - Permission denied (403)

## Additional Resources

- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Security Guide](../../docs/SECURITY-GUIDE.md)

## Maintenance Schedule

- **Daily:** Monitor security logs for unusual activity
- **Weekly:** Review failed login attempts and security events
- **Monthly:** Run full security audit and update dependencies
- **Quarterly:** Review and update security policies
- **Annually:** Conduct professional penetration testing

---

**Last Updated:** [Current Date]  
**Test Coverage:** 34 tests across 10 categories  
**Current Score:** 79% (Good)
