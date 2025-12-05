import { describe, it, expect } from 'vitest';
import {
  fetchAddresses,
  fetchAddressById,
} from '../addressService';
import { isSuccess } from '@/types/api';

describe('Address Service', () => {
  describe('fetchAddresses', () => {
    it('should fetch addresses structure from real server', async () => {
      const result = await fetchAddresses('00000000-0000-0000-0000-000000000000');

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });

  describe('fetchAddressById', () => {
    it('should handle non-existent address gracefully', async () => {
      const result = await fetchAddressById('00000000-0000-0000-0000-000000000000');

      expect(result).toHaveProperty('success');
    });
  });
});
