# Test Safety Guidelines - Real Server Testing

## Safety Rules

### 1. TEST_ Prefix Rule
**CRITICAL**: All test data created must use `TEST_` prefix in identifiable fields:

```typescript
// ✅ GOOD
await createProduct({ 
  title: 'TEST_Auto_Product_123',
  slug: 'test-auto-product-123'
});

// ❌ BAD
await createProduct({ 
  title: 'Product Test',
  slug: 'product-test'
});
```

**Cleanup**: Run this SQL to clean up test data:
```sql
-- Clean up test listings
DELETE FROM listings WHERE product_name LIKE 'TEST_%';

-- Clean up test users (if created)
DELETE FROM profiles WHERE username LIKE 'TEST_%';
```

### 2. Read-Only Preference
- **Prefer read-only tests** that fetch and verify data
- Only create/modify data when absolutely necessary
- Use existing test data when possible

### 3. Network Timeouts
- Tests may be slower due to real API calls
- Test timeout increased to 10 seconds in config
- Network flakiness is handled gracefully

## Test Data Pattern

When creating test data, use this pattern:
- Titles/Names: `TEST_Auto_{descriptive_name}_{timestamp}`
- IDs: Use UUIDs normally
- Timestamps: Use test-friendly dates

## Cleanup Strategy

After test runs, use SQL cleanup scripts:
```sql
-- Find all test data
SELECT * FROM listings WHERE product_name LIKE 'TEST_%';
SELECT * FROM profiles WHERE username LIKE 'TEST_%';

-- Remove when safe
DELETE FROM listings WHERE product_name LIKE 'TEST_%' AND created_at < NOW() - INTERVAL '1 day';
```
