#!/bin/bash

# Quick Start Testing Script for Educard Forum
# Purpose: Streamline the manual testing process
# Usage: ./scripts/start-testing.sh

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

clear

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════╗"
echo "║                                                      ║"
echo "║       Educard Forum - Manual Testing Tool           ║"
echo "║                                                      ║"
echo "╚══════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Function to open testing documents
open_docs() {
    echo -e "${YELLOW}Opening testing documents...${NC}"
    
    # Open testing checklist
    if [ -f "docs/TESTING_CHECKLIST.md" ]; then
        open "docs/TESTING_CHECKLIST.md" 2>/dev/null || echo "Open docs/TESTING_CHECKLIST.md in your editor"
    fi
    
    # Open bug tracker
    if [ -f "docs/BUGS_FOUND.md" ]; then
        open "docs/BUGS_FOUND.md" 2>/dev/null || echo "Open docs/BUGS_FOUND.md in your editor"
    fi
    
    # Open testing guide
    if [ -f "docs/MANUAL_TESTING_GUIDE.md" ]; then
        open "docs/MANUAL_TESTING_GUIDE.md" 2>/dev/null || echo "Open docs/MANUAL_TESTING_GUIDE.md in your editor"
    fi
    
    echo -e "${GREEN}✓ Testing documents opened${NC}"
}

# Function to check application status
check_status() {
    echo -e "${YELLOW}Checking application status...${NC}"
    
    if curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000" | grep -q "200"; then
        RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" "http://localhost:3000")
        echo -e "${GREEN}✓ Application is running${NC}"
        echo -e "  URL: http://localhost:3000"
        echo -e "  Response time: ${RESPONSE_TIME}s"
    else
        echo -e "${YELLOW}⚠ Application not responding${NC}"
        echo -e "  Start with: docker-compose up -d"
        exit 1
    fi
}

# Function to show test accounts
show_accounts() {
    echo ""
    echo -e "${BLUE}Test Accounts:${NC}"
    echo -e "  ${GREEN}testuser1${NC} / testuser1@example.com / TestPass123!"
    echo -e "  ${GREEN}testuser2${NC} / testuser2@example.com / TestPass123!"
    echo -e "  ${GREEN}adminuser${NC} / admin@example.com / AdminPass123!"
}

# Function to open browser
open_browser() {
    echo ""
    echo -e "${YELLOW}Opening application in browser...${NC}"
    open "http://localhost:3000" 2>/dev/null || echo "Open http://localhost:3000 in your browser"
    echo -e "${GREEN}✓ Browser opened${NC}"
}

# Interactive menu
show_menu() {
    echo ""
    echo -e "${BLUE}What would you like to do?${NC}"
    echo ""
    echo "  1) Start testing (open all docs + browser)"
    echo "  2) Setup test data (create test accounts)"
    echo "  3) View test accounts"
    echo "  4) Check application status"
    echo "  5) Open testing checklist"
    echo "  6) Open bug tracker"
    echo "  7) Open testing guide"
    echo "  8) View testing progress"
    echo "  9) Exit"
    echo ""
}

# Function to view testing progress
view_progress() {
    echo ""
    echo -e "${BLUE}Testing Progress:${NC}"
    echo ""
    
    if [ -f "docs/TESTING_CHECKLIST.md" ]; then
        TOTAL_TESTS=$(grep -c "\[ \]" "docs/TESTING_CHECKLIST.md" || echo "0")
        COMPLETED_TESTS=$(grep -c "\[x\]" "docs/TESTING_CHECKLIST.md" || echo "0")
        
        echo -e "  Total tests: ${YELLOW}$TOTAL_TESTS${NC}"
        echo -e "  Completed: ${GREEN}$COMPLETED_TESTS${NC}"
        
        if [ "$TOTAL_TESTS" -gt 0 ]; then
            PERCENTAGE=$((COMPLETED_TESTS * 100 / TOTAL_TESTS))
            echo -e "  Progress: ${GREEN}${PERCENTAGE}%${NC}"
        fi
    else
        echo -e "  ${YELLOW}Testing checklist not found${NC}"
    fi
    
    echo ""
    
    if [ -f "docs/BUGS_FOUND.md" ]; then
        BUGS=$(grep -c "BUG-" "docs/BUGS_FOUND.md" 2>/dev/null || echo "0")
        echo -e "  Bugs found: ${YELLOW}$BUGS${NC}"
    fi
}

# Main function
main() {
    while true; do
        show_menu
        read -p "Enter choice [1-9]: " choice
        
        case $choice in
            1)
                check_status
                open_docs
                show_accounts
                open_browser
                echo ""
                echo -e "${GREEN}✓ Ready to start testing!${NC}"
                echo -e "${BLUE}Follow the checklist in docs/TESTING_CHECKLIST.md${NC}"
                ;;
            2)
                if [ -f "scripts/setup-test-data.sh" ]; then
                    ./scripts/setup-test-data.sh
                else
                    echo -e "${YELLOW}Test data setup script not found${NC}"
                fi
                ;;
            3)
                show_accounts
                ;;
            4)
                check_status
                ;;
            5)
                open "docs/TESTING_CHECKLIST.md" 2>/dev/null || echo "Open docs/TESTING_CHECKLIST.md"
                ;;
            6)
                open "docs/BUGS_FOUND.md" 2>/dev/null || echo "Open docs/BUGS_FOUND.md"
                ;;
            7)
                open "docs/MANUAL_TESTING_GUIDE.md" 2>/dev/null || echo "Open docs/MANUAL_TESTING_GUIDE.md"
                ;;
            8)
                view_progress
                ;;
            9)
                echo ""
                echo -e "${GREEN}Happy testing! 🚀${NC}"
                echo ""
                exit 0
                ;;
            *)
                echo -e "${YELLOW}Invalid choice. Please enter 1-9.${NC}"
                ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
        clear
        echo -e "${BLUE}"
        echo "╔══════════════════════════════════════════════════════╗"
        echo "║       Educard Forum - Manual Testing Tool           ║"
        echo "╚══════════════════════════════════════════════════════╝"
        echo -e "${NC}"
    done
}

# Run main function
main
