import { describe, it, expect } from 'vitest';
import {
  loadCart,
  guestCartUtils,
} from '../cartService';
import { isSuccess } from '@/types/api';

describe('Cart Service', () => {
  describe('loadCart', () => {
    it('should load cart structure from real server', async () => {
      const result = await loadCart('00000000-0000-0000-0000-000000000000');

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });

  describe('guestCartUtils', () => {
    it('should handle guest cart operations', () => {
      const guestCart = guestCartUtils.getGuestCart();
      expect(Array.isArray(guestCart)).toBe(true);
    });

    it('should allow adding items to guest cart', () => {
      guestCartUtils.addToGuestCart('listing-123');
      const cart = guestCartUtils.getGuestCart();
      expect(cart.length).toBeGreaterThanOrEqual(1);
      guestCartUtils.clearGuestCart();
    });

    it('should allow clearing guest cart', () => {
      guestCartUtils.addToGuestCart('listing-123');
      guestCartUtils.clearGuestCart();
      const cart = guestCartUtils.getGuestCart();
      expect(cart.length).toBe(0);
    });
  });
});
