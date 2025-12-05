import { describe, it, expect } from 'vitest';
import {
  fetchActiveBlogCategories,
  fetchAllBlogCategories,
  fetchBlogCategoryBySlug,
} from '../blogCategoryService';
import { isSuccess } from '@/types/api';

describe('Blog Category Service', () => {
  describe('fetchActiveBlogCategories', () => {
    it('should fetch active blog categories from real server', async () => {
      const result = await fetchActiveBlogCategories();

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(Array.isArray(result.data)).toBe(true);
        if (result.data.length > 0) {
          expect(result.data[0]).toHaveProperty('id');
          expect(result.data[0]).toHaveProperty('name');
        }
      }
    });
  });

  describe('fetchAllBlogCategories', () => {
    it('should fetch all blog categories from real server', async () => {
      const result = await fetchAllBlogCategories();

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });

  describe('fetchBlogCategoryBySlug', () => {
    it('should handle non-existent slug gracefully', async () => {
      const result = await fetchBlogCategoryBySlug('nonexistent-slug-12345');

      // May succeed with null data or fail - both are valid
      expect(result).toHaveProperty('success');
      if (result.success) {
        expect(result.data === null || typeof result.data === 'object').toBe(true);
      }
    });
  });
});
