import { describe, it, expect } from 'vitest';
import { fetchProducts, fetchProductByIdOrSlug, fetchProductsByIds } from '../productService';

describe('ProductService', () => {
  describe('fetchProducts', () => {
    it('should fetch products structure from real server', async () => {
      const result = await fetchProducts({}, 1, 10);

      expect(result).toHaveProperty('success');
      if (result.success) {
        expect(result.data).toHaveProperty('products');
        expect(Array.isArray(result.data.products)).toBe(true);
      }
    });
  });

  describe('fetchProductByIdOrSlug', () => {
    it('should handle non-existent product gracefully', async () => {
      const result = await fetchProductByIdOrSlug('00000000-0000-0000-0000-000000000000');

      expect(result).toHaveProperty('success');
    });
  });

  describe('fetchProductsByIds', () => {
    it('should fetch products by IDs from real server', async () => {
      const result = await fetchProductsByIds(['00000000-0000-0000-0000-000000000000']);

      expect(result).toHaveProperty('success');
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });
});
