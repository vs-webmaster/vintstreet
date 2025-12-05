import { describe, it, expect } from 'vitest';
import {
  filterByField,
  filterByCategoryId,
  filterBySubcategoryId,
  filterBySubSubcategoryId,
} from '../filterUtils';

interface TestItem {
  id: string;
  name: string;
  category_id?: string;
  subcategory_id?: string;
  sub_subcategory_id?: string;
}

interface CategoryItem {
  id: string;
  name: string;
  category_id: string;
}

interface SubcategoryItem {
  id: string;
  name: string;
  subcategory_id: string;
}

interface SubSubcategoryItem {
  id: string;
  name: string;
  sub_subcategory_id: string;
}

describe('Filter Utils', () => {
  const mockItems: TestItem[] = [
    { id: '1', name: 'Item 1', category_id: 'cat-1', subcategory_id: 'sub-1', sub_subcategory_id: 'subsub-1' },
    { id: '2', name: 'Item 2', category_id: 'cat-1', subcategory_id: 'sub-2', sub_subcategory_id: 'subsub-2' },
    { id: '3', name: 'Item 3', category_id: 'cat-2', subcategory_id: 'sub-1', sub_subcategory_id: 'subsub-1' },
    { id: '4', name: 'Item 4', category_id: 'cat-2' },
  ];

  const categoryItems: CategoryItem[] = [
    { id: '1', name: 'Item 1', category_id: 'cat-1' },
    { id: '2', name: 'Item 2', category_id: 'cat-1' },
    { id: '3', name: 'Item 3', category_id: 'cat-2' },
  ];

  const subcategoryItems: SubcategoryItem[] = [
    { id: '1', name: 'Item 1', subcategory_id: 'sub-1' },
    { id: '2', name: 'Item 2', subcategory_id: 'sub-2' },
    { id: '3', name: 'Item 3', subcategory_id: 'sub-1' },
  ];

  const subSubcategoryItems: SubSubcategoryItem[] = [
    { id: '1', name: 'Item 1', sub_subcategory_id: 'subsub-1' },
    { id: '2', name: 'Item 2', sub_subcategory_id: 'subsub-2' },
    { id: '3', name: 'Item 3', sub_subcategory_id: 'subsub-1' },
  ];

  describe('filterByField', () => {
    it('should filter items by field value', () => {
      const result = filterByField(mockItems, 'category_id', 'cat-1');
      expect(result).toHaveLength(2);
      expect(result.every(item => item.category_id === 'cat-1')).toBe(true);
    });

    it('should return empty array when no matches found', () => {
      const result = filterByField(mockItems, 'category_id', 'nonexistent');
      expect(result).toEqual([]);
    });

    it('should handle null/undefined arrays', () => {
      expect(filterByField<TestItem, 'category_id'>(null, 'category_id', 'cat-1')).toEqual([]);
      expect(filterByField<TestItem, 'category_id'>(undefined, 'category_id', 'cat-1')).toEqual([]);
    });

    it('should filter by different field types', () => {
      const result = filterByField(mockItems, 'name', 'Item 1');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Item 1');
    });
  });

  describe('filterByCategoryId', () => {
    it('should filter items by category_id', () => {
      const result = filterByCategoryId(categoryItems, 'cat-1');
      expect(result).toHaveLength(2);
      expect(result.every(item => item.category_id === 'cat-1')).toBe(true);
    });

    it('should return empty array when category not found', () => {
      const result = filterByCategoryId(categoryItems, 'nonexistent');
      expect(result).toEqual([]);
    });
  });

  describe('filterBySubcategoryId', () => {
    it('should filter items by subcategory_id', () => {
      const result = filterBySubcategoryId(subcategoryItems, 'sub-1');
      expect(result).toHaveLength(2);
      expect(result.every(item => item.subcategory_id === 'sub-1')).toBe(true);
    });
  });

  describe('filterBySubSubcategoryId', () => {
    it('should filter items by sub_subcategory_id', () => {
      const result = filterBySubSubcategoryId(subSubcategoryItems, 'subsub-1');
      expect(result).toHaveLength(2);
      expect(result.every(item => item.sub_subcategory_id === 'subsub-1')).toBe(true);
    });
  });
});
