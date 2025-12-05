import { describe, it, expect, vi } from 'vitest';
import { applyListingFilters, applyDirectListingFilters } from '../listingFilterUtils';

describe('Listing Filter Utils', () => {
  describe('applyListingFilters', () => {
    it('should apply category filter', () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
      };

      applyListingFilters(mockQuery as any, {
        activeCategory: 'cat-1',
        activeSubcategory: null,
        activeSubSubcategory: null,
        isSubSubcategoryPage: false,
        selectedBrands: new Set<string>(),
        selectedLowestLevel: new Set<string>(),
      });

      expect(mockQuery.eq).toHaveBeenCalledWith('listings.category_id', 'cat-1');
    });

    it('should apply subcategory filter', () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
      };

      applyListingFilters(mockQuery as any, {
        activeCategory: 'cat-1',
        activeSubcategory: 'sub-1',
        activeSubSubcategory: null,
        isSubSubcategoryPage: false,
        selectedBrands: new Set<string>(),
        selectedLowestLevel: new Set<string>(),
      });

      expect(mockQuery.eq).toHaveBeenCalledWith('listings.subcategory_id', 'sub-1');
    });

    it('should apply sub-subcategory filter when isSubSubcategoryPage is true', () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
      };

      applyListingFilters(mockQuery as any, {
        activeCategory: 'cat-1',
        activeSubcategory: 'sub-1',
        activeSubSubcategory: 'subsub-1',
        isSubSubcategoryPage: true,
        selectedBrands: new Set<string>(),
        selectedLowestLevel: new Set<string>(),
      });

      expect(mockQuery.eq).toHaveBeenCalledWith('listings.sub_subcategory_id', 'subsub-1');
    });

    it('should not apply sub-subcategory filter when isSubSubcategoryPage is false', () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
      };

      applyListingFilters(mockQuery as any, {
        activeCategory: 'cat-1',
        activeSubcategory: 'sub-1',
        activeSubSubcategory: 'subsub-1',
        isSubSubcategoryPage: false,
        selectedBrands: new Set<string>(),
        selectedLowestLevel: new Set<string>(),
      });

      expect(mockQuery.eq).not.toHaveBeenCalledWith('listings.sub_subcategory_id', 'subsub-1');
    });

    it('should apply brand filters', () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
      };

      applyListingFilters(mockQuery as any, {
        activeCategory: null,
        activeSubcategory: null,
        activeSubSubcategory: null,
        isSubSubcategoryPage: false,
        selectedBrands: new Set<string>(['brand-1', 'brand-2']),
        selectedLowestLevel: new Set<string>(),
      });

      expect(mockQuery.in).toHaveBeenCalledWith('listings.brand_id', ['brand-1', 'brand-2']);
    });

    it('should apply lowest level category filters', () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
      };

      applyListingFilters(mockQuery as any, {
        activeCategory: null,
        activeSubcategory: null,
        activeSubSubcategory: null,
        isSubSubcategoryPage: false,
        selectedBrands: new Set<string>(),
        selectedLowestLevel: new Set<string>(['level4-1', 'level4-2']),
      });

      expect(mockQuery.in).toHaveBeenCalledWith('listings.sub_sub_subcategory_id', ['level4-1', 'level4-2']);
    });

    it('should apply all filters together', () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
      };

      applyListingFilters(mockQuery as any, {
        activeCategory: 'cat-1',
        activeSubcategory: 'sub-1',
        activeSubSubcategory: 'subsub-1',
        isSubSubcategoryPage: true,
        selectedBrands: new Set<string>(['brand-1']),
        selectedLowestLevel: new Set<string>(['level4-1']),
      });

      expect(mockQuery.eq).toHaveBeenCalledWith('listings.category_id', 'cat-1');
      expect(mockQuery.eq).toHaveBeenCalledWith('listings.subcategory_id', 'sub-1');
      expect(mockQuery.eq).toHaveBeenCalledWith('listings.sub_subcategory_id', 'subsub-1');
      expect(mockQuery.in).toHaveBeenCalledWith('listings.brand_id', ['brand-1']);
      expect(mockQuery.in).toHaveBeenCalledWith('listings.sub_sub_subcategory_id', ['level4-1']);
    });
  });

  describe('applyDirectListingFilters', () => {
    it('should apply category filter without listings prefix', () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
      };

      applyDirectListingFilters(mockQuery as any, {
        activeCategory: 'cat-1',
        activeSubcategory: null,
        activeSubSubcategory: null,
        isSubSubcategoryPage: false,
        selectedLowestLevel: new Set<string>(),
      });

      expect(mockQuery.eq).toHaveBeenCalledWith('category_id', 'cat-1');
    });

    it('should apply subcategory filter without listings prefix', () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
      };

      applyDirectListingFilters(mockQuery as any, {
        activeCategory: 'cat-1',
        activeSubcategory: 'sub-1',
        activeSubSubcategory: null,
        isSubSubcategoryPage: false,
        selectedLowestLevel: new Set<string>(),
      });

      expect(mockQuery.eq).toHaveBeenCalledWith('subcategory_id', 'sub-1');
    });

    it('should apply lowest level category filters without listings prefix', () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
      };

      applyDirectListingFilters(mockQuery as any, {
        activeCategory: null,
        activeSubcategory: null,
        activeSubSubcategory: null,
        isSubSubcategoryPage: false,
        selectedLowestLevel: new Set<string>(['level4-1']),
      });

      expect(mockQuery.in).toHaveBeenCalledWith('sub_sub_subcategory_id', ['level4-1']);
    });
  });
});
