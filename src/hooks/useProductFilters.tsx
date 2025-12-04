// Product Filters Hook
// Handles color, size, and attribute filter queries for shop pages

import { useQuery } from '@tanstack/react-query';
import {
  fetchAttributeByNamePattern,
  fetchProductIdsByAttributeValues,
  fetchAvailableAttributeValues,
} from '@/services/attributes';
import { fetchCategoryFilterSettings } from '@/services/categories';
import { fetchAvailableBrands } from '@/services/products';
import { fetchNonSuspendedSellerIds } from '@/services/users';
import { isFailure } from '@/types/api';

interface UseProductFiltersProps {
  activeCategory: string | null;
  activeSubcategory: string | null;
  activeSubSubcategory: string | null;
  isSubSubcategoryPage: boolean;
  selectedColors: Set<string>;
  selectedSizes: Set<string>;
  selectedBrands: Set<string>;
  selectedLowestLevel: Set<string>;
  colorFilteredProductIds?: string[] | null;
  sizeFilteredProductIds?: string[] | null;
  categoryName?: string;
}

export function useProductFilters({
  activeCategory,
  activeSubcategory,
  activeSubSubcategory,
  isSubSubcategoryPage,
  selectedColors,
  selectedSizes,
  selectedBrands,
  selectedLowestLevel,
  colorFilteredProductIds,
  sizeFilteredProductIds,
  categoryName,
}: UseProductFiltersProps) {
  // Fetch relevant color attribute
  const { data: relevantColorAttribute } = useQuery({
    queryKey: ['relevant-color-attribute'],
    queryFn: async () => {
      // Try color first, then colour
      const colorResult = await fetchAttributeByNamePattern('color');
      if (!isFailure(colorResult) && colorResult.data) {
        return colorResult.data;
      }
      const colourResult = await fetchAttributeByNamePattern('colour');
      if (!isFailure(colourResult) && colourResult.data) {
        return colourResult.data;
      }
      return null;
    },
    staleTime: 1000 * 60 * 30,
  });

  // Fetch relevant size attribute based on category
  const { data: relevantSizeAttribute } = useQuery({
    queryKey: ['relevant-size-attribute', activeCategory, categoryName],
    queryFn: async () => {
      if (!activeCategory && !categoryName) return null;

      const catName = categoryName?.toLowerCase() || '';
      let sizeSearchTerm = '%size%';

      if (catName.includes('men') && !catName.includes('women')) {
        sizeSearchTerm = '%size%men%';
      } else if (catName.includes('women')) {
        sizeSearchTerm = '%size%women%';
      } else if (catName.includes('kid') || catName.includes('junior')) {
        sizeSearchTerm = '%size%junior%';
      }

      const result = await fetchAttributeByNamePattern(sizeSearchTerm.replace(/%/g, ''));
      if (isFailure(result)) return null;
      return result.data;
    },
    enabled: !!activeCategory || !!categoryName,
    staleTime: 1000 * 60 * 30,
  });

  // Fetch color-filtered product IDs
  const { data: colorFilteredIds } = useQuery({
    queryKey: [
      'color-filtered-products',
      Array.from(selectedColors).sort(),
      relevantColorAttribute?.id,
      activeCategory,
      activeSubcategory,
      activeSubSubcategory,
      Array.from(selectedBrands).sort(),
      Array.from(selectedLowestLevel).sort(),
    ],
    enabled: selectedColors.size > 0 && !!relevantColorAttribute?.id,
    queryFn: async () => {
      if (selectedColors.size === 0 || !relevantColorAttribute?.id) return null;

      const sellersResult = await fetchNonSuspendedSellerIds();
      const nonSuspendedSellerIds = isFailure(sellersResult) ? [] : sellersResult.data;

      const result = await fetchProductIdsByAttributeValues({
        attributeId: relevantColorAttribute.id,
        selectedValues: Array.from(selectedColors),
        categoryId: activeCategory || null,
        subcategoryId: activeSubcategory || null,
        subSubcategoryId: activeSubSubcategory || null,
        subSubSubcategoryIds: selectedLowestLevel.size > 0 ? Array.from(selectedLowestLevel) : undefined,
        brandIds: selectedBrands.size > 0 ? Array.from(selectedBrands) : undefined,
        sellerIds: nonSuspendedSellerIds.length > 0 ? nonSuspendedSellerIds : undefined,
        isSubSubcategoryPage,
      });

      if (isFailure(result)) {
        throw result.error;
      }

      return result.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Fetch size-filtered product IDs
  const { data: sizeFilteredIds } = useQuery({
    queryKey: [
      'size-filtered-products',
      Array.from(selectedSizes).sort(),
      relevantSizeAttribute?.id,
      activeCategory,
      activeSubcategory,
      activeSubSubcategory,
      Array.from(selectedBrands).sort(),
      Array.from(selectedLowestLevel).sort(),
    ],
    enabled: selectedSizes.size > 0 && !!relevantSizeAttribute?.id,
    queryFn: async () => {
      if (selectedSizes.size === 0 || !relevantSizeAttribute?.id) return null;

      const sellersResult = await fetchNonSuspendedSellerIds();
      const nonSuspendedSellerIds = isFailure(sellersResult) ? [] : sellersResult.data;

      const result = await fetchProductIdsByAttributeValues({
        attributeId: relevantSizeAttribute.id,
        selectedValues: Array.from(selectedSizes),
        categoryId: activeCategory || null,
        subcategoryId: activeSubcategory || null,
        subSubcategoryId: activeSubSubcategory || null,
        subSubSubcategoryIds: selectedLowestLevel.size > 0 ? Array.from(selectedLowestLevel) : undefined,
        brandIds: selectedBrands.size > 0 ? Array.from(selectedBrands) : undefined,
        sellerIds: nonSuspendedSellerIds.length > 0 ? nonSuspendedSellerIds : undefined,
        isSubSubcategoryPage,
      });

      if (isFailure(result)) {
        throw result.error;
      }

      return result.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Fetch available brands
  const { data: availableBrands = [] } = useQuery({
    queryKey: [
      'available-brands',
      activeCategory,
      activeSubcategory,
      activeSubSubcategory,
      Array.from(selectedLowestLevel).sort(),
    ],
    queryFn: async () => {
      const result = await fetchAvailableBrands({
        categoryId: activeCategory || null,
        subcategoryId: activeSubcategory || null,
        subSubcategoryId: activeSubSubcategory || null,
        subSubSubcategoryIds: selectedLowestLevel.size > 0 ? Array.from(selectedLowestLevel) : undefined,
        isSubSubcategoryPage,
      });

      if (isFailure(result)) {
        throw result.error;
      }

      return result.data;
    },
    enabled: !!activeCategory || !!activeSubcategory || !!activeSubSubcategory || selectedLowestLevel.size > 0,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch available colors
  const { data: availableColors = [] } = useQuery({
    queryKey: [
      'available-colors',
      relevantColorAttribute?.id,
      activeCategory,
      activeSubcategory,
      activeSubSubcategory,
      Array.from(selectedLowestLevel).sort(),
      Array.from(selectedBrands).sort(),
      Array.from(selectedSizes).sort(),
    ],
    queryFn: async () => {
      if (!relevantColorAttribute?.id) return [];

      const sellersResult = await fetchNonSuspendedSellerIds();
      const nonSuspendedSellerIds = isFailure(sellersResult) ? [] : sellersResult.data;

      const result = await fetchAvailableAttributeValues({
        attributeId: relevantColorAttribute.id,
        categoryId: activeCategory || null,
        subcategoryId: activeSubcategory || null,
        subSubcategoryId: activeSubSubcategory || null,
        subSubSubcategoryIds: selectedLowestLevel.size > 0 ? Array.from(selectedLowestLevel) : undefined,
        brandIds: selectedBrands.size > 0 ? Array.from(selectedBrands) : undefined,
        sellerIds: nonSuspendedSellerIds.length > 0 ? nonSuspendedSellerIds : undefined,
        isSubSubcategoryPage,
        filteredProductIds:
          selectedSizes.size > 0 && sizeFilteredProductIds && sizeFilteredProductIds.length > 0
            ? sizeFilteredProductIds
            : undefined,
      });

      if (isFailure(result)) {
        throw result.error;
      }

      return result.data;
    },
    enabled: !!relevantColorAttribute?.id,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch available sizes
  const { data: availableSizes = [] } = useQuery({
    queryKey: [
      'available-sizes',
      relevantSizeAttribute?.id,
      activeCategory,
      activeSubcategory,
      activeSubSubcategory,
      Array.from(selectedLowestLevel).sort(),
      Array.from(selectedBrands).sort(),
      Array.from(selectedColors).sort(),
      colorFilteredProductIds,
    ],
    queryFn: async () => {
      if (!relevantSizeAttribute?.id) return [];

      const sellersResult = await fetchNonSuspendedSellerIds();
      const nonSuspendedSellerIds = isFailure(sellersResult) ? [] : sellersResult.data;

      const result = await fetchAvailableAttributeValues({
        attributeId: relevantSizeAttribute.id,
        categoryId: activeCategory || null,
        subcategoryId: activeSubcategory || null,
        subSubcategoryId: activeSubSubcategory || null,
        subSubSubcategoryIds: selectedLowestLevel.size > 0 ? Array.from(selectedLowestLevel) : undefined,
        brandIds: selectedBrands.size > 0 ? Array.from(selectedBrands) : undefined,
        sellerIds: nonSuspendedSellerIds.length > 0 ? nonSuspendedSellerIds : undefined,
        isSubSubcategoryPage,
        filteredProductIds:
          selectedColors.size > 0 && colorFilteredProductIds && colorFilteredProductIds.length > 0
            ? colorFilteredProductIds
            : undefined,
      });

      if (isFailure(result)) {
        throw result.error;
      }

      return result.data;
    },
    enabled:
      !!relevantSizeAttribute?.id &&
      (!!activeCategory || !!activeSubcategory || !!activeSubSubcategory || selectedLowestLevel.size > 0) &&
      (!selectedColors.size || (selectedColors.size > 0 && colorFilteredProductIds !== undefined)),
    staleTime: 1000 * 60 * 5,
  });

  // Fetch filter settings for category
  const { data: filterSettings } = useQuery({
    queryKey: ['category-filter-settings', activeCategory, activeSubcategory, activeSubSubcategory],
    queryFn: async () => {
      const result = await fetchCategoryFilterSettings({
        categoryId: activeCategory || undefined,
        subcategoryId: activeSubcategory || undefined,
        subSubcategoryId: activeSubSubcategory || undefined,
      });

      if (isFailure(result)) {
        // Return defaults on error
        return {
          show_brand_filter: true,
          show_size_filter: true,
          show_color_filter: true,
          show_price_filter: true,
        };
      }

      return {
        show_brand_filter: result.data.show_brand_filter,
        show_size_filter: result.data.show_size_filter,
        show_color_filter: result.data.show_color_filter,
        show_price_filter: result.data.show_price_filter,
      };
    },
    enabled: !!activeCategory || !!activeSubcategory || !!activeSubSubcategory,
    staleTime: 1000 * 60 * 5,
  });

  return {
    // Filtered product IDs
    colorFilteredProductIds: colorFilteredIds,
    sizeFilteredProductIds: sizeFilteredIds,

    // Available filter options
    availableBrands,
    availableColors,
    availableSizes,

    // Filter settings
    filterSettings,

    // Attribute references
    relevantColorAttribute,
    relevantSizeAttribute,
  };
}
