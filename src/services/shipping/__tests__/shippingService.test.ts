import { describe, it, expect } from 'vitest';
import {
  fetchShippingProviders,
  fetchAllShippingProviders,
} from '../shippingService';
import { isSuccess } from '@/types/api';

describe('Shipping Service', () => {
  describe('fetchShippingProviders', () => {
    it('should fetch shipping providers from real server', async () => {
      const result = await fetchShippingProviders();

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });

  describe('fetchAllShippingProviders', () => {
    it('should fetch all shipping providers from real server', async () => {
      const result = await fetchAllShippingProviders();

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });
});
