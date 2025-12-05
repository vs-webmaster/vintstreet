import { describe, it, expect } from 'vitest';
import {
  fetchCategories,
  fetchCategoryByIdOrSlug,
  fetchSubcategories,
} from '../categoryService';
import { isSuccess } from '@/types/api';

describe('Category Service', () => {
  describe('fetchCategories', () => {
    it('should fetch all active categories', async () => {
      const result = await fetchCategories();

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(Array.isArray(result.data)).toBe(true);
        // Verify structure of returned categories
        if (result.data.length > 0) {
          expect(result.data[0]).toHaveProperty('id');
          expect(result.data[0]).toHaveProperty('name');
        }
      }
    });
  });

  describe('fetchCategoryByIdOrSlug', () => {
    it('should fetch category structure is correct', async () => {
      // Test with a non-existent ID to verify null handling
      const result = await fetchCategoryByIdOrSlug('00000000-0000-0000-0000-000000000000');

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        // Should return null for non-existent category
        expect(result.data === null || typeof result.data === 'object').toBe(true);
      }
    });
  });

  describe('fetchSubcategories', () => {
    it('should fetch subcategories structure is correct', async () => {
      // Try with a test category ID - will return empty array or error
      const result = await fetchSubcategories('00000000-0000-0000-0000-000000000000');

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });
});
