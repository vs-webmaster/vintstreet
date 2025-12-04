# Testing Guide for VintStreet

## Setup

Testing infrastructure has been set up using **Vitest** (fast, Vite-native test framework).

### Install Test Dependencies

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event @vitest/ui jsdom
```

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Open Vitest UI
npm run test:ui
```

## Adding Test Scripts to package.json

Add these to the `"scripts"` section:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

## Test Structure

```
src/
├── test/
│   ├── setup.ts           # Test setup and global mocks
│   └── example.test.ts    # Example tests
├── lib/
│   └── __tests__/
│       └── utils.test.ts  # Unit tests for lib/utils
└── components/
    └── __tests__/
        └── Component.test.tsx  # Component tests
```

## Priority Testing Areas

### 1. Payment Processing (CRITICAL)
- [ ] Test order creation flow
- [ ] Test payment split calculations
- [ ] Test Stripe integration mocks
- [ ] Test refund logic
- [ ] Test buyer protection fees

**Example:**
```typescript
// src/services/stripe/__tests__/checkout.test.ts
describe('Stripe Checkout', () => {
  it('should calculate correct split payment', () => {
    const order = { total: 100, sellerFee: 10, buyerProtection: 5 };
    const split = calculateSplit(order);
    expect(split.sellerAmount).toBe(85);
    expect(split.platformFee).toBe(15);
  });
});
```

### 2. Authentication (CRITICAL)
- [ ] Test login flow
- [ ] Test signup flow
- [ ] Test session management
- [ ] Test role-based access

**Example:**
```typescript
// src/services/auth/__tests__/auth.test.ts
describe('Authentication', () => {
  it('should handle login with valid credentials', async () => {
    const result = await login('user@example.com', 'password');
    expect(result.success).toBe(true);
    expect(result.data.user).toBeDefined();
  });

  it('should reject invalid credentials', async () => {
    const result = await login('user@example.com', 'wrong');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
```

### 3. Business Logic (HIGH)
- [ ] Test listing creation/validation
- [ ] Test auction bid logic
- [ ] Test offer acceptance/rejection
- [ ] Test inventory management
- [ ] Test order status transitions

**Example:**
```typescript
// src/services/auctions/__tests__/bidding.test.ts
describe('Auction Bidding', () => {
  it('should accept bid higher than current price', () => {
    const auction = { currentBid: 100, minIncrement: 5 };
    const result = validateBid(auction, 110);
    expect(result.valid).toBe(true);
  });

  it('should reject bid lower than minimum increment', () => {
    const auction = { currentBid: 100, minIncrement: 5 };
    const result = validateBid(auction, 102);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('minimum increment');
  });
});
```

### 4. Utility Functions (MEDIUM)
- [ ] Test price formatting
- [ ] Test date formatting
- [ ] Test validation functions
- [ ] Test filtering/sorting logic

### 5. Component Tests (MEDIUM)
- [ ] Test critical UI components
- [ ] Test form validation
- [ ] Test error states
- [ ] Test loading states

**Example:**
```typescript
// src/components/product/__tests__/ProductCard.test.tsx
import { render, screen } from '@testing-library/react';
import { ProductCard } from '../ProductCard';

describe('ProductCard', () => {
  it('should display product information', () => {
    const product = {
      id: '1',
      title: 'Test Product',
      price: 99.99,
      image: '/test.jpg',
    };

    render(<ProductCard product={product} />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
  });
});
```

## Mocking External Services

### Supabase
```typescript
import { vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: vi.fn().mockResolvedValue({ data: [], error: null }),
      update: vi.fn().mockResolvedValue({ data: [], error: null }),
      delete: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
    auth: {
      signIn: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
    },
  },
}));
```

### Stripe
```typescript
vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn().mockResolvedValue({
    confirmPayment: vi.fn().mockResolvedValue({ error: null }),
  }),
}));
```

### Agora (Live Streaming)
```typescript
vi.mock('@/config/agora', () => ({
  getAgoraConfig: vi.fn().mockResolvedValue({
    appId: 'test-app-id',
    token: 'test-token',
  }),
}));
```

## Coverage Goals

- **Critical paths (payments, auth):** 80%+
- **Business logic:** 70%+
- **Utilities:** 90%+
- **Components:** 60%+
- **Overall:** 60%+

## CI/CD Integration

<<<<<<< HEAD
Tests are automatically run in the GitHub Actions pipeline. 
=======
Tests are automatically run in the GitHub Actions pipeline. PRs cannot merge if tests fail.

>>>>>>> a275e0e6fd466fe0415be180aa3be0c399054c93
## Best Practices

1. **Arrange-Act-Assert:** Structure tests clearly
2. **One assertion per test:** Keep tests focused
3. **Descriptive test names:** Use `it('should do X when Y')` format
4. **Mock external dependencies:** Don't rely on real APIs
5. **Test edge cases:** Not just happy paths
6. **Keep tests fast:** Mock slow operations

## Common Pitfalls

❌ **Don't test implementation details**
```typescript
// Bad
expect(component.state.isLoading).toBe(false);

// Good
expect(screen.getByText('Content')).toBeInTheDocument();
```

❌ **Don't test third-party libraries**
```typescript
// Bad
it('should format date correctly', () => {
  expect(dayjs('2024-01-01').format('YYYY')).toBe('2024');
});

// Good
it('should display formatted creation date', () => {
  render(<Post createdAt="2024-01-01" />);
  expect(screen.getByText('January 1, 2024')).toBeInTheDocument();
});
```

## Next Steps

1. Install test dependencies (see above)
2. Add test scripts to package.json
3. Start with critical paths: payments and authentication
4. Gradually increase coverage
5. Make testing part of your workflow

**Goal:** Get to 60% coverage on critical paths before production launch (estimated 1-2 weeks).

