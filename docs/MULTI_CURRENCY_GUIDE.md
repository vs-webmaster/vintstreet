# Multi-Currency Implementation Guide

## Overview
Your eCommerce platform now supports multi-currency display with GBP as the base currency. Exchange rates are fetched daily and cached for performance.

## Features Implemented

### 1. Database Schema
- `currency_rates` table stores exchange rates
- `profiles.preferred_currency` tracks user preferences
- `orders` table extended to track both GBP and display amounts

### 2. Backend (Edge Functions)
- **fetch-exchange-rates**: Fetches live rates from exchangerate-api.com daily
- **Cron job**: Automatically updates rates at midnight UTC
- **Supported currencies**: GBP, USD, EUR, CAD, AUD, JPY

### 3. Frontend Components
- **CurrencyContext**: Global state management for currency
- **CurrencySelector**: Dropdown in header for currency selection
- **PriceDisplay**: Formatted price display component

## How to Use in Your Code

### Display Prices
Replace hardcoded price displays with `PriceDisplay`:

```tsx
import { PriceDisplay } from '@/components/PriceDisplay';

// Before:
<span>£{product.price}</span>

// After:
<PriceDisplay gbpPrice={parseFloat(product.price)} />

// With original GBP price shown:
<PriceDisplay 
  gbpPrice={parseFloat(product.price)} 
  showOriginal={true}
  className="text-2xl"
/>
```

### Access Currency Functions
Use the `useCurrency` hook in any component:

```tsx
import { useCurrency } from '@/contexts/CurrencyContext';

function MyComponent() {
  const { currency, convertPrice, formatPrice } = useCurrency();
  
  const gbpPrice = 49.99;
  const converted = convertPrice(gbpPrice); // 63.44 USD
  const formatted = formatPrice(converted); // "$63.44"
  
  return <div>{formatted}</div>;
}
```

### Checkout Integration
In checkout/cart pages, track both currencies:

```tsx
const { currency, convertPrice, rates } = useCurrency();

const handleOrder = async () => {
  const totalGBP = 100.00;
  const displayTotal = convertPrice(totalGBP);
  
  await supabase.from('orders').insert({
    amount_gbp: totalGBP,           // Always store GBP
    display_amount: displayTotal,    // What customer saw
    display_currency: currency,      // Their selected currency
    exchange_rate_used: rates[currency],
    // ... other fields
  });
};
```

## Manual Rate Updates

To manually fetch latest rates (useful for testing):

```tsx
import { supabase } from '@/integrations/supabase/client';

const updateRates = async () => {
  const { data, error } = await supabase.functions.invoke(
    'fetch-exchange-rates'
  );
  console.log('Rates updated:', data);
};
```

## Pricing Best Practices

### 1. Rounding Rules
- USD/GBP/EUR: Rounded to .99 (e.g., $49.99)
- JPY: Rounded to nearest 100 (e.g., ¥5,000)

### 2. Display Guidelines
- Always show currency code on first appearance: "$49.99 USD"
- Subsequent displays can use symbol only: "$49.99"
- Show conversion note at checkout: "Approximate. Final charge in GBP"

### 3. Legal Disclaimers
Add to checkout page:
```tsx
<p className="text-sm text-muted-foreground">
  Prices shown in {currency} are approximate. 
  You will be charged £{gbpAmount.toFixed(2)} GBP
</p>
```

## API Setup

### Get Your Exchange Rate API Key
1. Sign up at [exchangerate-api.com](https://www.exchangerate-api.com/)
2. Get your free API key (1,500 requests/month)
3. Add it to Supabase secrets as `EXCHANGE_RATE_API_KEY`

### Alternative Providers
You can swap to other providers by editing `supabase/functions/fetch-exchange-rates/index.ts`:

**Fixer.io**:
```typescript
const response = await fetch(
  `https://api.fixer.io/latest?base=GBP&symbols=${SUPPORTED_CURRENCIES.join(',')}&access_key=${API_KEY}`
);
```

**CurrencyAPI**:
```typescript
const response = await fetch(
  `https://api.currencyapi.com/v3/latest?base_currency=GBP&currencies=${SUPPORTED_CURRENCIES.join(',')}&apikey=${API_KEY}`
);
```

## Performance Optimization

### Caching Strategy
- **Backend**: Rates refresh daily via cron
- **Frontend**: React Query cache (5min stale, 1hr refetch)
- **User preference**: Stored in localStorage

### Bundle Size
The entire multi-currency system adds ~5KB to your bundle (gzipped).

## Testing

### Test Different Currencies
1. Open DevTools > Application > Local Storage
2. Set `preferredCurrency` to test currency (e.g., "USD")
3. Refresh page to see prices in that currency

### Verify Rate Updates
```sql
-- Check current rates
SELECT * FROM currency_rates ORDER BY last_updated DESC;

-- Check cron jobs
SELECT * FROM cron.job WHERE jobname = 'refresh-exchange-rates';
```

## Migration from Single Currency

To update existing components:

1. **Find all price displays**:
```bash
grep -r "£{\\" src/
grep -r "price}\\}" src/
```

2. **Replace with PriceDisplay**:
```tsx
// Old
<span className="text-2xl font-bold">£{product.price}</span>

// New
<PriceDisplay gbpPrice={parseFloat(product.price)} className="text-2xl" />
```

3. **Update checkout logic** to store dual currency data

## Troubleshooting

### Rates not updating
- Check edge function logs in Supabase dashboard
- Verify `EXCHANGE_RATE_API_KEY` is set
- Check cron job is running: `SELECT * FROM cron.job_run_details;`

### Wrong currency displayed
- Clear localStorage: `localStorage.removeItem('preferredCurrency')`
- Check React Query cache is working
- Verify currency_rates table has data

### Formatting issues
- Ensure Intl.NumberFormat is supported in target browsers
- Fallback is included for unsupported locales

## Future Enhancements

- [ ] Add more currencies (CHF, CNY, INR, etc.)
- [ ] User-specific rate locking at checkout
- [ ] Multi-currency payment gateway integration
- [ ] Historical rate tracking
- [ ] Currency conversion analytics

## Support

For issues or questions:
- Check edge function logs: Supabase > Functions > fetch-exchange-rates
- Review database: `SELECT * FROM currency_rates`
- Verify user preference: `SELECT preferred_currency FROM profiles WHERE user_id = auth.uid()`
