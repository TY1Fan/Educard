#!/bin/bash

# Performance Testing Script
# Tests application performance with various metrics

echo "=========================================="
echo "Educard Performance Testing"
echo "=========================================="
echo ""

BASE_URL="http://localhost:3000"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Performance thresholds (in milliseconds)
THRESHOLD_FAST=500
THRESHOLD_GOOD=1000
THRESHOLD_ACCEPTABLE=2000

TESTS=0
FAST=0
GOOD=0
SLOW=0
FAILED=0

# Test function
test_performance() {
    local name="$1"
    local url="$2"
    local expected_status="${3:-200}"
    
    TESTS=$((TESTS + 1))
    
    echo -n "[$TESTS] Testing: $name... "
    
    # Measure time and get status code (use curl's time_total)
    result=$(curl -o /dev/null -s -w "%{http_code}:%{time_total}" "$url")
    status_code=$(echo "$result" | cut -d: -f1)
    response_time_sec=$(echo "$result" | cut -d: -f2)
    
    # Convert seconds to milliseconds
    response_time=$(echo "$response_time_sec * 1000" | bc | cut -d. -f1)
    
    # Check status code
    if [ "$status_code" != "$expected_status" ]; then
        echo -e "${RED}✗ FAILED${NC} (HTTP $status_code, expected $expected_status)"
        FAILED=$((FAILED + 1))
        return
    fi
    
    # Categorize response time
    if [ $response_time -lt $THRESHOLD_FAST ]; then
        echo -e "${GREEN}✓ FAST${NC} (${response_time}ms)"
        FAST=$((FAST + 1))
    elif [ $response_time -lt $THRESHOLD_GOOD ]; then
        echo -e "${BLUE}✓ GOOD${NC} (${response_time}ms)"
        GOOD=$((GOOD + 1))
    elif [ $response_time -lt $THRESHOLD_ACCEPTABLE ]; then
        echo -e "${YELLOW}⚠ ACCEPTABLE${NC} (${response_time}ms)"
        SLOW=$((SLOW + 1))
    else
        echo -e "${RED}✗ SLOW${NC} (${response_time}ms)"
        FAILED=$((FAILED + 1))
    fi
}

# Warmup request
echo "Warming up application..."
curl -s "$BASE_URL" > /dev/null
sleep 1
echo ""

echo "========================================"
echo "1. Page Load Performance"
echo "========================================"
echo ""

test_performance "Homepage" "$BASE_URL/"
test_performance "Login page" "$BASE_URL/auth/login"
test_performance "Register page" "$BASE_URL/auth/register"
test_performance "General category" "$BASE_URL/category/general"
test_performance "Technology category" "$BASE_URL/category/technology"
test_performance "Search page" "$BASE_URL/search"

echo ""
echo "========================================"
echo "2. Static Asset Performance"
echo "========================================"
echo ""

test_performance "Main CSS" "$BASE_URL/css/style.css"
test_performance "Form loading JS" "$BASE_URL/js/form-loading.js"
test_performance "Client validation JS" "$BASE_URL/js/client-validation.js"
test_performance "UI enhancements JS" "$BASE_URL/js/ui-enhancements.js"

echo ""
echo "========================================"
echo "3. Concurrent Request Test"
echo "========================================"
echo ""

echo "Testing 10 concurrent homepage requests..."

# Use time command to measure
start=$(perl -MTime::HiRes=time -e 'printf "%.3f\n", time')

# Run 10 concurrent requests
for i in {1..10}; do
    curl -s "$BASE_URL/" > /dev/null &
done

# Wait for all background jobs to complete
wait

end=$(perl -MTime::HiRes=time -e 'printf "%.3f\n", time')

# Calculate time in milliseconds
total_time=$(echo "($end - $start) * 1000" | bc | cut -d. -f1)
avg_time=$((total_time / 10))

if [ $avg_time -lt $THRESHOLD_FAST ]; then
    echo -e "${GREEN}✓ FAST${NC} - Average: ${avg_time}ms (Total: ${total_time}ms)"
    FAST=$((FAST + 1))
elif [ $avg_time -lt $THRESHOLD_GOOD ]; then
    echo -e "${BLUE}✓ GOOD${NC} - Average: ${avg_time}ms (Total: ${total_time}ms)"
    GOOD=$((GOOD + 1))
elif [ $avg_time -lt $THRESHOLD_ACCEPTABLE ]; then
    echo -e "${YELLOW}⚠ ACCEPTABLE${NC} - Average: ${avg_time}ms (Total: ${total_time}ms)"
    SLOW=$((SLOW + 1))
else
    echo -e "${RED}✗ SLOW${NC} - Average: ${avg_time}ms (Total: ${total_time}ms)"
    FAILED=$((FAILED + 1))
fi

TESTS=$((TESTS + 1))

echo ""
echo "========================================"
echo "4. Database Query Performance"
echo "========================================"
echo ""

echo "Testing with sequential thread access..."
# Test accessing 5 threads sequentially
start=$(perl -MTime::HiRes=time -e 'printf "%.3f\n", time')

for i in {1..5}; do
    curl -s "$BASE_URL/category/general" > /dev/null
done

end=$(perl -MTime::HiRes=time -e 'printf "%.3f\n", time')
total_time=$(echo "($end - $start) * 1000" | bc | cut -d. -f1)
avg_time=$((total_time / 5))

echo -n "Sequential thread list access (5 requests)... "
if [ $avg_time -lt $THRESHOLD_GOOD ]; then
    echo -e "${GREEN}✓ GOOD${NC} - Average: ${avg_time}ms"
    GOOD=$((GOOD + 1))
elif [ $avg_time -lt $THRESHOLD_ACCEPTABLE ]; then
    echo -e "${YELLOW}⚠ ACCEPTABLE${NC} - Average: ${avg_time}ms"
    SLOW=$((SLOW + 1))
else
    echo -e "${RED}✗ SLOW${NC} - Average: ${avg_time}ms"
    FAILED=$((FAILED + 1))
fi

TESTS=$((TESTS + 1))

echo ""
echo "========================================"
echo "5. Cache Performance Test"
echo "========================================"
echo ""

echo "First request (no cache)..."
result=$(curl -o /dev/null -s -w "%{time_total}" "$BASE_URL/")
first_request=$(echo "$result * 1000" | bc | cut -d. -f1)

echo "  Time: ${first_request}ms"

sleep 1

echo "Second request (with cache)..."
result=$(curl -o /dev/null -s -w "%{time_total}" "$BASE_URL/")
second_request=$(echo "$result * 1000" | bc | cut -d. -f1)

echo "  Time: ${second_request}ms"

# Calculate improvement
if [ $first_request -gt 0 ]; then
    improvement=$((100 - (second_request * 100 / first_request)))
    echo -n "Cache effectiveness... "
    
    if [ $improvement -gt 30 ]; then
        echo -e "${GREEN}✓ EXCELLENT${NC} (${improvement}% faster with cache)"
        FAST=$((FAST + 1))
    elif [ $improvement -gt 10 ]; then
        echo -e "${BLUE}✓ GOOD${NC} (${improvement}% faster with cache)"
        GOOD=$((GOOD + 1))
    elif [ $improvement -gt 0 ]; then
        echo -e "${YELLOW}⚠ MINOR${NC} (${improvement}% faster with cache)"
        SLOW=$((SLOW + 1))
    else
        echo -e "${RED}✗ NO IMPROVEMENT${NC}"
        FAILED=$((FAILED + 1))
    fi
else
    echo -e "${YELLOW}⚠ Cannot calculate improvement${NC}"
    SLOW=$((SLOW + 1))
fi

TESTS=$((TESTS + 1))

echo ""
echo "========================================"
echo "6. Resource Size Test"
echo "========================================"
echo ""

# Check main CSS size
css_size=$(curl -sI "$BASE_URL/css/style.css" | grep -i content-length | awk '{print $2}' | tr -d '\r')
css_size_kb=$((css_size / 1024))

echo -n "Main CSS size: ${css_size_kb}KB... "
if [ $css_size_kb -lt 100 ]; then
    echo -e "${GREEN}✓ GOOD${NC}"
    GOOD=$((GOOD + 1))
elif [ $css_size_kb -lt 200 ]; then
    echo -e "${YELLOW}⚠ ACCEPTABLE${NC}"
    SLOW=$((SLOW + 1))
else
    echo -e "${RED}✗ TOO LARGE${NC}"
    FAILED=$((FAILED + 1))
fi

TESTS=$((TESTS + 1))

# Check if gzip compression is enabled
gzip_encoding=$(curl -sI "$BASE_URL/" -H "Accept-Encoding: gzip" | grep -i content-encoding | grep -i gzip)

echo -n "Gzip compression... "
if [ -n "$gzip_encoding" ]; then
    echo -e "${GREEN}✓ ENABLED${NC}"
    FAST=$((FAST + 1))
else
    echo -e "${YELLOW}⚠ NOT ENABLED${NC}"
    SLOW=$((SLOW + 1))
fi

TESTS=$((TESTS + 1))

echo ""
echo "========================================"
echo "Performance Test Summary"
echo "========================================"
echo ""
echo "Total Tests: $TESTS"
echo -e "${GREEN}Fast (<500ms): $FAST${NC}"
echo -e "${BLUE}Good (<1000ms): $GOOD${NC}"
echo -e "${YELLOW}Acceptable (<2000ms): $SLOW${NC}"
echo -e "${RED}Slow/Failed (>2000ms or error): $FAILED${NC}"
echo ""

# Calculate score
passed=$((FAST + GOOD))
score=$((passed * 100 / TESTS))

if [ $score -ge 90 ]; then
    echo -e "${GREEN}✓ Performance Score: $score% - Excellent${NC}"
    exit 0
elif [ $score -ge 75 ]; then
    echo -e "${BLUE}Performance Score: $score% - Good${NC}"
    exit 0
elif [ $score -ge 60 ]; then
    echo -e "${YELLOW}⚠ Performance Score: $score% - Needs Improvement${NC}"
    exit 1
else
    echo -e "${RED}✗ Performance Score: $score% - Poor${NC}"
    exit 1
fi
