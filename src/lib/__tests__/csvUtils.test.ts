import { describe, it, expect } from 'vitest';
import { escapeCsv } from '../csvUtils';

describe('CSV Utils', () => {
  describe('escapeCsv', () => {
    it('should return empty string for null', () => {
      expect(escapeCsv(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(escapeCsv(undefined)).toBe('');
    });

    it('should return string as-is for simple values', () => {
      expect(escapeCsv('simple')).toBe('simple');
      expect(escapeCsv('123')).toBe('123');
    });

    it('should escape values containing commas', () => {
      expect(escapeCsv('value,with,commas')).toBe('"value,with,commas"');
    });

    it('should escape values containing quotes', () => {
      expect(escapeCsv('value"with"quotes')).toBe('"value""with""quotes"');
    });

    it('should escape values containing newlines', () => {
      expect(escapeCsv('value\nwith\nnewlines')).toBe('"value\nwith\nnewlines"');
    });

    it('should escape values with multiple special characters', () => {
      expect(escapeCsv('value,with"quotes\nand\nnewlines')).toBe('"value,with""quotes\nand\nnewlines"');
    });

    it('should handle numbers', () => {
      expect(escapeCsv(123)).toBe('123');
      expect(escapeCsv(123.45)).toBe('123.45');
    });

    it('should handle boolean values', () => {
      expect(escapeCsv(true)).toBe('true');
      expect(escapeCsv(false)).toBe('false');
    });

    it('should handle values with commas and quotes', () => {
      const result = escapeCsv('text,with"quotes');
      expect(result).toContain('"');
      expect(result).toContain('""');
    });
  });
});
