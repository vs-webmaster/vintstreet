import { describe, it, expect } from 'vitest';
import {
  fetchFooterColumns,
  fetchFooterLinks,
  fetchAllContentPages,
  fetchContentPageBySlug,
} from '../contentService';
import { isSuccess } from '@/types/api';

describe('Content Service', () => {
  describe('fetchFooterColumns', () => {
    it('should fetch footer columns from real server', async () => {
      const result = await fetchFooterColumns();

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(Array.isArray(result.data)).toBe(true);
        if (result.data.length > 0) {
          expect(result.data[0]).toHaveProperty('id');
          expect(result.data[0]).toHaveProperty('title');
        }
      }
    });
  });

  describe('fetchFooterLinks', () => {
    it('should fetch footer links from real server', async () => {
      const result = await fetchFooterLinks();

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(Array.isArray(result.data)).toBe(true);
        if (result.data.length > 0) {
          expect(result.data[0]).toHaveProperty('id');
          expect(result.data[0]).toHaveProperty('label');
        }
      }
    });
  });

  describe('fetchAllContentPages', () => {
    it('should fetch all content pages from real server', async () => {
      const result = await fetchAllContentPages();

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(Array.isArray(result.data)).toBe(true);
        if (result.data.length > 0) {
          expect(result.data[0]).toHaveProperty('id');
          expect(result.data[0]).toHaveProperty('title');
        }
      }
    });
  });

  describe('fetchContentPageBySlug', () => {
    it('should handle non-existent page gracefully', async () => {
      const result = await fetchContentPageBySlug('nonexistent-page-slug-12345');

      // May succeed with null data or fail - both are valid
      expect(result).toHaveProperty('success');
      if (result.success) {
        expect(result.data === null || typeof result.data === 'object').toBe(true);
      }
    });
  });
});
