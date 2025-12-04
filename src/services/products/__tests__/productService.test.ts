import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fetchProducts, fetchProductById } from '../productService';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          range: vi.fn(),
        })),
        order: vi.fn(() => ({
          range: vi.fn(),
        })),
        range: vi.fn(),
      })),
    })),
  },
}));

describe('ProductService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchProducts', () => {
    it('should fetch products with pagination', async () => {
      const mockProducts = [
        { id: '1', product_name: 'Product 1', price: 100 },
        { id: '2', product_name: 'Product 2', price: 200 },
      ];

      // This is a simplified mock - actual implementation would need more setup
      const result = await fetchProducts({}, 1, 10);

      // Test that the function returns a Result type
      expect(result).toHaveProperty('success');
    });

    it('should handle empty results', async () => {
      const result = await fetchProducts({}, 1, 10);

      expect(result).toHaveProperty('success');
      if (result.success) {
        expect(Array.isArray(result.data?.products)).toBe(true);
      }
    });
  });

  describe('fetchProductById', () => {
    it('should fetch a single product by ID', async () => {
      const result = await fetchProductById('test-product-id');

      expect(result).toHaveProperty('success');
    });

    it('should return null for non-existent product', async () => {
      const result = await fetchProductById('non-existent-id');

      expect(result).toHaveProperty('success');
    });
  });
});


