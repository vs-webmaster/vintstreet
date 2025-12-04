# Incident Response Plan

## Incident Severity Levels

### P0 - Critical
- **Definition:** Complete service outage, data breach, security compromise
- **Examples:** Database down, payment processing stopped, credentials compromised
- **Response Time:** Immediate (< 5 minutes)
- **Escalation:** Notify all stakeholders immediately

### P1 - High
- **Definition:** Major feature broken, significant user impact
- **Examples:** Checkout broken, authentication failing, streams not working
- **Response Time:** < 30 minutes
- **Escalation:** Notify team lead and on-call engineer

### P2 - Medium
- **Definition:** Minor feature broken, limited user impact
- **Examples:** Search slow, images not loading, email delays
- **Response Time:** < 2 hours
- **Escalation:** Create ticket, assign to relevant team

### P3 - Low
- **Definition:** Cosmetic issues, no user impact
- **Examples:** UI glitches, typos, minor performance issues
- **Response Time:** Next business day
- **Escalation:** Add to backlog

## Response Procedures

### Step 1: Detection (0-5 min)
1. Alert received via monitoring system
2. Verify incident is real (not false positive)
3. Assess severity level
4. Create incident ticket

### Step 2: Initial Response (5-15 min)
1. Acknowledge incident
2. Notify relevant stakeholders
3. Begin investigation
4. Update status page (if public-facing)

### Step 3: Investigation (15-60 min)
1. Check logs in Supabase Dashboard
2. Review error tracking (Sentry)
3. Check Cloud Run metrics
4. Review recent deployments
5. Identify root cause

### Step 4: Mitigation (varies)
1. Implement immediate fix or workaround
2. Test fix in staging if possible
3. Deploy fix to production
4. Monitor for resolution

### Step 5: Resolution (varies)
1. Confirm incident is resolved
2. Update stakeholders
3. Update status page
4. Close incident ticket

### Step 6: Post-Mortem (24-48 hours after)
1. Schedule post-mortem meeting
2. Document timeline of events
3. Identify root cause
4. Create action items to prevent recurrence
5. Share learnings with team

## Escalation Paths

### P0 - Critical
1. Alert on-call engineer (via PagerDuty/phone)
2. Notify CTO/technical lead
3. Notify CEO if customer-facing
4. Notify PR team if security breach

### P1 - High
1. Alert on-call engineer
2. Notify team lead
3. Escalate to P0 if not resolved in 2 hours

### P2 - Medium
1. Assign to relevant team
2. Escalate to P1 if not resolved in 8 hours

### P3 - Low
1. Add to sprint backlog
2. No escalation needed

## Rollback Procedures

### Quick Rollback (for recent deployments)
```bash
# Via Google Cloud Console
gcloud run services update-traffic vintstreet --to-revisions=PREVIOUS_REVISION=100

# Or via GitHub (revert and redeploy)
git revert HEAD
git push origin main
```

### Database Rollback
```bash
# Restore from point-in-time
# Via Supabase Dashboard:
# Settings > Database > Point-in-time recovery
```

### Feature Flag Disable
```bash
# If using feature flags, disable problematic feature
# Via Supabase Dashboard or database:
UPDATE feature_flags SET enabled = false WHERE name = 'problematic_feature';
```

## Communication Templates

### Internal Alert (Slack/Teams)
```
🚨 [P0] VintStreet Incident

Status: INVESTIGATING
Impact: Payment processing down
Started: 2024-01-01 14:30 UTC
Incident Lead: @engineer

Updates:
14:30 - Incident detected
14:35 - Team investigating
```

### Status Page Update
```
[Investigating] Payment Processing Issues

We are currently investigating reports of payment processing failures. 
Our team is working to resolve this as quickly as possible.

Status: Investigating
Started: Jan 1, 2024 at 2:30pm UTC
Last Update: Jan 1, 2024 at 2:35pm UTC
```

### Customer Communication
```
Subject: Service Update - VintStreet

Dear VintStreet Users,

We experienced a brief service interruption today affecting payment processing. 
The issue has been resolved and all systems are now operating normally.

We sincerely apologize for any inconvenience this may have caused.

Timeline:
- Issue started: 2:30 PM UTC
- Issue resolved: 3:15 PM UTC
- Duration: 45 minutes

No customer data was compromised during this incident.

If you have any questions, please contact support@vintstreet.com

Thank you for your patience.
The VintStreet Team
```

## Post-Mortem Template

```markdown
# Post-Mortem: [Incident Title]

**Date:** YYYY-MM-DD
**Incident Lead:** Name
**Severity:** P0/P1/P2/P3
**Duration:** X hours Y minutes

## Summary

[Brief summary of what happened]

## Timeline

- HH:MM - Event 1
- HH:MM - Event 2
- HH:MM - Resolution

## Root Cause

[What caused the incident]

## Impact

- **Users Affected:** X users
- **Revenue Impact:** $X
- **Duration:** X hours
- **Services Affected:** List services

## Resolution

[How it was fixed]

## Action Items

1. [ ] Action 1 - Owner - Due date
2. [ ] Action 2 - Owner - Due date
3. [ ] Action 3 - Owner - Due date

## Lessons Learned

**What went well:**
- Point 1
- Point 2

**What could be improved:**
- Point 1
- Point 2

**Preventive measures:**
- Measure 1
- Measure 2
```

## Monitoring & Alerts

### Critical Alerts
- Payment processing failures (>1% error rate)
- Authentication failures (>5% error rate)
- Database connection failures
- API response time >500ms (p95)
- Error rate >1%

### Alert Channels
- **Slack:** #incidents channel
- **Email:** engineering@vintstreet.com
- **SMS:** On-call engineer
- **PagerDuty:** For P0/P1 incidents

## Key Contacts

| Role | Name | Contact |
|------|------|---------|
| CTO | [Name] | [Phone/Email] |
| Tech Lead | [Name] | [Phone/Email] |
| DevOps | [Name] | [Phone/Email] |
| On-Call | Rotation | [PagerDuty] |
| Supabase Support | Support | support@supabase.io |
| Stripe Support | Support | support@stripe.com |

## Tools & Access

- **Supabase Dashboard:** https://supabase.com/dashboard
- **Google Cloud Console:** https://console.cloud.google.com
- **Error Tracking:** https://sentry.io
- **Status Page:** https://status.vintstreet.com
- **Logs:** Cloud Run logs, Supabase logs
- **Runbooks:** /docs/runbooks/

## Testing Incident Response

Conduct quarterly incident response drills:
1. Simulate P0 incident
2. Test communication channels
3. Practice rollback procedures
4. Review and update this plan

