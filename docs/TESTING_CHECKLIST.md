# Manual End-to-End Testing Checklist - Educard Forum

**Testing Date:** December 9, 2024  
**Tester Name:** _______________  
**Application Version:** 1.0.0  
**Environment:** http://localhost:3000  

**Status Legend:**
- ✅ Pass - Feature works as expected
- ❌ Fail - Feature broken or not working
- ⚠️ Issue - Works but has minor issues
- 🔄 Retest - Needs retesting after fix
- ⏭️ Skip - Not applicable/not implemented

---

## Pre-Testing Setup

### Environment Check
- [ ] Application is running and accessible
- [ ] Database is populated with test data
- [ ] Test user accounts prepared
- [ ] Browser cleared (cache/cookies)
- [ ] Bug tracking document ready

### Test Accounts Created
- [ ] Test User 1: username: `testuser1`, email: `test1@educard.com`
- [ ] Test User 2: username: `testuser2`, email: `test2@educard.com`
- [ ] Admin User: username: `admin`, email: `admin@educard.com`

---

## 1. User Registration Flow

### 1.1 Access Registration Page
**Test:** Navigate to registration page

- [ ] Can access `/auth/register` directly
- [ ] Can access via "Register" link from homepage
- [ ] Page loads without errors
- [ ] Form displays correctly
- [ ] All required fields visible

**Status:** ___  
**Notes:** _______________________________________________

---

### 1.2 Form Validation - Invalid Inputs
**Test:** Submit form with invalid data

#### Username Validation
- [ ] Rejects username < 3 characters
- [ ] Rejects username > 20 characters
- [ ] Rejects username with special characters
- [ ] Rejects empty username
- [ ] Shows clear error message

**Status:** ___  
**Notes:** _______________________________________________

#### Email Validation
- [ ] Rejects invalid email format (no @)
- [ ] Rejects invalid email format (no domain)
- [ ] Rejects empty email
- [ ] Shows clear error message

**Status:** ___  
**Notes:** _______________________________________________

#### Password Validation
- [ ] Rejects password < 8 characters
- [ ] Rejects empty password
- [ ] Rejects mismatched password confirmation
- [ ] Shows clear error message

**Status:** ___  
**Notes:** _______________________________________________

---

### 1.3 Form Validation - Duplicate Prevention
**Test:** Attempt to register with existing credentials

- [ ] Rejects duplicate username
- [ ] Rejects duplicate email
- [ ] Shows appropriate error message
- [ ] Preserves other form fields

**Status:** ___  
**Notes:** _______________________________________________

---

### 1.4 Successful Registration
**Test:** Complete registration with valid data

- [ ] Form accepts valid data
- [ ] No errors during submission
- [ ] Redirected to appropriate page (home or login)
- [ ] Success message displayed
- [ ] User can immediately log in
- [ ] New user appears in database

**Test Data:**
- Username: `e2e_test_user_[timestamp]`
- Email: `e2e_test_[timestamp]@test.com`
- Password: `TestPass123!`

**Status:** ___  
**Notes:** _______________________________________________

---

## 2. User Login/Logout Flow

### 2.1 Access Login Page
**Test:** Navigate to login page

- [ ] Can access `/auth/login` directly
- [ ] Can access via "Login" link from homepage
- [ ] Page loads without errors
- [ ] Form displays correctly
- [ ] Remember me option visible (if implemented)

**Status:** ___  
**Notes:** _______________________________________________

---

### 2.2 Login Validation - Invalid Credentials
**Test:** Attempt login with wrong credentials

- [ ] Rejects invalid username
- [ ] Rejects invalid password
- [ ] Rejects non-existent user
- [ ] Shows clear error message (doesn't reveal if user exists)
- [ ] Preserves username field

**Status:** ___  
**Notes:** _______________________________________________

---

### 2.3 Successful Login
**Test:** Login with valid credentials

- [ ] Form accepts valid credentials
- [ ] No errors during submission
- [ ] Redirected to homepage or intended page
- [ ] Navigation shows "Logged in as [username]"
- [ ] User-specific features now accessible
- [ ] Session persists across page navigation

**Test Data:**
- Username: `testuser1`
- Password: `TestPass123!`

**Status:** ___  
**Notes:** _______________________________________________

---

### 2.4 Session Persistence
**Test:** Verify session maintains across interactions

- [ ] Navigate to different pages
- [ ] Refresh browser (F5)
- [ ] Open link in new tab
- [ ] Session remains active
- [ ] User stays logged in

**Status:** ___  
**Notes:** _______________________________________________

---

### 2.5 Logout
**Test:** Log out and verify session ends

- [ ] Can access logout via navigation menu
- [ ] Confirmation prompt appears (optional)
- [ ] Redirected to homepage or login
- [ ] Navigation no longer shows username
- [ ] Cannot access protected pages
- [ ] Must login again to access protected features

**Status:** ___  
**Notes:** _______________________________________________

---

## 3. Thread Browsing

### 3.1 Homepage Thread List
**Test:** View main thread listing

- [ ] Homepage displays thread list
- [ ] Threads show title
- [ ] Threads show author
- [ ] Threads show creation date/time
- [ ] Threads show category
- [ ] Threads show reply count
- [ ] Threads are sorted correctly (newest first or by activity)

**Status:** ___  
**Notes:** _______________________________________________

---

### 3.2 Category Filtering
**Test:** Browse threads by category

- [ ] Can view category list
- [ ] Can click on category
- [ ] Threads filter to selected category
- [ ] Category name displayed prominently
- [ ] Can return to all threads
- [ ] Empty categories show helpful message

**Categories to Test:**
- [ ] General Discussion
- [ ] Questions & Answers
- [ ] Announcements
- [ ] Study Groups
- [ ] Resources

**Status:** ___  
**Notes:** _______________________________________________

---

### 3.3 Thread Pagination
**Test:** Navigate through multiple pages of threads

- [ ] Pagination controls visible (if > 20 threads)
- [ ] Can navigate to next page
- [ ] Can navigate to previous page
- [ ] Can jump to specific page number
- [ ] Current page highlighted
- [ ] Thread count accurate

**Status:** ___  
**Notes:** _______________________________________________

---

### 3.4 Empty States
**Test:** View pages with no content

- [ ] Empty category shows helpful message
- [ ] Empty search results show helpful message
- [ ] Messages suggest next actions
- [ ] No errors displayed

**Status:** ___  
**Notes:** _______________________________________________

---

## 4. Thread Viewing

### 4.1 Thread Detail Page
**Test:** Open and view a thread

- [ ] Can click on thread title
- [ ] Thread page loads correctly
- [ ] Thread title displayed
- [ ] Thread content displayed (with markdown rendering)
- [ ] Thread author shown
- [ ] Thread creation date shown
- [ ] Category badge/link shown
- [ ] View count increments

**Status:** ___  
**Notes:** _______________________________________________

---

### 4.2 Thread Posts/Replies
**Test:** View posts in thread

- [ ] All posts display in order
- [ ] First post shows thread content
- [ ] Posts show author
- [ ] Posts show timestamp
- [ ] Posts show edit indicator (if edited)
- [ ] Markdown renders correctly
- [ ] Code blocks highlighted (if present)
- [ ] Links are clickable
- [ ] Images display (if present)

**Status:** ___  
**Notes:** _______________________________________________

---

### 4.3 Post Actions (Own Posts)
**Test:** Actions available on user's own posts

- [ ] Edit button visible on own posts
- [ ] Delete button visible on own posts
- [ ] No edit/delete on other users' posts
- [ ] Admin can edit/delete all posts (if applicable)

**Status:** ___  
**Notes:** _______________________________________________

---

## 5. Thread Creation

### 5.1 Access Thread Creation (Not Logged In)
**Test:** Try to create thread without login

- [ ] "New Thread" button hidden OR
- [ ] Clicking redirects to login
- [ ] After login, redirected back to create thread
- [ ] Appropriate message shown

**Status:** ___  
**Notes:** _______________________________________________

---

### 5.2 Access Thread Creation (Logged In)
**Test:** Access thread creation form

- [ ] "New Thread" button visible
- [ ] Can navigate to create thread page
- [ ] Form displays correctly
- [ ] Category dropdown available
- [ ] Title field visible
- [ ] Content textarea visible (with markdown support)
- [ ] Submit button enabled

**Status:** ___  
**Notes:** _______________________________________________

---

### 5.3 Thread Creation Validation
**Test:** Submit thread with invalid data

- [ ] Rejects empty title
- [ ] Rejects title < 3 characters
- [ ] Rejects title > 200 characters
- [ ] Rejects empty content
- [ ] Rejects without category selection
- [ ] Shows clear error messages
- [ ] Preserves entered data on error

**Status:** ___  
**Notes:** _______________________________________________

---

### 5.4 Successful Thread Creation
**Test:** Create thread with valid data

- [ ] Form accepts valid input
- [ ] Markdown preview works (if available)
- [ ] Submit succeeds without errors
- [ ] Redirected to new thread page
- [ ] Thread content displays correctly
- [ ] Markdown renders properly
- [ ] Thread appears in thread list
- [ ] Thread appears in correct category

**Test Data:**
- Category: General Discussion
- Title: `E2E Test Thread - [timestamp]`
- Content: `This is a **test thread** with *markdown* formatting.`

**Status:** ___  
**Notes:** _______________________________________________

---

## 6. Post Reply Creation

### 6.1 Reply Access (Not Logged In)
**Test:** Try to reply without login

- [ ] Reply button/form hidden OR
- [ ] Clicking redirects to login
- [ ] After login, redirected back to thread
- [ ] Appropriate message shown

**Status:** ___  
**Notes:** _______________________________________________

---

### 6.2 Reply Form Display (Logged In)
**Test:** View reply form when logged in

- [ ] Reply form visible
- [ ] Textarea for content
- [ ] Submit button enabled
- [ ] Cancel button available
- [ ] Markdown help available

**Status:** ___  
**Notes:** _______________________________________________

---

### 6.3 Reply Validation
**Test:** Submit reply with invalid data

- [ ] Rejects empty reply
- [ ] Rejects reply < 1 character
- [ ] Shows clear error message
- [ ] Form remains open with entered text

**Status:** ___  
**Notes:** _______________________________________________

---

### 6.4 Successful Reply Creation
**Test:** Post a reply

- [ ] Form accepts valid input
- [ ] Submit succeeds
- [ ] Reply appears at bottom of thread
- [ ] Reply content displays correctly
- [ ] Markdown renders properly
- [ ] Author name correct
- [ ] Timestamp current
- [ ] Reply count increments

**Test Data:**
- Content: `This is a **test reply** with *markdown*.`

**Status:** ___  
**Notes:** _______________________________________________

---

## 7. Edit Functionality

### 7.1 Edit Own Thread
**Test:** Edit a thread you created

- [ ] Edit button visible on own thread
- [ ] Can click edit button
- [ ] Edit form loads with current content
- [ ] Can modify title
- [ ] Can modify content
- [ ] Can change category
- [ ] Cancel button works
- [ ] Save button works

**Status:** ___  
**Notes:** _______________________________________________

---

### 7.2 Edit Validation
**Test:** Submit edit with invalid data

- [ ] Rejects empty title
- [ ] Rejects empty content
- [ ] Shows clear error messages
- [ ] Preserves changes on error

**Status:** ___  
**Notes:** _______________________________________________

---

### 7.3 Successful Edit
**Test:** Successfully edit content

- [ ] Changes save successfully
- [ ] Redirected to updated thread/post
- [ ] Content updates display
- [ ] "Edited" indicator shows
- [ ] Edit timestamp shown
- [ ] No duplicate content created

**Status:** ___  
**Notes:** _______________________________________________

---

### 7.4 Edit Authorization
**Test:** Verify cannot edit others' content

- [ ] Edit button NOT visible on others' posts
- [ ] Direct URL access blocked
- [ ] Appropriate error message shown
- [ ] No content change occurs

**Status:** ___  
**Notes:** _______________________________________________

---

## 8. Delete Functionality

### 8.1 Delete Own Thread
**Test:** Delete a thread you created

- [ ] Delete button visible on own thread
- [ ] Can click delete button
- [ ] Confirmation dialog appears
- [ ] Can cancel deletion
- [ ] Can confirm deletion
- [ ] Thread removes from list
- [ ] Redirected appropriately
- [ ] Thread no longer accessible

**Status:** ___  
**Notes:** _______________________________________________

---

### 8.2 Delete Own Post
**Test:** Delete a post you created

- [ ] Delete button visible on own post
- [ ] Confirmation dialog appears
- [ ] Can cancel deletion
- [ ] Can confirm deletion
- [ ] Post removes from thread
- [ ] Other posts remain intact
- [ ] Reply count decrements

**Status:** ___  
**Notes:** _______________________________________________

---

### 8.3 Delete Authorization
**Test:** Verify cannot delete others' content

- [ ] Delete button NOT visible on others' posts
- [ ] Direct action blocked
- [ ] Appropriate error message shown
- [ ] No content deletion occurs

**Status:** ___  
**Notes:** _______________________________________________

---

## 9. User Profile

### 9.1 View Own Profile
**Test:** Access and view your profile

- [ ] Can access via username link
- [ ] Profile page displays
- [ ] Username shown
- [ ] Join date shown
- [ ] Post count shown
- [ ] Recent activity shown
- [ ] Avatar/gravatar displays
- [ ] Edit profile button available

**Status:** ___  
**Notes:** _______________________________________________

---

### 9.2 View Other User Profile
**Test:** View another user's profile

- [ ] Can click on other usernames
- [ ] Profile page displays
- [ ] User information shown
- [ ] Recent activity visible
- [ ] No edit access available
- [ ] All public info displayed

**Status:** ___  
**Notes:** _______________________________________________

---

### 9.3 Edit Profile
**Test:** Update your profile information

- [ ] Edit profile button works
- [ ] Can update bio/description
- [ ] Can update profile settings
- [ ] Changes save successfully
- [ ] Changes display immediately
- [ ] Validation works on updates

**Status:** ___  
**Notes:** _______________________________________________

---

## 10. Search Functionality

### 10.1 Search Access
**Test:** Access search feature

- [ ] Search box visible in navigation
- [ ] Can enter search terms
- [ ] Search button/icon works
- [ ] Enter key triggers search

**Status:** ___  
**Notes:** _______________________________________________

---

### 10.2 Search Results
**Test:** Perform searches and view results

- [ ] Search returns relevant results
- [ ] Results show thread title
- [ ] Results show excerpt/preview
- [ ] Results are clickable
- [ ] Empty search handled gracefully
- [ ] No results shows helpful message

**Test Searches:**
- [ ] Search: "test"
- [ ] Search: "markdown"
- [ ] Search: "nonexistentterm123"

**Status:** ___  
**Notes:** _______________________________________________

---

## 11. Authorization & Security

### 11.1 Protected Pages (Not Logged In)
**Test:** Try to access protected features without login

- [ ] Cannot access create thread page
- [ ] Cannot access edit pages
- [ ] Cannot submit replies
- [ ] Redirected to login page
- [ ] Return URL preserved

**Status:** ___  
**Notes:** _______________________________________________

---

### 11.2 User Content Protection
**Test:** Try to manipulate other users' content

- [ ] Cannot edit others' threads via UI
- [ ] Cannot edit others' posts via UI
- [ ] Cannot delete others' content via UI
- [ ] Direct URL manipulation blocked
- [ ] Appropriate error messages shown

**Status:** ___  
**Notes:** _______________________________________________

---

### 11.3 Session Security
**Test:** Verify session handling

- [ ] Session expires after inactivity (if implemented)
- [ ] Cannot use another user's session
- [ ] CSRF protection works
- [ ] XSS attempts blocked
- [ ] SQL injection attempts blocked

**Status:** ___  
**Notes:** _______________________________________________

---

## 12. Error Handling

### 12.1 404 Not Found
**Test:** Access non-existent pages

- [ ] Custom 404 page displays
- [ ] Clear error message
- [ ] Navigation still works
- [ ] Can return to home

**Test URLs:**
- [ ] `/nonexistent`
- [ ] `/thread/999999`
- [ ] `/user/nonexistent`

**Status:** ___  
**Notes:** _______________________________________________

---

### 12.2 500 Server Error
**Test:** Trigger server error (if safe to do)

- [ ] Custom 500 page displays
- [ ] Clear error message
- [ ] No sensitive info exposed
- [ ] Can navigate away

**Status:** ___  
**Notes:** _______________________________________________

---

### 12.3 Form Errors
**Test:** Verify all form error messages

- [ ] Errors display prominently
- [ ] Errors are specific and helpful
- [ ] Field-level errors shown
- [ ] Form data preserved on error
- [ ] Can correct and resubmit

**Status:** ___  
**Notes:** _______________________________________________

---

## 13. UI/UX Quality

### 13.1 Navigation
**Test:** Verify navigation usability

- [ ] All nav links work
- [ ] Current page highlighted
- [ ] Breadcrumbs work (if implemented)
- [ ] Back button behavior correct
- [ ] No broken links

**Status:** ___  
**Notes:** _______________________________________________

---

### 13.2 Visual Consistency
**Test:** Check visual design consistency

- [ ] Consistent styling across pages
- [ ] Buttons styled consistently
- [ ] Forms styled consistently
- [ ] Colors consistent with theme
- [ ] Typography consistent
- [ ] Spacing/margins consistent

**Status:** ___  
**Notes:** _______________________________________________

---

### 13.3 Loading States
**Test:** Verify loading indicators

- [ ] Loading spinners show during operations
- [ ] Buttons disable during submit
- [ ] Progress indicators visible
- [ ] No double-submit possible

**Status:** ___  
**Notes:** _______________________________________________

---

### 13.4 Success Feedback
**Test:** Verify success messages

- [ ] Success messages display prominently
- [ ] Messages are clear and specific
- [ ] Messages auto-dismiss (if applicable)
- [ ] Can manually dismiss messages

**Status:** ___  
**Notes:** _______________________________________________

---

## 14. Performance

### 14.1 Page Load Times
**Test:** Measure page load performance

- [ ] Homepage loads < 2 seconds
- [ ] Thread list loads < 2 seconds
- [ ] Thread detail loads < 2 seconds
- [ ] No browser console errors
- [ ] No browser console warnings

**Status:** ___  
**Notes:** _______________________________________________

---

### 14.2 Responsiveness
**Test:** Verify UI responsiveness

- [ ] Buttons respond immediately
- [ ] Forms submit quickly
- [ ] No UI lag or stuttering
- [ ] Smooth scrolling
- [ ] Animations smooth

**Status:** ___  
**Notes:** _______________________________________________

---

## 15. Data Integrity

### 15.1 Content Preservation
**Test:** Verify data is saved correctly

- [ ] All thread data saves correctly
- [ ] All post data saves correctly
- [ ] User profile data saves correctly
- [ ] Markdown formatting preserved
- [ ] Special characters handled correctly

**Status:** ___  
**Notes:** _______________________________________________

---

### 15.2 Markdown Rendering
**Test:** Verify markdown features work

- [ ] **Bold text** renders
- [ ] *Italic text* renders
- [ ] `Inline code` renders
- [ ] Code blocks render with highlighting
- [ ] Links render and are clickable
- [ ] Lists render correctly
- [ ] Blockquotes render
- [ ] Headers render

**Status:** ___  
**Notes:** _______________________________________________

---

## 16. Edge Cases

### 16.1 Long Content
**Test:** Handle very long content

- [ ] Long thread titles truncate gracefully
- [ ] Long usernames display correctly
- [ ] Long posts display without breaking layout
- [ ] Very long words wrap correctly

**Status:** ___  
**Notes:** _______________________________________________

---

### 16.2 Special Characters
**Test:** Handle special characters

- [ ] Unicode characters display
- [ ] Emoji display correctly
- [ ] Special symbols handled
- [ ] No XSS vulnerability with special chars

**Status:** ___  
**Notes:** _______________________________________________

---

### 16.3 Rapid Actions
**Test:** Perform actions quickly

- [ ] Rapid clicking doesn't cause errors
- [ ] No double-submit on forms
- [ ] No race conditions visible
- [ ] UI remains responsive

**Status:** ___  
**Notes:** _______________________________________________

---

## Testing Summary

### Overall Statistics

**Total Test Cases:** _____  
**Passed:** _____  
**Failed:** _____  
**Issues Found:** _____  
**Skipped:** _____  

**Pass Rate:** _____% 

### Critical Bugs Found
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### High Priority Bugs
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Medium Priority Issues
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Low Priority Issues
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Recommendations
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

---

## Sign-Off

**Testing Completed By:** _______________  
**Date:** _______________  
**Overall Assessment:** [ ] Ready for Production [ ] Needs Work [ ] Major Issues

**Reviewed By:** _______________  
**Date:** _______________  

**Notes:**
```
_______________________________________________
_______________________________________________
_______________________________________________
```

---

## Retest Section (After Bug Fixes)

### Bugs Retested

| Bug ID | Description | Original Status | Retest Date | New Status |
|--------|-------------|-----------------|-------------|------------|
| 1 | | ❌ Fail | | |
| 2 | | ❌ Fail | | |
| 3 | | ❌ Fail | | |

### Retest Sign-Off

**Retested By:** _______________  
**Date:** _______________  
**All Critical Bugs Fixed:** [ ] Yes [ ] No  
**Ready for Production:** [ ] Yes [ ] No
