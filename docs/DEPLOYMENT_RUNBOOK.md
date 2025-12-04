# Deployment Runbook

## Pre-Deployment Checklist

- [ ] All tests passing locally (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] Linting passes (`npm run lint`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] Code reviewed and approved
- [ ] Database migrations reviewed
- [ ] Environment variables configured
- [ ] Security scan passed
- [ ] Performance budget met

## Deployment Process

### 1. Pre-Deployment (T-30 minutes)

#### Notify Team
```
📢 Deployment starting in 30 minutes
Version: v1.2.3
Expected downtime: None
Rollback plan: Ready
```

#### Database Backup
```bash
# Create pre-deployment backup
./scripts/backup-database.sh
```

#### Verify Environment
```bash
# Check all required secrets are set
./scripts/check-env-vars.sh
```

### 2. Deploy Database Migrations (T-10 minutes)

```bash
# Run migrations
npm run migrate:production

# Verify migrations
npm run migrate:status
```

**⚠️ STOP if migrations fail**

### 3. Deploy Application (T-0)

#### Via GitHub (Automatic CI/CD)
```bash
# Tag release
git tag -a v1.2.3 -m "Release v1.2.3"
git push origin v1.2.3

# Or merge to main
git checkout main
git merge release/v1.2.3
git push origin main
```

#### Via Command Line (Manual)
```bash
# Build and deploy to Cloud Run
gcloud run deploy vintstreet \
  --image gcr.io/PROJECT_ID/vintstreet:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="$(cat .env.production)"
```

### 4. Post-Deployment Verification (T+5 minutes)

#### Smoke Tests
```bash
# Health check
curl https://your-app.run.app/health

# Auth endpoint
curl https://your-app.run.app/api/auth/status

# Payment endpoint
curl https://your-app.run.app/api/stripe/health
```

#### Monitor Logs
```bash
# View recent logs
gcloud run services logs read vintstreet \
  --region=us-central1 \
  --limit=50

# Watch for errors
gcloud run services logs tail vintstreet \
  --region=us-central1
```

#### Check Metrics
- [ ] Error rate < 1%
- [ ] Response time < 500ms (p95)
- [ ] Success rate > 99%
- [ ] No increase in 5xx errors

### 5. Notify Team (T+10 minutes)

```
✅ Deployment Complete
Version: v1.2.3
Status: SUCCESS
Metrics: All green
Issues: None
```

## Rollback Procedure

If issues detected, rollback immediately:

### Quick Rollback (< 5 minutes)

```bash
# Rollback to previous revision
gcloud run services update-traffic vintstreet \
  --to-revisions=PREVIOUS_REVISION=100 \
  --region=us-central1

# Verify rollback
curl https://your-app.run.app/health
```

### Database Rollback

```bash
# Revert migrations
npm run migrate:rollback

# Or restore from backup
./scripts/restore-database.sh backup_TIMESTAMP.sql
```

### Notify Team

```
🔄 ROLLBACK Initiated
Reason: [Describe issue]
Status: In progress
ETA: 5 minutes
```

## Feature Flags

Use feature flags for risky changes:

```typescript
// Enable new feature gradually
if (featureFlags.newCheckoutFlow && Math.random() < 0.1) {
  return newCheckout();
}
return oldCheckout();
```

Toggle via database:
```sql
UPDATE feature_flags 
SET enabled = true, 
    rollout_percentage = 10 
WHERE name = 'new_checkout_flow';
```

## Deployment Windows

### Recommended Windows
- **Best:** Tuesday-Thursday, 10:00-14:00 UTC
- **Good:** Monday-Wednesday, 08:00-16:00 UTC
- **Avoid:** Friday afternoons, weekends, holidays

### Blackout Periods
- No deployments during:
  - Black Friday / Cyber Monday
  - Major sales events
  - Known high-traffic periods

## Emergency Hotfix Process

For critical production issues:

1. Create hotfix branch from main
2. Fix issue
3. Test thoroughly
4. Deploy directly (skip normal release process)
5. Follow up with proper release

```bash
git checkout main
git pull
git checkout -b hotfix/critical-fix
# Make fix
git commit -m "hotfix: Fix critical issue"
git push origin hotfix/critical-fix
# Deploy immediately
```

## Database Migration Guidelines

### Safe Migrations
- Add new columns (with defaults)
- Add new tables
- Add indexes (CONCURRENTLY)
- Rename columns (with aliasing)

### Risky Migrations
- Drop columns
- Change column types
- Drop tables
- Remove indexes

### Migration Checklist
- [ ] Tested on production-like data
- [ ] Has rollback script
- [ ] Doesn't lock tables for >1 second
- [ ] Uses transactions where appropriate
- [ ] Includes indexes for new queries

## Monitoring During Deployment

### Key Metrics to Watch

1. **Error Rates**
   - Target: < 1%
   - Alert: > 2%

2. **Response Times**
   - Target: < 300ms (p50)
   - Target: < 500ms (p95)
   - Alert: > 1000ms (p95)

3. **Success Rate**
   - Target: > 99%
   - Alert: < 98%

4. **Database**
   - Connection pool usage
   - Query performance
   - Replication lag

### Dashboards

- **Cloud Run:** https://console.cloud.google.com/run
- **Supabase:** https://supabase.com/dashboard
- **Error Tracking:** https://sentry.io
- **Logs:** Cloud Logging

## Common Issues and Solutions

### Issue: High Error Rate After Deployment

**Diagnosis:**
```bash
# Check error logs
gcloud run services logs read vintstreet --region=us-central1 | grep ERROR
```

**Solution:**
- Rollback if > 5% error rate
- Check for missing environment variables
- Verify database migrations completed
- Check for breaking API changes

### Issue: Slow Response Times

**Diagnosis:**
```bash
# Check slow queries
SELECT * FROM pg_stat_statements 
WHERE mean_exec_time > 1000
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**Solution:**
- Check for missing indexes
- Verify cache is working
- Check for N+1 queries
- Review recent code changes

### Issue: Database Connection Errors

**Diagnosis:**
```bash
# Check connection pool
SELECT count(*) FROM pg_stat_activity;
```

**Solution:**
- Increase connection pool size
- Check for connection leaks
- Verify database credentials
- Check network connectivity

## Post-Deployment Tasks

### Immediate (within 1 hour)
- [ ] Monitor error rates
- [ ] Check user feedback channels
- [ ] Verify critical user flows
- [ ] Update deployment log

### Within 24 hours
- [ ] Review performance metrics
- [ ] Check for new errors in Sentry
- [ ] Review user analytics
- [ ] Document any issues

### Within 1 week
- [ ] Conduct deployment retrospective
- [ ] Update runbook with learnings
- [ ] Clean up feature flags
- [ ] Archive old releases

## Deployment Log Template

```markdown
## Deployment: v1.2.3

**Date:** 2024-01-01
**Deployed By:** Engineer Name
**Duration:** 15 minutes
**Downtime:** 0 minutes

### Changes
- Feature: New checkout flow
- Fix: Payment processing bug
- Improvement: Faster search

### Migrations
- Added index on orders.created_at
- New table: feature_flags

### Rollback Plan
- Revert to v1.2.2
- Rollback migration: 20240101_add_feature_flags

### Results
- ✅ Deployment successful
- ✅ All smoke tests passed
- ✅ Error rate: 0.1%
- ✅ Response time: 250ms (p95)

### Issues
- None

### Notes
- Went smoothly
- No user reports
```

## Emergency Contacts

| Role | Name | Contact |
|------|------|---------|
| On-Call Engineer | Rotation | PagerDuty |
| Tech Lead | [Name] | [Phone/Email] |
| DevOps | [Name] | [Phone/Email] |
| Database Admin | [Name] | [Phone/Email] |

## Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Supabase Migrations](https://supabase.com/docs/guides/database/migrations)
- [Deployment Best Practices](https://cloud.google.com/architecture/devops/devops-tech-deployment-automation)

