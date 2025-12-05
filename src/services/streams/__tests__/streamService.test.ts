import { describe, it, expect } from 'vitest';
import {
  fetchStreamsByUserId,
  fetchStreamByIdPublic,
  fetchStreamById,
  fetchActiveStreamCategories,
  fetchAllStreamCategories,
  fetchLivestreamProducts,
} from '../streamService';
import { isSuccess } from '@/types/api';

describe('Stream Service', () => {
  describe('fetchStreamsByUserId', () => {
    it('should fetch streams by user ID from real server', async () => {
      const result = await fetchStreamsByUserId('00000000-0000-0000-0000-000000000000');

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });

  describe('fetchStreamByIdPublic', () => {
    it('should handle non-existent stream gracefully', async () => {
      const result = await fetchStreamByIdPublic('00000000-0000-0000-0000-000000000000');

      expect(result).toHaveProperty('success');
    });
  });

  describe('fetchStreamById', () => {
    it('should handle non-existent stream gracefully', async () => {
      const result = await fetchStreamById('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000');

      expect(result).toHaveProperty('success');
    });
  });

  describe('fetchActiveStreamCategories', () => {
    it('should fetch active stream categories from real server', async () => {
      const result = await fetchActiveStreamCategories();

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });

  describe('fetchAllStreamCategories', () => {
    it('should fetch all stream categories from real server', async () => {
      const result = await fetchAllStreamCategories();

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });

  describe('fetchLivestreamProducts', () => {
    it('should fetch livestream products structure from real server', async () => {
      const result = await fetchLivestreamProducts('00000000-0000-0000-0000-000000000000');

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });
});
