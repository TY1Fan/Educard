#!/bin/bash
# Task 2.13: Comprehensive Authentication Testing Script

echo "======================================"
echo " Phase 2: Authentication System Tests"
echo "======================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

# Test function
test_case() {
    echo -e "${YELLOW}Test:${NC} $1"
}

pass() {
    echo -e "${GREEN}✓ PASS${NC}: $1"
    ((PASSED++))
}

fail() {
    echo -e "${RED}✗ FAIL${NC}: $1"
    ((FAILED++))
}

echo "=== REGISTRATION TESTS ==="
echo ""

# Test 1: Valid registration
test_case "Valid registration"
rm -f /tmp/test1.txt
PAGE=$(curl -s http://localhost:3000/auth/register -c /tmp/test1.txt)
TOKEN=$(echo "$PAGE" | grep -o '_csrf" value="[^"]*"' | head -1 | cut -d'"' -f3)
TIMESTAMP=$(date +%s)
RESPONSE=$(curl -X POST http://localhost:3000/auth/register \
  -b /tmp/test1.txt -c /tmp/test1.txt \
  -d "username=user${TIMESTAMP}&email=user${TIMESTAMP}@test.com&password=Pass1234&confirmPassword=Pass1234&_csrf=$TOKEN" \
  -s -w "%{http_code}" -o /tmp/reg_result.html)
if [ "$RESPONSE" = "302" ]; then
    pass "Registration successful (HTTP 302 redirect)"
else
    fail "Registration failed (HTTP $RESPONSE)"
fi
echo ""

# Test 2: Short username
test_case "Short username (< 3 chars)"
PAGE=$(curl -s http://localhost:3000/auth/register -c /tmp/test2.txt)
TOKEN=$(echo "$PAGE" | grep -o '_csrf" value="[^"]*"' | head -1 | cut -d'"' -f3)
RESPONSE=$(curl -X POST http://localhost:3000/auth/register \
  -b /tmp/test2.txt \
  -d "username=ab&email=test@test.com&password=Pass1234&confirmPassword=Pass1234&_csrf=$TOKEN" \
  -s)
if echo "$RESPONSE" | grep -q "3-50 characters"; then
    pass "Short username validation works"
else
    fail "Short username validation failed"
fi
echo ""

# Test 3: Short password
test_case "Short password (< 8 chars)"
PAGE=$(curl -s http://localhost:3000/auth/register -c /tmp/test3.txt)
TOKEN=$(echo "$PAGE" | grep -o '_csrf" value="[^"]*"' | head -1 | cut -d'"' -f3)
RESPONSE=$(curl -X POST http://localhost:3000/auth/register \
  -b /tmp/test3.txt \
  -d "username=testuser&email=test@test.com&password=short&confirmPassword=short&_csrf=$TOKEN" \
  -s)
if echo "$RESPONSE" | grep -q "at least 8"; then
    pass "Short password validation works"
else
    fail "Short password validation failed"
fi
echo ""

# Test 4: Duplicate username
test_case "Duplicate username"
PAGE=$(curl -s http://localhost:3000/auth/register -c /tmp/test4.txt)
TOKEN=$(echo "$PAGE" | grep -o '_csrf" value="[^"]*"' | head -1 | cut -d'"' -f3)
RESPONSE=$(curl -X POST http://localhost:3000/auth/register \
  -b /tmp/test4.txt \
  -d "username=johndoe&email=newemail@test.com&password=Pass1234&confirmPassword=Pass1234&_csrf=$TOKEN" \
  -s)
if echo "$RESPONSE" | grep -q "already"; then
    pass "Duplicate username rejected"
else
    fail "Duplicate username not rejected"
fi
echo ""

echo "=== LOGIN TESTS ==="
echo ""

# Test 5: Login with username
test_case "Login with username"
PAGE=$(curl -s http://localhost:3000/auth/login -c /tmp/test5.txt)
TOKEN=$(echo "$PAGE" | grep -o '_csrf" value="[^"]*"' | head -1 | cut -d'"' -f3)
RESPONSE=$(curl -X POST http://localhost:3000/auth/login \
  -b /tmp/test5.txt -c /tmp/test5.txt \
  -d "usernameOrEmail=johndoe&password=securepass123&_csrf=$TOKEN" \
  -s -w "%{http_code}" -o /dev/null)
if [ "$RESPONSE" = "302" ]; then
    AUTH=$(curl -s http://localhost:3000/test-session -b /tmp/test5.txt | grep -o '"authenticated":true')
    if [ -n "$AUTH" ]; then
        pass "Login with username successful"
    else
        fail "Login succeeded but session not authenticated"
    fi
else
    fail "Login with username failed (HTTP $RESPONSE)"
fi
echo ""

# Test 6: Login with email
test_case "Login with email"
PAGE=$(curl -s http://localhost:3000/auth/login -c /tmp/test6.txt)
TOKEN=$(echo "$PAGE" | grep -o '_csrf" value="[^"]*"' | head -1 | cut -d'"' -f3)
RESPONSE=$(curl -X POST http://localhost:3000/auth/login \
  -b /tmp/test6.txt -c /tmp/test6.txt \
  -d "usernameOrEmail=john@example.com&password=securepass123&_csrf=$TOKEN" \
  -s -w "%{http_code}" -o /dev/null)
if [ "$RESPONSE" = "302" ]; then
    AUTH=$(curl -s http://localhost:3000/test-session -b /tmp/test6.txt | grep -o '"authenticated":true')
    if [ -n "$AUTH" ]; then
        pass "Login with email successful"
    else
        fail "Login succeeded but session not authenticated"
    fi
else
    fail "Login with email failed (HTTP $RESPONSE)"
fi
echo ""

# Test 7: Login with wrong password
test_case "Login with wrong password"
PAGE=$(curl -s http://localhost:3000/auth/login -c /tmp/test7.txt)
TOKEN=$(echo "$PAGE" | grep -o '_csrf" value="[^"]*"' | head -1 | cut -d'"' -f3)
RESPONSE=$(curl -X POST http://localhost:3000/auth/login \
  -b /tmp/test7.txt \
  -d "usernameOrEmail=johndoe&password=wrongpassword&_csrf=$TOKEN" \
  -s)
if echo "$RESPONSE" | grep -q "Invalid credentials"; then
    pass "Wrong password shows generic error"
else
    fail "Wrong password error message incorrect"
fi
echo ""

echo "=== LOGOUT TESTS ==="
echo ""

# Test 8: Logout
test_case "Logout functionality"
# First login
PAGE=$(curl -s http://localhost:3000/auth/login -c /tmp/test8.txt)
TOKEN=$(echo "$PAGE" | grep -o '_csrf" value="[^"]*"' | head -1 | cut -d'"' -f3)
curl -X POST http://localhost:3000/auth/login \
  -b /tmp/test8.txt -c /tmp/test8.txt \
  -d "usernameOrEmail=johndoe&password=securepass123&_csrf=$TOKEN" \
  -s -o /dev/null

# Check logged in
AUTH_BEFORE=$(curl -s http://localhost:3000/test-session -b /tmp/test8.txt | grep -o '"authenticated":true')

# Now logout
PAGE2=$(curl -s http://localhost:3000/test-nav -b /tmp/test8.txt)
TOKEN2=$(echo "$PAGE2" | grep -o '_csrf" value="[^"]*"' | tail -1 | cut -d'"' -f3)
curl -X POST http://localhost:3000/auth/logout \
  -b /tmp/test8.txt -c /tmp/test8.txt \
  -d "_csrf=$TOKEN2" \
  -s -o /dev/null

# Check logged out
AUTH_AFTER=$(curl -s http://localhost:3000/test-session -b /tmp/test8.txt | grep -o '"authenticated":false')

if [ -n "$AUTH_BEFORE" ] && [ -n "$AUTH_AFTER" ]; then
    pass "Logout destroys session properly"
else
    fail "Logout did not destroy session"
fi
echo ""

echo "=== SECURITY TESTS ==="
echo ""

# Test 9: CSRF Protection
test_case "CSRF token validation"
RESPONSE=$(curl -X POST http://localhost:3000/auth/login \
  -d "usernameOrEmail=johndoe&password=securepass123" \
  -s -w "%{http_code}" -o /tmp/csrf_test.html)
CONTENT=$(cat /tmp/csrf_test.html)
if echo "$CONTENT" | grep -q "Forbidden\|security token"; then
    pass "CSRF protection blocks requests without token"
else
    fail "CSRF protection not working (HTTP $RESPONSE)"
fi
echo ""

# Test 10: Password hashing
test_case "Password hashing in database"
docker-compose exec -T db psql -U educard -d educard -c "SELECT password FROM users WHERE username='johndoe' LIMIT 1" 2>/dev/null | grep -q '\$2b\$'
if [ $? -eq 0 ]; then
    pass "Passwords are hashed with bcrypt"
else
    fail "Passwords may not be properly hashed"
fi
echo ""

echo "======================================"
echo " Test Summary"
echo "======================================"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
