#!/bin/bash

# Educard Kubernetes Monitoring Script
# Quick health and resource check for the cluster

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KUBECONFIG="$SCRIPT_DIR/kubeconfig-vagrant-local"
NAMESPACE="educard-prod"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Export kubeconfig
export KUBECONFIG

echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Educard Kubernetes Cluster Monitoring         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if cluster is accessible
if ! kubectl cluster-info &>/dev/null; then
    echo -e "${RED}✗ Cannot connect to cluster${NC}"
    echo "  Please check if K3s is running: vagrant ssh -c 'sudo systemctl status k3s'"
    exit 1
fi

echo -e "${GREEN}✓ Cluster is accessible${NC}"
echo ""

# Node Resources
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Node Resources${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

NODE_METRICS=$(kubectl top nodes --no-headers 2>/dev/null)
if [ $? -eq 0 ]; then
    while read -r node cpu cpu_pct memory mem_pct; do
        echo -e "Node: ${GREEN}$node${NC}"
        
        # Parse CPU percentage
        cpu_val=$(echo "$cpu_pct" | sed 's/%//')
        if [ "$cpu_val" -gt 80 ]; then
            cpu_color=$RED
        elif [ "$cpu_val" -gt 50 ]; then
            cpu_color=$YELLOW
        else
            cpu_color=$GREEN
        fi
        echo -e "  CPU:    $cpu ($cpu_color$cpu_pct${NC})"
        
        # Parse memory percentage
        mem_val=$(echo "$mem_pct" | sed 's/%//')
        if [ "$mem_val" -gt 80 ]; then
            mem_color=$RED
        elif [ "$mem_val" -gt 50 ]; then
            mem_color=$YELLOW
        else
            mem_color=$GREEN
        fi
        echo -e "  Memory: $memory ($mem_color$mem_pct${NC})"
    done <<< "$NODE_METRICS"
else
    echo -e "${YELLOW}⚠ Unable to fetch node metrics${NC}"
fi

echo ""

# Pod Status
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Pod Status - $NAMESPACE${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

POD_STATUS=$(kubectl get pods -n $NAMESPACE --no-headers 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "$POD_STATUS" | while read -r name ready status restarts age; do
        # Parse ready status
        ready_current=$(echo "$ready" | cut -d'/' -f1)
        ready_total=$(echo "$ready" | cut -d'/' -f2)
        
        # Set colors based on status
        if [ "$status" = "Running" ] && [ "$ready_current" = "$ready_total" ]; then
            status_color=$GREEN
            status_icon="✓"
        elif [ "$status" = "Running" ]; then
            status_color=$YELLOW
            status_icon="⚠"
        else
            status_color=$RED
            status_icon="✗"
        fi
        
        # Parse restart count
        restart_val=$(echo "$restarts" | sed 's/[^0-9]//g')
        if [ -z "$restart_val" ]; then
            restart_val=0
        fi
        
        if [ "$restart_val" -gt 5 ]; then
            restart_color=$RED
        elif [ "$restart_val" -gt 0 ]; then
            restart_color=$YELLOW
        else
            restart_color=$GREEN
        fi
        
        echo -e "$status_icon ${status_color}$name${NC}"
        echo -e "  Status:   $status_color$status${NC}"
        echo -e "  Ready:    $ready"
        echo -e "  Restarts: $restart_color$restarts${NC}"
        echo -e "  Age:      $age"
        echo ""
    done
else
    echo -e "${RED}✗ Unable to fetch pod status${NC}"
fi

# Pod Resources
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Pod Resources - $NAMESPACE${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

POD_METRICS=$(kubectl top pods -n $NAMESPACE --no-headers 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "$POD_METRICS" | while read -r name cpu memory; do
        echo -e "Pod: ${GREEN}$name${NC}"
        echo -e "  CPU:    $cpu"
        echo -e "  Memory: $memory"
        echo ""
    done
else
    echo -e "${YELLOW}⚠ Unable to fetch pod metrics${NC}"
    echo -e "  Metrics may still be initializing..."
    echo ""
fi

# Service Status
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Services - $NAMESPACE${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

SERVICES=$(kubectl get svc -n $NAMESPACE --no-headers 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "$SERVICES" | while read -r name type cluster_ip external_ip ports age; do
        echo -e "Service: ${GREEN}$name${NC}"
        echo -e "  Type:        $type"
        echo -e "  Cluster IP:  $cluster_ip"
        echo -e "  Ports:       $ports"
        
        # Check endpoints
        ENDPOINTS=$(kubectl get endpoints -n $NAMESPACE $name -o jsonpath='{.subsets[*].addresses[*].ip}' 2>/dev/null)
        ENDPOINT_COUNT=$(echo "$ENDPOINTS" | wc -w | tr -d ' ')
        
        if [ "$ENDPOINT_COUNT" -gt 0 ]; then
            echo -e "  Endpoints:   ${GREEN}$ENDPOINT_COUNT ready${NC}"
        else
            echo -e "  Endpoints:   ${RED}0 ready (no pods)${NC}"
        fi
        echo ""
    done
else
    echo -e "${RED}✗ Unable to fetch services${NC}"
fi

# Storage Status
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Storage - $NAMESPACE${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

PVCS=$(kubectl get pvc -n $NAMESPACE --no-headers 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "$PVCS" | while read -r name status volume capacity access_mode storage_class age; do
        if [ "$status" = "Bound" ]; then
            status_color=$GREEN
            status_icon="✓"
        else
            status_color=$YELLOW
            status_icon="⚠"
        fi
        
        echo -e "$status_icon ${status_color}$name${NC}"
        echo -e "  Status:   $status_color$status${NC}"
        echo -e "  Volume:   $volume"
        echo -e "  Capacity: $capacity"
        echo -e "  Age:      $age"
        echo ""
    done
else
    echo -e "${YELLOW}⚠ No persistent volumes found${NC}"
    echo ""
fi

# Recent Events (Warnings)
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Recent Warnings - $NAMESPACE${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

WARNINGS=$(kubectl get events -n $NAMESPACE --field-selector type=Warning --sort-by='.lastTimestamp' 2>/dev/null | tail -n 5)
if [ $? -eq 0 ] && [ -n "$WARNINGS" ]; then
    echo "$WARNINGS" | tail -n +2 | while IFS= read -r line; do
        echo -e "${YELLOW}⚠${NC} $line"
    done
else
    echo -e "${GREEN}✓ No recent warnings${NC}"
fi

echo ""

# CronJob Status (Backups)
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}CronJobs - $NAMESPACE${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

CRONJOBS=$(kubectl get cronjob -n $NAMESPACE --no-headers 2>/dev/null)
if [ $? -eq 0 ] && [ -n "$CRONJOBS" ]; then
    echo "$CRONJOBS" | while read -r name schedule suspend active last_schedule age; do
        echo -e "CronJob: ${GREEN}$name${NC}"
        echo -e "  Schedule:      $schedule"
        echo -e "  Active Jobs:   $active"
        echo -e "  Last Schedule: $last_schedule"
        
        # Get recent job status
        LAST_JOB=$(kubectl get jobs -n $NAMESPACE -l cronjob-name=$name --sort-by=.metadata.creationTimestamp -o jsonpath='{.items[-1:].metadata.name}' 2>/dev/null)
        if [ -n "$LAST_JOB" ]; then
            JOB_STATUS=$(kubectl get job -n $NAMESPACE $LAST_JOB -o jsonpath='{.status.conditions[0].type}' 2>/dev/null)
            if [ "$JOB_STATUS" = "Complete" ]; then
                echo -e "  Last Job:      ${GREEN}✓ $LAST_JOB (Complete)${NC}"
            elif [ "$JOB_STATUS" = "Failed" ]; then
                echo -e "  Last Job:      ${RED}✗ $LAST_JOB (Failed)${NC}"
            else
                echo -e "  Last Job:      ${YELLOW}⚠ $LAST_JOB ($JOB_STATUS)${NC}"
            fi
        fi
        echo ""
    done
else
    echo -e "${YELLOW}⚠ No CronJobs found${NC}"
    echo ""
fi

# Summary
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

# Count pods
TOTAL_PODS=$(kubectl get pods -n $NAMESPACE --no-headers 2>/dev/null | wc -l | tr -d ' ')
RUNNING_PODS=$(kubectl get pods -n $NAMESPACE --no-headers 2>/dev/null | grep -c "Running" || echo "0")
READY_PODS=$(kubectl get pods -n $NAMESPACE --no-headers 2>/dev/null | awk '{split($2,a,"/"); if(a[1]==a[2]) count++} END{print count+0}')

echo -e "Namespace:     ${GREEN}$NAMESPACE${NC}"
echo -e "Total Pods:    $TOTAL_PODS"
echo -e "Running Pods:  $RUNNING_PODS"
echo -e "Ready Pods:    $READY_PODS"

if [ "$READY_PODS" = "$TOTAL_PODS" ] && [ "$TOTAL_PODS" -gt 0 ]; then
    echo -e "Status:        ${GREEN}✓ All systems operational${NC}"
elif [ "$RUNNING_PODS" -gt 0 ]; then
    echo -e "Status:        ${YELLOW}⚠ Some pods not ready${NC}"
else
    echo -e "Status:        ${RED}✗ System issues detected${NC}"
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""
echo "For detailed logs, use:"
echo "  kubectl logs -n $NAMESPACE <pod-name>"
echo ""
echo "For real-time monitoring, use:"
echo "  watch kubectl top pods -n $NAMESPACE"
echo ""
echo "For interactive monitoring, install k9s:"
echo "  brew install derailed/k9s/k9s"
echo ""
