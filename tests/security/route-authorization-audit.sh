#!/bin/bash

# Route Authorization Audit Script
# Checks all routes for proper authentication and authorization

echo "=========================================="
echo "Route Authorization Audit"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

ROUTES_DIR="/Users/tohyifan/Desktop/Educard/src/routes"
ISSUES=0

echo "Analyzing route files for authorization..."
echo ""

# Function to check if file has auth middleware
check_route_file() {
    local file="$1"
    local filename=$(basename "$file")
    
    echo -e "${BLUE}Checking: $filename${NC}"
    
    # Check if file uses authentication middleware
    has_auth=$(grep -E "requireLogin|requireAuth|isAuthenticated|ensureAuthenticated" "$file" | wc -l)
    has_routes=$(grep -E "router\.(get|post|put|delete|patch)" "$file" | wc -l)
    
    if [ "$has_routes" -gt 0 ]; then
        if [ "$has_auth" -gt 0 ]; then
            echo -e "  ${GREEN}✓${NC} Has authentication middleware ($has_auth uses)"
        else
            echo -e "  ${YELLOW}⚠${NC} No authentication middleware found"
            ISSUES=$((ISSUES + 1))
        fi
        
        # Check for role-based authorization
        has_role_check=$(grep -E "requireRole|requireAdmin|requireModerator|checkRole" "$file" | wc -l)
        if [ "$has_role_check" -gt 0 ]; then
            echo -e "  ${GREEN}✓${NC} Has role-based authorization ($has_role_check uses)"
        fi
        
        # Check for CSRF protection
        has_csrf=$(grep -E "csrf|csrfProtection" "$file" | wc -l)
        if [ "$has_csrf" -gt 0 ]; then
            echo -e "  ${GREEN}✓${NC} Has CSRF protection"
        else
            has_post=$(grep -E "router\.post" "$file" | wc -l)
            if [ "$has_post" -gt 0 ]; then
                echo -e "  ${YELLOW}⚠${NC} Has POST routes but no explicit CSRF protection"
                ISSUES=$((ISSUES + 1))
            fi
        fi
        
        echo "  Routes found: $has_routes"
    fi
    
    echo ""
}

# Check all route files
if [ -d "$ROUTES_DIR" ]; then
    for file in "$ROUTES_DIR"/*.js; do
        if [ -f "$file" ]; then
            check_route_file "$file"
        fi
    done
else
    echo -e "${RED}Routes directory not found: $ROUTES_DIR${NC}"
    exit 1
fi

echo "=========================================="
echo "Specific Route Security Check"
echo "=========================================="
echo ""

# Define routes that MUST be protected
protected_routes=(
    "/profile"
    "/profile/edit"
    "/profile/change-password"
    "/admin"
    "/admin/dashboard"
    "/category/.*/new-thread"
    "/thread/.*/reply"
    "/thread/.*/edit"
    "/thread/.*/delete"
)

echo "Checking critical protected routes..."
echo ""

for route in "${protected_routes[@]}"; do
    echo -n "  $route ... "
    
    # Search for route definition in route files
    found=$(grep -r "get.*['\"]$route" "$ROUTES_DIR" 2>/dev/null || grep -r "post.*['\"]$route" "$ROUTES_DIR" 2>/dev/null || echo "")
    
    if [ -n "$found" ]; then
        # Check if auth middleware is used
        if echo "$found" | grep -qE "requireLogin|requireAuth|isAuthenticated"; then
            echo -e "${GREEN}✓ Protected${NC}"
        else
            echo -e "${RED}✗ NOT Protected${NC}"
            ISSUES=$((ISSUES + 1))
        fi
    else
        echo -e "${YELLOW}⚠ Not found${NC}"
    fi
done

echo ""
echo "=========================================="
echo "Authorization Summary"
echo "=========================================="
echo ""

if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}✓ All routes properly protected${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠ Found $ISSUES potential authorization issues${NC}"
    echo ""
    echo "Recommendations:"
    echo "1. Add authentication middleware to unprotected routes"
    echo "2. Add CSRF protection to POST/PUT/DELETE routes"
    echo "3. Add role-based authorization where needed"
    echo "4. Review route access patterns"
    exit 1
fi
