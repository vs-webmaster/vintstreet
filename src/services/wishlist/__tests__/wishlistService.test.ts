import { describe, it, expect } from 'vitest';
import {
  loadWishlist,
  checkWishlistItem,
} from '../wishlistService';
import { isSuccess } from '@/types/api';

describe('Wishlist Service', () => {
  describe('loadWishlist', () => {
    it('should load wishlist structure from real server', async () => {
      const result = await loadWishlist('00000000-0000-0000-0000-000000000000');

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });

  describe('checkWishlistItem', () => {
    it('should check wishlist item structure from real server', async () => {
      const result = await checkWishlistItem('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001');

      expect(result).toHaveProperty('success');
    });
  });
});
