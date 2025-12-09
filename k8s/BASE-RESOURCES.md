# Kubernetes Base Resources Reference

## Overview

This document describes the base Kubernetes resources for Educard deployment.

## Resources Created

### Namespace: educard-prod

The `educard-prod` namespace isolates all Educard application resources.

**Manifest:** `k8s/namespace.yaml`

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: educard-prod
  labels:
    app: educard
    environment: production
```

**Purpose:**
- Isolates application resources from other workloads
- Provides resource quotas and limits boundary
- Enables RBAC policies per namespace
- Organizes related resources together

### ConfigMap: educard-config

The ConfigMap stores non-sensitive application configuration.

**Manifest:** `k8s/configmap.yaml`

**Configuration Items:**
- `NODE_ENV`: Application environment (production)
- `PORT`: Application port (3000)
- `DB_HOST`: PostgreSQL service name (postgres-service)
- `DB_PORT`: PostgreSQL port (5432)
- `DB_NAME`: Database name (educard_prod)
- `APP_URL`: Application URL (update with your domain)
- `SESSION_MAX_AGE`: Session duration in ms (24 hours)

**Usage in Pods:**

```yaml
# Option 1: Mount all as environment variables
envFrom:
  - configMapRef:
      name: educard-config

# Option 2: Select specific keys
env:
  - name: NODE_ENV
    valueFrom:
      configMapKeyRef:
        name: educard-config
        key: NODE_ENV
  - name: PORT
    valueFrom:
      configMapKeyRef:
        name: educard-config
        key: PORT

# Option 3: Mount as volume
volumes:
  - name: config
    configMap:
      name: educard-config
```

## Management Commands

### View Resources

```bash
# List all resources in namespace
kubectl get all -n educard-prod

# View namespace details
kubectl describe namespace educard-prod

# View ConfigMap
kubectl get configmap educard-config -n educard-prod -o yaml

# View ConfigMap data
kubectl describe configmap educard-config -n educard-prod
```

### Update ConfigMap

```bash
# Edit ConfigMap directly
kubectl edit configmap educard-config -n educard-prod

# Or update from file
kubectl apply -f k8s/configmap.yaml
```

### Delete Resources

```bash
# Delete ConfigMap only
kubectl delete configmap educard-config -n educard-prod

# Delete entire namespace (WARNING: deletes all resources)
kubectl delete namespace educard-prod
```

## Helper Scripts

### apply-base-resources.sh

Automated script to apply namespace and ConfigMap:

```bash
./k8s/apply-base-resources.sh
```

**What it does:**
1. Checks kubectl availability
2. Verifies cluster connection
3. Applies namespace.yaml
4. Applies configmap.yaml
5. Verifies resources created

## Best Practices

### ConfigMap Usage

✅ **DO:**
- Store non-sensitive configuration
- Use for environment-specific settings
- Update via kubectl apply for changes
- Document all configuration keys
- Use meaningful names for data keys

❌ **DON'T:**
- Store passwords or secrets (use Secrets instead)
- Store large files (use volumes instead)
- Hard-code values that should be secrets
- Mix sensitive and non-sensitive data

### Namespace Organization

✅ **DO:**
- Use consistent naming conventions
- Add descriptive labels
- Document namespace purpose
- Set resource quotas for production
- Use RBAC for access control

❌ **DON'T:**
- Mix different environments in same namespace
- Use default namespace for applications
- Create too many namespaces unnecessarily
- Forget to document namespace ownership

## Updating Configuration

### Change Application URL

```bash
kubectl edit configmap educard-config -n educard-prod
# Update APP_URL value
# Save and exit

# Or update the file and apply:
# Edit k8s/configmap.yaml
kubectl apply -f k8s/configmap.yaml

# Restart pods to pick up changes
kubectl rollout restart deployment educard-app -n educard-prod
```

### Add New Configuration

1. Edit `k8s/configmap.yaml`
2. Add new data item
3. Apply changes: `kubectl apply -f k8s/configmap.yaml`
4. Update deployment to use new config
5. Restart pods if needed

## Verification Checklist

- [ ] Namespace `educard-prod` exists
- [ ] Namespace has correct labels
- [ ] ConfigMap `educard-config` exists
- [ ] ConfigMap has 7 data items
- [ ] All configuration values are correct
- [ ] No sensitive data in ConfigMap
- [ ] Resources visible via kubectl

## Next Steps

After base resources are created:

1. **Task 5.5:** Create Kubernetes Secrets for sensitive data
2. **Task 5.6:** Deploy PostgreSQL database
3. **Task 5.7:** Deploy Educard application
4. Configure ingress and SSL

## Troubleshooting

### ConfigMap Not Found

```bash
# Check if it exists
kubectl get configmap -n educard-prod

# Re-apply if missing
kubectl apply -f k8s/configmap.yaml
```

### Namespace Stuck in Terminating

```bash
# View namespace status
kubectl get namespace educard-prod -o yaml

# Force delete (careful!)
kubectl delete namespace educard-prod --force --grace-period=0
```

### Changes Not Reflected in Pods

ConfigMap changes don't automatically restart pods. You need to:

```bash
# Restart deployment
kubectl rollout restart deployment educard-app -n educard-prod

# Or delete pods (they'll be recreated)
kubectl delete pod -l app=educard -n educard-prod
```

## Reference

- [Kubernetes Namespaces](https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/)
- [Kubernetes ConfigMaps](https://kubernetes.io/docs/concepts/configuration/configmap/)
- [Configure Pods with ConfigMaps](https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/)
