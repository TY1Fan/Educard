# Quick Reference Card - Manual Testing

## Test Accounts

```
Username: testuser1
Email:    testuser1@example.com
Password: TestPass123!
```

```
Username: testuser2
Email:    testuser2@example.com
Password: TestPass123!
```

```
Username: adminuser
Email:    admin@example.com
Password: AdminPass123!
```

## Quick Commands

```bash
# Start testing (interactive menu)
./scripts/start-testing.sh

# Setup test accounts
./scripts/setup-test-data.sh

# Check application
curl -I http://localhost:3000

# View logs
docker logs -f educard_app

# Access database
docker exec -it educard_db psql -U postgres -d educard
```

## Application URLs

- **App:** http://localhost:3000
- **Register:** http://localhost:3000/register
- **Login:** http://localhost:3000/login
- **API:** http://localhost:3000/api

## Testing Documents

- **Checklist:** `docs/TESTING_CHECKLIST.md`
- **Bugs:** `docs/BUGS_FOUND.md`
- **Guide:** `docs/MANUAL_TESTING_GUIDE.md`

## Testing Workflow

1. ✅ Run `./scripts/start-testing.sh`
2. ✅ Open testing checklist
3. ✅ Login with test account
4. ✅ Follow test scenarios
5. ✅ Mark checkboxes
6. ✅ Document bugs
7. ✅ Calculate statistics
8. ✅ Complete sign-off

## Bug Priority Guide

| Priority | Description | Action |
|----------|-------------|--------|
| **P0 Critical** | App crashes, data loss, security | Fix immediately |
| **P1 High** | Major features broken | Fix before release |
| **P2 Medium** | Minor features broken | Fix if time permits |
| **P3 Low** | Cosmetic issues | Nice to have |

## Browser DevTools

**Open DevTools:**
- macOS: `Cmd + Option + I`
- Windows/Linux: `F12`

**Open Console:**
- macOS: `Cmd + Option + J`
- Windows/Linux: `Ctrl + Shift + J`

## Common Test Scenarios

### Registration Test
1. Navigate to /register
2. Fill in valid credentials
3. Submit form
4. Verify success message
5. Verify redirect to login
6. Login with new account

### Create Thread Test
1. Login as testuser1
2. Click "New Thread"
3. Enter title and content
4. Submit form
5. Verify thread appears in list
6. Verify can view thread

### Edit Post Test
1. Login as post owner
2. Navigate to post
3. Click "Edit"
4. Modify content
5. Save changes
6. Verify changes visible

### Delete Test
1. Login as owner
2. Navigate to item
3. Click "Delete"
4. Confirm deletion
5. Verify item removed
6. Verify redirect

## Testing Statistics Template

```
Total Tests: ____
Completed: ____
Progress: ____%

Critical Bugs: ____
High Priority: ____
Medium Priority: ____
Low Priority: ____

Time Spent: ____ hours
```

## Production Readiness Checklist

- [ ] All tests completed (100%)
- [ ] No critical bugs
- [ ] No high priority bugs
- [ ] Medium bugs documented
- [ ] Low bugs backlogged
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Sign-off obtained

## Emergency Contacts

- **Technical Issues:** Check `docs/MANUAL_TESTING_GUIDE.md`
- **Bug Template:** Check `docs/BUGS_FOUND.md`
- **Test Questions:** Review `docs/TESTING_CHECKLIST.md`

## Tips

✅ Test in incognito mode for clean state  
✅ Clear cache if behavior is inconsistent  
✅ Check console for errors after every action  
✅ Take screenshots of bugs  
✅ Document reproduction steps clearly  
✅ Test edge cases (empty inputs, long inputs)  
✅ Test as a real user would  
✅ Take breaks to maintain focus  

---

**Print this card and keep it handy during testing!**

**Version:** 1.0 | **Updated:** December 9, 2024
