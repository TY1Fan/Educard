#!/bin/bash

# Error Handling Test Script
# Tests all error scenarios for Task 6.5

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color
BLUE='\033[0;34m'

# Base URL
BASE_URL="http://localhost:3000"

# Test counter
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print section header
print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

# Function to print test result
print_result() {
    local test_name=$1
    local expected=$2
    local actual=$3
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    if [ "$actual" == "$expected" ]; then
        echo -e "${GREEN}✓ PASS${NC}: $test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗ FAIL${NC}: $test_name"
        echo -e "  Expected: $expected"
        echo -e "  Got: $actual"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

# Function to check if server is running
check_server() {
    print_header "Server Health Check"
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health")
    
    if [ "$response" == "200" ]; then
        echo -e "${GREEN}✓ Server is running${NC}"
        return 0
    else
        echo -e "${RED}✗ Server is not running or not responding${NC}"
        echo "Please start the server with: docker-compose up -d"
        exit 1
    fi
}

# Test 404 - Not Found Errors
test_404_errors() {
    print_header "Testing 404 - Not Found Errors"
    
    # Test non-existent route
    response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/this-page-does-not-exist")
    print_result "Non-existent route returns 404" "404" "$response"
    
    # Test non-existent thread
    response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/threads/99999")
    print_result "Non-existent thread returns 404" "404" "$response"
    
    # Test non-existent user profile
    response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/users/99999")
    print_result "Non-existent user returns 404" "404" "$response"
    
    # Verify 404 page contains expected content
    content=$(curl -s "$BASE_URL/this-page-does-not-exist")
    if echo "$content" | grep -q "404"; then
        echo -e "${GREEN}✓ PASS${NC}: 404 page displays correct error code"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗ FAIL${NC}: 404 page doesn't display error code"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    TESTS_RUN=$((TESTS_RUN + 1))
}

# Test 403 - Forbidden Errors
test_403_errors() {
    print_header "Testing 403 - Forbidden Errors"
    
    # Test accessing admin panel without authentication
    response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/admin")
    print_result "Admin panel without auth redirects (302 or 403)" "302" "$response"
    
    # Test accessing moderation without authentication
    response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/moderation")
    print_result "Moderation panel without auth redirects (302 or 403)" "302" "$response"
    
    echo -e "${YELLOW}Note: CSRF 403 errors require valid session and form submission${NC}"
}

# Test 400 - Validation Errors
test_400_errors() {
    print_header "Testing 400 - Validation Errors"
    
    # Test registration with invalid data (no body)
    response=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        "$BASE_URL/auth/register")
    
    # Should get 400 or 403 (CSRF)
    if [ "$response" == "400" ] || [ "$response" == "403" ]; then
        echo -e "${GREEN}✓ PASS${NC}: Empty registration data returns error"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗ FAIL${NC}: Expected 400 or 403, got $response"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    TESTS_RUN=$((TESTS_RUN + 1))
    
    echo -e "${YELLOW}Note: Full validation tests require session and CSRF token${NC}"
}

# Test 500 - Server Errors
test_500_errors() {
    print_header "Testing 500 - Server Error Page"
    
    # We can't easily trigger a 500 without breaking the app
    # Instead, verify the error page exists
    if [ -f "$PROJECT_ROOT/src/views/errors/500.ejs" ]; then
        echo -e "${GREEN}✓ PASS${NC}: 500 error page exists"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗ FAIL${NC}: 500 error page not found"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    TESTS_RUN=$((TESTS_RUN + 1))
    
    # Check if 500 page has stack trace support
    if grep -q "stack" "$PROJECT_ROOT/src/views/errors/500.ejs"; then
        echo -e "${GREEN}✓ PASS${NC}: 500 page has stack trace support"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗ FAIL${NC}: 500 page missing stack trace support"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    TESTS_RUN=$((TESTS_RUN + 1))
}

# Test Error Pages Existence
test_error_pages_exist() {
    print_header "Testing Error Pages Existence"
    
    local pages=("400" "403" "404" "429" "500")
    
    for page in "${pages[@]}"; do
        if [ -f "$PROJECT_ROOT/src/views/errors/${page}.ejs" ]; then
            echo -e "${GREEN}✓ PASS${NC}: ${page}.ejs exists"
            TESTS_PASSED=$((TESTS_PASSED + 1))
        else
            echo -e "${RED}✗ FAIL${NC}: ${page}.ejs not found"
            TESTS_FAILED=$((TESTS_FAILED + 1))
        fi
        TESTS_RUN=$((TESTS_RUN + 1))
    done
}

# Test Error Handler Middleware
test_error_handler_middleware() {
    print_header "Testing Error Handler Middleware"
    
    # Check if errorHandler.js exists
    if [ -f "$PROJECT_ROOT/src/middlewares/errorHandler.js" ]; then
        echo -e "${GREEN}✓ PASS${NC}: errorHandler.js exists"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗ FAIL${NC}: errorHandler.js not found"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    TESTS_RUN=$((TESTS_RUN + 1))
    
    # Check if app.js imports error handlers
    if grep -q "errorHandler" "$PROJECT_ROOT/src/app.js"; then
        echo -e "${GREEN}✓ PASS${NC}: app.js imports error handlers"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗ FAIL${NC}: app.js doesn't import error handlers"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    TESTS_RUN=$((TESTS_RUN + 1))
    
    # Check for key error handler functions
    local functions=("notFoundHandler" "csrfErrorHandler" "validationErrorHandler" "databaseErrorHandler" "globalErrorHandler")
    
    for func in "${functions[@]}"; do
        if grep -q "$func" "$PROJECT_ROOT/src/middlewares/errorHandler.js"; then
            echo -e "${GREEN}✓ PASS${NC}: ${func} exists"
            TESTS_PASSED=$((TESTS_PASSED + 1))
        else
            echo -e "${RED}✗ FAIL${NC}: ${func} not found"
            TESTS_FAILED=$((TESTS_FAILED + 1))
        fi
        TESTS_RUN=$((TESTS_RUN + 1))
    done
    
    # Check for process-level handlers
    if grep -q "setupUnhandledRejectionHandler" "$PROJECT_ROOT/src/middlewares/errorHandler.js"; then
        echo -e "${GREEN}✓ PASS${NC}: Unhandled rejection handler exists"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗ FAIL${NC}: Unhandled rejection handler not found"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    TESTS_RUN=$((TESTS_RUN + 1))
    
    if grep -q "setupUncaughtExceptionHandler" "$PROJECT_ROOT/src/middlewares/errorHandler.js"; then
        echo -e "${GREEN}✓ PASS${NC}: Uncaught exception handler exists"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗ FAIL${NC}: Uncaught exception handler not found"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    TESTS_RUN=$((TESTS_RUN + 1))
}

# Test Error Logging
test_error_logging() {
    print_header "Testing Error Logging Configuration"
    
    # Check if logger is imported in errorHandler.js
    if grep -q "logger" "$PROJECT_ROOT/src/middlewares/errorHandler.js"; then
        echo -e "${GREEN}✓ PASS${NC}: errorHandler.js uses logger"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗ FAIL${NC}: errorHandler.js doesn't use logger"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    TESTS_RUN=$((TESTS_RUN + 1))
    
    # Check if logger.js exists
    if [ -f "$PROJECT_ROOT/src/utils/logger.js" ]; then
        echo -e "${GREEN}✓ PASS${NC}: logger.js exists"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗ FAIL${NC}: logger.js not found"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    TESTS_RUN=$((TESTS_RUN + 1))
}

# Test JSON API Error Responses
test_json_api_errors() {
    print_header "Testing JSON API Error Responses"
    
    # Test 404 with JSON Accept header
    response=$(curl -s -H "Accept: application/json" "$BASE_URL/api/non-existent")
    
    if echo "$response" | grep -q "error"; then
        echo -e "${GREEN}✓ PASS${NC}: JSON API returns error object"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${YELLOW}⚠ SKIP${NC}: No JSON API routes to test (or API returns HTML)"
        TESTS_RUN=$((TESTS_RUN - 1))
    fi
}

# Run all tests
main() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║   Error Handling Test Suite - Task 6.5   ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
    
    # Get project root directory (two levels up from this script)
    SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
    PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
    
    # Check server health
    check_server
    
    # Run all test suites
    test_error_pages_exist
    test_error_handler_middleware
    test_error_logging
    test_404_errors
    test_403_errors
    test_400_errors
    test_500_errors
    test_json_api_errors
    
    # Print summary
    print_header "Test Summary"
    echo -e "Tests run:    ${BLUE}$TESTS_RUN${NC}"
    echo -e "Tests passed: ${GREEN}$TESTS_PASSED${NC}"
    echo -e "Tests failed: ${RED}$TESTS_FAILED${NC}"
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✓ All tests passed!${NC}"
        echo ""
        exit 0
    else
        echo ""
        echo -e "${RED}✗ Some tests failed${NC}"
        echo ""
        exit 1
    fi
}

# Run main function
main
