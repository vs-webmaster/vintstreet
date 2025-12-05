import { describe, it, expect } from 'vitest';
import {
  checkFollowStatus,
  fetchFollowing,
  fetchFollowers,
} from '../followService';
import { isSuccess } from '@/types/api';

describe('Follow Service', () => {
  describe('checkFollowStatus', () => {
    it('should check follow status structure', async () => {
      const result = await checkFollowStatus('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001');

      // May succeed with null data or fail - both are valid
      expect(result).toHaveProperty('success');
      if (result.success) {
        expect(result.data === null || typeof result.data === 'object').toBe(true);
      }
    });
  });

  describe('fetchFollowing', () => {
    it('should fetch following list structure', async () => {
      const result = await fetchFollowing('00000000-0000-0000-0000-000000000000');

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });

  describe('fetchFollowers', () => {
    it('should fetch followers list structure', async () => {
      const result = await fetchFollowers('00000000-0000-0000-0000-000000000000');

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });
});
