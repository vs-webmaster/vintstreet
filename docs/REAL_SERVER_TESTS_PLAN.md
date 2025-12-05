# Real Server Integration Tests - Conversion Plan

## Current State
- 45 test files exist (unit tests with Supabase mocks)
- Tests use mocked Supabase client
- Fast execution, isolated tests

## Target State
- Integration tests hitting real Supabase server
- Tests verify actual database operations
- Slower but more reliable and closer to production

## Safety Measures (COMMANDER'S RULES)

### ✅ TEST_ Prefix Rule
All test data MUST use `TEST_` prefix:
```typescript
// ✅ CORRECT
title: `TEST_Auto_Product_${Date.now()}`
product_name: 'TEST_Auto_Listing_12345'

// ❌ WRONG
title: 'Product Test'
product_name: 'Test Listing'
```

### ✅ Read-Only Preference
- Prefer fetching existing data and verifying structure
- Only create/modify when testing creation/modification flows
- Use existing test data when possible

### ✅ Network Timeouts
- Test timeout: 10 seconds (already configured)
- Handles Supabase handshake and network latency

## Conversion Strategy

For each test file:
1. Remove `vi.mock('@/integrations/supabase/client')`
2. Remove all mock variable declarations
3. Remove mock setup in `beforeEach`
4. Update tests to use real data or create with TEST_ prefix
5. Focus on read-only verification when possible

## Cleanup SQL Script
```sql
-- Clean up all test data after test runs
DELETE FROM listings WHERE product_name LIKE 'TEST_%';
DELETE FROM profiles WHERE username LIKE 'TEST_%';
DELETE FROM messages WHERE subject LIKE 'TEST_%';
-- Add more as needed
```

## Benefits
- Tests verify actual integration with database
- No mock drift issues
- Real error scenarios caught
- Higher confidence in production readiness
