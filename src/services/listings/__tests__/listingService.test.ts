import { describe, it, expect } from 'vitest';
import {
  fetchArchivedProducts,
  fetchAuctionProducts,
  fetchProductAttributeValues,
} from '../listingService';
import { isSuccess } from '@/types/api';

describe('Listing Service', () => {
  describe('fetchArchivedProducts', () => {
    it('should fetch archived products from real server', async () => {
      const result = await fetchArchivedProducts();

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });

  describe('fetchAuctionProducts', () => {
    it('should fetch auction products from real server', async () => {
      const result = await fetchAuctionProducts({ page: 0, pageSize: 10 });

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toHaveProperty('products');
        expect(Array.isArray(result.data.products)).toBe(true);
      }
    });
  });

  describe('fetchProductAttributeValues', () => {
    it('should fetch product attribute values structure from real server', async () => {
      const result = await fetchProductAttributeValues(['00000000-0000-0000-0000-000000000000']);

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });
});
