# Backup & Recovery Strategy

## Database Backups (Supabase)

### Automatic Backups

Supabase provides automatic daily backups:
- **Frequency:** Daily at 02:00 UTC
- **Retention:** 7 days (Free tier), 30 days (Pro tier)
- **Location:** Encrypted in Supabase infrastructure
- **Access:** Via Supabase Dashboard

### Point-in-Time Recovery (PITR)

Available on Pro tier and above:
- **Recovery Window:** Up to 30 days
- **Granularity:** Down to the second
- **Use Case:** Recover from accidental data deletion, corruption

### Manual Backups

Create manual backups before:
- Major migrations
- Bulk data operations
- Schema changes

```bash
# Export database
pg_dump -h db.PROJECT_REF.supabase.co \
  -U postgres \
  -d postgres \
  --clean --if-exists \
  > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore database
psql -h db.PROJECT_REF.supabase.co \
  -U postgres \
  -d postgres \
  < backup_20240101_120000.sql
```

## Storage Backups (Images, Files)

### Supabase Storage

- **Automatic Backup:** Included in database backups
- **Manual Export:** 
  ```bash
  # List all files
  supabase storage list <bucket-name>
  
  # Download all files
  supabase storage download <bucket-name> --all
  ```

### External Backup

For critical files, maintain external backup:
- **Service:** AWS S3, Google Cloud Storage
- **Frequency:** Weekly
- **Script:** Automated via cron job

```bash
#!/bin/bash
# backup-storage.sh

# Export to S3
aws s3 sync supabase://storage/product-images \
  s3://vintstreet-backup/product-images/$(date +%Y%m%d)
```

## Configuration Backups

### Environment Variables

Backup `.env` and secrets:
```bash
# Store in secure location (1Password, AWS Secrets Manager)
cat .env | gpg --encrypt > .env.gpg
```

### Edge Functions

Functions are version-controlled in git:
```bash
git tag release-v1.0.0
git push origin release-v1.0.0
```

## Recovery Time Objective (RTO)

| Incident Type | RTO | Procedure |
|--------------|-----|-----------|
| Database corruption | < 1 hour | PITR restoration |
| Complete database loss | < 4 hours | Full backup restoration |
| Storage loss | < 2 hours | S3 backup restoration |
| Application failure | < 15 minutes | Redeploy from git |
| Infrastructure failure | < 30 minutes | Fail over to backup |

## Recovery Point Objective (RPO)

| Data Type | RPO | Backup Frequency |
|-----------|-----|------------------|
| Database | < 24 hours | Daily automatic |
| Critical transactions | < 1 hour | WAL archiving |
| Storage files | < 7 days | Weekly sync |
| Configuration | 0 (version control) | Git commits |

## Disaster Recovery Procedures

### Scenario 1: Database Corruption

1. Stop all write operations
2. Assess extent of corruption
3. Identify last known good state
4. Restore using PITR
5. Verify data integrity
6. Resume operations

```bash
# Via Supabase Dashboard:
# Settings > Database > Point-in-time recovery
# Select recovery point
# Confirm restoration
```

### Scenario 2: Complete Data Loss

1. Provision new Supabase instance
2. Restore latest backup
3. Update DNS/connection strings
4. Verify all services
5. Monitor for issues

```bash
# Restore from backup
psql -h NEW_DB_HOST \
  -U postgres \
  -d postgres \
  < latest_backup.sql

# Update environment variables
export VITE_SUPABASE_URL=NEW_URL
```

### Scenario 3: Region Outage

1. Activate secondary region (if configured)
2. Update DNS to point to backup region
3. Monitor service health
4. Coordinate with Supabase support

## Backup Testing

### Monthly Backup Verification

Test backup restoration monthly:
```bash
# 1. Create test database
createdb vintstreet_test

# 2. Restore latest backup
psql -d vintstreet_test < latest_backup.sql

# 3. Run verification queries
psql -d vintstreet_test -c "SELECT COUNT(*) FROM users;"
psql -d vintstreet_test -c "SELECT COUNT(*) FROM orders;"

# 4. Drop test database
dropdb vintstreet_test
```

### Quarterly DR Drill

Conduct full disaster recovery drill:
1. Simulate complete outage
2. Execute recovery procedures
3. Verify all services
4. Document time taken
5. Update procedures based on learnings

## Backup Security

### Encryption

- **At Rest:** All backups encrypted with AES-256
- **In Transit:** TLS 1.3 for transfers
- **Access:** Role-based access control

### Access Control

Who can access backups:
- **Production Backups:** CTO, DevOps lead
- **Backup Restoration:** Requires 2-person approval for production
- **Backup Downloads:** Logged and monitored

### Retention Policy

| Backup Type | Retention |
|-------------|-----------|
| Daily backups | 30 days |
| Weekly backups | 3 months |
| Monthly backups | 1 year |
| Yearly backups | 7 years (compliance) |

## Backup Monitoring

### Alerts

Monitor backup health:
- Backup job failures
- Backup size anomalies
- Restore test failures
- Storage quota warnings

### Metrics

Track backup metrics:
- Backup duration
- Backup size
- Success/failure rate
- Recovery time (from tests)

## Backup Checklist

### Daily
- [ ] Verify automatic backup completed
- [ ] Check backup logs for errors
- [ ] Monitor storage usage

### Weekly
- [ ] Download critical data offsite
- [ ] Verify backup integrity

### Monthly
- [ ] Test backup restoration
- [ ] Review retention policy
- [ ] Audit backup access logs

### Quarterly
- [ ] Disaster recovery drill
- [ ] Update recovery procedures
- [ ] Review RTO/RPO targets
- [ ] Test failover procedures

## Compliance

### GDPR
- Right to erasure: Backups include deleted user data
- Data retention: Comply with retention periods
- Data location: Know where backups are stored

### PCI DSS
- Cardholder data: Not stored in backups (Stripe handles)
- Encryption: All backups encrypted
- Access logs: Maintain audit trail

## Emergency Contacts

| Service | Support | Contact |
|---------|---------|---------|
| Supabase | 24/7 Support | support@supabase.io |
| Google Cloud | Support Portal | cloud.google.com/support |
| Database Admin | [Name] | [Phone/Email] |
| DevOps Lead | [Name] | [Phone/Email] |

## Resources

- [Supabase Backup Documentation](https://supabase.com/docs/guides/platform/backups)
- [PostgreSQL Backup Guide](https://www.postgresql.org/docs/current/backup.html)
- [AWS S3 Backup Best Practices](https://aws.amazon.com/blogs/storage/best-practices-for-using-amazon-s3-for-backup-and-recovery/)

