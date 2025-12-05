import { describe, it, expect } from 'vitest';
import {
  fetchActiveProhibitedWords,
  fetchAllProhibitedWords,
} from '../prohibitedWordsService';
import { isSuccess } from '@/types/api';

describe('Prohibited Words Service', () => {
  describe('fetchActiveProhibitedWords', () => {
    it('should fetch active prohibited words from real server', async () => {
      const result = await fetchActiveProhibitedWords();

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });

  describe('fetchAllProhibitedWords', () => {
    it('should fetch all prohibited words from real server', async () => {
      const result = await fetchAllProhibitedWords();

      expect(result.success).toBe(true);
      if (isSuccess(result)) {
        expect(Array.isArray(result.data)).toBe(true);
        if (result.data.length > 0) {
          expect(result.data[0]).toHaveProperty('id');
          expect(result.data[0]).toHaveProperty('word');
        }
      }
    });
  });
});
