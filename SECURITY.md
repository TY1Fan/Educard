# Security Policy

## Overview

This document outlines the security measures implemented in the Educard Forum application and provides guidelines for maintaining security best practices.

## Reporting Security Vulnerabilities

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT** create a public GitHub issue
2. Email security concerns to: [your-email@example.com]
3. Provide detailed information about the vulnerability
4. Allow reasonable time for the issue to be addressed before public disclosure

## Security Measures Implemented

### 1. Authentication & Authorization

#### Password Security
- **Bcrypt Hashing**: All passwords are hashed using bcrypt with a salt factor of 10
- **Minimum Requirements**: Passwords must be at least 6 characters (configurable)
- **No Plain Text Storage**: Passwords are never stored in plain text

#### Session Management
- **Secure Sessions**: Express-session with secure cookie settings
- **Session Store**: PostgreSQL session store for persistence
- **HTTPS Only** (production): Cookies marked as `secure` in production
- **HttpOnly Flags**: Prevents JavaScript access to session cookies
- **Session Expiration**: Configurable session timeout

#### Role-Based Access Control (RBAC)
- **User Roles**: Guest, User, Moderator, Admin
- **Middleware Protection**: `requireAuth`, `requireAdmin`, `requireModerator`
- **Route-Level Security**: All admin/moderator routes are protected
- **View-Level Security**: UI elements hidden based on user permissions

### 2. Input Validation & Sanitization

#### Express Validator
- **All User Input Validated**: Registration, login, posts, threads, profiles
- **Sanitization**: XSS-prone inputs are sanitized using `escape()` and `trim()`
- **Length Limits**: Enforced on all text inputs
  - Thread titles: max 200 characters
  - Post content: max 10,000 characters
  - Usernames: 3-20 characters
  - Email: valid email format

#### SQL Injection Prevention
- **Sequelize ORM**: All database queries use parameterized queries
- **No Raw SQL**: Avoid raw SQL queries; use Sequelize methods
- **Prepared Statements**: Automatic parameter binding

### 3. Cross-Site Scripting (XSS) Protection

#### Server-Side Protection
- **EJS Auto-Escaping**: All user-generated content is escaped by default
- **DOMPurify**: Client-side HTML sanitization for markdown rendering
- **Content-Security-Policy**: Helmet.js CSP headers restrict script sources

#### Markdown Rendering
- **marked.js**: Converts markdown to HTML safely
- **DOMPurify**: Sanitizes HTML output before rendering
- **Configuration**: Allows safe tags only (no `<script>`, `<iframe>`, etc.)

```javascript
// Markdown sanitization example
const dirty = marked.parse(content);
const clean = DOMPurify.sanitize(dirty, {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'code', 'pre', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
  ALLOWED_ATTR: ['href', 'target', 'rel']
});
```

### 4. Cross-Site Request Forgery (CSRF) Protection

#### CSRF Tokens
- **All State-Changing Requests**: POST, PUT, DELETE require CSRF token
- **Token Generation**: Unique token per session
- **Token Validation**: Middleware checks token on every request
- **Double Submit Cookie**: Session-based CSRF protection

#### Implementation
```javascript
// CSRF middleware (already implemented)
app.use(csrfToken);       // Generate token for all requests
app.use(csrfProtection);  // Validate token on state-changing requests
```

All forms include hidden CSRF token field:
```html
<input type="hidden" name="_csrf" value="<%= csrfToken %>">
```

### 5. Rate Limiting

#### General Rate Limiting
- **Window**: 15 minutes
- **Max Requests**: 100 per IP
- **Applies To**: All routes

#### Authentication Rate Limiting
- **Window**: 15 minutes
- **Max Attempts**: 5 per IP
- **Applies To**: Login, registration
- **Protects Against**: Brute force attacks

#### Content Creation Rate Limiting
- **Window**: 1 minute
- **Max Posts**: 10 per minute
- **Applies To**: Creating threads, posts, editing posts
- **Protects Against**: Spam and abuse

#### Password Reset Rate Limiting
- **Window**: 1 hour
- **Max Attempts**: 3 per IP
- **Applies To**: Password reset requests

### 6. Security Headers (Helmet.js)

#### Implemented Headers

**Content-Security-Policy**
- Restricts script sources to self and trusted CDNs
- Blocks inline scripts except where necessary
- Prevents loading of untrusted resources

**X-Frame-Options**
- Set to `DENY` to prevent clickjacking attacks

**X-Content-Type-Options**
- Set to `nosniff` to prevent MIME type sniffing

**Strict-Transport-Security (HSTS)**
- Forces HTTPS connections
- Max age: 1 year
- Includes subdomains
- Preload enabled

**X-XSS-Protection**
- Enables browser XSS filter

**Referrer-Policy**
- Set to `strict-origin-when-cross-origin`

**Permissions-Policy**
- Disables geolocation, microphone, camera

### 7. Database Security

#### Query Protection
- **Parameterized Queries**: All queries use Sequelize ORM
- **No String Concatenation**: Never build SQL with string concatenation
- **Prepared Statements**: Automatic with Sequelize
- **Query Logging**: Enhanced logging for debugging (disabled in production)

#### Performance Indexes
- **Foreign Key Indexes**: All foreign keys are indexed
- **Compound Indexes**: Optimized for common query patterns
- **Regular Analysis**: Use `npm run db:analyze` to check performance

#### Statement Timeout
- **Timeout**: 10 seconds to prevent runaway queries
- **Protection**: Against denial-of-service via slow queries

### 8. Error Handling

#### Production Error Pages
- **Generic Error Messages**: Don't leak stack traces or sensitive info
- **Custom Error Pages**: 404, 429, 500 error pages
- **Logging**: Errors logged server-side for debugging

#### Development vs Production
- **Development**: Detailed error messages for debugging
- **Production**: Generic error messages, full logging to files

### 9. File Upload Security

**Note**: Currently no file uploads are implemented. If added, implement:
- File type validation (whitelist)
- File size limits
- Virus scanning
- Storage outside web root
- Unique filenames (prevent overwrites)
- Content-Type validation

### 10. Dependency Security

#### Regular Audits
```bash
npm audit          # Check for vulnerabilities
npm audit fix      # Automatically fix vulnerabilities
npm outdated       # Check for outdated packages
```

#### Update Schedule
- **Weekly**: Check for security updates
- **Monthly**: Update dependencies
- **Immediate**: Critical security patches

## Security Best Practices for Contributors

### Code Review Checklist
- [ ] All user inputs are validated and sanitized
- [ ] All forms include CSRF tokens
- [ ] No raw SQL queries (use Sequelize)
- [ ] No inline JavaScript in templates (use external scripts)
- [ ] Authentication checks on protected routes
- [ ] Role checks for admin/moderator features
- [ ] Error messages don't leak sensitive information
- [ ] Passwords are hashed with bcrypt
- [ ] Session cookies are HttpOnly and Secure (production)

### Secure Coding Guidelines

#### Never Do This ❌
```javascript
// BAD: Raw SQL with string concatenation
db.query(`SELECT * FROM users WHERE id = ${req.params.id}`);

// BAD: No validation
const username = req.body.username;
user.update({ username });

// BAD: Plain text passwords
user.password = req.body.password;

// BAD: Inline JavaScript
<script>alert('<%= userInput %>')</script>
```

#### Always Do This ✅
```javascript
// GOOD: Sequelize ORM with parameters
User.findOne({ where: { id: req.params.id } });

// GOOD: Validation with express-validator
body('username').trim().isLength({ min: 3, max: 20 }).escape();

// GOOD: Bcrypt password hashing
user.password = await bcrypt.hash(req.body.password, 10);

// GOOD: EJS auto-escaping
<div><%= userInput %></div>
```

## Security Configuration

### Environment Variables

Required security-related environment variables:

```env
# Session
SESSION_SECRET=your-secure-random-string-here

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=educard_forum
DB_USER=your_db_user
DB_PASSWORD=your_secure_db_password

# App
NODE_ENV=production
PORT=3000
TRUST_PROXY=true  # If behind a reverse proxy
```

### Production Deployment

#### Nginx Configuration (Recommended)
```nginx
# HTTPS redirect
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL certificates
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # SSL security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to Node.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Security Testing

### Manual Testing Checklist

#### Authentication
- [ ] Attempt to access admin pages without login → Redirect to login
- [ ] Attempt to access admin pages as regular user → Access denied
- [ ] Try SQL injection in login form → Should be blocked
- [ ] Try XSS in username field → Should be escaped
- [ ] Brute force login → Rate limited after 5 attempts

#### Authorization
- [ ] Regular user cannot access `/admin/*` routes
- [ ] Regular user cannot pin/lock threads
- [ ] Regular user cannot hide posts
- [ ] Moderator can hide posts but not manage users
- [ ] Admin has full access

#### CSRF Protection
- [ ] Submit form without CSRF token → 403 Forbidden
- [ ] Submit form with invalid CSRF token → 403 Forbidden
- [ ] Submit form with valid token → Success

#### XSS Protection
- [ ] Post content with `<script>alert('XSS')</script>` → Escaped or sanitized
- [ ] Thread title with HTML tags → Escaped
- [ ] Profile bio with JavaScript → Sanitized

#### Rate Limiting
- [ ] Make 6+ login attempts → Rate limited
- [ ] Create 11+ posts in 1 minute → Rate limited
- [ ] Make 101+ requests in 15 minutes → Rate limited

### Automated Security Testing

```bash
# Run npm audit
npm audit

# Check for outdated packages
npm outdated

# Analyze database performance
npm run db:analyze
```

## Incident Response

### In Case of Security Breach

1. **Immediate Actions**
   - Identify and contain the breach
   - Change all passwords and secrets
   - Review logs for suspicious activity
   - Take affected systems offline if necessary

2. **Investigation**
   - Determine scope and impact
   - Identify vulnerable code/configuration
   - Document findings

3. **Remediation**
   - Apply security patches
   - Update vulnerable dependencies
   - Improve security measures
   - Test fixes thoroughly

4. **Communication**
   - Notify affected users
   - Provide clear instructions
   - Be transparent about what happened
   - Explain steps taken to prevent recurrence

5. **Post-Incident**
   - Conduct post-mortem
   - Update security policies
   - Improve monitoring and alerting
   - Train team on lessons learned

## Security Contacts

- **Security Lead**: [Your Name] - [email@example.com]
- **Development Team**: [team@example.com]

## Version History

- **v1.0.0** (2025-01-27): Initial security documentation
  - Authentication & authorization
  - Input validation & sanitization
  - XSS & CSRF protection
  - Rate limiting
  - Security headers
  - Database security

---

**Last Updated**: January 27, 2025  
**Next Review**: April 27, 2025
