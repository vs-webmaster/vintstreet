import { describe, it, expect } from 'vitest';
import {
  fetchOffersBySeller,
  fetchOffersByBuyer,
} from '../offerService';
import { isSuccess } from '@/types/api';

describe('Offer Service', () => {
  describe('fetchOffersBySeller', () => {
    it('should fetch offers by seller from real server', async () => {
      const result = await fetchOffersBySeller('00000000-0000-0000-0000-000000000000');

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });

  describe('fetchOffersByBuyer', () => {
    it('should fetch offers by buyer from real server', async () => {
      const result = await fetchOffersByBuyer('00000000-0000-0000-0000-000000000000');

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });
});
