#!/bin/bash

# Edge Case Testing Script
# Tests various validation scenarios

echo "=========================================="
echo "Educard Validation Testing Script"
echo "=========================================="
echo ""

BASE_URL="http://localhost:3000"

echo "Testing Edge Cases for Input Validation..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS=0
PASSED=0
FAILED=0

# Function to test endpoint
test_case() {
    local name="$1"
    local endpoint="$2"
    local data="$3"
    local expected_status="$4"
    
    TESTS=$((TESTS + 1))
    
    echo -n "Test $TESTS: $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL$endpoint" -d "$data" -H "Content-Type: application/x-www-form-urlencoded")
    
    if [ "$response" -eq "$expected_status" ]; then
        echo -e "${GREEN}PASS${NC} (HTTP $response)"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}FAIL${NC} (Expected $expected_status, got $response)"
        FAILED=$((FAILED + 1))
    fi
}

echo "1. Testing Empty Inputs"
echo "------------------------"
test_case "Empty username" "/auth/register" "username=&email=test@example.com&password=Test123!&confirmPassword=Test123!" 200
test_case "Empty email" "/auth/register" "username=testuser&email=&password=Test123!&confirmPassword=Test123!" 200
test_case "Empty password" "/auth/register" "username=testuser&email=test@example.com&password=&confirmPassword=" 200

echo ""
echo "2. Testing Length Validation"
echo "-----------------------------"
test_case "Short username (2 chars)" "/auth/register" "username=ab&email=test@example.com&password=Test123!&confirmPassword=Test123!" 200
test_case "Long username (51 chars)" "/auth/register" "username=$(printf 'a%.0s' {1..51})&email=test@example.com&password=Test123!&confirmPassword=Test123!" 200
test_case "Short password (7 chars)" "/auth/register" "username=testuser&email=test@example.com&password=Test12!&confirmPassword=Test12!" 200

echo ""
echo "3. Testing Pattern Validation"
echo "------------------------------"
test_case "Invalid username chars" "/auth/register" "username=user@123&email=test@example.com&password=Test123!&confirmPassword=Test123!" 200
test_case "Invalid email format" "/auth/register" "username=testuser&email=notanemail&password=Test123!&confirmPassword=Test123!" 200
test_case "Weak password" "/auth/register" "username=testuser&email=test@example.com&password=12345678&confirmPassword=12345678" 200

echo ""
echo "4. Testing SQL Injection Attempts"
echo "----------------------------------"
test_case "SQL injection in username" "/auth/login" "usernameOrEmail=' OR '1'='1&password=anything" 200
test_case "SQL injection with UNION" "/auth/login" "usernameOrEmail=admin' UNION SELECT * FROM users--&password=anything" 200
test_case "SQL injection with DROP" "/auth/login" "usernameOrEmail='; DROP TABLE users; --&password=anything" 200

echo ""
echo "5. Testing XSS Attempts"
echo "-----------------------"
test_case "XSS in username" "/auth/register" "username=<script>alert('xss')</script>&email=test@example.com&password=Test123!&confirmPassword=Test123!" 200
test_case "XSS with img tag" "/auth/register" "username=<img src=x onerror=alert('xss')>&email=test@example.com&password=Test123!&confirmPassword=Test123!" 200
test_case "XSS with event handler" "/auth/register" "username=<div onclick=alert('xss')>&email=test@example.com&password=Test123!&confirmPassword=Test123!" 200

echo ""
echo "6. Testing Special Characters"
echo "------------------------------"
test_case "Unicode characters" "/auth/register" "username=user123&email=test@example.com&password=Test123!你好&confirmPassword=Test123!你好" 200
test_case "Emoji in username" "/auth/register" "username=user🎉test&email=test@example.com&password=Test123!&confirmPassword=Test123!" 200
test_case "Null bytes" "/auth/register" "username=user%00admin&email=test@example.com&password=Test123!&confirmPassword=Test123!" 200

echo ""
echo "7. Testing Password Mismatch"
echo "-----------------------------"
test_case "Passwords don't match" "/auth/register" "username=testuser&email=test@example.com&password=Test123!&confirmPassword=Different123!" 200

echo ""
echo "8. Testing Whitespace Handling"
echo "-------------------------------"
test_case "Username with spaces" "/auth/register" "username=test user&email=test@example.com&password=Test123!&confirmPassword=Test123!" 200
test_case "Email with spaces" "/auth/register" "username=testuser&email=test @example.com&password=Test123!&confirmPassword=Test123!" 200
test_case "Whitespace-only input" "/auth/register" "username=   &email=   &password=   &confirmPassword=   " 200

echo ""
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "Total Tests: $TESTS"
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
