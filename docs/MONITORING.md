# Kubernetes Cluster Monitoring Guide

## Overview

This guide covers monitoring for the Educard application deployed on K3s, including resource metrics, logs, events, and operational commands for maintaining cluster health.

## Table of Contents

1. [Metrics Server](#metrics-server)
2. [Resource Monitoring](#resource-monitoring)
3. [Log Management](#log-management)
4. [Event Monitoring](#event-monitoring)
5. [Health Checks](#health-checks)
6. [Troubleshooting](#troubleshooting)
7. [Best Practices](#best-practices)
8. [Advanced Monitoring](#advanced-monitoring)

## Metrics Server

### Overview

Metrics Server is a cluster-wide aggregator of resource usage data. It collects metrics from the Kubelet running on each node and exposes them via the Kubernetes API.

**Status:** Pre-installed with K3s ✅

### Verify Metrics Server

```bash
# Check deployment status
kubectl get deployment metrics-server -n kube-system

# Check pod status
kubectl get pods -n kube-system -l k8s-app=metrics-server

# View logs
kubectl logs -n kube-system -l k8s-app=metrics-server
```

Expected output:
```
NAME             READY   UP-TO-DATE   AVAILABLE   AGE
metrics-server   1/1     1            1           21h
```

### Test Metrics Collection

```bash
# Node metrics
kubectl top nodes

# All pods
kubectl top pods --all-namespaces

# Specific namespace
kubectl top pods -n educard-prod
```

## Resource Monitoring

### Node Resources

**View node resource usage:**
```bash
kubectl top nodes
```

Output:
```
NAME          CPU(cores)   CPU(%)   MEMORY(bytes)   MEMORY(%)   
educard-k3s   40m          2%       1982Mi          52%
```

**Detailed node information:**
```bash
# Basic info
kubectl get nodes -o wide

# Resource capacity
kubectl describe node educard-k3s | grep -A 5 "Allocated resources"

# Node conditions
kubectl get nodes -o custom-columns=NAME:.metadata.name,STATUS:.status.conditions[-1].type,REASON:.status.conditions[-1].reason
```

### Pod Resources

**View pod resource usage:**
```bash
# All pods in namespace
kubectl top pods -n educard-prod

# With container breakdown
kubectl top pods -n educard-prod --containers

# Sorted by CPU
kubectl top pods -n educard-prod --sort-by=cpu

# Sorted by memory
kubectl top pods -n educard-prod --sort-by=memory
```

Example output:
```
NAME                           CPU(cores)   MEMORY(bytes)   
educard-app-68c8f489dd-hkqjj   1m           83Mi            
educard-app-68c8f489dd-kvxxh   1m           68Mi            
postgres-0                     3m           24Mi
```

**Pod resource limits and requests:**
```bash
# View configured limits
kubectl describe pod <pod-name> -n educard-prod | grep -A 5 "Limits:"

# All pods resource configuration
kubectl get pods -n educard-prod -o custom-columns=NAME:.metadata.name,CPU-REQUEST:.spec.containers[0].resources.requests.cpu,MEM-REQUEST:.spec.containers[0].resources.requests.memory,CPU-LIMIT:.spec.containers[0].resources.limits.cpu,MEM-LIMIT:.spec.containers[0].resources.limits.memory
```

### Storage Resources

**PVC usage:**
```bash
# List PVCs
kubectl get pvc -n educard-prod

# Check disk usage
kubectl exec -n educard-prod postgres-0 -- df -h

# PostgreSQL data volume
kubectl exec -n educard-prod postgres-0 -- df -h /var/lib/postgresql/data

# Backup volume (if accessible)
kubectl exec -n educard-prod postgres-0 -- df -h /backups 2>/dev/null || echo "Backup volume not mounted on postgres pod"
```

**Persistent Volume details:**
```bash
# List PVs
kubectl get pv

# PVC details
kubectl describe pvc <pvc-name> -n educard-prod
```

## Log Management

### Application Logs

**View application logs:**
```bash
# All application pods
kubectl logs -n educard-prod -l app=educard

# Specific pod
kubectl logs -n educard-prod <pod-name>

# Follow logs (live tail)
kubectl logs -n educard-prod -l app=educard -f

# Last 100 lines
kubectl logs -n educard-prod -l app=educard --tail=100

# Since timestamp
kubectl logs -n educard-prod -l app=educard --since=1h

# Previous pod instance (after crash)
kubectl logs -n educard-prod <pod-name> --previous
```

**Container-specific logs:**
```bash
# Specify container (if pod has multiple)
kubectl logs -n educard-prod <pod-name> -c <container-name>

# All containers in pod
kubectl logs -n educard-prod <pod-name> --all-containers=true
```

**Save logs to file:**
```bash
# Export to file
kubectl logs -n educard-prod -l app=educard > app-logs.txt

# With timestamps
kubectl logs -n educard-prod -l app=educard --timestamps > app-logs-with-time.txt
```

### Database Logs

**PostgreSQL logs:**
```bash
# View PostgreSQL logs
kubectl logs -n educard-prod postgres-0

# Follow PostgreSQL logs
kubectl logs -n educard-prod postgres-0 -f

# Last 50 lines
kubectl logs -n educard-prod postgres-0 --tail=50
```

**Database queries and connections:**
```bash
# Connect to PostgreSQL and check activity
kubectl exec -it -n educard-prod postgres-0 -- psql -U educard_user -d educard_prod -c "SELECT pid, usename, application_name, client_addr, state, query FROM pg_stat_activity WHERE state != 'idle';"

# Connection count
kubectl exec -it -n educard-prod postgres-0 -- psql -U educard_user -d educard_prod -c "SELECT count(*) as connections FROM pg_stat_activity;"

# Database size
kubectl exec -it -n educard-prod postgres-0 -- psql -U educard_user -d educard_prod -c "SELECT pg_size_pretty(pg_database_size('educard_prod'));"
```

### System Logs

**K3s logs:**
```bash
# On the node (via vagrant)
vagrant ssh -c "sudo journalctl -u k3s -f"

# Last 100 lines
vagrant ssh -c "sudo journalctl -u k3s -n 100"

# Since time
vagrant ssh -c "sudo journalctl -u k3s --since '1 hour ago'"
```

**kubelet logs:**
```bash
vagrant ssh -c "sudo journalctl -u k3s-agent -f"
```

## Event Monitoring

### Cluster Events

**View recent events:**
```bash
# All namespaces
kubectl get events --all-namespaces --sort-by='.lastTimestamp'

# Specific namespace
kubectl get events -n educard-prod --sort-by='.lastTimestamp'

# Last 20 events
kubectl get events -n educard-prod --sort-by='.lastTimestamp' | tail -20

# Watch events in real-time
kubectl get events -n educard-prod --watch
```

**Filter events by type:**
```bash
# Warning events only
kubectl get events -n educard-prod --field-selector type=Warning

# Normal events only
kubectl get events -n educard-prod --field-selector type=Normal

# Events for specific object
kubectl get events -n educard-prod --field-selector involvedObject.name=<pod-name>
```

### Pod Events

**Events for specific pods:**
```bash
# Describe pod (includes events)
kubectl describe pod <pod-name> -n educard-prod

# Just the events section
kubectl describe pod <pod-name> -n educard-prod | grep -A 10 "Events:"
```

## Health Checks

### Application Health

**Pod status:**
```bash
# List pods
kubectl get pods -n educard-prod

# Watch pods
kubectl get pods -n educard-prod -w

# Detailed status
kubectl get pods -n educard-prod -o wide

# Ready status
kubectl get pods -n educard-prod -o custom-columns=NAME:.metadata.name,READY:.status.conditions[?(@.type==\"Ready\")].status,STATUS:.status.phase
```

**Health endpoints:**
```bash
# Test application health endpoint
kubectl exec -it -n educard-prod <app-pod> -- wget -qO- http://localhost:3000/health

# Or use port-forward
kubectl port-forward -n educard-prod svc/educard-service 8080:80
curl http://localhost:8080/health
```

**Readiness and liveness probes:**
```bash
# Check probe configuration
kubectl get pod <pod-name> -n educard-prod -o jsonpath='{.spec.containers[0].livenessProbe}'
kubectl get pod <pod-name> -n educard-prod -o jsonpath='{.spec.containers[0].readinessProbe}'

# Probe status in conditions
kubectl describe pod <pod-name> -n educard-prod | grep -E "Liveness|Readiness"
```

### Service Health

**Service endpoints:**
```bash
# Check service
kubectl get svc -n educard-prod

# Check endpoints (should list pod IPs)
kubectl get endpoints -n educard-prod educard-service

# Describe service
kubectl describe svc educard-service -n educard-prod
```

**Test service connectivity:**
```bash
# From another pod
kubectl run test-pod --rm -it --image=busybox --restart=Never -- wget -qO- http://educard-service.educard-prod.svc.cluster.local/health

# Port forward and test locally
kubectl port-forward -n educard-prod svc/educard-service 8080:80
curl http://localhost:8080/health
```

### Database Health

**PostgreSQL status:**
```bash
# Check pod
kubectl get pod postgres-0 -n educard-prod

# Test connection
kubectl exec -it -n educard-prod postgres-0 -- psql -U educard_user -d educard_prod -c "SELECT 1"

# Database stats
kubectl exec -it -n educard-prod postgres-0 -- psql -U educard_user -d educard_prod -c "
  SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
  FROM pg_tables 
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"
```

## Troubleshooting

### High CPU Usage

**Identify high CPU pods:**
```bash
# Sort by CPU
kubectl top pods -n educard-prod --sort-by=cpu

# Node CPU usage
kubectl top nodes
```

**Investigate:**
```bash
# Check pod logs for errors
kubectl logs -n educard-prod <high-cpu-pod> --tail=100

# Check events
kubectl get events -n educard-prod --field-selector involvedObject.name=<pod-name>

# Resource limits
kubectl describe pod <pod-name> -n educard-prod | grep -A 5 "Limits:"
```

**Solutions:**
- Increase resource limits if needed
- Check for infinite loops or performance issues
- Scale horizontally (add replicas)
- Optimize application code

### High Memory Usage

**Identify memory-intensive pods:**
```bash
# Sort by memory
kubectl top pods -n educard-prod --sort-by=memory

# Check if pods are OOMKilled
kubectl get pods -n educard-prod -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.containerStatuses[0].lastState.terminated.reason}{"\n"}{end}'
```

**Investigate:**
```bash
# Memory limits
kubectl describe pod <pod-name> -n educard-prod | grep -E "memory|Memory"

# Check if pod was restarted due to OOM
kubectl describe pod <pod-name> -n educard-prod | grep -i "oom"
```

**Solutions:**
- Increase memory limits
- Check for memory leaks
- Optimize queries/caching
- Add more replicas to distribute load

### Pod Crashes

**Check crash status:**
```bash
# List pods with restart count
kubectl get pods -n educard-prod

# View previous logs
kubectl logs -n educard-prod <pod-name> --previous

# Check events
kubectl describe pod <pod-name> -n educard-prod | grep -A 10 Events:
```

**Common crash reasons:**
```bash
# OOMKilled
kubectl get pods -n educard-prod -o jsonpath='{.items[*].status.containerStatuses[*].lastState.terminated.reason}'

# Exit code
kubectl get pods -n educard-prod -o jsonpath='{.items[*].status.containerStatuses[*].lastState.terminated.exitCode}'
```

**Solutions:**
- Check application logs
- Verify environment variables
- Check database connectivity
- Increase resource limits
- Fix application bugs

### Service Not Accessible

**Debug service issues:**
```bash
# Check service exists
kubectl get svc -n educard-prod educard-service

# Check endpoints (should have IPs)
kubectl get endpoints -n educard-prod educard-service

# Check if pods are ready
kubectl get pods -n educard-prod -l app=educard

# Test from within cluster
kubectl run test --rm -it --image=busybox --restart=Never -- wget -qO- http://educard-service.educard-prod:80/health
```

**Check selectors:**
```bash
# Service selector
kubectl get svc educard-service -n educard-prod -o jsonpath='{.spec.selector}'

# Pod labels
kubectl get pods -n educard-prod --show-labels
```

### Disk Space Issues

**Check disk usage:**
```bash
# Node disk space
kubectl get nodes -o custom-columns=NAME:.metadata.name,DISK:.status.allocatable.ephemeral-storage

# Via SSH
vagrant ssh -c "df -h"

# PVC usage
kubectl get pvc -n educard-prod

# Check from pod
kubectl exec -n educard-prod postgres-0 -- df -h
```

**Clean up:**
```bash
# Remove old backup jobs
kubectl delete job -n educard-prod -l app=postgres-backup --field-selector status.successful=1

# Clean old completed pods
kubectl delete pods -n educard-prod --field-selector status.phase=Succeeded

# Clean old backups (via backup cleanup script)
kubectl exec -n educard-prod postgres-0 -- find /backups -name "backup-*.sql.gz" -type f -mtime +30 -delete
```

## Best Practices

### Regular Monitoring

**Daily checks:**
```bash
# Quick health check script
./k8s/check-metrics.sh

# Or manually:
kubectl get pods -n educard-prod
kubectl top pods -n educard-prod
kubectl get events -n educard-prod --field-selector type=Warning --sort-by='.lastTimestamp' | tail -10
```

**Weekly reviews:**
- Review resource trends
- Check for memory leaks (increasing memory over time)
- Analyze error logs
- Review backup success rate
- Check disk usage trends

**Monthly tasks:**
- Review and adjust resource limits
- Analyze performance bottlenecks
- Update monitoring dashboards
- Test disaster recovery procedures

### Resource Management

**Right-sizing:**
```bash
# Compare actual vs limits
kubectl top pods -n educard-prod --containers
kubectl describe pod <pod-name> -n educard-prod | grep -A 5 "Limits:"

# Adjust if needed (edit deployment)
kubectl edit deployment educard-app -n educard-prod
```

**Guidelines:**
- Set requests = typical usage
- Set limits = 1.5-2x requests
- Leave 20% node capacity for system pods
- Monitor and adjust based on actual usage

### Log Retention

**K3s logs:**
- Default: System journal retention
- Configure: `/etc/systemd/journald.conf`
- Limit: `SystemMaxUse=1G`

**Application logs:**
- Stored in container (ephemeral)
- Lost on pod restart
- Use log aggregation for persistence (ELK, Loki)

**Backup logs:**
- Captured in CronJob logs
- Auto-deleted after TTL (24 hours)
- Download important logs before deletion

### Alerting

**Set up alerts for:**
- Pod restarts > 3 in 1 hour
- CPU usage > 80% for 5 minutes
- Memory usage > 90%
- Disk usage > 80%
- Backup failures
- Service endpoint count = 0
- Certificate expiring < 7 days

**Tools:**
- Prometheus + Alertmanager
- Grafana alerts
- Cloud provider monitoring
- Custom scripts with notifications

## Advanced Monitoring

### Prometheus + Grafana (Optional)

**Install Prometheus Operator:**
```bash
kubectl apply -f https://raw.githubusercontent.com/prometheus-operator/prometheus-operator/main/bundle.yaml
```

**Install kube-prometheus-stack:**
```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring --create-namespace
```

**Access Grafana:**
```bash
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
# Open http://localhost:3000
# Default: admin/prom-operator
```

### K9s - Terminal UI

**Install K9s:**
```bash
# macOS
brew install derailed/k9s/k9s

# Or download from: https://github.com/derailed/k9s/releases
```

**Usage:**
```bash
# Set kubeconfig
export KUBECONFIG=/Users/tohyifan/Desktop/Educard/k8s/kubeconfig-vagrant-local

# Launch k9s
k9s

# Commands:
# :pods      - View pods
# :svc       - View services
# :deploy    - View deployments
# :events    - View events
# :top       - Resource usage
```

### Kubernetes Dashboard (Optional)

**Install:**
```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.7.0/aio/deploy/recommended.yaml
```

**Access:**
```bash
# Create service account
kubectl create serviceaccount dashboard-admin -n kubernetes-dashboard
kubectl create clusterrolebinding dashboard-admin --clusterrole=cluster-admin --serviceaccount=kubernetes-dashboard:dashboard-admin

# Get token
kubectl -n kubernetes-dashboard create token dashboard-admin

# Port forward
kubectl port-forward -n kubernetes-dashboard svc/kubernetes-dashboard 8443:443

# Open https://localhost:8443
```

## Quick Reference

### Essential Commands

```bash
# Cluster status
kubectl cluster-info
kubectl get nodes

# Pod status
kubectl get pods -n educard-prod
kubectl get pods -n educard-prod -o wide

# Resource usage
kubectl top nodes
kubectl top pods -n educard-prod

# Logs
kubectl logs -n educard-prod -l app=educard --tail=100
kubectl logs -n educard-prod postgres-0 --tail=50

# Events
kubectl get events -n educard-prod --sort-by='.lastTimestamp' | tail -20

# Health checks
kubectl get pods -n educard-prod
kubectl get svc -n educard-prod
kubectl get endpoints -n educard-prod

# Debugging
kubectl describe pod <pod-name> -n educard-prod
kubectl exec -it -n educard-prod <pod-name> -- /bin/sh
```

### Monitoring Script

Create a quick monitoring script: `k8s/check-metrics.sh`

```bash
#!/bin/bash
export KUBECONFIG=/Users/tohyifan/Desktop/Educard/k8s/kubeconfig-vagrant-local

echo "=== Node Resources ==="
kubectl top nodes

echo -e "\n=== Pod Status ==="
kubectl get pods -n educard-prod

echo -e "\n=== Pod Resources ==="
kubectl top pods -n educard-prod

echo -e "\n=== Recent Warnings ==="
kubectl get events -n educard-prod --field-selector type=Warning --sort-by='.lastTimestamp' | tail -5
```

## Summary

✅ **Monitoring Checklist:**

- [x] Metrics server installed and running
- [x] Node metrics accessible (`kubectl top nodes`)
- [x] Pod metrics accessible (`kubectl top pods`)
- [x] Log access configured
- [x] Event monitoring enabled
- [x] Health check procedures documented
- [x] Troubleshooting guide created

**Current Status:**
- Node: educard-k3s (2% CPU, 52% Memory)
- App Pods: 2 running (1m CPU each, 68-83 Mi)
- Database: postgres-0 (3m CPU, 24 Mi)
- All systems operational ✅

**Resources:**
- [Kubernetes Monitoring](https://kubernetes.io/docs/tasks/debug/)
- [Metrics Server](https://github.com/kubernetes-sigs/metrics-server)
- [K9s](https://k9scli.io/)
- [Prometheus](https://prometheus.io/)
