# Test Approach Decision

## Two Options

### Option 1: Fix Mock Hoisting (Unit Tests)
- Fix `vi.hoisted()` issues so current unit tests work
- Tests remain fast, isolated, mocked
- Good for code coverage goals
- **Pros**: Quick fix, tests run immediately
- **Cons**: Still using mocks, not testing real integration

### Option 2: Convert to Integration Tests (Real Server)
- Remove all Supabase mocks
- Tests hit real database from `.env`
- Verify actual database operations
- **Pros**: Real integration testing, higher confidence
- **Cons**: Requires rewriting 28+ test files, slower execution

## Recommendation

For achieving 8/10 score and 60% coverage:
- **Fix mock hoisting first** (Option 1) - gets tests running quickly
- **Then add integration tests** (Option 2) - for critical paths only

This gives you:
- ✅ Working unit tests (fast coverage)
- ✅ Integration tests for critical flows (real server verification)
- ✅ Best of both worlds

## Current Status
- Test timeout already increased to 10s (ready for real server)
- Safety guidelines documented (TEST_ prefix, read-only preference)
- Ready to proceed with either approach
