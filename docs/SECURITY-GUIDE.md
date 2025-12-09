# Security Quick Reference Guide

## Quick Security Checklist

### Before Deployment:
- [ ] `NODE_ENV=production` set
- [ ] Strong `SESSION_SECRET` configured
- [ ] HTTPS enabled
- [ ] Security audit passed (>80%)
- [ ] Dependencies updated (`npm audit`)
- [ ] Logs monitoring configured
- [ ] Security alerts set up

### Regular Maintenance:
- [ ] Review security logs weekly
- [ ] Run security audit monthly
- [ ] Update dependencies monthly
- [ ] Review failed login attempts
- [ ] Check for unusual activity

## Running Security Tests

### Full Security Audit:
```bash
./tests/security/security-audit.sh
```

**Expected Score:** 80%+ (Good or Excellent)

### Route Authorization Audit:
```bash
./tests/security/route-authorization-audit.sh
```

### Manual Testing:
```bash
# Test XSS protection
# In browser: Try entering <script>alert('xss')</script> in forms

# Test SQL injection
# In browser: Try entering ' OR '1'='1 in login

# Test CSRF protection
# In DevTools: Try POST without CSRF token

# Check security headers
curl -I http://localhost:3000
```

## Security Event Monitoring

### View Security Logs:
```bash
# Development (pretty print to console)
docker-compose logs -f app | grep SECURITY

# Production (JSON logs)
# Configure log aggregation service
```

### Critical Events to Monitor:
- `CSRF_VIOLATION` - CSRF attack attempt
- `XSS_ATTEMPT` - XSS injection attempt
- `SQL_INJECTION_ATTEMPT` - SQL injection attempt
- `SESSION_HIJACK_ATTEMPT` - Session hijacking
- `RATE_LIMIT_EXCEEDED` - Brute force attempt
- `UNAUTHORIZED_ACCESS` - Unauthorized route access

### Example Alert Query (Production):
```javascript
// CloudWatch Insights / ELK query
fields @timestamp, level, message, event_type, ip_address
| filter level = "security" and event_type in ["csrf_violation", "xss_attempt", "sql_injection_attempt"]
| sort @timestamp desc
| limit 100
```

## Security Best Practices

### 1. Input Validation
```javascript
// Always validate and sanitize user input
const { body, validationResult } = require('express-validator');

router.post('/thread',
  body('title').trim().isLength({ min: 3, max: 200 }),
  body('content').trim().isLength({ min: 10, max: 10000 }),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Process valid input
  }
);
```

### 2. Output Escaping
```ejs
<!-- EJS automatically escapes by default -->
<%= userInput %> <!-- Safe: <script> becomes &lt;script&gt; -->
<%- userInput %> <!-- Unsafe: Use only for trusted content -->
```

### 3. Authentication Check
```javascript
// Always check authentication
const requireLogin = (req, res, next) => {
  if (!req.session.user) {
    req.flash('error', 'Please log in to continue');
    return res.redirect('/auth/login');
  }
  next();
};

router.get('/protected', requireLogin, (req, res) => {
  // Protected route
});
```

### 4. Authorization Check
```javascript
// Check ownership before allowing actions
router.post('/thread/:id/edit', requireLogin, async (req, res) => {
  const thread = await Thread.findByPk(req.params.id);
  
  if (thread.authorId !== req.session.user.id) {
    return res.status(403).send('Unauthorized');
  }
  
  // Allow edit
});
```

### 5. CSRF Protection
```javascript
// Generate token (already in app.js)
app.use(csrfToken);

// Include token in forms (already in templates)
<input type="hidden" name="_csrf" value="<%= csrfToken %>">

// Validate token (automatic via csrfProtection middleware)
```

### 6. Password Security
```javascript
// Hash password with bcrypt
const bcrypt = require('bcrypt');
const hashedPassword = await bcrypt.hash(password, 10);

// Compare password
const isValid = await bcrypt.compare(candidatePassword, hashedPassword);
```

### 7. Session Security
```javascript
// Configure secure session (in src/config/session.js)
{
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,      // Prevent XSS
    secure: true,        // HTTPS only (production)
    sameSite: 'strict',  // Prevent CSRF
    maxAge: 24 * 60 * 60 * 1000  // 24 hours
  }
}
```

## Common Vulnerabilities & Prevention

### 1. XSS (Cross-Site Scripting)
**Attack:** `<script>alert('xss')</script>`

**Prevention:**
- ✅ EJS escaping (use `<%=` not `<%-`)
- ✅ DOMPurify sanitization
- ✅ Content Security Policy header

### 2. SQL Injection
**Attack:** `' OR '1'='1`

**Prevention:**
- ✅ Sequelize ORM (parameterized queries)
- ✅ Input validation
- ✅ Never concatenate SQL strings

### 3. CSRF (Cross-Site Request Forgery)
**Attack:** External form posting to your site

**Prevention:**
- ✅ CSRF tokens on all forms
- ✅ SameSite cookie flag
- ✅ Origin/Referer validation

### 4. Brute Force
**Attack:** Repeated login attempts

**Prevention:**
- ✅ Security logging (tracks attempts)
- ⚠️ Rate limiting (recommended)
- ⚠️ Account lockout (recommended)

### 5. Session Hijacking
**Attack:** Stealing session cookies

**Prevention:**
- ✅ HttpOnly cookie flag
- ✅ Secure cookie flag (HTTPS)
- ✅ Session hijacking detection
- ✅ User agent/IP tracking

### 6. Clickjacking
**Attack:** Embedding site in iframe

**Prevention:**
- ✅ X-Frame-Options: DENY
- ✅ CSP frame-ancestors directive

### 7. Information Disclosure
**Attack:** Exposing sensitive data

**Prevention:**
- ✅ No stack traces in production
- ✅ .git directory not accessible
- ✅ .env file not accessible
- ✅ Generic error messages

## Security Headers Reference

### Current Configuration:
```javascript
// Content Security Policy
"default-src 'self'; script-src 'self' 'unsafe-inline' cdn.jsdelivr.net; ..."

// HSTS (HTTPS Strict Transport Security)
"Strict-Transport-Security: max-age=31536000; includeSubDomains; preload"

// Clickjacking Protection
"X-Frame-Options: DENY"

// MIME Sniffing Protection
"X-Content-Type-Options: nosniff"

// XSS Filter
"X-XSS-Protection: 1; mode=block"

// Referrer Policy
"Referrer-Policy: strict-origin-when-cross-origin"

// Permissions Policy
"Permissions-Policy: geolocation=(), microphone=(), camera=()"
```

## Incident Response

### If Security Breach Detected:

1. **Immediate Actions:**
   - Invalidate all active sessions
   - Change all secrets (SESSION_SECRET, DB passwords)
   - Take affected systems offline if needed
   - Preserve logs for investigation

2. **Investigation:**
   - Review security logs for attack patterns
   - Identify affected users/data
   - Determine attack vector
   - Check for data exfiltration

3. **Remediation:**
   - Patch vulnerability
   - Run security audit
   - Reset affected user passwords
   - Notify affected users if data compromised

4. **Prevention:**
   - Update security measures
   - Add monitoring for similar attacks
   - Document incident and lessons learned
   - Review and update security policies

## Security Contact

For security issues:
- Email: security@educard.com
- Report via: GitHub Security Advisory
- Urgent: Contact system administrator

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Helmet.js Documentation](https://helmetjs.github.io/)

## Quick Commands

```bash
# Run security audit
./tests/security/security-audit.sh

# Run route authorization audit
./tests/security/route-authorization-audit.sh

# Check for vulnerable dependencies
npm audit

# Fix vulnerable dependencies
npm audit fix

# Update dependencies
npm update

# Check security headers
curl -I http://localhost:3000

# View security logs (development)
docker-compose logs -f app | grep SECURITY

# View all logs
docker-compose logs -f app

# Restart application
docker-compose restart app

# Clear all sessions (if compromised)
# Connect to Redis/DB and clear session store
```

---

**Last Updated:** [Current Date]  
**Security Score:** 79% (Good)  
**Next Audit Due:** +1 month
