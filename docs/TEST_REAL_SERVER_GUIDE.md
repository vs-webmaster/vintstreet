# Real Server Integration Tests - Safety Guide

## Approach
Tests now connect to the real Supabase server from your `.env` file instead of using mocks.

## Safety Measures Implemented

### 1. TEST_ Prefix Rule ✅
Any test data created MUST use `TEST_` prefix:
```typescript
// When creating test data
title: 'TEST_Auto_Product_' + Date.now()
username: 'TEST_User_' + Date.now()
```

### 2. Read-Only Tests Preferred ✅
- Most tests just fetch existing data and verify structure
- No database modifications in most cases
- Only create data when testing creation flows

### 3. Increased Timeout ✅
- Test timeout set to 10 seconds in `vitest.config.ts`
- Handles network latency and Supabase handshake time

### 4. Cleanup Strategy
Run cleanup SQL after tests if needed:
```sql
DELETE FROM listings WHERE product_name LIKE 'TEST_%';
DELETE FROM profiles WHERE username LIKE 'TEST_%';
```

## Test Structure

Tests are now integration tests that:
- Connect to real Supabase instance
- Fetch real data (read-only)
- Verify response structure and types
- May create test data with TEST_ prefix if needed

## Requirements
- `.env` file with valid Supabase credentials
- Active Supabase database connection
- Network access to Supabase API
