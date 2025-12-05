import { describe, it, expect } from 'vitest';
import {
  fetchProductAttributes,
  fetchProductAttributeByName,
  fetchAttributesByIds,
  fetchAttributeByName,
  fetchColorAttributeOptions,
} from '../attributeService';
import { isSuccess } from '@/types/api';

describe('Attribute Service', () => {
  describe('fetchProductAttributes', () => {
    it('should fetch product attributes structure from real server', async () => {
      const result = await fetchProductAttributes('00000000-0000-0000-0000-000000000000');

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });

  describe('fetchProductAttributeByName', () => {
    it('should handle non-existent attribute gracefully', async () => {
      const result = await fetchProductAttributeByName('00000000-0000-0000-0000-000000000000', 'nonexistent');

      expect(result).toHaveProperty('success');
    });
  });

  describe('fetchAttributesByIds', () => {
    it('should fetch attributes by IDs structure from real server', async () => {
      const result = await fetchAttributesByIds(['00000000-0000-0000-0000-000000000000']);

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });

  describe('fetchAttributeByName', () => {
    it('should handle non-existent attribute name gracefully', async () => {
      const result = await fetchAttributeByName('nonexistent-attribute-name-12345');

      expect(result).toHaveProperty('success');
    });
  });

  describe('fetchColorAttributeOptions', () => {
    it('should fetch color attribute options structure from real server', async () => {
      const result = await fetchColorAttributeOptions();

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });
});
