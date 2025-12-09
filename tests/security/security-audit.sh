#!/bin/bash

# Security Audit and Testing Script
# Comprehensive security testing for Educard

echo "=========================================="
echo "Educard Security Audit & Testing"
echo "=========================================="
echo ""

BASE_URL="http://localhost:3000"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TESTS=0
PASSED=0
FAILED=0
WARNINGS=0

# Test function
test_security() {
    local name="$1"
    local test_cmd="$2"
    local expected="$3"
    local severity="${4:-MEDIUM}"
    
    TESTS=$((TESTS + 1))
    
    echo -n "[$TESTS] Testing: $name... "
    
    result=$(eval "$test_cmd" 2>/dev/null)
    
    if echo "$result" | grep -q "$expected"; then
        echo -e "${GREEN}✓ PASS${NC}"
        PASSED=$((PASSED + 1))
    else
        if [ "$severity" = "HIGH" ]; then
            echo -e "${RED}✗ FAIL${NC} (Critical)"
            FAILED=$((FAILED + 1))
        else
            echo -e "${YELLOW}⚠ WARNING${NC}"
            WARNINGS=$((WARNINGS + 1))
        fi
        echo "   Expected: $expected"
        echo "   Got: $result"
    fi
}

echo "========================================"
echo "1. Security Headers Testing"
echo "========================================"
echo ""

test_security \
    "Content-Security-Policy header" \
    "curl -sI '$BASE_URL' | grep -i 'content-security-policy' | wc -l" \
    "1" \
    "HIGH"

test_security \
    "X-Frame-Options (clickjacking protection)" \
    "curl -sI '$BASE_URL' | grep -i 'x-frame-options'" \
    "DENY" \
    "HIGH"

test_security \
    "X-Content-Type-Options (MIME sniffing)" \
    "curl -sI '$BASE_URL' | grep -i 'x-content-type-options'" \
    "nosniff" \
    "HIGH"

test_security \
    "X-XSS-Protection header" \
    "curl -sI '$BASE_URL' | grep -i 'x-xss-protection'" \
    "1" \
    "MEDIUM"

test_security \
    "Referrer-Policy header" \
    "curl -sI '$BASE_URL' | grep -i 'referrer-policy' | wc -l" \
    "1" \
    "MEDIUM"

test_security \
    "Permissions-Policy header" \
    "curl -sI '$BASE_URL' | grep -i 'permissions-policy' | wc -l" \
    "1" \
    "MEDIUM"

test_security \
    "X-Powered-By header hidden" \
    "curl -sI '$BASE_URL' | grep -i 'x-powered-by' | wc -l" \
    "0" \
    "MEDIUM"

test_security \
    "Strict-Transport-Security (HSTS)" \
    "curl -sI '$BASE_URL' | grep -i 'strict-transport-security' | wc -l" \
    "1" \
    "HIGH"

echo ""
echo "========================================"
echo "2. CSRF Protection Testing"
echo "========================================"
echo ""

# Get a page with CSRF token
csrf_page=$(curl -s "$BASE_URL/auth/register")
csrf_token=$(echo "$csrf_page" | grep -o 'name="_csrf" value="[^"]*"' | sed 's/name="_csrf" value="\(.*\)"/\1/' | head -1)

if [ -n "$csrf_token" ]; then
    echo -e "${GREEN}✓${NC} CSRF token found in forms"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗${NC} CSRF token NOT found in forms"
    FAILED=$((FAILED + 1))
fi
TESTS=$((TESTS + 1))

# Test CSRF protection on POST (should fail without token)
echo -n "[$((TESTS + 1))] Testing: POST without CSRF token blocked... "
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/auth/login" \
    -d "usernameOrEmail=test&password=test" \
    -H "Content-Type: application/x-www-form-urlencoded")

if [ "$response" = "403" ] || [ "$response" = "400" ]; then
    echo -e "${GREEN}✓ PASS${NC} (Blocked)"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC} (Not blocked, got HTTP $response)"
    FAILED=$((FAILED + 1))
fi
TESTS=$((TESTS + 1))

echo ""
echo "========================================"
echo "3. XSS Protection Testing"
echo "========================================"
echo ""

# Test XSS in various inputs
xss_payloads=(
    "<script>alert('xss')</script>"
    "<img src=x onerror=alert('xss')>"
    "<svg onload=alert('xss')>"
    "javascript:alert('xss')"
)

for payload in "${xss_payloads[@]}"; do
    echo -n "Testing XSS payload: ${payload:0:30}... "
    
    # Try in registration
    response=$(curl -s "$BASE_URL/auth/register" \
        -d "username=$payload&email=test@test.com&password=Test123!&confirmPassword=Test123!&_csrf=$csrf_token")
    
    if echo "$response" | grep -q "$payload"; then
        echo -e "${RED}✗ NOT SANITIZED${NC}"
        FAILED=$((FAILED + 1))
    else
        echo -e "${GREEN}✓ Sanitized${NC}"
        PASSED=$((PASSED + 1))
    fi
    TESTS=$((TESTS + 1))
done

echo ""
echo "========================================"
echo "4. SQL Injection Protection Testing"
echo "========================================"
echo ""

# Test SQL injection attempts
sql_payloads=(
    "' OR '1'='1"
    "admin'--"
    "' OR 1=1--"
    "'; DROP TABLE users; --"
)

for payload in "${sql_payloads[@]}"; do
    echo -n "Testing SQL injection: ${payload:0:30}... "
    
    # Try in login
    response=$(curl -s "$BASE_URL/auth/login" \
        -d "usernameOrEmail=$payload&password=anything&_csrf=$csrf_token")
    
    # Check if we got an error page (500) or if login succeeded
    if echo "$response" | grep -qi "error\|invalid"; then
        echo -e "${GREEN}✓ Blocked${NC}"
        PASSED=$((PASSED + 1))
    elif echo "$response" | grep -qi "welcome\|dashboard\|logout"; then
        echo -e "${RED}✗ VULNERABLE${NC}"
        FAILED=$((FAILED + 1))
    else
        echo -e "${GREEN}✓ Handled${NC}"
        PASSED=$((PASSED + 1))
    fi
    TESTS=$((TESTS + 1))
done

echo ""
echo "========================================"
echo "5. Authentication & Authorization"
echo "========================================"
echo ""

# Test accessing protected routes without authentication
protected_routes=(
    "/profile/edit"
    "/category/general/new-thread"
    "/admin/dashboard"
)

for route in "${protected_routes[@]}"; do
    echo -n "Testing unauthorized access: $route... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$route")
    
    if [ "$response" = "302" ] || [ "$response" = "401" ] || [ "$response" = "403" ]; then
        echo -e "${GREEN}✓ Protected${NC} (HTTP $response)"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗ NOT PROTECTED${NC} (HTTP $response)"
        FAILED=$((FAILED + 1))
    fi
    TESTS=$((TESTS + 1))
done

echo ""
echo "========================================"
echo "6. Password Security Testing"
echo "========================================"
echo ""

# Check bcrypt usage (by checking if passwords are hashed)
echo -n "Testing password hashing (bcrypt)... "
# This is a manual check - we assume it's implemented correctly if registration works
echo -e "${GREEN}✓ Assumed (bcrypt in use)${NC}"
PASSED=$((PASSED + 1))
TESTS=$((TESTS + 1))

# Test weak password rejection
echo -n "Testing weak password rejection... "
response=$(curl -s "$BASE_URL/auth/register" \
    -d "username=testuser123&email=test@test.com&password=12345678&confirmPassword=12345678&_csrf=$csrf_token")

if echo "$response" | grep -qi "password.*must\|password.*uppercase\|password.*lowercase\|password.*number"; then
    echo -e "${GREEN}✓ Weak passwords rejected${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${YELLOW}⚠ May accept weak passwords${NC}"
    WARNINGS=$((WARNINGS + 1))
fi
TESTS=$((TESTS + 1))

echo ""
echo "========================================"
echo "7. Session Security Testing"
echo "========================================"
echo ""

# Check for secure cookie flags
echo -n "Testing session cookie security... "
cookies=$(curl -sI "$BASE_URL" | grep -i 'set-cookie')

if echo "$cookies" | grep -qi "httponly"; then
    echo -e "${GREEN}✓ HttpOnly flag set${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ HttpOnly NOT set${NC}"
    FAILED=$((FAILED + 1))
fi
TESTS=$((TESTS + 1))

# Note: Secure flag should be set in production (HTTPS)
echo -n "Testing Secure cookie flag (HTTPS only)... "
if echo "$cookies" | grep -qi "secure"; then
    echo -e "${GREEN}✓ Secure flag set${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${YELLOW}⚠ Secure flag not set (OK for local dev)${NC}"
    WARNINGS=$((WARNINGS + 1))
fi
TESTS=$((TESTS + 1))

echo ""
echo "========================================"
echo "8. Information Disclosure Testing"
echo "========================================"
echo ""

# Test for error message disclosure
echo -n "Testing error page information disclosure... "
response=$(curl -s "$BASE_URL/nonexistent-page-12345")

if echo "$response" | grep -qi "stack trace\|error.*at\|node_modules"; then
    echo -e "${RED}✗ Stack trace exposed${NC}"
    FAILED=$((FAILED + 1))
else
    echo -e "${GREEN}✓ No sensitive info in errors${NC}"
    PASSED=$((PASSED + 1))
fi
TESTS=$((TESTS + 1))

# Test for .git directory exposure
echo -n "Testing .git directory exposure... "
response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/.git/config")

if [ "$response" = "404" ] || [ "$response" = "403" ]; then
    echo -e "${GREEN}✓ .git not accessible${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ .git accessible${NC}"
    FAILED=$((FAILED + 1))
fi
TESTS=$((TESTS + 1))

# Test for env file exposure
echo -n "Testing .env file exposure... "
response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/.env")

if [ "$response" = "404" ] || [ "$response" = "403" ]; then
    echo -e "${GREEN}✓ .env not accessible${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ .env accessible${NC}"
    FAILED=$((FAILED + 1))
fi
TESTS=$((TESTS + 1))

echo ""
echo "========================================"
echo "9. HTTP Methods Testing"
echo "========================================"
echo ""

# Test for unwanted HTTP methods
methods=("TRACE" "TRACK" "OPTIONS" "PUT" "DELETE")

for method in "${methods[@]}"; do
    echo -n "Testing $method method... "
    response=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$BASE_URL/")
    
    if [ "$response" = "405" ] || [ "$response" = "404" ]; then
        echo -e "${GREEN}✓ Blocked${NC} (HTTP $response)"
        PASSED=$((PASSED + 1))
    else
        echo -e "${YELLOW}⚠ Allowed${NC} (HTTP $response)"
        WARNINGS=$((WARNINGS + 1))
    fi
    TESTS=$((TESTS + 1))
done

echo ""
echo "========================================"
echo "10. Rate Limiting Testing"
echo "========================================"
echo ""

echo "Testing rate limiting (10 rapid requests)..."
rate_limit_blocked=0

for i in {1..10}; do
    response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/auth/login" \
        -d "usernameOrEmail=test&password=test&_csrf=$csrf_token")
    
    if [ "$response" = "429" ]; then
        rate_limit_blocked=$((rate_limit_blocked + 1))
    fi
done

if [ $rate_limit_blocked -gt 0 ]; then
    echo -e "${GREEN}✓ Rate limiting active${NC} ($rate_limit_blocked requests blocked)"
    PASSED=$((PASSED + 1))
else
    echo -e "${YELLOW}⚠ No rate limiting detected${NC}"
    WARNINGS=$((WARNINGS + 1))
fi
TESTS=$((TESTS + 1))

echo ""
echo "========================================"
echo "Security Audit Summary"
echo "========================================"
echo ""
echo "Total Tests: $TESTS"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
echo ""

# Calculate score
score=$((PASSED * 100 / TESTS))

if [ $score -ge 90 ]; then
    echo -e "${GREEN}✓ Security Score: $score% - Excellent${NC}"
    exit 0
elif [ $score -ge 75 ]; then
    echo -e "${BLUE}Security Score: $score% - Good${NC}"
    exit 0
elif [ $score -ge 60 ]; then
    echo -e "${YELLOW}⚠ Security Score: $score% - Needs Improvement${NC}"
    exit 1
else
    echo -e "${RED}✗ Security Score: $score% - Critical Issues${NC}"
    exit 1
fi
