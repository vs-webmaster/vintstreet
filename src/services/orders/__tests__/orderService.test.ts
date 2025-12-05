import { describe, it, expect } from 'vitest';
import {
  fetchOrderById,
  fetchBuyerOrders,
  fetchSellerOrders,
} from '../orderService';
import { isSuccess } from '@/types/api';

describe('Order Service', () => {
  describe('fetchOrderById', () => {
    it('should handle non-existent order gracefully', async () => {
      const result = await fetchOrderById('00000000-0000-0000-0000-000000000000');

      expect(result).toHaveProperty('success');
    });
  });

  describe('fetchBuyerOrders', () => {
    it('should fetch buyer orders structure from real server', async () => {
      const result = await fetchBuyerOrders('00000000-0000-0000-0000-000000000000');

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });

  describe('fetchSellerOrders', () => {
    it('should fetch seller orders structure from real server', async () => {
      const result = await fetchSellerOrders('00000000-0000-0000-0000-000000000000');

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });
});
