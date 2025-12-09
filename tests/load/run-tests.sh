#!/bin/bash

# Load Testing Suite Runner
# Runs all k6 load tests in sequence

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base URL (can be overridden)
BASE_URL=${BASE_URL:-"http://localhost:3000"}

# Test directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Log file
LOG_FILE="$SCRIPT_DIR/load-test-results-$(date +%Y%m%d-%H%M%S).log"

# Function to print section header
print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

# Function to check if server is running
check_server() {
    print_header "Checking Server Health"
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health")
    
    if [ "$response" == "200" ]; then
        echo -e "${GREEN}✓ Server is running at $BASE_URL${NC}"
        return 0
    else
        echo -e "${RED}✗ Server is not responding at $BASE_URL${NC}"
        echo "Please start the server before running load tests"
        exit 1
    fi
}

# Function to run a test
run_test() {
    local test_name=$1
    local test_file=$2
    local duration=$3
    
    print_header "$test_name"
    echo "Test file: $test_file"
    echo "Estimated duration: $duration"
    echo "Starting test..."
    echo ""
    
    # Run k6 test and capture output
    k6 run --quiet "$SCRIPT_DIR/$test_file" 2>&1 | tee -a "$LOG_FILE"
    local exit_code=${PIPESTATUS[0]}
    
    if [ $exit_code -eq 0 ]; then
        echo -e "\n${GREEN}✓ $test_name completed${NC}\n"
    else
        echo -e "\n${RED}✗ $test_name failed${NC}\n"
    fi
    
    return $exit_code
}

# Main execution
main() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║   Load Testing Suite - Educard Forum    ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo "Base URL: $BASE_URL"
    echo "Log file: $LOG_FILE"
    echo ""
    
    # Check if k6 is installed
    if ! command -v k6 &> /dev/null; then
        echo -e "${RED}✗ k6 is not installed${NC}"
        echo "Install k6 with: brew install k6"
        exit 1
    fi
    
    echo -e "${GREEN}✓ k6 is installed${NC}"
    
    # Check server
    check_server
    
    echo ""
    echo "Select test to run:"
    echo "  1) Baseline Test (quick)"
    echo "  2) Light Load Test (25 users, ~9 min)"
    echo "  3) Normal Load Test (100 users, ~19 min)"
    echo "  4) Peak Load Test (300 users, ~21 min)"
    echo "  5) Stress Test (up to 600 users, ~25 min)"
    echo "  6) Soak Test (50 users, ~70 min)"
    echo "  7) Run All Tests (Sequential, ~2.5 hours)"
    echo "  8) Quick Suite (Baseline + Light + Normal, ~30 min)"
    echo ""
    read -p "Enter choice (1-8): " choice
    
    case $choice in
        1)
            run_test "Baseline Performance Test" "baseline.js" "< 1 minute"
            ;;
        2)
            run_test "Light Load Test" "light-load.js" "~9 minutes"
            ;;
        3)
            run_test "Normal Load Test" "normal-load.js" "~19 minutes"
            ;;
        4)
            run_test "Peak Load Test" "peak-load.js" "~21 minutes"
            ;;
        5)
            run_test "Stress Test" "stress-test.js" "~25 minutes"
            ;;
        6)
            run_test "Soak Test" "soak-test.js" "~70 minutes"
            ;;
        7)
            echo -e "${YELLOW}Running full test suite (this will take ~2.5 hours)${NC}"
            run_test "1/6: Baseline Performance Test" "baseline.js" "< 1 minute"
            run_test "2/6: Light Load Test" "light-load.js" "~9 minutes"
            run_test "3/6: Normal Load Test" "normal-load.js" "~19 minutes"
            run_test "4/6: Peak Load Test" "peak-load.js" "~21 minutes"
            run_test "5/6: Stress Test" "stress-test.js" "~25 minutes"
            run_test "6/6: Soak Test" "soak-test.js" "~70 minutes"
            ;;
        8)
            echo -e "${YELLOW}Running quick test suite (~30 minutes)${NC}"
            run_test "1/3: Baseline Performance Test" "baseline.js" "< 1 minute"
            run_test "2/3: Light Load Test" "light-load.js" "~9 minutes"
            run_test "3/3: Normal Load Test" "normal-load.js" "~19 minutes"
            ;;
        *)
            echo -e "${RED}Invalid choice${NC}"
            exit 1
            ;;
    esac
    
    print_header "Test Suite Complete"
    echo "Results saved to: $LOG_FILE"
    echo ""
    echo "To view system stats during tests, run:"
    echo "  docker stats educard_app"
    echo ""
    echo "To view application logs:"
    echo "  docker logs educard_app --tail 100 -f"
    echo ""
}

# Run main function
main
