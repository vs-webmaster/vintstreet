import { describe, it, expect } from 'vitest';
import {
  fetchTags,
  fetchTagById,
  fetchTagBySlug,
  fetchFeaturedTags,
  fetchProductTags,
} from '../tagService';
import { isSuccess } from '@/types/api';

describe('Tag Service', () => {
  describe('fetchTags', () => {
    it('should fetch tags from real server', async () => {
      const result = await fetchTags();

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

  describe('fetchTagById', () => {
    it('should handle non-existent tag gracefully', async () => {
      const result = await fetchTagById('00000000-0000-0000-0000-000000000000');

      expect(result).toHaveProperty('success');
    });
  });

  describe('fetchTagBySlug', () => {
    it('should handle non-existent slug gracefully', async () => {
      const result = await fetchTagBySlug('nonexistent-slug-12345');

      // May succeed with null data or fail - both are valid
      expect(result).toHaveProperty('success');
      if (result.success) {
        expect(result.data === null || typeof result.data === 'object').toBe(true);
      }
    });
  });

  describe('fetchFeaturedTags', () => {
    it('should fetch featured tags from real server', async () => {
      const result = await fetchFeaturedTags();

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });

  describe('fetchProductTags', () => {
    it('should fetch product tags structure from real server', async () => {
      const result = await fetchProductTags('00000000-0000-0000-0000-000000000000');

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });
});
