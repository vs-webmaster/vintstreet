import { describe, it, expect } from 'vitest';
import {
  getPublicUrl,
} from '../storageService';

describe('Storage Service', () => {
  describe('getPublicUrl', () => {
    it('should return public URL structure', () => {
      const url = getPublicUrl('product-images', 'test/path.jpg');
      expect(typeof url).toBe('string');
      expect(url).toBeTruthy();
    });
  });
});
