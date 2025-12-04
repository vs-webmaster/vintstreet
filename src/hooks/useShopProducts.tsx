// Shop Products Hook
// Handles infinite scroll product fetching and sorting for shop pages

import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { extractSellerIds } from '@/lib/sellerNameUtils';
import { fetchShopProducts } from '@/services/products';
import { fetchSellerInfoMap, fetchNonSuspendedSellerIds } from '@/services/users';
import { isFailure } from '@/types/api';

const PRODUCTS_PER_PAGE = 32;

export interface ShopProduct {
  id: string;
  slug?: string;
  product_name: string;
  starting_price: number;
  discounted_price: number | null;
  thumbnail: string | null;
  product_description: string | null;
  seller_id: string;
  category_id: string | null;
  subcategory_id: string | null;
  sub_subcategory_id: string | null;
  sub_sub_subcategory_id: string | null;
  brand_id: string | null;
  status: 'draft' | 'published' | 'private' | 'out_of_stock';
  stock_quantity: number | null;
  created_at: string;
  auction_type: string | null;
  product_categories: {
    id: string;
    name: string;
  } | null;
  brands?: {
    id: string;
    name: string;
  } | null;
  seller_info_view: {
    shop_name: string;
    display_name_format?: string;
    full_name: string;
    username: string;
    avatar_url: string | null;
  } | null;
  auctions?: {
    id: string;
    current_bid: number | null;
    starting_bid: number | null;
    end_time: string;
    status: string;
    bid_count: number | null;
  }[];
}

interface CategoryFilter {
  id: string;
  name: string;
  level: 1 | 2 | 3 | 4;
  slug?: string;
}

interface UseShopProductsProps {
  activeCategory: string | null;
  activeSubcategory: string | null;
  activeSubSubcategory: string | null;
  isMainShopPage: boolean;
  isSubSubcategoryPage: boolean;
  showLandingPage: boolean;
  isCategoryPage: boolean;
  hasActiveFilters: boolean;
  selectedLowestLevel: Set<string>;
  selectedBrands: Set<string>;
  selectedColors: Set<string>;
  selectedSizes: Set<string>;
  selectedAttributes: Map<string, Set<string>>;
  colorFilteredProductIds?: string[] | null;
  sizeFilteredProductIds?: string[] | null;
  attributeFilteredProductIds?: string[] | null;
  categoryFiltersToShow: CategoryFilter[];
  sortBy: string;
}

export function useShopProducts({
  activeCategory,
  activeSubcategory,
  activeSubSubcategory,
  isMainShopPage,
  isSubSubcategoryPage,
  showLandingPage,
  isCategoryPage,
  hasActiveFilters,
  selectedLowestLevel,
  selectedBrands,
  selectedColors,
  selectedSizes,
  selectedAttributes,
  colorFilteredProductIds,
  sizeFilteredProductIds,
  attributeFilteredProductIds,
  categoryFiltersToShow,
  sortBy,
}: UseShopProductsProps) {
  const {
    data: productsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: [
      'products-infinite',
      activeCategory,
      activeSubcategory,
      activeSubSubcategory,
      Array.from(selectedLowestLevel).sort(),
      Array.from(selectedBrands).sort(),
      Array.from(selectedColors).sort(),
      colorFilteredProductIds,
      Array.from(selectedSizes).sort(),
      sizeFilteredProductIds,
      Array.from(selectedAttributes.entries())
        .map(([k, v]) => `${k}:${Array.from(v).sort().join(',')}`)
        .sort()
        .join('|'),
      attributeFilteredProductIds,
      sortBy,
      isMainShopPage,
    ],
    enabled:
      !showLandingPage &&
      !(isCategoryPage && !hasActiveFilters) &&
      (!selectedColors.size || (selectedColors.size > 0 && colorFilteredProductIds !== undefined)) &&
      (!selectedSizes.size || (selectedSizes.size > 0 && sizeFilteredProductIds !== undefined)) &&
      (!selectedAttributes.size || attributeFilteredProductIds !== undefined),
    queryFn: async ({ pageParam = 0 }) => {
      const offset = pageParam * PRODUCTS_PER_PAGE;

      // Get non-suspended seller IDs
      const sellersResult = await fetchNonSuspendedSellerIds();
      if (isFailure(sellersResult)) {
        throw sellersResult.error;
      }
      const nonSuspendedSellerIds = sellersResult.data;

      // Apply color and size filters - compute intersection when both are active
      let filteredProductIds: string[] | undefined = undefined;

      if (selectedColors.size > 0 && selectedSizes.size > 0) {
        if (
          colorFilteredProductIds &&
          colorFilteredProductIds.length > 0 &&
          sizeFilteredProductIds &&
          sizeFilteredProductIds.length > 0
        ) {
          const colorSet = new Set(colorFilteredProductIds);
          const intersection = sizeFilteredProductIds.filter((id) => colorSet.has(id));

          if (intersection.length > 0) {
            filteredProductIds = intersection;
          } else {
            return { products: [], total: 0, nextPage: undefined };
          }
        } else {
          return { products: [], total: 0, nextPage: undefined };
        }
      } else if (selectedColors.size > 0) {
        if (colorFilteredProductIds && colorFilteredProductIds.length > 0) {
          filteredProductIds = colorFilteredProductIds;
        } else {
          return { products: [], total: 0, nextPage: undefined };
        }
      } else if (selectedSizes.size > 0) {
        if (sizeFilteredProductIds && sizeFilteredProductIds.length > 0) {
          filteredProductIds = sizeFilteredProductIds;
        } else {
          return { products: [], total: 0, nextPage: undefined };
        }
      }

      // Apply dynamic attribute filters
      if (selectedAttributes.size > 0) {
        if (attributeFilteredProductIds && attributeFilteredProductIds.length > 0) {
          if (filteredProductIds) {
            // Intersect with existing filters
            const attributeSet = new Set(attributeFilteredProductIds);
            filteredProductIds = filteredProductIds.filter((id) => attributeSet.has(id));
          } else {
            filteredProductIds = attributeFilteredProductIds;
          }

          if (!filteredProductIds || filteredProductIds.length === 0) {
            return { products: [], total: 0, nextPage: undefined };
          }
        } else {
          return { products: [], total: 0, nextPage: undefined };
        }
      }

      // Build category filters
      const level1Ids: string[] = [];
      const level2Ids: string[] = [];
      const level3Ids: string[] = [];

      if (selectedLowestLevel.size > 0) {
        selectedLowestLevel.forEach((id) => {
          const category = categoryFiltersToShow.find((c) => c.id === id);
          if (category) {
            if (category.level === 1) level1Ids.push(id);
            else if (category.level === 2) level2Ids.push(id);
            else if (category.level === 3) level3Ids.push(id);
          }
        });
      }

      // Fetch products using service
      const productsResult = await fetchShopProducts({
        sellerIds: nonSuspendedSellerIds,
        productIds: filteredProductIds,
        categoryId: !isMainShopPage ? activeCategory || undefined : undefined,
        subcategoryId: !isMainShopPage ? activeSubcategory || undefined : undefined,
        subSubcategoryId: !isMainShopPage && isSubSubcategoryPage ? activeSubSubcategory || undefined : undefined,
        categoryIds: level1Ids.length > 0 ? level1Ids : undefined,
        subcategoryIds: level2Ids.length > 0 ? level2Ids : undefined,
        subSubcategoryIds: level3Ids.length > 0 ? level3Ids : undefined,
        brandIds: selectedBrands.size > 0 ? Array.from(selectedBrands) : undefined,
        showLandingPage,
        offset,
        limit: PRODUCTS_PER_PAGE,
      });

      if (isFailure(productsResult)) {
        throw productsResult.error;
      }

      const { products, total } = productsResult.data;

      // Fetch seller info
      const sellerIds = extractSellerIds(products);
      const sellerInfoResult = await fetchSellerInfoMap(sellerIds);
      const sellersMap = sellerInfoResult.success ? sellerInfoResult.data : new Map();

      const productsWithSellers = products.map((product) => ({
        ...product,
        seller_info_view: sellersMap.get(product.seller_id) || null,
      })) as ShopProduct[];

      return {
        products: productsWithSellers,
        total,
        nextPage: offset + PRODUCTS_PER_PAGE < total ? pageParam + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    staleTime: 1000 * 60 * 5,
  });

  // Flatten products from all pages
  const allProducts = useMemo(() => {
    return productsData?.pages.flatMap((page) => page.products) || [];
  }, [productsData]);

  return {
    products: allProducts,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    totalCount: productsData?.pages[0]?.total || 0,
  };
}
