import { describe, it, expect } from 'vitest';
import { cn, uniqueByNameSorted, type NamedItem } from '../utils';

describe('Utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      const result = cn('foo', 'bar');
      expect(result).toContain('foo');
      expect(result).toContain('bar');
    });

    it('should handle conditional class names', () => {
      const isActive = true;
      const result = cn('base', isActive && 'active');
      expect(result).toContain('base');
      expect(result).toContain('active');
    });

    it('should handle undefined and null', () => {
      const result = cn('base', undefined, null);
      expect(result).toBeDefined();
    });
  });

  describe('uniqueByNameSorted', () => {
    const mockItems: NamedItem[] = [
      { id: '1', name: 'Charlie' },
      { id: '2', name: 'Alice' },
      { id: '3', name: 'Bob' },
      { id: '4', name: 'Alice' }, // Duplicate
      { id: '5', name: 'Charlie' }, // Duplicate
    ];

    it('should deduplicate items by name', () => {
      const result = uniqueByNameSorted(mockItems);
      expect(result).toHaveLength(3);
      expect(result.map((item) => item.name)).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    it('should sort items alphabetically by name', () => {
      const unsorted: NamedItem[] = [
        { id: '1', name: 'Zebra' },
        { id: '2', name: 'Alpha' },
        { id: '3', name: 'Beta' },
      ];

      const result = uniqueByNameSorted(unsorted);
      expect(result[0].name).toBe('Alpha');
      expect(result[1].name).toBe('Beta');
      expect(result[2].name).toBe('Zebra');
    });

    it('should handle empty array', () => {
      const result = uniqueByNameSorted([]);
      expect(result).toEqual([]);
    });

    it('should keep first occurrence when duplicates exist', () => {
      const duplicates: NamedItem[] = [
        { id: 'first', name: 'Test' },
        { id: 'second', name: 'Test' },
        { id: 'third', name: 'Test' },
      ];

      const result = uniqueByNameSorted(duplicates);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('first');
    });
  });
});
