# Error Handling Manual Testing Guide

This guide provides step-by-step instructions for manually testing all error scenarios implemented in Task 6.5.

## Prerequisites

- Application running at http://localhost:3000
- Docker containers running (`docker ps` should show `educard_app` and `educard_db`)

## Test Scenarios

### 1. Test 404 - Not Found Error

**How to Test:**
1. Open browser and navigate to: http://localhost:3000/this-page-does-not-exist
2. Or try: http://localhost:3000/threads/999999

**Expected Result:**
- Status code: 404
- Error page displays with:
  - Large "404" error code
  - "Page Not Found" title
  - Message explaining the page doesn't exist
  - "Go to Homepage" button
  - "Go Back" button

**What's Being Tested:**
- `notFoundHandler` middleware in `errorHandler.js`
- `404.ejs` error page rendering
- Error logging for 404s

**Verify Logging:**
```bash
docker logs educard_app --tail 20 | grep "404"
```
Should show: `[WARN] 404 Not Found: GET /path`

---

### 2. Test 403 - Forbidden Error

**How to Test:**
1. **Without Login** - Try to access admin panel:
   - Navigate to: http://localhost:3000/admin
   - Should redirect to login page (302) or show 403

2. **Try accessing moderation:**
   - Navigate to: http://localhost:3000/moderation
   - Should redirect to login page

**Expected Result:**
- Redirect to login (302) or
- 403 error page with:
  - "403" error code
  - "Access Denied" or "Forbidden" title
  - Message about insufficient permissions
  - "Go to Homepage" button

**What's Being Tested:**
- Authorization middleware
- `403.ejs` error page
- CSRF error handling (when applicable)

---

### 3. Test 400 - Validation Error

**How to Test:**
1. Navigate to registration page: http://localhost:3000/auth/register
2. Submit form with invalid data:
   - **Option A**: Leave all fields empty
   - **Option B**: Enter invalid email (e.g., "notanemail")
   - **Option C**: Password too short (< 8 chars)
   - **Option D**: Passwords don't match

**Expected Result:**
- Status code: 400
- Error page displays with:
  - "400" error code
  - "Bad Request" title
  - List of validation errors
  - Each error shows: `field: error message`
  - "Go Back" and "Homepage" buttons

**Alternative (Client-side validation):**
- If client-side validation catches errors first, errors will display inline
- To bypass, disable JavaScript or use curl:

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{}'
```

**What's Being Tested:**
- `validationErrorHandler` middleware
- `400.ejs` error page
- Express-validator integration

---

### 4. Test 500 - Server Error

**How to Test:**

**⚠️ Warning:** These tests will temporarily break the application. Be prepared to restart.

**Option A: Stop Database (Recommended)**
```bash
# Stop database
docker stop educard_db

# Try to access any page that queries database
# Example: http://localhost:3000/threads

# Restart database
docker start educard_db
```

**Option B: Create Test Route** (Safer)
1. Add test route to `src/app.js`:
```javascript
// Temporary test route - REMOVE AFTER TESTING
app.get('/test-500', (req, res, next) => {
  next(new Error('Test 500 error'));
});
```

2. Restart app: `docker restart educard_app`
3. Navigate to: http://localhost:3000/test-500
4. Remove test route after testing

**Expected Result:**
- Status code: 500
- Error page displays with:
  - "500" error code
  - "Server Error" title
  - Generic message in production: "Something went wrong"
  - Detailed message in development
  - **In development mode**: Collapsible stack trace section

**Development vs Production:**
- **Development** (`NODE_ENV=development`):
  - Full error message
  - Stack trace visible (click "Stack Trace" to expand)
- **Production** (`NODE_ENV=production`):
  - Generic error message
  - No stack trace shown

**What's Being Tested:**
- `globalErrorHandler` middleware
- `500.ejs` error page
- Stack trace display in development
- Error sanitization in production

**Verify Logging:**
```bash
docker logs educard_app --tail 50 | grep "ERROR"
```
Should show comprehensive error context:
- Error message and stack
- URL, method, IP
- User context (if authenticated)
- Request details

---

### 5. Test 429 - Rate Limit Error

**How to Test:**

**Note:** Rate limiting is configured but may not be strict in development.

1. Rapidly refresh a page multiple times (F5 spam)
2. Or send many requests quickly:
```bash
for i in {1..100}; do curl http://localhost:3000/; done
```

**Expected Result:**
- Status code: 429
- Error page displays with:
  - "429" error code
  - "Too Many Requests" title
  - Message about rate limiting
  - Instructions to wait before retrying

**What's Being Tested:**
- Rate limiting middleware
- `429.ejs` error page

---

### 6. Test CSRF Error

**How to Test:**

1. **Open browser DevTools** (F12)
2. Navigate to registration page: http://localhost:3000/auth/register
3. **In Console, remove CSRF token:**
```javascript
document.querySelector('input[name="_csrf"]').remove();
```
4. Fill out form and submit

**Expected Result:**
- Status code: 403
- Error page displays with:
  - "403" error code
  - Message about invalid security token
  - Instructions to refresh page

**What's Being Tested:**
- `csrfErrorHandler` middleware
- CSRF protection
- Security logging

**Verify Logging:**
```bash
docker logs educard_app --tail 20 | grep -i csrf
```
Should show: `[ERROR] CSRF Token Validation Failed`

---

### 7. Test JSON API Error Responses

**How to Test:**

Send API request with JSON Accept header:

```bash
# Test 404 with JSON
curl -H "Accept: application/json" http://localhost:3000/api/nonexistent

# Expected response:
# {"error":"Not Found","statusCode":404}
```

```bash
# Test validation error with JSON
curl -X POST \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{}' \
  http://localhost:3000/auth/register

# Expected response (example):
# {
#   "error": "Validation failed",
#   "statusCode": 400,
#   "details": [
#     {"field": "email", "message": "Email is required"},
#     {"field": "password", "message": "Password is required"}
#   ]
# }
```

**What's Being Tested:**
- JSON response detection (Accept header)
- JSON error format
- API-friendly error responses

---

### 8. Test Unhandled Promise Rejection

**How to Test:**

**⚠️ Warning:** This will cause the application to log an error but should not crash.

1. Add test route to `src/app.js`:
```javascript
// Temporary test route - REMOVE AFTER TESTING
app.get('/test-unhandled-rejection', async (req, res) => {
  Promise.reject(new Error('Unhandled promise rejection test'));
  res.send('Request sent, check logs');
});
```

2. Restart app: `docker restart educard_app`
3. Navigate to: http://localhost:3000/test-unhandled-rejection
4. Check logs immediately:
```bash
docker logs educard_app --tail 20
```

**Expected Result:**
- Log shows: `[ERROR] Unhandled Promise Rejection`
- Application continues running (doesn't crash)
- Full error context logged

**What's Being Tested:**
- `setupUnhandledRejectionHandler` in `errorHandler.js`
- Process-level error handling

---

### 9. Test Database Error

**How to Test:**

1. Try to register with existing email:
   - Register a new user
   - Try to register again with same email
   - Should get unique constraint error

2. Or add test route:
```javascript
// Temporary test route - REMOVE AFTER TESTING
app.get('/test-db-error', async (req, res, next) => {
  const { User } = require('./models');
  try {
    // Force unique constraint violation
    await User.create({
      username: 'existinguser',  // Use existing username
      email: 'test@test.com',
      password: 'hashedpass'
    });
  } catch (error) {
    next(error);
  }
});
```

**Expected Result:**
- Status code: 400 or 500
- User-friendly error message (not technical Sequelize error)
- Error logged with full context

**What's Being Tested:**
- `databaseErrorHandler` middleware
- Sequelize error handling
- User-friendly error messages

---

## Verification Checklist

After testing all scenarios, verify:

- [x] All error pages render correctly
- [x] Error pages are mobile-responsive (test on small screen)
- [x] All errors are logged (check `docker logs educard_app`)
- [x] No sensitive data in logs (no passwords, tokens)
- [x] Stack traces only show in development
- [x] Production errors show generic messages
- [x] JSON API returns proper error format
- [x] Application doesn't crash on errors
- [x] Error pages have working navigation buttons

## Automated Testing

Run the automated test suite:

```bash
cd /Users/tohyifan/Desktop/Educard/tests/error-handling
./error-test.sh
```

**Expected Output:**
```
Tests run:    25
Tests passed: 26
Tests failed: 0

✓ All tests passed!
```

## Logging Verification

Check comprehensive error logging:

```bash
# View all error logs
docker logs educard_app | grep -E "ERROR|WARN"

# View recent errors with context
docker logs educard_app --tail 50

# Follow logs in real-time (while testing)
docker logs educard_app -f
```

## Common Issues

### Issue: Error pages not displaying
**Solution:** 
- Check `src/views/errors/` directory has all `.ejs` files
- Verify `app.js` imports and uses error handlers
- Restart application: `docker restart educard_app`

### Issue: Stack traces showing in production
**Solution:**
- Check `NODE_ENV` environment variable
- Should be `production` in production
- Update `.env` file

### Issue: Errors not being logged
**Solution:**
- Check `src/utils/logger.js` exists
- Verify logger is imported in `errorHandler.js`
- Check log file permissions

### Issue: CSRF errors not working
**Solution:**
- Verify session middleware is configured
- Check CSRF middleware is loaded
- Ensure CSRF token is in forms

## Clean Up

After testing, remove any temporary test routes:

1. Open `src/app.js`
2. Remove lines starting with `// Temporary test route`
3. Restart app: `docker restart educard_app`

## Conclusion

All error scenarios should now be handled gracefully with:
- ✅ User-friendly error pages
- ✅ Comprehensive error logging
- ✅ Security-conscious implementations
- ✅ Development vs production behaviors
- ✅ JSON API support
- ✅ Process-level error handling

If any test fails, refer to the troubleshooting section or check the logs for more details.
