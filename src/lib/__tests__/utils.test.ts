import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('Utility Functions', () => {
  describe('cn (className merger)', () => {
    it('should merge class names', () => {
      const result = cn('class1', 'class2');
      expect(result).toContain('class1');
      expect(result).toContain('class2');
    });

    it('should handle conditional classes', () => {
      const condition1 = true;
      const condition2 = false;
      const result = cn('base', condition1 && 'included', condition2 && 'excluded');
      expect(result).toContain('base');
      expect(result).toContain('included');
      expect(result).not.toContain('excluded');
    });

    it('should handle undefined and null', () => {
      const result = cn('base', undefined, null);
      expect(result).toBe('base');
    });
  });
});

