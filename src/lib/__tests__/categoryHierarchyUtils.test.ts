import { describe, it, expect } from 'vitest';
import {
  buildCategoryHierarchy,
  buildAdminCategoryHierarchy,
  buildCategoryLevelMaps,
} from '../categoryHierarchyUtils';

interface TestLevel2Category {
  id: string;
  name: string;
  category_id: string;
  [key: string]: unknown;
}

interface TestLevel3Category {
  id: string;
  name: string;
  subcategory_id: string;
  [key: string]: unknown;
}

interface TestLevel4Category {
  id: string;
  name: string;
  sub_subcategory_id: string;
  [key: string]: unknown;
}

describe('Category Hierarchy Utils', () => {
  const mockLevel2: TestLevel2Category[] = [
    { id: 'sub-1', name: 'Subcategory 1', category_id: 'cat-1' },
    { id: 'sub-2', name: 'Subcategory 2', category_id: 'cat-1' },
    { id: 'sub-3', name: 'Subcategory 3', category_id: 'cat-2' },
  ];

  const mockLevel3: TestLevel3Category[] = [
    { id: 'subsub-1', name: 'SubSubcategory 1', subcategory_id: 'sub-1' },
    { id: 'subsub-2', name: 'SubSubcategory 2', subcategory_id: 'sub-1' },
    { id: 'subsub-3', name: 'SubSubcategory 3', subcategory_id: 'sub-2' },
  ];

  const mockLevel4: TestLevel4Category[] = [
    { id: 'subsubsub-1', name: 'SubSubSubcategory 1', sub_subcategory_id: 'subsub-1' },
    { id: 'subsubsub-2', name: 'SubSubSubcategory 2', sub_subcategory_id: 'subsub-1' },
  ];

  describe('buildCategoryHierarchy', () => {
    it('should build nested category hierarchy', () => {
      const result = buildCategoryHierarchy('cat-1', mockLevel2, mockLevel3, mockLevel4);

      expect(result).toHaveLength(2);
      const firstItem = result[0] as Record<string, unknown>;
      expect(firstItem).toHaveProperty('product_sub_subcategories');
      const level3Array = firstItem.product_sub_subcategories as Array<Record<string, unknown>>;
      expect(level3Array).toHaveLength(2);
    });

    it('should return empty array when no level2 items', () => {
      const result = buildCategoryHierarchy('cat-1', null, mockLevel3, mockLevel4);

      expect(result).toEqual([]);
    });

    it('should handle empty level3 and level4 items', () => {
      const result = buildCategoryHierarchy('cat-1', mockLevel2, null, null);

      expect(result).toHaveLength(2);
      const firstItem = result[0] as Record<string, unknown>;
      expect(firstItem).toHaveProperty('product_sub_subcategories');
      const level3Array = firstItem.product_sub_subcategories as Array<Record<string, unknown>>;
      expect(level3Array).toEqual([]);
    });

    it('should use custom property names when provided', () => {
      const result = buildCategoryHierarchy('cat-1', mockLevel2, mockLevel3, mockLevel4, {
        level3Key: 'custom_level3',
        level4Key: 'custom_level4',
      });

      const firstItem = result[0] as Record<string, unknown>;
      expect(firstItem).toHaveProperty('custom_level3');
      const level3Array = firstItem.custom_level3 as Array<Record<string, unknown>>;
      expect(level3Array[0]).toHaveProperty('custom_level4');
    });
  });

  describe('buildAdminCategoryHierarchy', () => {
    it('should build hierarchy with admin property names', () => {
      const result = buildAdminCategoryHierarchy('cat-1', mockLevel2, mockLevel3, mockLevel4);

      expect(result).toHaveLength(2);
      const firstItem = result[0] as Record<string, unknown>;
      expect(firstItem).toHaveProperty('sub_subcategories');
      const level3Array = firstItem.sub_subcategories as Array<Record<string, unknown>>;
      expect(level3Array[0]).toHaveProperty('sub_sub_subcategories');
    });
  });

  describe('buildCategoryLevelMaps', () => {
    it('should create maps from category arrays', () => {
      const categories = [
        { id: 'cat-1', name: 'Category 1', is_active: true },
        { id: 'cat-2', name: 'Category 2', is_active: true },
      ];
      const subcategories = [
        { id: 'sub-1', name: 'Sub 1', category_id: 'cat-1', is_active: true },
      ];
      const subSubcategories: TestLevel3Category[] = [];
      const subSubSubcategories: TestLevel4Category[] = [];

      const maps = buildCategoryLevelMaps(
        categories,
        subcategories,
        subSubcategories,
        subSubSubcategories,
      );

      expect(maps.l1Map).toBeInstanceOf(Map);
      expect(maps.l1Map.size).toBe(2);
      expect(maps.l2Map.size).toBe(1);
    });
  });
});
