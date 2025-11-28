#!/bin/bash

# Educard Kubernetes Deployment Testing Script
# Automated testing for pod resilience, database persistence, and system health

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KUBECONFIG="$SCRIPT_DIR/kubeconfig-vagrant-local"
NAMESPACE="educard-prod"
TEST_MODE="${1:-all}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test results
TESTS_PASSED=0
TESTS_FAILED=0
TEST_RESULTS=()

# Export kubeconfig
export KUBECONFIG

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    TEST_RESULTS+=("✅ $1")
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    TEST_RESULTS+=("❌ $1")
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_section() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
    echo ""
}

# Show usage
usage() {
    echo "Usage: $0 [test-mode]"
    echo ""
    echo "Test modes:"
    echo "  all          - Run all tests (default)"
    echo "  health       - Run health checks only"
    echo "  resilience   - Run pod resilience tests only"
    echo "  persistence  - Run database persistence tests only"
    echo "  connectivity - Run service connectivity tests only"
    echo ""
    echo "Examples:"
    echo "  $0              # Run all tests"
    echo "  $0 health       # Run health checks only"
    echo "  $0 resilience   # Run resilience tests only"
    exit 0
}

# Check if help requested
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    usage
fi

# Header
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Educard Kubernetes Deployment Testing           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Test Mode: ${CYAN}$TEST_MODE${NC}"
echo -e "Namespace: ${CYAN}$NAMESPACE${NC}"
echo -e "Date: ${CYAN}$(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo ""

# Pre-flight checks
log_section "Pre-Flight Checks"

log_info "Checking cluster connectivity..."
if kubectl cluster-info &>/dev/null; then
    log_success "Cluster is accessible"
else
    log_error "Cannot connect to cluster"
    exit 1
fi

log_info "Checking namespace exists..."
if kubectl get namespace $NAMESPACE &>/dev/null; then
    log_success "Namespace '$NAMESPACE' exists"
else
    log_error "Namespace '$NAMESPACE' not found"
    exit 1
fi

# Health Checks
if [ "$TEST_MODE" = "all" ] || [ "$TEST_MODE" = "health" ]; then
    log_section "Health Checks"
    
    log_info "Checking pod status..."
    PODS=$(kubectl get pods -n $NAMESPACE --no-headers 2>/dev/null)
    TOTAL_PODS=$(echo "$PODS" | wc -l | tr -d ' ')
    RUNNING_PODS=$(echo "$PODS" | grep -c "Running" || echo "0")
    
    if [ "$RUNNING_PODS" -eq "$TOTAL_PODS" ] && [ "$TOTAL_PODS" -gt 0 ]; then
        log_success "All $TOTAL_PODS pods are running"
    else
        log_error "Only $RUNNING_PODS/$TOTAL_PODS pods are running"
    fi
    
    log_info "Checking pod readiness..."
    READY_PODS=$(kubectl get pods -n $NAMESPACE --no-headers 2>/dev/null | awk '{split($2,a,"/"); if(a[1]==a[2]) count++} END{print count+0}')
    
    if [ "$READY_PODS" -eq "$TOTAL_PODS" ]; then
        log_success "All $READY_PODS pods are ready"
    else
        log_error "Only $READY_PODS/$TOTAL_PODS pods are ready"
    fi
    
    log_info "Checking services..."
    SERVICES=$(kubectl get svc -n $NAMESPACE --no-headers 2>/dev/null | wc -l | tr -d ' ')
    if [ "$SERVICES" -ge 2 ]; then
        log_success "Found $SERVICES services"
    else
        log_warning "Only found $SERVICES services (expected at least 2)"
    fi
    
    log_info "Checking service endpoints..."
    APP_ENDPOINTS=$(kubectl get endpoints -n $NAMESPACE educard-service -o jsonpath='{.subsets[*].addresses[*].ip}' 2>/dev/null | wc -w | tr -d ' ')
    if [ "$APP_ENDPOINTS" -ge 1 ]; then
        log_success "Application service has $APP_ENDPOINTS endpoint(s)"
    else
        log_error "Application service has no endpoints"
    fi
    
    DB_ENDPOINTS=$(kubectl get endpoints -n $NAMESPACE postgres-service -o jsonpath='{.subsets[*].addresses[*].ip}' 2>/dev/null | wc -w | tr -d ' ')
    if [ "$DB_ENDPOINTS" -ge 1 ]; then
        log_success "Database service has $DB_ENDPOINTS endpoint(s)"
    else
        log_error "Database service has no endpoints"
    fi
    
    log_info "Checking PVCs..."
    BOUND_PVCS=$(kubectl get pvc -n $NAMESPACE --no-headers 2>/dev/null | grep -c "Bound" || echo "0")
    TOTAL_PVCS=$(kubectl get pvc -n $NAMESPACE --no-headers 2>/dev/null | wc -l | tr -d ' ')
    
    if [ "$BOUND_PVCS" -eq "$TOTAL_PVCS" ] && [ "$TOTAL_PVCS" -gt 0 ]; then
        log_success "All $BOUND_PVCS PVCs are bound"
    else
        log_error "Only $BOUND_PVCS/$TOTAL_PVCS PVCs are bound"
    fi
    
    log_info "Checking for warning events..."
    WARNINGS=$(kubectl get events -n $NAMESPACE --field-selector type=Warning 2>/dev/null | tail -n +2 | wc -l | tr -d ' ')
    if [ "$WARNINGS" -eq 0 ]; then
        log_success "No warning events found"
    else
        log_warning "Found $WARNINGS warning event(s)"
    fi
    
    log_info "Checking resource usage..."
    if kubectl top nodes &>/dev/null; then
        NODE_CPU=$(kubectl top nodes --no-headers 2>/dev/null | awk '{print $3}' | sed 's/%//')
        NODE_MEM=$(kubectl top nodes --no-headers 2>/dev/null | awk '{print $5}' | sed 's/%//')
        
        if [ "$NODE_CPU" -lt 80 ]; then
            log_success "Node CPU usage is acceptable ($NODE_CPU%)"
        else
            log_warning "Node CPU usage is high ($NODE_CPU%)"
        fi
        
        if [ "$NODE_MEM" -lt 80 ]; then
            log_success "Node memory usage is acceptable ($NODE_MEM%)"
        else
            log_warning "Node memory usage is high ($NODE_MEM%)"
        fi
    else
        log_warning "Cannot retrieve node metrics (metrics-server may not be ready)"
    fi
fi

# Service Connectivity Tests
if [ "$TEST_MODE" = "all" ] || [ "$TEST_MODE" = "connectivity" ]; then
    log_section "Service Connectivity Tests"
    
    log_info "Testing application service connectivity..."
    APP_POD=$(kubectl get pods -n $NAMESPACE -l app=educard -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    
    if [ -n "$APP_POD" ]; then
        if kubectl exec -n $NAMESPACE $APP_POD -- wget -q -O- http://localhost:3000/health --timeout=5 &>/dev/null; then
            log_success "Application health endpoint is accessible"
        else
            log_warning "Application health endpoint not accessible (may not be implemented)"
        fi
    else
        log_error "No application pod found for connectivity test"
    fi
    
    log_info "Testing database service connectivity..."
    DB_POD="postgres-0"
    DB_USER="educard"
    DB_NAME="educard_prod"
    
    if kubectl get pod -n $NAMESPACE $DB_POD &>/dev/null; then
        if kubectl exec -n $NAMESPACE $DB_POD -- pg_isready -U $DB_USER &>/dev/null; then
            log_success "Database is ready and accepting connections"
        else
            log_error "Database is not ready"
        fi
    else
        log_error "Database pod '$DB_POD' not found"
    fi
    
    log_info "Testing database authentication..."
    if kubectl exec -n $NAMESPACE $DB_POD -- psql -U $DB_USER -d $DB_NAME -c "SELECT 1" &>/dev/null; then
        log_success "Database authentication successful"
    else
        log_error "Database authentication failed"
    fi
fi

# Pod Resilience Tests
if [ "$TEST_MODE" = "all" ] || [ "$TEST_MODE" = "resilience" ]; then
    log_section "Pod Resilience Tests"
    
    log_warning "⚠️  This test will delete pods to verify auto-recovery"
    log_info "Waiting 3 seconds to start resilience tests..."
    sleep 3
    
    log_info "Testing application pod auto-recovery..."
    APP_POD=$(kubectl get pods -n $NAMESPACE -l app=educard -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    
    if [ -n "$APP_POD" ]; then
        log_info "Deleting pod: $APP_POD"
        kubectl delete pod -n $NAMESPACE $APP_POD --wait=false &>/dev/null
        
        log_info "Waiting for pod recovery (max 60 seconds)..."
        if kubectl wait --for=condition=ready pod -l app=educard -n $NAMESPACE --timeout=60s &>/dev/null; then
            log_success "Application pod recovered successfully"
            
            # Verify replica count
            DESIRED=$(kubectl get deployment educard-app -n $NAMESPACE -o jsonpath='{.spec.replicas}' 2>/dev/null)
            READY=$(kubectl get deployment educard-app -n $NAMESPACE -o jsonpath='{.status.readyReplicas}' 2>/dev/null)
            
            if [ "$READY" -eq "$DESIRED" ]; then
                log_success "All $DESIRED replica(s) are ready"
            else
                log_error "Only $READY/$DESIRED replicas are ready"
            fi
        else
            log_error "Application pod did not recover within timeout"
        fi
    else
        log_error "No application pod found for resilience test"
    fi
    
    log_info "Verifying service endpoints after pod recovery..."
    sleep 2
    APP_ENDPOINTS=$(kubectl get endpoints -n $NAMESPACE educard-service -o jsonpath='{.subsets[*].addresses[*].ip}' 2>/dev/null | wc -w | tr -d ' ')
    if [ "$APP_ENDPOINTS" -ge 1 ]; then
        log_success "Service endpoints restored ($APP_ENDPOINTS endpoint(s))"
    else
        log_error "Service endpoints not restored"
    fi
fi

# Database Persistence Tests
if [ "$TEST_MODE" = "all" ] || [ "$TEST_MODE" = "persistence" ]; then
    log_section "Database Persistence Tests"
    
    log_warning "⚠️  This test will delete database pod and verify data persistence"
    log_info "Waiting 3 seconds to start persistence tests..."
    sleep 3
    
    DB_POD="postgres-0"
    DB_USER="educard"
    DB_NAME="educard_prod"
    
    if kubectl get pod -n $NAMESPACE $DB_POD &>/dev/null; then
        log_info "Creating test table and data..."
        kubectl exec -n $NAMESPACE $DB_POD -- psql -U $DB_USER -d $DB_NAME -c "CREATE TABLE IF NOT EXISTS test_persistence_$(date +%s) (id SERIAL PRIMARY KEY, test_data VARCHAR(255), created_at TIMESTAMP DEFAULT NOW());" &>/dev/null
        
        TEST_TABLE=$(kubectl exec -n $NAMESPACE $DB_POD -- psql -U $DB_USER -d $DB_NAME -t -c "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'test_persistence_%' ORDER BY tablename DESC LIMIT 1;" 2>/dev/null | tr -d ' ')
        
        if [ -n "$TEST_TABLE" ]; then
            kubectl exec -n $NAMESPACE $DB_POD -- psql -U $DB_USER -d $DB_NAME -c "INSERT INTO $TEST_TABLE (test_data) VALUES ('Test data before pod deletion');" &>/dev/null
            
            log_info "Verifying test data exists..."
            RECORD_COUNT=$(kubectl exec -n $NAMESPACE $DB_POD -- psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM $TEST_TABLE;" 2>/dev/null | tr -d ' ')
            
            if [ "$RECORD_COUNT" -ge 1 ]; then
                log_success "Test data created successfully ($RECORD_COUNT record(s))"
                
                log_info "Deleting database pod: $DB_POD"
                kubectl delete pod -n $NAMESPACE $DB_POD --wait=false &>/dev/null
                
                log_info "Waiting for database pod recovery (max 120 seconds)..."
                if kubectl wait --for=condition=ready pod $DB_POD -n $NAMESPACE --timeout=120s &>/dev/null; then
                    log_success "Database pod recovered successfully"
                    
                    log_info "Waiting for database to be fully ready..."
                    sleep 5
                    
                    log_info "Verifying test data persisted..."
                    RECORD_COUNT_AFTER=$(kubectl exec -n $NAMESPACE $DB_POD -- psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM $TEST_TABLE;" 2>/dev/null | tr -d ' ')
                    
                    if [ "$RECORD_COUNT_AFTER" -eq "$RECORD_COUNT" ]; then
                        log_success "Data persisted successfully ($RECORD_COUNT_AFTER record(s))"
                        
                        # Cleanup test table
                        log_info "Cleaning up test data..."
                        kubectl exec -n $NAMESPACE $DB_POD -- psql -U $DB_USER -d $DB_NAME -c "DROP TABLE IF EXISTS $TEST_TABLE;" &>/dev/null
                        log_success "Test data cleaned up"
                    else
                        log_error "Data not persisted correctly (before: $RECORD_COUNT, after: $RECORD_COUNT_AFTER)"
                    fi
                else
                    log_error "Database pod did not recover within timeout"
                fi
            else
                log_error "Failed to create test data"
            fi
        else
            log_error "Failed to create test table"
        fi
    else
        log_error "Database pod '$DB_POD' not found"
    fi
    
    log_info "Verifying PVC still bound..."
    PVC_STATUS=$(kubectl get pvc -n $NAMESPACE postgres-pvc -o jsonpath='{.status.phase}' 2>/dev/null)
    if [ "$PVC_STATUS" = "Bound" ]; then
        log_success "Database PVC is still bound"
    else
        log_error "Database PVC status: $PVC_STATUS"
    fi
fi

# Summary
log_section "Test Summary"

echo ""
echo -e "${BLUE}Test Results:${NC}"
echo ""

for result in "${TEST_RESULTS[@]}"; do
    echo "  $result"
done

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
echo -e "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please review the output above.${NC}"
    echo ""
    echo "For detailed logs, run:"
    echo "  kubectl logs -n $NAMESPACE -l app=educard --tail=100"
    echo "  kubectl logs -n $NAMESPACE postgres-0 --tail=100"
    echo ""
    echo "For cluster status, run:"
    echo "  ./k8s/check-metrics.sh"
    echo ""
    exit 1
fi
