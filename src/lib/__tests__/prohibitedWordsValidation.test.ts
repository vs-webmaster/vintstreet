import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchProhibitedWords,
  clearProhibitedWordsCache,
  checkForProhibitedWords,
  validateProductInput,
} from '../prohibitedWordsValidation';
import * as prohibitedWordsService from '@/services/prohibitedWords';

vi.mock('@/services/prohibitedWords');

describe('Prohibited Words Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearProhibitedWordsCache();
  });

  describe('fetchProhibitedWords', () => {
    it('should fetch prohibited words from service', async () => {
      vi.mocked(prohibitedWordsService.fetchActiveProhibitedWords).mockResolvedValue({
        success: true,
        data: ['spam', 'badword'],
      });

      const words = await fetchProhibitedWords();

      expect(words).toEqual(['spam', 'badword']);
      expect(prohibitedWordsService.fetchActiveProhibitedWords).toHaveBeenCalled();
    });

    it('should use cache for subsequent calls', async () => {
      vi.mocked(prohibitedWordsService.fetchActiveProhibitedWords).mockResolvedValue({
        success: true,
        data: ['spam'],
      });

      await fetchProhibitedWords();
      await fetchProhibitedWords();

      expect(prohibitedWordsService.fetchActiveProhibitedWords).toHaveBeenCalledTimes(1);
    });

    it('should return empty array on error', async () => {
      vi.mocked(prohibitedWordsService.fetchActiveProhibitedWords).mockResolvedValue({
        success: false,
        error: { message: 'Error', code: 'ERROR' },
      });

      const words = await fetchProhibitedWords();

      expect(words).toEqual([]);
    });
  });

  describe('clearProhibitedWordsCache', () => {
    it('should clear the cache', async () => {
      vi.mocked(prohibitedWordsService.fetchActiveProhibitedWords).mockResolvedValue({
        success: true,
        data: ['spam'],
      });

      await fetchProhibitedWords();
      clearProhibitedWordsCache();
      await fetchProhibitedWords();

      expect(prohibitedWordsService.fetchActiveProhibitedWords).toHaveBeenCalledTimes(2);
    });
  });

  describe('checkForProhibitedWords', () => {
    it('should detect prohibited words in text', async () => {
      vi.mocked(prohibitedWordsService.fetchActiveProhibitedWords).mockResolvedValue({
        success: true,
        data: ['spam', 'badword'],
      });

      const found = await checkForProhibitedWords('This is spam content');

      expect(found).toContain('spam');
    });

    it('should return empty array for clean text', async () => {
      vi.mocked(prohibitedWordsService.fetchActiveProhibitedWords).mockResolvedValue({
        success: true,
        data: ['spam'],
      });

      const found = await checkForProhibitedWords('This is clean content');

      expect(found).toEqual([]);
    });

    it('should return empty array for empty text', async () => {
      const found = await checkForProhibitedWords('');
      expect(found).toEqual([]);
    });

    it('should handle case insensitive matching', async () => {
      vi.mocked(prohibitedWordsService.fetchActiveProhibitedWords).mockResolvedValue({
        success: true,
        data: ['spam'],
      });

      const found = await checkForProhibitedWords('This is SPAM content');

      expect(found).toContain('spam');
    });
  });

  describe('validateProductInput', () => {
    it('should validate product name and description', async () => {
      vi.mocked(prohibitedWordsService.fetchActiveProhibitedWords).mockResolvedValue({
        success: true,
        data: ['spam'],
      });

      const result = await validateProductInput('Clean Product', 'Clean description');

      expect(result.isValid).toBe(true);
      expect(result.foundWords).toEqual([]);
    });

    it('should detect prohibited words in product name', async () => {
      vi.mocked(prohibitedWordsService.fetchActiveProhibitedWords).mockResolvedValue({
        success: true,
        data: ['spam'],
      });

      const result = await validateProductInput('Spam Product', 'Clean description');

      expect(result.isValid).toBe(false);
      expect(result.foundWords).toContain('spam');
      expect(result.message).toBeDefined();
    });

    it('should detect prohibited words in description', async () => {
      vi.mocked(prohibitedWordsService.fetchActiveProhibitedWords).mockResolvedValue({
        success: true,
        data: ['spam'],
      });

      const result = await validateProductInput('Clean Product', 'This is spam description');

      expect(result.isValid).toBe(false);
      expect(result.foundWords).toContain('spam');
    });

    it('should detect multiple prohibited words', async () => {
      vi.mocked(prohibitedWordsService.fetchActiveProhibitedWords).mockResolvedValue({
        success: true,
        data: ['spam', 'badword'],
      });

      const result = await validateProductInput('Spam Product', 'This is badword content');

      expect(result.isValid).toBe(false);
      expect(result.foundWords.length).toBeGreaterThan(0);
    });
  });
});
