import { describe, it, expect } from 'vitest';
import { groupByNameWithIds } from '../groupUtils';

describe('Group Utils', () => {
  describe('groupByNameWithIds', () => {
    it('should group items by name and collect IDs', () => {
      const items = [
        { id: 'id-1', name: 'Category A' },
        { id: 'id-2', name: 'Category B' },
        { id: 'id-3', name: 'Category A' },
      ];

      const result = groupByNameWithIds(items);

      expect(result).toHaveLength(2);
      expect(result.find((g) => g.name === 'Category A')?.ids).toEqual(['id-1', 'id-3']);
      expect(result.find((g) => g.name === 'Category B')?.ids).toEqual(['id-2']);
    });

    it('should handle empty array', () => {
      const result = groupByNameWithIds([]);
      expect(result).toEqual([]);
    });

    it('should handle single item', () => {
      const items = [{ id: 'id-1', name: 'Category A' }];
      const result = groupByNameWithIds(items);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Category A');
      expect(result[0].ids).toEqual(['id-1']);
    });

    it('should handle items with same name but different IDs', () => {
      const items = [
        { id: 'id-1', name: 'Same Name' },
        { id: 'id-2', name: 'Same Name' },
        { id: 'id-3', name: 'Same Name' },
      ];

      const result = groupByNameWithIds(items);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Same Name');
      expect(result[0].ids).toEqual(['id-1', 'id-2', 'id-3']);
    });
  });
});
