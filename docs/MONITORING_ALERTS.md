# Monitoring & Alerting Configuration

## Alert Definitions

### Critical Alerts (P0)

#### 1. High Error Rate
**Condition:** Error rate > 5% over 5 minutes
**Impact:** Users experiencing failures
**Response:** Immediate investigation and rollback if needed
**Channels:** PagerDuty, Slack, SMS

**Query:**
```sql
SELECT 
  COUNT(CASE WHEN status >= 500 THEN 1 END) * 100.0 / COUNT(*) as error_rate
FROM logs
WHERE timestamp > NOW() - INTERVAL '5 minutes'
HAVING error_rate > 5;
```

#### 2. Payment Processing Failures
**Condition:** Payment success rate < 95% over 5 minutes
**Impact:** Revenue loss, user frustration
**Response:** Immediate investigation
**Channels:** PagerDuty, Slack, SMS, Email to finance team

#### 3. Database Down
**Condition:** Unable to connect to database
**Impact:** Complete service outage
**Response:** Immediate escalation to Supabase
**Channels:** PagerDuty, Slack, SMS

#### 4. Authentication Failures
**Condition:** Auth failure rate > 10% over 5 minutes
**Impact:** Users cannot log in
**Response:** Check Supabase auth service
**Channels:** PagerDuty, Slack

### High Priority Alerts (P1)

#### 5. Slow Response Times
**Condition:** p95 response time > 1000ms over 10 minutes
**Impact:** Poor user experience
**Response:** Investigate slow queries/endpoints
**Channels:** Slack, Email

**Query:**
```sql
SELECT 
  percentile_cont(0.95) WITHIN GROUP (ORDER BY response_time) as p95
FROM logs
WHERE timestamp > NOW() - INTERVAL '10 minutes'
HAVING p95 > 1000;
```

#### 6. High CPU Usage
**Condition:** CPU > 80% for 10 minutes
**Impact:** Potential service degradation
**Response:** Scale up or optimize
**Channels:** Slack, Email

#### 7. High Memory Usage
**Condition:** Memory > 85% for 10 minutes
**Impact:** Potential OOM crashes
**Response:** Investigate memory leaks
**Channels:** Slack, Email

#### 8. Failed Payments
**Condition:** > 10 failed payments in 1 hour
**Impact:** Revenue loss
**Response:** Check Stripe integration
**Channels:** Slack, Email to finance

### Medium Priority Alerts (P2)

#### 9. Increased 4xx Errors
**Condition:** 4xx error rate > 10% over 30 minutes
**Impact:** Possible client-side issues or API changes
**Response:** Review recent changes
**Channels:** Slack

#### 10. Slow Database Queries
**Condition:** Query time > 500ms (p95) for 15 minutes
**Impact:** Degraded performance
**Response:** Review and optimize queries
**Channels:** Slack

#### 11. High Disk Usage
**Condition:** Disk usage > 80%
**Impact:** Potential out of space
**Response:** Clean up logs, increase storage
**Channels:** Slack, Email

#### 12. SSL Certificate Expiring
**Condition:** Certificate expires in < 30 days
**Impact:** Future service disruption
**Response:** Renew certificate
**Channels:** Email

### Low Priority Alerts (P3)

#### 13. Increased Search Latency
**Condition:** Search p95 > 2000ms for 30 minutes
**Impact:** Slower search experience
**Response:** Review Algolia performance
**Channels:** Slack

#### 14. High Stream Bandwidth
**Condition:** Bandwidth usage > 80% of quota
**Impact:** Potential overage charges
**Response:** Review usage patterns
**Channels:** Email

## Alert Channels

### Slack Channels
- `#incidents` - P0/P1 alerts
- `#monitoring` - All alerts
- `#engineering` - P2/P3 alerts

### Email
- `engineering@vintstreet.com` - All alerts
- `finance@vintstreet.com` - Payment alerts
- `oncall@vintstreet.com` - P0/P1 alerts

### PagerDuty
- On-call rotation for P0/P1
- Escalation after 15 minutes if not acknowledged

### SMS
- P0 alerts only
- On-call engineer

## Dashboard Setup

### Google Cloud Monitoring

Create custom dashboard with:

1. **Service Health**
   - Request count
   - Error rate
   - Response time (p50, p95, p99)
   - Success rate

2. **Infrastructure**
   - CPU usage
   - Memory usage
   - Disk usage
   - Network I/O

3. **Database**
   - Query performance
   - Connection count
   - Replication lag
   - Slow queries

4. **Business Metrics**
   - Orders per minute
   - Payment success rate
   - Active users
   - Stream viewers

### Supabase Dashboard

Monitor:
- Database size
- API requests
- Auth requests
- Storage usage
- Edge Function invocations

### Custom Metrics

Track business-specific metrics:

```typescript
// Track order completion
analytics.track('order_completed', {
  order_id: orderId,
  amount: total,
  duration: completionTime,
});

// Track stream performance
analytics.track('stream_ended', {
  stream_id: streamId,
  viewers: maxViewers,
  duration: streamDuration,
  sales: totalSales,
});
```

## Alert Notification Rules

### On-Call Rotation
- **Schedule:** 7-day rotations
- **Handoff:** Monday 9:00 AM
- **Coverage:** 24/7 for P0/P1

### Escalation Policy

**P0 Alerts:**
1. Page on-call engineer (immediate)
2. Escalate to team lead (after 5 min)
3. Escalate to CTO (after 15 min)

**P1 Alerts:**
1. Slack notification (immediate)
2. Page on-call engineer (after 10 min)
3. Escalate to team lead (after 30 min)

**P2/P3 Alerts:**
1. Slack notification only
2. Create ticket for investigation
3. No immediate escalation

### Alert Fatigue Prevention

- Review alerts weekly
- Tune thresholds based on historical data
- Consolidate similar alerts
- Auto-resolve alerts when condition clears
- Implement alert snoozing for maintenance

## Alert Response Playbooks

### High Error Rate

1. Check recent deployments
2. Review error logs for patterns
3. Check third-party service status
4. Consider rollback if spike correlates with deployment
5. Investigate root cause

```bash
# Quick diagnosis
gcloud run services logs read vintstreet \
  --region=us-central1 \
  --limit=100 \
  --format="value(textPayload)" | grep ERROR
```

### Payment Failures

1. Check Stripe status page
2. Review failed payment logs
3. Verify Stripe credentials are valid
4. Check for rate limiting
5. Contact Stripe support if needed

```bash
# Check payment logs
supabase logs --service=edge-functions --filter="stripe"
```

### Database Issues

1. Check Supabase status
2. Review connection pool usage
3. Identify slow queries
4. Check for locks
5. Contact Supabase support

```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check for locks
SELECT * FROM pg_locks WHERE NOT granted;

-- Check slow queries
SELECT * FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

## Monitoring Best Practices

1. **Measure What Matters**
   - Focus on user-impacting metrics
   - Track business KPIs
   - Monitor critical paths

2. **Set Realistic Thresholds**
   - Based on historical data
   - Account for normal variance
   - Adjust seasonally

3. **Reduce Noise**
   - Consolidate related alerts
   - Use intelligent grouping
   - Implement grace periods

4. **Document Everything**
   - Keep runbooks updated
   - Document alert responses
   - Share learnings

5. **Review Regularly**
   - Weekly alert review
   - Monthly threshold tuning
   - Quarterly playbook updates

## Testing Alerts

### Smoke Tests

Test alerts monthly:

```bash
# Trigger test alert
curl https://your-app.run.app/test/alert/high-error-rate

# Verify alert received
# Check Slack/PagerDuty
```

### Load Testing

Trigger alerts during load tests:

```bash
# Run load test
artillery run load-test.yml

# Monitor dashboards for alerts
```

## Maintenance Windows

During planned maintenance:

1. Announce maintenance window
2. Snooze non-critical alerts
3. Monitor extra closely
4. Resume alerts after completion
5. Verify all systems normal

```bash
# Snooze alerts (via API or UI)
curl -X POST https://api.pagerduty.com/maintenance_windows \
  -H "Authorization: Token token=YOUR_TOKEN" \
  -d '{
    "maintenance_window": {
      "start_time": "2024-01-01T02:00:00Z",
      "end_time": "2024-01-01T04:00:00Z",
      "description": "Scheduled maintenance"
    }
  }'
```

## Resources

- [Google Cloud Monitoring](https://cloud.google.com/monitoring/docs)
- [Supabase Metrics](https://supabase.com/docs/guides/platform/metrics)
- [Alert Fatigue Guide](https://www.pagerduty.com/resources/learn/what-is-alert-fatigue/)
- [SLO/SLA Best Practices](https://sre.google/sre-book/service-level-objectives/)

