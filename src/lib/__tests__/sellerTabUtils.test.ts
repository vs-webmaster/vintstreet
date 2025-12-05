import { describe, it, expect } from 'vitest';
import { getTabFromHash } from '../sellerTabUtils';

describe('Seller Tab Utils', () => {
  describe('getTabFromHash', () => {
    it('should return correct tab for valid hash', () => {
      expect(getTabFromHash('#setup')).toBe('setup');
      expect(getTabFromHash('#streams')).toBe('streams');
      expect(getTabFromHash('#products')).toBe('products');
      expect(getTabFromHash('#orders')).toBe('orders');
      expect(getTabFromHash('#finances')).toBe('finances');
      expect(getTabFromHash('#reviews')).toBe('reviews');
    });

    it('should return null for invalid hash', () => {
      expect(getTabFromHash('#invalid')).toBeNull();
      expect(getTabFromHash('')).toBeNull();
      expect(getTabFromHash('#unknown')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(getTabFromHash('')).toBeNull();
    });
  });
});
