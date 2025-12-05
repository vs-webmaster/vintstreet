# Test Integration Approach

## Decision
Tests now use the real Supabase server instead of mocks. Tests will make actual API calls to your Supabase instance.

## Requirements
- `.env` file with `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
- Live Supabase database connection
- Tests may modify data (use test database if possible)

## What Changed
- Removed all `vi.mock('@/integrations/supabase/client')` calls
- Removed all mock variable declarations
- Tests now make real database calls

## Test Behavior
- Tests will be slower (network calls)
- Tests require database to be available
- Tests may create/modify real data
- Consider using a separate test database
