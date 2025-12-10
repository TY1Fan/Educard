# GitHub Actions CI/CD Workflows

This directory contains automated workflows for the Educard project.

## Workflows Overview

### 1. **CI/CD Pipeline** (`ci-cd.yml`)
Main pipeline that runs on every push and pull request.

**Triggers:**
- Push to `main` or `production` branches
- Pull requests to `main` or `production`

**Jobs:**
1. **Test** - Runs unit and integration tests with PostgreSQL
2. **Security** - Performs security audit and Snyk scanning
3. **Build** - Builds and pushes Docker image to Docker Hub
4. **Deploy Production** - Deploys to production (production branch)
5. **Performance Test** - Runs k6 load tests (scheduled/manual)

### 2. **Pull Request Checks** (`pr-checks.yml`)
Lightweight checks for pull requests.

**Triggers:**
- Pull requests to any branch

**Checks:**
- Code formatting
- Linting
- Unit tests
- Security vulnerabilities
- Build verification

### 3. **Manual Deployment** (`manual-deploy.yml`)
Manual deployment trigger for emergency deployments.

**Triggers:**
- Manual workflow dispatch from GitHub Actions UI

**Options:**
- Specify Docker image tag to deploy

## Setup Instructions

### Step 1: Add Required Secrets

Go to GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:

**Docker Hub:**
```
DOCKER_USERNAME=your-dockerhub-username
DOCKER_PASSWORD=your-dockerhub-password
```

**Kubernetes:**
```
KUBE_CONFIG_PRODUCTION=<base64-encoded-kubeconfig>
```

**Optional - Security Scanning:**
```
SNYK_TOKEN=your-snyk-api-token
CODECOV_TOKEN=your-codecov-token
```

### Step 2: Encode Kubeconfig

To create the base64-encoded kubeconfig:

```bash
# For production
cat ~/.kube/config | base64 | pbcopy  # macOS
cat ~/.kube/config | base64 -w 0      # Linux

# Paste into KUBE_CONFIG_PRODUCTION secret
```

### Step 3: Update Configuration

Edit the workflow files if needed:

**Update Docker image name:**
```yaml
env:
  DOCKER_IMAGE: your-dockerhub-username/educard
```

**Update URLs:**
```yaml
url: https://your-domain.com  # Production
url: https://staging.your-domain.com  # Staging
```

**Update namespace names:**
```yaml
-n educard-prod    # Your production namespace
-n educard-staging # Your staging namespace
```

## Usage

### Automatic Deployment

**To Production:**
1. Merge code to `production` branch
2. Workflow automatically:
   - Runs tests
   - Builds Docker image
   - Deploys to production
   - Runs smoke tests
   - Notifies on failure

### Manual Deployment

1. Go to: Actions → Manual Deployment → Run workflow
2. Enter image tag (default: latest)
3. Click "Run workflow"

### Monitoring Workflow Status

**View workflow runs:**
```
https://github.com/TY1Fan/Educard/actions
```

**Check deployment status:**
```bash
kubectl rollout status deployment/educard-app -n educard-prod
kubectl get pods -n educard-prod
```

## Workflow Behavior

### On Pull Request:
✅ Run tests  
✅ Run linter  
✅ Security scan  
✅ Code formatting check  
❌ No deployment  

### On Push to `main`:
✅ Run tests  
✅ Build Docker image  
❌ No deployment  

### On Push to `production`:
✅ Run tests  
✅ Build Docker image  
✅ Deploy to production  
✅ Run smoke tests  
✅ Automatic rollback on failure  

## Docker Image Tags

Images are tagged automatically:

- `latest` - Latest from main/production branch
- `production` - Production branch
- `main` - Main branch
- `sha-<commit>` - Specific commit
- `v1.0.0` - Semantic version tags

**Example:**
```
tyifan/educard:latest
tyifan/educard:production
tyifan/educard:main
tyifan/educard:sha-abc1234
tyifan/educard:v1.0.0
```

## Troubleshooting

### Workflow Fails on Test Step

**Check:**
- Database connection settings
- Environment variables
- Test database schema

**Fix:**
```bash
# Run tests locally first
npm test
```

### Deployment Fails

**Check:**
- Kubernetes credentials are valid
- Namespace exists
- Docker image was built successfully
- Resource quotas not exceeded

**View logs:**
```bash
kubectl logs -f deployment/educard-app -n educard-prod
```

### Rollback Failed Deployment

**Manual rollback:**
```bash
kubectl rollout undo deployment/educard-app -n educard-prod
```

**Deploy specific version:**
```bash
kubectl set image deployment/educard-app \
  educard=tyifan/educard:v1.0.0 \
  -n educard-prod
```

### Security Scan Fails

**Check npm vulnerabilities:**
```bash
npm audit
npm audit fix
```

**Update dependencies:**
```bash
npm update
npm audit
```

## Performance Testing

Scheduled performance tests run automatically or can be triggered manually.

**Manual trigger:**
1. Go to: Actions → CI/CD Pipeline
2. Click "Run workflow"
3. Tests will run against production URL

**View results:**
- Check workflow run logs
- Download performance-results artifact

## Best Practices

### Branch Strategy

```
main (stable) → production (live) → hotfix
          ↓
       develop (staging) → feature branches
```

### Commit Messages

Use conventional commits for better changelog:
```
feat: add user profile feature
fix: resolve login issue
chore: update dependencies
docs: update API documentation
```

### Environment Promotion

```
Feature Branch → PR → Develop → Staging → Production
     ↓            ↓      ↓         ↓          ↓
   Local       Tests  Auto Deploy Manual  Production
```

## Monitoring & Alerts

**Add Slack notifications** (optional):

```yaml
- name: Notify Slack
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

**Add Discord notifications** (optional):

```yaml
- name: Notify Discord
  uses: sarisia/actions-status-discord@v1
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}
```

## Resource Limits

**Workflow limits:**
- Max execution time: 6 hours
- Max concurrent jobs: 20
- Artifact retention: 90 days

**Optimize:**
- Use caching for dependencies
- Run tests in parallel
- Use matrix builds for multiple versions

## Security Considerations

✅ Never commit secrets to repository  
✅ Use GitHub Secrets for sensitive data  
✅ Rotate credentials regularly  
✅ Use least-privilege access for Kubernetes  
✅ Enable branch protection rules  
✅ Require PR reviews before merge  
✅ Enable CODEOWNERS file  

## Support

**Issues with workflows:**
1. Check workflow run logs
2. Review GitHub Actions documentation
3. Check Kubernetes cluster status
4. Verify all secrets are configured

**Additional Resources:**
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Kubernetes Deployment Guide](../docs/K3S_DEPLOYMENT.md)
- [Testing Documentation](../docs/TESTING_CHECKLIST.md)

---

**Status:** ✅ Ready to use  
**Last Updated:** December 10, 2024  
**Version:** 1.0.0
