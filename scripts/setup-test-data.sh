#!/bin/bash

# Test Data Setup Script for Educard Forum
# Purpose: Automate creation of test accounts and sample data for manual testing
# Usage: ./scripts/setup-test-data.sh

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_URL="http://localhost:3000"
API_URL="http://localhost:3000/api"

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Educard Test Data Setup Script          ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo ""

# Function to check if application is running
check_app_running() {
    echo -e "${YELLOW}[1/5] Checking application status...${NC}"
    
    if curl -s -o /dev/null -w "%{http_code}" "$APP_URL" | grep -q "200"; then
        echo -e "${GREEN}✓ Application is running at $APP_URL${NC}"
        return 0
    else
        echo -e "${RED}✗ Application is not responding${NC}"
        echo -e "${YELLOW}Please start the application first:${NC}"
        echo -e "  docker-compose up -d"
        exit 1
    fi
}

# Function to check database connection
check_database() {
    echo -e "${YELLOW}[2/5] Checking database connection...${NC}"
    
    if docker exec educard_db psql -U postgres -d educard -c "SELECT 1;" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Database connection successful${NC}"
        return 0
    else
        echo -e "${RED}✗ Cannot connect to database${NC}"
        echo -e "${YELLOW}Please ensure database container is running${NC}"
        exit 1
    fi
}

# Function to clear existing test data
clear_test_data() {
    echo -e "${YELLOW}[3/5] Clearing existing test data...${NC}"
    
    read -p "$(echo -e ${YELLOW}Do you want to clear existing test data? [y/N]: ${NC})" -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Clearing test users and data...${NC}"
        
        docker exec educard_db psql -U postgres -d educard <<-EOSQL
            DELETE FROM posts WHERE user_id IN (
                SELECT id FROM users WHERE email LIKE '%@example.com'
            );
            DELETE FROM threads WHERE user_id IN (
                SELECT id FROM users WHERE email LIKE '%@example.com'
            );
            DELETE FROM users WHERE email LIKE '%@example.com';
EOSQL
        
        echo -e "${GREEN}✓ Test data cleared${NC}"
    else
        echo -e "${BLUE}Skipping data clearing${NC}"
    fi
}

# Function to create test accounts
create_test_accounts() {
    echo -e "${YELLOW}[4/5] Creating test accounts...${NC}"
    
    # Test Account 1
    echo -e "  Creating testuser1..."
    curl -s -X POST "$API_URL/auth/register" \
        -H "Content-Type: application/json" \
        -d '{
            "username": "testuser1",
            "email": "testuser1@example.com",
            "password": "TestPass123!"
        }' > /dev/null 2>&1 || echo -e "${YELLOW}    Note: testuser1 may already exist${NC}"
    
    # Test Account 2
    echo -e "  Creating testuser2..."
    curl -s -X POST "$API_URL/auth/register" \
        -H "Content-Type: application/json" \
        -d '{
            "username": "testuser2",
            "email": "testuser2@example.com",
            "password": "TestPass123!"
        }' > /dev/null 2>&1 || echo -e "${YELLOW}    Note: testuser2 may already exist${NC}"
    
    # Admin Account
    echo -e "  Creating adminuser..."
    curl -s -X POST "$API_URL/auth/register" \
        -H "Content-Type: application/json" \
        -d '{
            "username": "adminuser",
            "email": "admin@example.com",
            "password": "AdminPass123!"
        }' > /dev/null 2>&1 || echo -e "${YELLOW}    Note: adminuser may already exist${NC}"
    
    echo -e "${GREEN}✓ Test accounts created${NC}"
}

# Function to create sample threads and posts
create_sample_data() {
    echo -e "${YELLOW}[5/5] Creating sample threads and posts...${NC}"
    
    read -p "$(echo -e ${YELLOW}Create sample threads and posts? [y/N]: ${NC})" -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}This requires logged-in users. You'll need to:${NC}"
        echo -e "  1. Login as testuser1"
        echo -e "  2. Create a few threads"
        echo -e "  3. Add some posts to threads"
        echo -e "  4. Login as testuser2 and interact"
        echo -e "${BLUE}For now, we'll just verify the accounts exist...${NC}"
        
        USER_COUNT=$(docker exec educard_db psql -U postgres -d educard -t -c "SELECT COUNT(*) FROM users WHERE email LIKE '%@example.com';")
        echo -e "${GREEN}✓ $USER_COUNT test accounts ready${NC}"
    else
        echo -e "${BLUE}Skipping sample data creation${NC}"
    fi
}

# Function to display test account information
display_test_accounts() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║        Test Accounts Created               ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}Account 1: Standard User${NC}"
    echo -e "  Username: ${YELLOW}testuser1${NC}"
    echo -e "  Email:    ${YELLOW}testuser1@example.com${NC}"
    echo -e "  Password: ${YELLOW}TestPass123!${NC}"
    echo ""
    echo -e "${GREEN}Account 2: Secondary User${NC}"
    echo -e "  Username: ${YELLOW}testuser2${NC}"
    echo -e "  Email:    ${YELLOW}testuser2@example.com${NC}"
    echo -e "  Password: ${YELLOW}TestPass123!${NC}"
    echo ""
    echo -e "${GREEN}Account 3: Admin User${NC}"
    echo -e "  Username: ${YELLOW}adminuser${NC}"
    echo -e "  Email:    ${YELLOW}admin@example.com${NC}"
    echo -e "  Password: ${YELLOW}AdminPass123!${NC}"
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║          Next Steps                        ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "1. Open browser to: ${YELLOW}$APP_URL${NC}"
    echo -e "2. Login with test accounts above"
    echo -e "3. Follow testing checklist: ${YELLOW}docs/TESTING_CHECKLIST.md${NC}"
    echo -e "4. Document bugs in: ${YELLOW}docs/BUGS_FOUND.md${NC}"
    echo ""
}

# Function to verify setup
verify_setup() {
    echo -e "${YELLOW}Verifying setup...${NC}"
    
    # Check user count
    USER_COUNT=$(docker exec educard_db psql -U postgres -d educard -t -c "SELECT COUNT(*) FROM users WHERE email LIKE '%@example.com';" | xargs)
    
    if [ "$USER_COUNT" -ge 3 ]; then
        echo -e "${GREEN}✓ Setup complete! $USER_COUNT test accounts ready${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠ Warning: Only $USER_COUNT test accounts found${NC}"
        echo -e "${YELLOW}You may need to create accounts manually${NC}"
        return 1
    fi
}

# Main execution
main() {
    check_app_running
    check_database
    clear_test_data
    create_test_accounts
    create_sample_data
    echo ""
    verify_setup
    display_test_accounts
}

# Run main function
main

exit 0
