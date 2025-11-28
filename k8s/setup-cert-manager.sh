#!/usr/bin/env bash

# setup-cert-manager.sh - Configure and verify cert-manager installation
# This script helps configure email and verify cert-manager setup

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== cert-manager Configuration ===${NC}\n"

# Check if cert-manager is installed
echo -e "${YELLOW}Step 1: Verifying cert-manager Installation${NC}"
if ! kubectl get namespace cert-manager &>/dev/null; then
    echo -e "${RED}Error: cert-manager namespace not found${NC}"
    echo "Install cert-manager first:"
    echo "  kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml"
    exit 1
fi

# Check pods
PODS_READY=$(kubectl get pods -n cert-manager --no-headers 2>/dev/null | grep -c "1/1" || echo "0")
TOTAL_PODS=$(kubectl get pods -n cert-manager --no-headers 2>/dev/null | wc -l | tr -d ' ')

if [[ "$PODS_READY" -eq "$TOTAL_PODS" ]] && [[ "$TOTAL_PODS" -ge 3 ]]; then
    echo -e "${GREEN}✓ cert-manager is installed and running (${PODS_READY}/${TOTAL_PODS} pods ready)${NC}"
else
    echo -e "${RED}✗ cert-manager pods not ready (${PODS_READY}/${TOTAL_PODS})${NC}"
    kubectl get pods -n cert-manager
    exit 1
fi
echo

# Check if ClusterIssuers exist
echo -e "${YELLOW}Step 2: Checking ClusterIssuers${NC}"
ISSUER_FILE="$(dirname "$0")/cert-manager-issuer.yaml"

if [[ ! -f "$ISSUER_FILE" ]]; then
    echo -e "${RED}Error: ClusterIssuer file not found: ${ISSUER_FILE}${NC}"
    exit 1
fi

# Check current email configuration
CURRENT_EMAIL=$(grep "email:" "$ISSUER_FILE" | head -1 | awk '{print $2}')
echo "Current email in config: ${CURRENT_EMAIL}"

if [[ "$CURRENT_EMAIL" == "your-email@example.com" ]]; then
    echo -e "${YELLOW}⚠  Email not configured (using placeholder)${NC}"
    echo
    echo "You need to update the email address in cert-manager-issuer.yaml"
    echo "This email will receive certificate expiry notifications."
    echo
    echo "Do you want to update it now? (y/n)"
    read -r answer
    
    if [[ "$answer" == "y" ]]; then
        echo "Enter your email address:"
        read -r email
        
        # Validate email format
        if [[ ! "$email" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
            echo -e "${RED}Invalid email format${NC}"
            exit 1
        fi
        
        # Update email in file
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s/your-email@example.com/$email/g" "$ISSUER_FILE"
        else
            # Linux
            sed -i "s/your-email@example.com/$email/g" "$ISSUER_FILE"
        fi
        
        echo -e "${GREEN}✓ Email updated to: ${email}${NC}"
        CURRENT_EMAIL="$email"
    else
        echo "Please update the email manually in: ${ISSUER_FILE}"
        echo "Then re-run this script."
        exit 0
    fi
fi
echo

# Apply ClusterIssuers
echo -e "${YELLOW}Step 3: Applying ClusterIssuers${NC}"
kubectl apply -f "$ISSUER_FILE"
echo -e "${GREEN}✓ ClusterIssuers applied${NC}"
echo

# Wait for ClusterIssuers to be ready
echo -e "${YELLOW}Step 4: Waiting for ClusterIssuers to Register${NC}"
echo "This may take a few seconds..."

for issuer in letsencrypt-staging letsencrypt-prod; do
    echo -n "  Checking $issuer: "
    
    for i in {1..30}; do
        STATUS=$(kubectl get clusterissuer "$issuer" -o jsonpath='{.status.conditions[0].status}' 2>/dev/null || echo "Unknown")
        
        if [[ "$STATUS" == "True" ]]; then
            echo -e "${GREEN}Ready${NC}"
            break
        elif [[ "$STATUS" == "False" ]]; then
            REASON=$(kubectl get clusterissuer "$issuer" -o jsonpath='{.status.conditions[0].message}' 2>/dev/null)
            echo -e "${RED}Failed${NC}"
            echo "    Reason: $REASON"
            break
        fi
        
        sleep 1
        echo -n "."
    done
    
    if [[ "$STATUS" == "Unknown" ]]; then
        echo -e "${YELLOW}Timeout${NC}"
    fi
done
echo

# Show ClusterIssuer status
echo -e "${YELLOW}Step 5: ClusterIssuer Status${NC}"
kubectl get clusterissuer
echo

# Check detailed status
echo -e "${YELLOW}Detailed Status:${NC}"
for issuer in letsencrypt-staging letsencrypt-prod; do
    echo -e "\n${BLUE}$issuer:${NC}"
    kubectl describe clusterissuer "$issuer" | grep -A 5 "Status:" || echo "  No status information available"
done
echo

# Summary
echo -e "${GREEN}=== Configuration Complete ===${NC}"
echo
echo "Email configured: ${CURRENT_EMAIL}"
echo
echo "ClusterIssuers created:"
echo "  - letsencrypt-staging (for testing)"
echo "  - letsencrypt-prod (for production)"
echo
echo "Next steps:"
echo "  1. Configure DNS A record to point to your server IP"
echo "  2. Create Ingress with cert-manager annotation"
echo "  3. Test with staging issuer first"
echo "  4. Switch to production issuer after testing"
echo
echo "Useful commands:"
echo "  # Check ClusterIssuers"
echo "  kubectl get clusterissuer"
echo
echo "  # Describe issuer"
echo "  kubectl describe clusterissuer letsencrypt-staging"
echo
echo "  # View certificates"
echo "  kubectl get certificate --all-namespaces"
echo
echo "  # Check cert-manager logs"
echo "  kubectl logs -n cert-manager -l app=cert-manager"
echo
