import { describe, it, expect } from 'vitest';
import {
  parseSetFromUrl,
  syncSetToUrlParam,
  syncStringToUrlParam,
  createFilterStateFromUrl,
  syncFiltersToUrlParams,
} from '../urlFilterUtils';

describe('URL Filter Utils', () => {
  describe('parseSetFromUrl', () => {
    it('should parse comma-separated string into Set', () => {
      const result = parseSetFromUrl('brand1,brand2,brand3');
      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBe(3);
      expect(result.has('brand1')).toBe(true);
      expect(result.has('brand2')).toBe(true);
      expect(result.has('brand3')).toBe(true);
    });

    it('should return empty Set for null input', () => {
      const result = parseSetFromUrl(null);
      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBe(0);
    });

    it('should handle single value', () => {
      const result = parseSetFromUrl('brand1');
      expect(result.size).toBe(1);
      expect(result.has('brand1')).toBe(true);
    });

    it('should handle empty string', () => {
      const result = parseSetFromUrl('');
      expect(result.size).toBe(0);
    });
  });

  describe('syncSetToUrlParam', () => {
    it('should set URL param when Set has values', () => {
      const params = new URLSearchParams();
      const value = new Set(['brand1', 'brand2']);
      
      syncSetToUrlParam(params, 'brands', value);
      
      expect(params.get('brands')).toBe('brand1,brand2');
    });

    it('should delete URL param when Set is empty', () => {
      const params = new URLSearchParams();
      params.set('brands', 'brand1');
      const value = new Set<string>();
      
      syncSetToUrlParam(params, 'brands', value);
      
      expect(params.has('brands')).toBe(false);
    });
  });

  describe('syncStringToUrlParam', () => {
    it('should set URL param when value differs from default', () => {
      const params = new URLSearchParams();
      
      syncStringToUrlParam(params, 'price', 'high', 'all');
      
      expect(params.get('price')).toBe('high');
    });

    it('should delete URL param when value matches default', () => {
      const params = new URLSearchParams();
      params.set('price', 'all');
      
      syncStringToUrlParam(params, 'price', 'all', 'all');
      
      expect(params.has('price')).toBe(false);
    });

    it('should use "all" as default when not specified', () => {
      const params = new URLSearchParams();
      
      syncStringToUrlParam(params, 'price', 'all');
      
      expect(params.has('price')).toBe(false);
    });
  });

  describe('createFilterStateFromUrl', () => {
    it('should create filter state from URL params', () => {
      const searchParams = new URLSearchParams('brands=brand1,brand2&colors=red&price=high');
      
      const result = createFilterStateFromUrl(searchParams);
      
      // Use type assertions to ensure correct Set<string> types
      const brandsSet = result.selectedBrands as Set<string>;
      const colorsSet = result.selectedColors as Set<string>;
      
      expect(brandsSet).toBeInstanceOf(Set);
      expect(brandsSet.has('brand1')).toBe(true);
      expect(brandsSet.has('brand2')).toBe(true);
      expect(colorsSet.has('red')).toBe(true);
      expect(result.selectedPriceRange).toBe('high');
    });

    it('should use default price range when not in URL', () => {
      const searchParams = new URLSearchParams('brands=brand1');
      
      const result = createFilterStateFromUrl(searchParams);
      
      expect(result.selectedPriceRange).toBe('all');
    });
  });

  describe('syncFiltersToUrlParams', () => {
    it('should sync all filters to URL params', () => {
      const params = new URLSearchParams();
      const filters = {
        selectedBrands: new Set(['brand1', 'brand2']),
        selectedColors: new Set(['red']),
        selectedSizes: new Set(['M']),
        selectedPriceRange: 'high',
      };
      
      syncFiltersToUrlParams(params, filters);
      
      expect(params.get('brands')).toBe('brand1,brand2');
      expect(params.get('colors')).toBe('red');
      expect(params.get('sizes')).toBe('M');
      expect(params.get('price')).toBe('high');
    });

    it('should delete params when filters are empty', () => {
      const params = new URLSearchParams('brands=brand1&price=high');
      const filters = {
        selectedBrands: new Set<string>(),
        selectedColors: new Set<string>(),
        selectedSizes: new Set<string>(),
        selectedPriceRange: 'all',
      };
      
      syncFiltersToUrlParams(params, filters);
      
      expect(params.has('brands')).toBe(false);
      expect(params.has('price')).toBe(false);
    });
  });
});
