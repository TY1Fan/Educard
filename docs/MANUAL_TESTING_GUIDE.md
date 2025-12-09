# Manual Testing Guide - Educard Forum

**Version:** 1.0.0  
**Purpose:** Guide for conducting comprehensive manual end-to-end testing  
**Target Audience:** QA Testers, Developers, Product Team

---

## Table of Contents

1. [Overview](#overview)
2. [Pre-Testing Setup](#pre-testing-setup)
3. [Test Account Setup](#test-account-setup)
4. [Testing Workflow](#testing-workflow)
5. [Bug Reporting Guidelines](#bug-reporting-guidelines)
6. [Best Practices](#best-practices)
7. [Common Issues](#common-issues)
8. [Resources](#resources)

---

## Overview

This guide provides step-by-step instructions for conducting manual end-to-end testing of the Educard Educational Forum application. The testing process ensures all user flows work correctly before production deployment.

### Testing Objectives
- ✅ Verify all core features work as expected
- ✅ Identify bugs, usability issues, and edge cases
- ✅ Validate security and authorization controls
- ✅ Ensure UI/UX quality across browsers
- ✅ Document any issues for resolution

### Documents Used
- **Testing Checklist:** `docs/TESTING_CHECKLIST.md` - Complete test scenarios
- **Bug Tracker:** `docs/BUGS_FOUND.md` - Document issues found
- **This Guide:** Instructions and best practices

---

## Pre-Testing Setup

### 1. Environment Check

Verify the application is running:

```bash
# Check application status
curl -I http://localhost:3000

# Expected output: HTTP/1.1 200 OK
```

### 2. Database Check

Ensure database is clean and has test data:

```bash
# Check Docker containers
docker ps

# You should see:
# - educard_app (Node.js application)
# - educard_db (PostgreSQL database)
```

### 3. Browser Setup

Test in multiple browsers (minimum):
- **Desktop:** Chrome, Firefox, Safari (macOS)
- **Mobile:** iOS Safari, Chrome (via device or simulator)

### 4. Tools Needed

- **Browser DevTools** - Check console errors
- **Screenshot Tool** - Document bugs visually
- **Text Editor** - Update testing checklist
- **Time Tracker** - Record time spent

---

## Test Account Setup

### Create Test Accounts

You'll need multiple test accounts to verify user interactions:

#### Account 1: Standard User
```
Username: testuser1
Email: testuser1@example.com
Password: TestPass123!
Purpose: Primary test account
```

#### Account 2: Secondary User
```
Username: testuser2
Email: testuser2@example.com
Password: TestPass123!
Purpose: Test user-to-user interactions
```

#### Account 3: Admin User (if applicable)
```
Username: adminuser
Email: admin@example.com
Password: AdminPass123!
Purpose: Test admin features
```

### Account Creation Steps

1. Navigate to http://localhost:3000/register
2. Fill in registration form with test account details
3. Submit and verify success
4. Check database to confirm user creation
5. Repeat for all test accounts

### Reset Test Data

If you need to reset test data between testing sessions:

```bash
# Option 1: Reset database (nuclear option)
docker-compose down -v
docker-compose up -d

# Option 2: Delete specific test data via SQL
docker exec -it educard_db psql -U postgres -d educard
# Then run cleanup queries
```

---

## Testing Workflow

### Step 1: Review Testing Checklist

Open `docs/TESTING_CHECKLIST.md` and review:
- All test sections (16 major areas)
- Individual test scenarios (50+ tests)
- Expected outcomes for each test

### Step 2: Systematic Testing

Follow this workflow for each test:

1. **Read Test Description** - Understand what to test
2. **Perform Test Steps** - Execute the test scenario
3. **Verify Expected Outcome** - Check if it works correctly
4. **Mark Checkbox** - Update testing checklist
5. **Document Issues** - If bugs found, record in BUGS_FOUND.md
6. **Add Notes** - Record any observations

### Step 3: Document Bugs

When you find a bug:

1. **Assess Severity**
   - Critical: Blocks core functionality
   - High: Major feature broken
   - Medium: Minor feature broken
   - Low: Cosmetic issues

2. **Document in BUGS_FOUND.md**
   - Clear title
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details

3. **Update Bug Summary Table**
   - Increment appropriate priority counter

### Step 4: Retest Fixed Bugs

After bugs are fixed:

1. Review fix implementation
2. Retest using original reproduction steps
3. Verify bug no longer occurs
4. Test related functionality
5. Mark bug as "Fixed" in BUGS_FOUND.md
6. Check box in "Retest Results" section

### Step 5: Complete Testing

1. Verify all 50+ test scenarios checked
2. Review all bug reports
3. Calculate testing statistics
4. Complete sign-off section
5. Provide production readiness assessment

---

## Bug Reporting Guidelines

### Good Bug Report Structure

#### ✅ Good Example
```markdown
### BUG-001: Cannot delete thread after editing
**Status:** 🔴 Open
**Priority:** High (P1)
**Date Found:** 2024-12-09

**Description:**
After editing a thread title, the delete button becomes unresponsive.
No error message shown, button just doesn't respond to clicks.

**Steps to Reproduce:**
1. Login as testuser1
2. Create a new thread titled "Test Thread"
3. Click "Edit" on the thread
4. Change title to "Modified Thread"
5. Save changes
6. Click "Delete" button
7. **Bug:** Nothing happens, thread not deleted

**Expected Behavior:**
Delete confirmation modal should appear, and after confirmation,
thread should be deleted and user redirected to thread list.

**Actual Behavior:**
Delete button does not respond. No modal appears. Thread remains.

**Environment:**
- Browser: Chrome 120
- OS: macOS 14.1
- User: testuser1 (thread owner)

**Console Errors:**
```
TypeError: Cannot read property 'id' of undefined
  at deleteThread (thread.js:45)
```

**Workaround:**
Refresh page after editing, then delete works.
```

#### ❌ Bad Example
```markdown
### BUG-001: Delete broken
Delete doesn't work sometimes.
```

### What Makes a Good Bug Report

✅ **Clear, specific title**  
✅ **Detailed reproduction steps**  
✅ **Expected vs actual behavior**  
✅ **Environment information**  
✅ **Screenshots/console errors**  
✅ **Appropriate priority**

❌ Vague descriptions  
❌ Missing reproduction steps  
❌ No environment details  
❌ Wrong priority assessment

---

## Best Practices

### Do's ✅

1. **Test Systematically**
   - Follow checklist order
   - Don't skip sections
   - Complete one section before moving to next

2. **Take Breaks**
   - Testing requires focus
   - Take breaks every hour
   - Fresh eyes catch more bugs

3. **Document Everything**
   - Write notes as you test
   - Screenshot unusual behavior
   - Record timestamps

4. **Test Edge Cases**
   - Empty inputs
   - Very long inputs
   - Special characters
   - Boundary conditions

5. **Use DevTools**
   - Monitor console for errors
   - Check network requests
   - Inspect element states

6. **Test as Real User**
   - Think like an end user
   - Try unexpected actions
   - Test common workflows

### Don'ts ❌

1. **Don't Rush**
   - Take time to be thorough
   - Re-test if uncertain
   - Verify fixes properly

2. **Don't Skip Tests**
   - Every test matters
   - Edge cases catch bugs
   - Complete checklist 100%

3. **Don't Test in Wrong State**
   - Ensure clean state before tests
   - Reset data when needed
   - Use correct test accounts

4. **Don't Ignore Console**
   - Console errors indicate bugs
   - Warnings may reveal issues
   - Check after every action

5. **Don't Test with Cached Data**
   - Clear cache between sessions
   - Hard refresh when needed
   - Use incognito mode if helpful

---

## Common Issues

### Issue: Application Not Responding

**Symptoms:** Slow or unresponsive UI

**Checks:**
```bash
# Check if containers are running
docker ps

# Check application logs
docker logs educard_app

# Check database logs
docker logs educard_db

# Check system resources
docker stats
```

### Issue: Cannot Create Test Accounts

**Symptoms:** Registration fails

**Checks:**
- Database connection working?
- Email validation requirements met?
- Password meets requirements?
- Check console for errors

**Solution:**
```bash
# Check database connection
docker exec -it educard_db psql -U postgres -d educard -c "SELECT 1;"

# Verify users table exists
docker exec -it educard_db psql -U postgres -d educard -c "\dt"
```

### Issue: Tests Pass First Time, Fail Second Time

**Symptoms:** Inconsistent behavior

**Possible Causes:**
- Cached data interfering
- Dirty test state
- Race conditions
- Session issues

**Solution:**
- Clear browser cache/cookies
- Reset test data
- Use incognito mode
- Wait for async operations

### Issue: Different Results in Different Browsers

**Symptoms:** Works in Chrome, fails in Safari

**This is Expected:** Document as browser-specific issue

**Document:**
- Which browsers work
- Which browsers fail
- Specific behavior differences
- Console errors from failing browser

---

## Resources

### Testing Documents
- `docs/TESTING_CHECKLIST.md` - Complete test scenarios
- `docs/BUGS_FOUND.md` - Bug tracking document
- `docs/k8s-tasks/TASK-6.7-SUMMARY.md` - Automated testing results
- `docs/k8s-tasks/TASK-6.8-CROSS-BROWSER-TESTING-REPORT.md` - Browser testing

### Application URLs
- **Local App:** http://localhost:3000
- **API Base:** http://localhost:3000/api
- **Database:** postgresql://localhost:5432/educard

### Useful Commands

```bash
# Start application
docker-compose up -d

# Stop application
docker-compose down

# View logs (real-time)
docker logs -f educard_app

# Access database
docker exec -it educard_db psql -U postgres -d educard

# Check test results
npm test

# Generate test coverage
npm run test:coverage
```

### Browser DevTools Shortcuts

**Chrome/Firefox:**
- Open DevTools: `Cmd+Option+I` (macOS) or `F12`
- Open Console: `Cmd+Option+J` (macOS)
- Network Tab: Check API requests
- Elements Tab: Inspect DOM

**Safari:**
- Enable Developer Menu: Safari > Preferences > Advanced
- Open DevTools: `Cmd+Option+I`
- Check Console: `Cmd+Option+C`

---

## Testing Timeline

### Estimated Time

| Section | Time Estimate |
|---------|--------------|
| Pre-Testing Setup | 15 minutes |
| Test Account Creation | 10 minutes |
| User Registration Tests | 20 minutes |
| Login/Logout Tests | 20 minutes |
| Thread Browsing Tests | 15 minutes |
| Thread Creation Tests | 20 minutes |
| Post Reply Tests | 20 minutes |
| Edit Functionality Tests | 20 minutes |
| Delete Functionality Tests | 15 minutes |
| User Profile Tests | 15 minutes |
| Search Tests | 15 minutes |
| Authorization Tests | 20 minutes |
| Error Handling Tests | 20 minutes |
| UI/UX Tests | 25 minutes |
| Performance Tests | 15 minutes |
| Data Integrity Tests | 15 minutes |
| Edge Case Tests | 20 minutes |
| Bug Documentation | 30 minutes |
| **Total** | **~5-6 hours** |

### Schedule Recommendation

**Day 1 (3 hours):**
- Setup and account creation
- User authentication tests
- Thread browsing and creation
- Post reply tests

**Day 2 (2-3 hours):**
- Edit and delete tests
- Profile and search tests
- Authorization and security
- Error handling

**Day 3 (1-2 hours):**
- UI/UX quality checks
- Performance testing
- Edge cases
- Bug documentation and reporting

---

## Success Criteria

Testing is complete when:

- ✅ All 50+ test scenarios executed
- ✅ All checkboxes marked in testing checklist
- ✅ All bugs documented with proper priority
- ✅ Critical bugs fixed and retested
- ✅ Testing statistics calculated
- ✅ Sign-off section completed
- ✅ Production readiness assessment provided

---

## Support

### Need Help?

1. **Review automated test results:** `npm test`
2. **Check documentation:** docs/ directory
3. **Review implementation:** src/ directory
4. **Check logs:** `docker logs educard_app`

### Questions?

Document questions in testing checklist notes section for team review.

---

**Guide Version:** 1.0  
**Last Updated:** December 9, 2024  
**Maintained By:** QA Team
