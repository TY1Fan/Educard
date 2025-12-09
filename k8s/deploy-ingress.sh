#!/bin/bash

# deploy-ingress.sh - Helper script to deploy Ingress with SSL/TLS
# This script helps configure and deploy the Ingress resource with automatic
# certificate management via cert-manager

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="educard-prod"
INGRESS_NAME="educard-ingress"
INGRESS_FILE="k8s/ingress.yaml"
ISSUER_FILE="k8s/cert-manager-issuer.yaml"

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}  Educard Ingress Deployment${NC}"
echo -e "${BLUE}=====================================${NC}"
echo

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${BLUE}[1/7] Checking prerequisites...${NC}"

if ! command_exists kubectl; then
    echo -e "${RED}❌ kubectl not found. Please install kubectl.${NC}"
    exit 1
fi

if ! command_exists dig; then
    echo -e "${YELLOW}⚠️  dig not found. DNS checks will be skipped.${NC}"
fi

echo -e "${GREEN}✓ Prerequisites OK${NC}"
echo

# Check cert-manager
echo -e "${BLUE}[2/7] Verifying cert-manager...${NC}"

if ! kubectl get namespace cert-manager &>/dev/null; then
    echo -e "${RED}❌ cert-manager namespace not found${NC}"
    echo "Please install cert-manager first (Task 5.11)"
    exit 1
fi

CERT_MANAGER_PODS=$(kubectl get pods -n cert-manager -o json | jq -r '.items[] | select(.status.phase=="Running") | .metadata.name' | wc -l | tr -d ' ')
if [ "$CERT_MANAGER_PODS" -lt 3 ]; then
    echo -e "${RED}❌ cert-manager pods not all running${NC}"
    kubectl get pods -n cert-manager
    exit 1
fi

echo -e "${GREEN}✓ cert-manager is running (${CERT_MANAGER_PODS} pods)${NC}"
echo

# Check ClusterIssuers
echo -e "${BLUE}[3/7] Checking ClusterIssuers...${NC}"

if ! kubectl get clusterissuer letsencrypt-prod &>/dev/null; then
    echo -e "${YELLOW}⚠️  letsencrypt-prod ClusterIssuer not found${NC}"
    echo "Creating ClusterIssuers..."
    
    if [ -f "$ISSUER_FILE" ]; then
        kubectl apply -f "$ISSUER_FILE"
        echo -e "${GREEN}✓ ClusterIssuers created${NC}"
    else
        echo -e "${RED}❌ File not found: $ISSUER_FILE${NC}"
        exit 1
    fi
else
    # Check if email is configured
    EMAIL=$(kubectl get clusterissuer letsencrypt-prod -o jsonpath='{.spec.acme.email}')
    
    if [[ "$EMAIL" == *"example.com"* ]] || [[ "$EMAIL" == "your-email@example.com" ]]; then
        echo -e "${RED}❌ ClusterIssuer email not configured${NC}"
        echo
        echo "The email in ClusterIssuer is still set to placeholder: $EMAIL"
        echo
        echo "Please update the email in $ISSUER_FILE or run:"
        echo "  ./k8s/setup-cert-manager.sh"
        echo
        exit 1
    fi
    
    ISSUER_READY=$(kubectl get clusterissuer letsencrypt-prod -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}')
    
    if [ "$ISSUER_READY" != "True" ]; then
        echo -e "${YELLOW}⚠️  ClusterIssuer not ready yet${NC}"
        echo
        kubectl describe clusterissuer letsencrypt-prod | grep -A 5 "Status:"
        echo
        echo -e "${YELLOW}This might be temporary. Continuing anyway...${NC}"
    else
        echo -e "${GREEN}✓ ClusterIssuer ready (email: $EMAIL)${NC}"
    fi
fi
echo

# Get domain from ingress.yaml
echo -e "${BLUE}[4/7] Extracting domain configuration...${NC}"

if [ ! -f "$INGRESS_FILE" ]; then
    echo -e "${RED}❌ Ingress file not found: $INGRESS_FILE${NC}"
    exit 1
fi

DOMAIN=$(grep -A 1 "- hosts:" "$INGRESS_FILE" | grep -v "hosts:" | grep -v "www\." | sed 's/^[[:space:]]*-[[:space:]]*//' | head -1)

if [[ "$DOMAIN" == *"yourdomain.com"* ]]; then
    echo -e "${RED}❌ Domain not configured in $INGRESS_FILE${NC}"
    echo
    echo "Current domain: $DOMAIN"
    echo
    echo "Please update the domain in $INGRESS_FILE:"
    echo "  1. Replace 'yourdomain.com' with your actual domain"
    echo "  2. Update both the root domain and www subdomain"
    echo
    read -p "Enter your domain name (e.g., educard.example.com): " USER_DOMAIN
    
    if [ -z "$USER_DOMAIN" ]; then
        echo -e "${RED}❌ No domain provided${NC}"
        exit 1
    fi
    
    # Update the ingress file
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/yourdomain\.com/$USER_DOMAIN/g" "$INGRESS_FILE"
    else
        # Linux
        sed -i "s/yourdomain\.com/$USER_DOMAIN/g" "$INGRESS_FILE"
    fi
    
    DOMAIN="$USER_DOMAIN"
    echo -e "${GREEN}✓ Domain updated to: $DOMAIN${NC}"
else
    echo -e "${GREEN}✓ Domain configured: $DOMAIN${NC}"
fi
echo

# Check DNS resolution
echo -e "${BLUE}[5/7] Checking DNS configuration...${NC}"

if command_exists dig; then
    DNS_IP=$(dig +short "$DOMAIN" | tail -1)
    
    if [ -z "$DNS_IP" ]; then
        echo -e "${YELLOW}⚠️  DNS not configured for $DOMAIN${NC}"
        echo
        echo "Please create an A record pointing to your server IP:"
        echo "  Domain: $DOMAIN"
        echo "  Type: A"
        echo "  Value: <your-server-ip>"
        echo
        echo -e "${YELLOW}Note: DNS propagation can take up to 24-48 hours${NC}"
        echo
        read -p "Continue anyway? (y/N): " CONTINUE
        if [[ ! "$CONTINUE" =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        echo -e "${GREEN}✓ DNS resolves to: $DNS_IP${NC}"
        
        # Try to get server IP from kubectl
        if kubectl get nodes -o wide &>/dev/null; then
            SERVER_IP=$(kubectl get nodes -o wide | awk 'NR==2 {print $6}')
            if [ "$DNS_IP" != "$SERVER_IP" ]; then
                echo -e "${YELLOW}⚠️  DNS IP ($DNS_IP) doesn't match server IP ($SERVER_IP)${NC}"
                echo "Make sure your DNS points to the correct server"
            fi
        fi
    fi
else
    echo -e "${YELLOW}⚠️  dig not available, skipping DNS check${NC}"
fi
echo

# Apply Ingress
echo -e "${BLUE}[6/7] Deploying Ingress...${NC}"
echo

kubectl apply -f "$INGRESS_FILE"

echo
echo -e "${GREEN}✓ Ingress deployed${NC}"
echo

# Wait a moment for the resource to be created
sleep 2

# Show Ingress details
echo -e "${BLUE}Ingress Status:${NC}"
kubectl get ingress -n "$NAMESPACE" "$INGRESS_NAME"
echo

# Monitor certificate
echo -e "${BLUE}[7/7] Monitoring certificate issuance...${NC}"
echo
echo "Waiting for certificate to be created..."

# Wait for certificate resource
MAX_WAIT=30
WAIT_COUNT=0
while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
    if kubectl get certificate -n "$NAMESPACE" educard-tls &>/dev/null; then
        break
    fi
    echo -n "."
    sleep 2
    WAIT_COUNT=$((WAIT_COUNT + 1))
done
echo

if kubectl get certificate -n "$NAMESPACE" educard-tls &>/dev/null; then
    echo -e "${GREEN}✓ Certificate resource created${NC}"
    echo
    
    echo -e "${BLUE}Certificate Status:${NC}"
    kubectl get certificate -n "$NAMESPACE" educard-tls
    echo
    
    CERT_READY=$(kubectl get certificate -n "$NAMESPACE" educard-tls -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}' 2>/dev/null || echo "Unknown")
    
    if [ "$CERT_READY" = "True" ]; then
        echo -e "${GREEN}✓ Certificate issued successfully!${NC}"
        
        # Show certificate details
        echo
        echo -e "${BLUE}Certificate Details:${NC}"
        kubectl describe certificate -n "$NAMESPACE" educard-tls | grep -A 10 "Status:"
    else
        echo -e "${YELLOW}⚠️  Certificate not ready yet${NC}"
        echo
        echo "Certificate issuance can take 1-5 minutes."
        echo "This is normal and happens because:"
        echo "  1. cert-manager needs to create a CertificateRequest"
        echo "  2. Let's Encrypt validates domain ownership (HTTP-01 challenge)"
        echo "  3. Certificate is issued and stored in Secret"
        echo
        echo "Monitor progress with:"
        echo "  kubectl get certificate -n $NAMESPACE educard-tls -w"
        echo
        echo "Check events with:"
        echo "  kubectl describe certificate -n $NAMESPACE educard-tls"
        echo
        echo "View cert-manager logs:"
        echo "  kubectl logs -n cert-manager -l app=cert-manager -f"
    fi
else
    echo -e "${YELLOW}⚠️  Certificate resource not created yet${NC}"
    echo
    echo "If the certificate doesn't appear within a few minutes, check:"
    echo "  1. ClusterIssuer status: kubectl get clusterissuer"
    echo "  2. Ingress annotations: kubectl describe ingress -n $NAMESPACE $INGRESS_NAME"
    echo "  3. cert-manager logs: kubectl logs -n cert-manager -l app=cert-manager"
fi

echo
echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}  Deployment Summary${NC}"
echo -e "${BLUE}=====================================${NC}"
echo
echo "Domain: $DOMAIN"
echo "Ingress: $INGRESS_NAME"
echo "Namespace: $NAMESPACE"
echo "TLS Secret: educard-tls"
echo
echo -e "${GREEN}✓ Ingress deployed successfully${NC}"
echo
echo -e "${BLUE}Next Steps:${NC}"
echo
echo "1. Monitor certificate issuance:"
echo "   kubectl get certificate -n $NAMESPACE -w"
echo
echo "2. Check certificate details:"
echo "   kubectl describe certificate -n $NAMESPACE educard-tls"
echo
echo "3. View Ingress status:"
echo "   kubectl describe ingress -n $NAMESPACE $INGRESS_NAME"
echo
echo "4. Test HTTP access (should redirect to HTTPS):"
echo "   curl -I http://$DOMAIN"
echo
echo "5. Test HTTPS access:"
echo "   curl -I https://$DOMAIN"
echo
echo "6. Test application health:"
echo "   curl https://$DOMAIN/health"
echo
echo "7. Check certificate in browser:"
echo "   Open https://$DOMAIN in your browser"
echo
echo -e "${YELLOW}Note:${NC} If DNS was just configured, wait for propagation (up to 48 hours)"
echo -e "${YELLOW}Note:${NC} Certificate issuance requires port 80 to be accessible from internet"
echo
