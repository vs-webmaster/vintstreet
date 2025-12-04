import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchProductIdsByAttributeValues, fetchAttributeValuesForProducts } from '@/services/attributes';
import {
  fetchProductIdsWithSales,
  fetchProductIdsByLevel4Categories,
  fetchProductsMissingAttribute,
  fetchSalesStatusForProducts,
  fetchLevel4CategoriesForProducts,
  fetchProductsCountWithFilters,
  fetchProductsWithFiltersAndPagination,
} from '@/services/products';
import { fetchTagsForProducts } from '@/services/tags';
import { isFailure } from '@/types/api';

interface UseProductsWithPaginationProps {
  systemSellerId?: string;
  showArchivedProducts?: boolean;
  showSoldProducts?: boolean;
  showDraftProducts?: boolean;
  showPrivateProducts?: boolean;
  showMissingImages?: boolean;
  showPublishedProducts?: boolean;
  currentPage: number;
  itemsPerPage: number;
  searchTerm: string;
  filterBrand: string;
  filterLevel1: string;
  filterLevel2: string;
  filterLevel3: string[];
  filterLevel4: string[]; // Array of category IDs
  filterColors: string[];
  colourAttributeId?: string;
  lastUpdatedFilter: string;
  sortField: string | null;
  sortDirection: 'asc' | 'desc';
  missingLevel2?: boolean;
  missingLevel3?: boolean;
  missingLevel4?: boolean;
  missingAttributeId?: string | null;
  statusFilter?: string;
}

export const useProductsWithPagination = ({
  systemSellerId,
  showArchivedProducts = false,
  showSoldProducts = false,
  showDraftProducts = false,
  showPrivateProducts = false,
  showMissingImages = false,
  showPublishedProducts = false,
  currentPage,
  itemsPerPage,
  searchTerm,
  filterBrand,
  filterLevel1,
  filterLevel2,
  filterLevel3,
  filterLevel4,
  filterColors,
  colourAttributeId,
  lastUpdatedFilter,
  sortField,
  sortDirection,
  missingLevel2 = false,
  missingLevel3 = false,
  missingLevel4 = false,
  missingAttributeId = null,
  statusFilter = 'all',
}: UseProductsWithPaginationProps) => {
  // Fetch product IDs with sales (if sold products filter is active)
  const { data: soldProductIds } = useQuery({
    queryKey: ['sold-product-ids', systemSellerId, showArchivedProducts],
    enabled: showSoldProducts,
    queryFn: async () => {
      if (!showSoldProducts) return null;

      const result = await fetchProductIdsWithSales();
      if (isFailure(result)) {
        throw result.error;
      }
      return result.data;
    },
    staleTime: 0,
  });

  // Fetch product IDs matching Level 4 filter (if Level 4 filter is active)
  const { data: level4FilteredProductIds } = useQuery({
    queryKey: ['level4-filtered-product-ids', filterLevel4],
    enabled: filterLevel4.length > 0,
    queryFn: async () => {
      if (filterLevel4.length === 0) return null;

      const result = await fetchProductIdsByLevel4Categories(filterLevel4);
      if (isFailure(result)) {
        throw result.error;
      }
      return result.data;
    },
    staleTime: 0,
  });

  // Fetch products missing the specified attribute using the new RPC function
  const { data: missingAttributeProductIds } = useQuery({
    queryKey: ['missing-attribute-product-ids', missingAttributeId, systemSellerId, showArchivedProducts],
    enabled: !!missingAttributeId,
    queryFn: async () => {
      if (!missingAttributeId) return null;

      const result = await fetchProductsMissingAttribute({
        attributeId: missingAttributeId,
        sellerId: systemSellerId || null,
        archived: showArchivedProducts,
      });

      if (isFailure(result)) {
        console.error('[Missing Attribute Filter] RPC error:', result.error);
        throw result.error;
      }

      return result.data;
    },
    staleTime: 0,
  });

  // Fetch product IDs matching color filter (if color filter is active)
  const { data: colorFilteredProductIds } = useQuery({
    queryKey: ['color-filtered-product-ids', filterColors, colourAttributeId],
    enabled: filterColors.length > 0 && !!colourAttributeId,
    queryFn: async () => {
      if (filterColors.length === 0 || !colourAttributeId) return null;

      const result = await fetchProductIdsByAttributeValues({
        attributeId: colourAttributeId,
        selectedValues: filterColors,
      });

      if (isFailure(result)) {
        throw result.error;
      }

      return result.data;
    },
    staleTime: 0,
  });

  // Fetch total count for pagination
  const { data: totalCount = 0 } = useQuery({
    queryKey: [
      'products-count',
      systemSellerId,
      showArchivedProducts,
      showSoldProducts,
      showDraftProducts,
      showPrivateProducts,
      showMissingImages,
      showPublishedProducts,
      soldProductIds,
      searchTerm,
      filterBrand,
      filterLevel1,
      filterLevel2,
      filterLevel3,
      filterLevel4,
      level4FilteredProductIds,
      colorFilteredProductIds,
      missingAttributeProductIds,
      missingLevel2,
      missingLevel3,
      missingLevel4,
      lastUpdatedFilter,
      statusFilter,
    ],
    queryFn: async () => {
      const result = await fetchProductsCountWithFilters({
        systemSellerId,
        showArchivedProducts,
        showSoldProducts,
        showDraftProducts,
        showPrivateProducts,
        showMissingImages,
        showPublishedProducts,
        searchTerm,
        filterBrand,
        filterLevel1,
        filterLevel2,
        filterLevel3,
        filterLevel4,
        filterColors,
        soldProductIds: soldProductIds || null,
        level4FilteredProductIds: level4FilteredProductIds || null,
        colorFilteredProductIds: colorFilteredProductIds || null,
        missingAttributeProductIds: missingAttributeProductIds || null,
        missingLevel2,
        missingLevel3,
        missingLevel4,
        lastUpdatedFilter,
        statusFilter,
      });

      if (isFailure(result)) {
        throw result.error;
      }

      return result.data;
    },
    staleTime: 0, // No caching to prevent stale data
    gcTime: 0, // Clear from cache immediately
  });

  // Fetch products with server-side pagination
  const { data: products = [], isLoading } = useQuery({
    queryKey: [
      'master-products-paginated',
      systemSellerId,
      showArchivedProducts,
      showSoldProducts,
      showDraftProducts,
      showPrivateProducts,
      showMissingImages,
      showPublishedProducts,
      soldProductIds,
      currentPage,
      itemsPerPage,
      searchTerm,
      filterBrand,
      filterLevel1,
      filterLevel2,
      filterLevel3,
      filterLevel4,
      level4FilteredProductIds,
      colorFilteredProductIds,
      missingAttributeProductIds,
      lastUpdatedFilter,
      sortField,
      sortDirection,
      missingLevel2,
      missingLevel3,
      missingLevel4,
      statusFilter,
    ],
    queryFn: async () => {
      const result = await fetchProductsWithFiltersAndPagination({
        systemSellerId,
        showArchivedProducts,
        showSoldProducts,
        showDraftProducts,
        showPrivateProducts,
        showMissingImages,
        showPublishedProducts,
        currentPage,
        itemsPerPage,
        searchTerm,
        filterBrand,
        filterLevel1,
        filterLevel2,
        filterLevel3,
        filterLevel4,
        filterColors,
        soldProductIds: soldProductIds || null,
        level4FilteredProductIds: level4FilteredProductIds || null,
        colorFilteredProductIds: colorFilteredProductIds || null,
        missingAttributeProductIds: missingAttributeProductIds || null,
        missingLevel2,
        missingLevel3,
        missingLevel4,
        lastUpdatedFilter,
        sortField,
        sortDirection,
        statusFilter,
      });

      if (isFailure(result)) {
        throw result.error;
      }

      return result.data;
    },
    staleTime: 0, // No caching to prevent stale data
    gcTime: 0, // Clear from cache immediately
  });

  // Fetch sales status for current page products
  const productIds = products.map((p: unknown) => p.id);
  const { data: salesStatus = [] } = useQuery({
    queryKey: ['product-sales-status', productIds],
    queryFn: async () => {
      if (productIds.length === 0) return [];

      const result = await fetchSalesStatusForProducts(productIds);
      if (isFailure(result)) {
        throw result.error;
      }
      return result.data;
    },
    enabled: productIds.length > 0,
    staleTime: 0,
  });

  // Fetch product attribute values for current page products only
  const { data: productAttributeValues = [] } = useQuery({
    queryKey: ['product-attribute-values-paginated', productIds],
    queryFn: async () => {
      if (productIds.length === 0) return [];

      const result = await fetchAttributeValuesForProducts(productIds);
      if (isFailure(result)) {
        throw result.error;
      }
      // Transform to match expected format
      return result.data.map((item) => ({
        product_id: item.product_id,
        attribute_id: item.attribute_id,
        value_text: item.value_text,
        value_number: item.value_number,
        value_boolean: item.value_boolean,
        value_date: null, // Not in the current response but keeping for compatibility
      }));
    },
    enabled: productIds.length > 0,
    staleTime: 0,
  });

  // Fetch additional Level 4 categories for current page products
  const { data: additionalLevel4Categories = [] } = useQuery({
    queryKey: ['product-level4-categories-paginated', productIds],
    queryFn: async () => {
      if (productIds.length === 0) return [];

      const result = await fetchLevel4CategoriesForProducts(productIds);
      if (isFailure(result)) {
        throw result.error;
      }
      return result.data;
    },
    enabled: productIds.length > 0,
    staleTime: 0,
  });

  // Fetch tags for current page products
  const { data: productTags = [] } = useQuery({
    queryKey: ['product-tags-paginated', productIds],
    queryFn: async () => {
      if (productIds.length === 0) return [];

      const result = await fetchTagsForProducts(productIds);
      if (isFailure(result)) {
        throw result.error;
      }
      return result.data;
    },
    enabled: productIds.length > 0,
    staleTime: 0,
  });

  // Create a lookup map for sales status
  const salesStatusMap = useMemo(() => {
    const map = new Map<string, boolean>();
    salesStatus.forEach((item: unknown) => {
      map.set(item.product_id, item.has_sales);
    });
    return map;
  }, [salesStatus]);

  // Add sales status, additional Level 4 categories, and tags to products
  const productsWithSales = useMemo(() => {
    return products.map((product: unknown) => {
      const additionalCategories = additionalLevel4Categories
        .filter((cat: unknown) => cat.product_id === product.id)
        .map((cat: unknown) => ({
          id: cat.sub_sub_subcategory_id,
          name: cat.product_sub_sub_subcategories?.name || '',
        }));

      const tags = productTags
        .filter((tag: unknown) => tag.product_id === product.id)
        .map((tag: unknown) => tag.product_tags)
        .filter(Boolean);

      return {
        ...product,
        hasSales: salesStatusMap.get(product.id) || false,
        additionalLevel4Categories: additionalCategories,
        tags: tags,
      };
    });
  }, [products, salesStatusMap, additionalLevel4Categories, productTags]);

  // No more client-side filtering needed - all filters now applied server-side
  return {
    products: productsWithSales,
    productAttributeValues,
    totalCount,
    isLoading,
  };
};
