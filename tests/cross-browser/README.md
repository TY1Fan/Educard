# Cross-Browser Testing Tools

This directory contains tools and documentation for cross-browser compatibility testing.

## Files

### 1. test-browsers.sh
**Interactive testing helper script**

Provides:
- Application status check
- Browser launch commands
- Testing instructions
- Responsive breakpoints list
- Test scenarios
- Mobile testing guide

**Usage:**
```bash
./test-browsers.sh
```

### 2. testing-checklist.md
**Comprehensive testing checklist**

Use this to:
- Track testing progress
- Document issues found
- Record browser versions
- Sign off on completed testing

**How to use:**
1. Open the file
2. Fill in browser versions
3. Check off items as you test
4. Document any issues
5. Sign off when complete

## Quick Start

1. **Ensure application is running:**
   ```bash
   docker-compose up -d
   ```

2. **Run the testing helper:**
   ```bash
   ./test-browsers.sh
   ```

3. **Follow the instructions** to test each browser

4. **Use the checklist** to track progress

## Browsers to Test

### Desktop
- Chrome (latest)
- Firefox (latest)
- Safari (latest, macOS only)
- Edge (latest)

### Mobile
- iOS Safari (via DevTools or real device)
- Android Chrome (via DevTools or real device)

## Responsive Breakpoints

Test at these sizes using browser DevTools:
- 320px - iPhone SE
- 375px - iPhone 13/14
- 414px - iPhone Pro Max
- 768px - iPad
- 1024px - Small Desktop
- 1280px - Desktop
- 1920px - Full HD

## Test Scenarios

For each browser, test:
1. Registration
2. Login
3. Browse threads
4. Create thread
5. Reply to post
6. Edit post
7. Delete post
8. View profile
9. Search
10. Logout

## Documentation

See also:
- `docs/k8s-tasks/TASK-6.8-CROSS-BROWSER-TESTING-REPORT.md` - Full test report
- `docs/k8s-tasks/TASK-6.8-SUMMARY.md` - Quick summary

## Tips

- Use DevTools Responsive Mode (Cmd+Shift+M on Mac)
- Clear browser cache between tests
- Check browser console for errors
- Test in private/incognito mode
- Use Lighthouse for performance testing
- Document any issues with screenshots
