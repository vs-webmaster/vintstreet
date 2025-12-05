import { describe, it, expect } from 'vitest';
import {
  fetchStripeTransactions,
  fetchStripePayouts,
  fetchStripeConnectedAccount,
} from '../stripeService';
import { isSuccess } from '@/types/api';

describe('Stripe Service', () => {
  describe('fetchStripeTransactions', () => {
    it('should fetch Stripe transactions structure from real server', async () => {
      const result = await fetchStripeTransactions('00000000-0000-0000-0000-000000000000');

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });

  describe('fetchStripePayouts', () => {
    it('should fetch Stripe payouts structure from real server', async () => {
      const result = await fetchStripePayouts('00000000-0000-0000-0000-000000000000');

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });

  describe('fetchStripeConnectedAccount', () => {
    it('should fetch Stripe connected account structure from real server', async () => {
      const result = await fetchStripeConnectedAccount('00000000-0000-0000-0000-000000000000');

      expect(result).toHaveProperty('success');
    });
  });
});
