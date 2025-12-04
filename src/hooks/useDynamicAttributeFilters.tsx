import { useQuery } from '@tanstack/react-query';
import {
  fetchCategoryAttributeFilters,
  checkAttributeHasOptions,
  fetchAttributeFilterValues,
} from '@/services/attributes';
import { fetchNonSuspendedSellerIds } from '@/services/users';
import { isFailure } from '@/types/api';

interface DynamicFilterAttribute {
  id: string;
  name: string;
  display_label: string;
  showInTopLine?: boolean;
  options: string[];
}

interface UseDynamicAttributeFiltersProps {
  activeCategory: string | null;
  activeSubcategory: string | null;
  activeSubSubcategory: string | null;
  selectedLowestLevel: Set<string>;
  selectedBrands: Set<string>;
  selectedAttributes: Map<string, Set<string>>; // Map of attribute_id -> selected values
  isSubSubcategoryPage: boolean;
}

interface CategoryHierarchyParams {
  activeSubcategory: string | null;
  activeSubSubcategory: string | null;
  isSubSubcategoryPage: boolean;
}

// Utility: Apply category hierarchy filter for category_attribute_filters table (uses OR patterns)
function applyCategoryFilterHierarchy(
  query: unknown,
  { activeSubcategory, activeSubSubcategory, isSubSubcategoryPage }: CategoryHierarchyParams,
): unknown {
  if (activeSubcategory && !activeSubSubcategory) {
    query = query.or(`subcategory_id.eq.${activeSubcategory},subcategory_id.is.null`);
    query = query.is('sub_subcategory_id', null);
  } else if (activeSubSubcategory && isSubSubcategoryPage) {
    query = query.or(
      `sub_subcategory_id.eq.${activeSubSubcategory},and(subcategory_id.eq.${activeSubcategory},sub_subcategory_id.is.null),subcategory_id.is.null`,
    );
  } else if (!activeSubcategory) {
    query = query.is('subcategory_id', null).is('sub_subcategory_id', null);
  }
  return query;
}

interface ListingFilterParams {
  activeCategory: string | null;
  activeSubcategory: string | null;
  activeSubSubcategory: string | null;
  selectedLowestLevel: Set<string>;
  selectedBrands: Set<string>;
  isSubSubcategoryPage: boolean;
}

// Utility: Apply listing filters for product queries (uses eq/in patterns on listings join)
function applyListingFilters(
  query: unknown,
  {
    activeCategory,
    activeSubcategory,
    activeSubSubcategory,
    selectedLowestLevel,
    selectedBrands,
    isSubSubcategoryPage,
  }: ListingFilterParams,
): unknown {
  if (activeCategory) query = query.eq('listings.category_id', activeCategory);
  if (activeSubcategory) query = query.eq('listings.subcategory_id', activeSubcategory);
  if (activeSubSubcategory && isSubSubcategoryPage) {
    query = query.eq('listings.sub_subcategory_id', activeSubSubcategory);
  }
  if (selectedLowestLevel.size > 0) {
    query = query.in('listings.sub_sub_subcategory_id', Array.from(selectedLowestLevel));
  }
  if (selectedBrands.size > 0) {
    query = query.in('listings.brand_id', Array.from(selectedBrands));
  }
  return query;
}

export const useDynamicAttributeFilters = ({
  activeCategory,
  activeSubcategory,
  activeSubSubcategory,
  selectedLowestLevel,
  selectedBrands,
  selectedAttributes,
  isSubSubcategoryPage,
}: UseDynamicAttributeFiltersProps) => {
  // Fetch default filter settings for top line placement
  const { data: defaultFilterSettings } = useQuery({
    queryKey: [
      'default-filter-settings',
      activeCategory,
      activeSubcategory,
      activeSubSubcategory,
      isSubSubcategoryPage,
    ],
    queryFn: async () => {
      if (!activeCategory) return { enabled: {}, topLine: {} };

      const result = await fetchCategoryAttributeFilters({
        categoryId: activeCategory,
        subcategoryId: activeSubcategory || null,
        subSubcategoryId: activeSubSubcategory || null,
        filterType: 'default',
        isSubSubcategoryPage,
      });

      if (isFailure(result)) {
        throw result.error;
      }

      const enabled: Record<string, boolean> = {};
      const topLine: Record<string, boolean> = {};

      result.data.forEach((f) => {
        if (f.filter_name) {
          enabled[f.filter_name] = true;
          topLine[f.filter_name] = f.show_in_top_line || false;
        }
      });

      return { enabled, topLine };
    },
    enabled: !!activeCategory,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch enabled filter attributes based on category_attribute_filters table
  const { data: enabledAttributes = [] } = useQuery({
    queryKey: [
      'enabled-attribute-filters',
      activeCategory,
      activeSubcategory,
      activeSubSubcategory,
      isSubSubcategoryPage,
    ],
    queryFn: async () => {
      if (!activeCategory) return [];

      const result = await fetchCategoryAttributeFilters({
        categoryId: activeCategory,
        subcategoryId: activeSubcategory || null,
        subSubcategoryId: activeSubSubcategory || null,
        filterType: 'attribute',
        isSubSubcategoryPage,
      });

      if (isFailure(result)) {
        throw result.error;
      }

      // Return attributes that have preset options
      const attributesWithOptions: { id: string; name: string; display_label: string; showInTopLine: boolean }[] = [];

      for (const filter of result.data) {
        const attr = filter.attributes;
        if (!attr || !filter.attribute_id) continue;

        const hasOptionsResult = await checkAttributeHasOptions(filter.attribute_id);
        if (isFailure(hasOptionsResult)) {
          continue;
        }

        if (hasOptionsResult.data) {
          attributesWithOptions.push({
            id: attr.id,
            name: attr.name,
            display_label: attr.display_label || attr.name,
            showInTopLine: filter.show_in_top_line || false,
          });
        }
      }

      return attributesWithOptions;
    },
    enabled: !!activeCategory,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch available values for each enabled attribute
  const attributeFiltersQuery = useQuery({
    queryKey: [
      'attribute-filter-values',
      enabledAttributes.map((a: unknown) => a.id).join(','),
      activeCategory,
      activeSubcategory,
      activeSubSubcategory,
      Array.from(selectedLowestLevel).sort(),
      Array.from(selectedBrands).sort(),
    ],
    queryFn: async () => {
      if (enabledAttributes.length === 0) return [];

      // Get non-suspended sellers
      const nonSuspendedSellersResult = await fetchNonSuspendedSellerIds();
      if (isFailure(nonSuspendedSellersResult)) {
        throw nonSuspendedSellersResult.error;
      }
      const nonSuspendedSellerIds = nonSuspendedSellersResult.data;

      const results: DynamicFilterAttribute[] = [];

      for (const attr of enabledAttributes) {
        const result = await fetchAttributeFilterValues({
          attributeId: attr.id,
          categoryId: activeCategory || null,
          subcategoryId: activeSubcategory || null,
          subSubcategoryId: activeSubSubcategory || null,
          subSubSubcategoryIds: Array.from(selectedLowestLevel),
          brandIds: Array.from(selectedBrands),
          sellerIds: nonSuspendedSellerIds,
          isSubSubcategoryPage,
          limit: 50000,
        });

        if (isFailure(result)) {
          continue;
        }

        // Parse and collect unique values
        const valuesSet = new Set<string>();
        result.data.forEach((av) => {
          const raw = av.value_text;
          if (!raw) return;
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              parsed.forEach((val: string) => {
                const trimmed = val.trim();
                if (trimmed) valuesSet.add(trimmed);
              });
            } else {
              const trimmed = String(parsed).trim();
              if (trimmed) valuesSet.add(trimmed);
            }
          } catch {
            const parts = raw.includes(',') ? raw.split(',') : [raw];
            parts.forEach((val) => {
              const trimmed = val.trim();
              if (trimmed) valuesSet.add(trimmed);
            });
          }
        });

        const options = Array.from(valuesSet).sort((a, b) => a.localeCompare(b));

        // Only include filters that have available values
        if (options.length > 0) {
          results.push({
            id: attr.id,
            name: attr.name,
            display_label: attr.display_label,
            showInTopLine: attr.showInTopLine || false,
            options,
          });
        }
      }

      return results;
    },
    enabled: enabledAttributes.length > 0 && !!activeCategory,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch product IDs that match all selected attribute filters
  const { data: attributeFilteredProductIds } = useQuery({
    queryKey: [
      'attribute-filtered-products',
      enabledAttributes.map((a: unknown) => a.id).join(','),
      activeCategory,
      activeSubcategory,
      activeSubSubcategory,
      Array.from(selectedLowestLevel).sort(),
      Array.from(selectedBrands).sort(),
      Array.from(selectedAttributes.entries())
        .map(([k, v]) => `${k}:${Array.from(v).sort().join(',')}`)
        .sort()
        .join('|'),
    ],
    enabled:
      enabledAttributes.length > 0 &&
      !!activeCategory &&
      Array.from(selectedAttributes.values()).some((set) => set.size > 0),
    queryFn: async () => {
      const activeAttributeFilters = Array.from(selectedAttributes.entries()).filter(([, values]) => values.size > 0);
      if (activeAttributeFilters.length === 0) return null;

      // Get non-suspended sellers
      const nonSuspendedSellersResult = await fetchNonSuspendedSellerIds();
      if (isFailure(nonSuspendedSellersResult)) {
        throw nonSuspendedSellersResult.error;
      }
      const nonSuspendedSellerIds = nonSuspendedSellersResult.data;

      let intersection: Set<string> | null = null;

      for (const [attributeId, selectedValues] of activeAttributeFilters) {
        const result = await fetchAttributeFilterValues({
          attributeId,
          categoryId: activeCategory || null,
          subcategoryId: activeSubcategory || null,
          subSubcategoryId: activeSubSubcategory || null,
          subSubSubcategoryIds: Array.from(selectedLowestLevel),
          brandIds: Array.from(selectedBrands),
          sellerIds: nonSuspendedSellerIds,
          isSubSubcategoryPage,
          limit: 50000,
        });

        if (isFailure(result)) {
          continue;
        }

        const selectedNormalized = Array.from(selectedValues).map((v) => v.trim().toLowerCase());
        const matchingIds = new Set<string>();

        result.data.forEach((av) => {
          const raw = av.value_text;
          if (!raw) return;

          let values: string[] = [];
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) values = parsed;
            else values = [String(parsed)];
          } catch {
            values = raw.includes(',') ? raw.split(',') : [raw];
          }

          const normalized = values.map((v) => v.trim().toLowerCase()).filter(Boolean);
          if (normalized.some((nv) => selectedNormalized.includes(nv))) {
            matchingIds.add(av.product_id);
          }
        });

        if (intersection === null) {
          intersection = matchingIds;
        } else {
          intersection = new Set(Array.from(intersection).filter((id) => matchingIds.has(id)));
        }

        if (intersection.size === 0) {
          return [];
        }
      }

      return intersection ? Array.from(intersection) : [];
    },
    staleTime: 1000 * 60 * 5,
  });

  return {
    attributeFilters: attributeFiltersQuery.data || [],
    attributeFilteredProductIds: attributeFilteredProductIds || null,
    defaultFiltersEnabled: defaultFilterSettings?.enabled || {},
    defaultFiltersTopLine: defaultFilterSettings?.topLine || {},
    isLoading: attributeFiltersQuery.isLoading,
  };
};
