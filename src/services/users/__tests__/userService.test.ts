import { describe, it, expect } from 'vitest';
import {
  fetchProfile,
  fetchSellerProfile,
  fetchBuyerProfile,
  fetchUserRole,
} from '../userService';
import { isSuccess } from '@/types/api';

describe('User Service', () => {
  describe('fetchProfile', () => {
    it('should handle non-existent profile gracefully', async () => {
      const result = await fetchProfile('00000000-0000-0000-0000-000000000000');

      expect(result).toHaveProperty('success');
    });
  });

  describe('fetchSellerProfile', () => {
    it('should handle non-existent seller profile gracefully', async () => {
      const result = await fetchSellerProfile('00000000-0000-0000-0000-000000000000');

      expect(result).toHaveProperty('success');
    });
  });

  describe('fetchBuyerProfile', () => {
    it('should handle non-existent buyer profile gracefully', async () => {
      const result = await fetchBuyerProfile('00000000-0000-0000-0000-000000000000');

      expect(result).toHaveProperty('success');
    });
  });

  describe('fetchUserRole', () => {
    it('should fetch user role structure from real server', async () => {
      const result = await fetchUserRole('00000000-0000-0000-0000-000000000000');

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(typeof result.data).toBe('string');
      }
    });
  });
});
