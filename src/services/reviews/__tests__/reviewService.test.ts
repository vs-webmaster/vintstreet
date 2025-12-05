import { describe, it, expect } from 'vitest';
import {
  fetchReviewsBySeller,
} from '../reviewService';
import { isSuccess } from '@/types/api';

describe('Review Service', () => {
  describe('fetchReviewsBySeller', () => {
    it('should fetch reviews by seller from real server', async () => {
      const result = await fetchReviewsBySeller('00000000-0000-0000-0000-000000000000');

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });
});
