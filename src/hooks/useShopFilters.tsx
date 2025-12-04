// Shop Filters Hook
// Centralized filter state management for ShopPage

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { parseSetFromUrl, syncSetToUrlParam, syncStringToUrlParam } from '@/lib/urlFilterUtils';

export interface ShopFiltersState {
  selectedLowestLevel: Set<string>;
  selectedBrands: Set<string>;
  selectedColors: Set<string>;
  selectedSizes: Set<string>;
  selectedPriceRange: string;
  selectedAttributes: Map<string, Set<string>>;
  sortBy: string;
}

export interface ShopFiltersActions {
  setSelectedLowestLevel: (levels: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  setSelectedBrands: (brands: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  setSelectedColors: (colors: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  setSelectedSizes: (sizes: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  setSelectedPriceRange: (value: string | ((prev: string) => string)) => void;
  setSelectedAttributes: (attrs: Map<string, Set<string>> | ((prev: Map<string, Set<string>>) => Map<string, Set<string>>)) => void;
  setSortBy: (sort: string) => void;
  clearAllFilters: () => void;
  handleCategoryChange: (categoryId: string, checked: boolean) => void;
  handleBrandChange: (brandId: string, checked: boolean) => void;
  handleColorChange: (color: string, checked: boolean) => void;
  handleSizeChange: (size: string, checked: boolean) => void;
  handlePriceRangeChange: (value: string) => void;
  handleAttributeChange: (attributeId: string, value: string, checked: boolean) => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
}

export type UseShopFiltersReturn = ShopFiltersState & ShopFiltersActions;

// Parse attributes from URL param string
const parseAttributesFromUrl = (attrs: string | null): Map<string, Set<string>> => {
  if (!attrs) return new Map();
  
  const map = new Map<string, Set<string>>();
  const pairs = attrs.split('|');
  pairs.forEach((pair) => {
    const [attrId, values] = pair.split(':');
    if (attrId && values) {
      map.set(attrId, new Set(values.split(',')));
    }
  });
  return map;
};

// Serialize attributes to URL param string
const serializeAttributesToUrl = (attrs: Map<string, Set<string>>): string => {
  return Array.from(attrs.entries())
    .filter(([_, values]) => values.size > 0)
    .map(([attrId, values]) => `${attrId}:${Array.from(values).join(',')}`)
    .join('|');
};

export const useShopFilters = (): UseShopFiltersReturn => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize filter state from URL params
  const [selectedLowestLevel, setSelectedLowestLevelState] = useState<Set<string>>(() => 
    parseSetFromUrl(searchParams.get('levels'))
  );

  const [selectedBrands, setSelectedBrandsState] = useState<Set<string>>(() => 
    parseSetFromUrl(searchParams.get('brands'))
  );

  const [selectedColors, setSelectedColorsState] = useState<Set<string>>(() => 
    parseSetFromUrl(searchParams.get('colors'))
  );

  const [selectedSizes, setSelectedSizesState] = useState<Set<string>>(() => 
    parseSetFromUrl(searchParams.get('sizes'))
  );

  const [selectedPriceRange, setSelectedPriceRangeState] = useState(() => 
    searchParams.get('price') || 'all'
  );

  const [selectedAttributes, setSelectedAttributesState] = useState<Map<string, Set<string>>>(() => 
    parseAttributesFromUrl(searchParams.get('attributes'))
  );

  const [sortBy, setSortBy] = useState(() => searchParams.get('sort') || 'featured');

  // Wrapper functions that update state
  const setSelectedLowestLevel = useCallback((levels: Set<string> | ((prev: Set<string>) => Set<string>)) => {
    setSelectedLowestLevelState((prev) => typeof levels === 'function' ? levels(prev) : levels);
  }, []);

  const setSelectedBrands = useCallback((brands: Set<string> | ((prev: Set<string>) => Set<string>)) => {
    setSelectedBrandsState((prev) => typeof brands === 'function' ? brands(prev) : brands);
  }, []);

  const setSelectedColors = useCallback((colors: Set<string> | ((prev: Set<string>) => Set<string>)) => {
    setSelectedColorsState((prev) => typeof colors === 'function' ? colors(prev) : colors);
  }, []);

  const setSelectedSizes = useCallback((sizes: Set<string> | ((prev: Set<string>) => Set<string>)) => {
    setSelectedSizesState((prev) => typeof sizes === 'function' ? sizes(prev) : sizes);
  }, []);

  const setSelectedPriceRange = useCallback((value: string | ((prev: string) => string)) => {
    setSelectedPriceRangeState((prev) => typeof value === 'function' ? value(prev) : value);
  }, []);

  const setSelectedAttributes = useCallback(
    (attrs: Map<string, Set<string>> | ((prev: Map<string, Set<string>>) => Map<string, Set<string>>)) => {
      setSelectedAttributesState((prev) => typeof attrs === 'function' ? attrs(prev) : attrs);
    },
    []
  );

  // Handler functions for filter changes
  const handleCategoryChange = useCallback((categoryId: string, checked: boolean) => {
    setSelectedLowestLevelState((prev) => {
      const newCategories = new Set(prev);
      if (checked) {
        newCategories.add(categoryId);
      } else {
        newCategories.delete(categoryId);
      }
      return newCategories;
    });
  }, []);

  const handleBrandChange = useCallback((brandId: string, checked: boolean) => {
    setSelectedBrandsState((prev) => {
      const newBrands = new Set(prev);
      if (checked) {
        newBrands.add(brandId);
      } else {
        newBrands.delete(brandId);
      }
      return newBrands;
    });
  }, []);

  const handleColorChange = useCallback((color: string, checked: boolean) => {
    setSelectedColorsState((prev) => {
      const newColors = new Set(prev);
      if (checked) {
        newColors.add(color);
      } else {
        newColors.delete(color);
      }
      return newColors;
    });
  }, []);

  const handleSizeChange = useCallback((size: string, checked: boolean) => {
    setSelectedSizesState((prev) => {
      const newSizes = new Set(prev);
      if (checked) {
        newSizes.add(size);
      } else {
        newSizes.delete(size);
      }
      return newSizes;
    });
  }, []);

  const handlePriceRangeChange = useCallback((value: string) => {
    setSelectedPriceRangeState(value);
  }, []);

  const handleAttributeChange = useCallback((attributeId: string, value: string, checked: boolean) => {
    setSelectedAttributesState((prev) => {
      const newMap = new Map(prev);
      const currentValues = newMap.get(attributeId) || new Set();
      const newValues = new Set(currentValues);
      
      if (checked) {
        newValues.add(value);
      } else {
        newValues.delete(value);
      }
      
      if (newValues.size > 0) {
        newMap.set(attributeId, newValues);
      } else {
        newMap.delete(attributeId);
      }
      
      return newMap;
    });
  }, []);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSelectedLowestLevelState(new Set());
    setSelectedBrandsState(new Set());
    setSelectedColorsState(new Set());
    setSelectedSizesState(new Set());
    setSelectedPriceRangeState('all');
    setSelectedAttributesState(new Map());
    
    // Also clear URL params
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      ['levels', 'brands', 'colors', 'sizes', 'price', 'attributes'].forEach((key) => params.delete(key));
      return params;
    }, { replace: true });
  }, [setSearchParams]);

  // Check if any filters are applied
  const hasActiveFilters =
    selectedLowestLevel.size > 0 ||
    selectedBrands.size > 0 ||
    selectedColors.size > 0 ||
    selectedSizes.size > 0 ||
    selectedPriceRange !== 'all' ||
    selectedAttributes.size > 0;

  // Count active filters
  const activeFilterCount =
    selectedLowestLevel.size +
    selectedBrands.size +
    selectedColors.size +
    selectedSizes.size +
    (selectedPriceRange !== 'all' ? 1 : 0) +
    Array.from(selectedAttributes.values()).reduce((sum, set) => sum + set.size, 0);

  // Sync URL params with state changes
  useEffect(() => {
    setSearchParams(
      (prev) => {
        const newParams = new URLSearchParams(prev);

        // Update levels param
        syncSetToUrlParam(newParams, 'levels', selectedLowestLevel);

        // Update brands param
        syncSetToUrlParam(newParams, 'brands', selectedBrands);

        // Update colors param
        syncSetToUrlParam(newParams, 'colors', selectedColors);

        // Update sizes param
        syncSetToUrlParam(newParams, 'sizes', selectedSizes);

        // Update price param
        syncStringToUrlParam(newParams, 'price', selectedPriceRange, 'all');

        // Update attributes param
        if (selectedAttributes.size > 0) {
          const attrString = serializeAttributesToUrl(selectedAttributes);
          if (attrString) {
            newParams.set('attributes', attrString);
          } else {
            newParams.delete('attributes');
          }
        } else {
          newParams.delete('attributes');
        }

        // Update sort param
        syncStringToUrlParam(newParams, 'sort', sortBy, 'featured');

        return newParams;
      },
      { replace: true }
    );
  }, [
    selectedLowestLevel,
    selectedBrands,
    selectedColors,
    selectedSizes,
    selectedPriceRange,
    selectedAttributes,
    sortBy,
    setSearchParams,
  ]);

  return {
    // State
    selectedLowestLevel,
    selectedBrands,
    selectedColors,
    selectedSizes,
    selectedPriceRange,
    selectedAttributes,
    sortBy,
    // Setters
    setSelectedLowestLevel,
    setSelectedBrands,
    setSelectedColors,
    setSelectedSizes,
    setSelectedPriceRange,
    setSelectedAttributes,
    setSortBy,
    // Handlers
    handleCategoryChange,
    handleBrandChange,
    handleColorChange,
    handleSizeChange,
    handlePriceRangeChange,
    handleAttributeChange,
    clearAllFilters,
    // Computed
    hasActiveFilters,
    activeFilterCount,
  };
};
