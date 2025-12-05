import { describe, it, expect } from 'vitest';
import {
  fetchBrands,
  fetchBrandById,
} from '../brandService';
import type { BrandFilters } from '../brandService';
import { isSuccess } from '@/types/api';

describe('Brand Service', () => {
  describe('fetchBrands', () => {
    it('should fetch brands from real server', async () => {
      const result = await fetchBrands();

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(Array.isArray(result.data)).toBe(true);
        if (result.data.length > 0) {
          expect(result.data[0]).toHaveProperty('id');
          expect(result.data[0]).toHaveProperty('name');
        }
      }
    });

    it('should filter brands by active status', async () => {
      const filters: BrandFilters = { isActive: true };
      const result = await fetchBrands(filters);

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });

  describe('fetchBrandById', () => {
    it('should handle non-existent brand gracefully', async () => {
      const result = await fetchBrandById('00000000-0000-0000-0000-000000000000');

      // Should either return null or handle error gracefully
      expect(result).toHaveProperty('success');
    });
  });
});
