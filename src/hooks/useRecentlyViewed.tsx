// Recently Viewed Products Hook
// Handles localStorage logic and fetching recently viewed/recommended products

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { extractSellerIds, fetchSellerInfoMap } from '@/lib/sellerNameUtils';
import { fetchProductsByIds, fetchRecommendedProducts } from '@/services/products';
import { isFailure } from '@/types/api';
import type { ShopProduct } from './useShopProducts';

interface UseRecentlyViewedProps {
  enabled: boolean;
}

export function useRecentlyViewed({ enabled }: UseRecentlyViewedProps) {
  // Get recently viewed product IDs from localStorage
  const recentlyViewedIds = useMemo(() => {
    try {
      const stored = localStorage.getItem('recentlyViewed');
      return stored ? JSON.parse(stored).slice(0, 4) : [];
    } catch {
      return [];
    }
  }, []);

  // Fetch recently viewed products
  const { data: recentlyViewedProducts = [] } = useQuery({
    queryKey: ['recently-viewed', recentlyViewedIds],
    queryFn: async () => {
      if (recentlyViewedIds.length === 0) return [];

      const result = await fetchProductsByIds(recentlyViewedIds, { status: ['published'] });

      if (isFailure(result)) {
        throw result.error;
      }

      const products = result.data || [];
      const sellersMap = await fetchSellerInfoMap(extractSellerIds(products));

      return products.map((product) => ({
        ...product,
        seller_info_view: sellersMap.get(product.seller_id) || null,
      })) as ShopProduct[];
    },
    enabled: enabled && recentlyViewedIds.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch recommended products based on recently viewed
  const { data: recommendedProducts = [] } = useQuery({
    queryKey: ['recommended-products-shop', recentlyViewedProducts],
    queryFn: async () => {
      if (recentlyViewedProducts.length === 0) return [];

      const brandIds = [...new Set(recentlyViewedProducts.map((p) => p.brand_id).filter(Boolean))] as string[];
      const categoryIds = [
        ...new Set(recentlyViewedProducts.map((p) => p.sub_sub_subcategory_id).filter(Boolean)),
      ] as string[];
      const viewedProductIds = recentlyViewedProducts.map((p) => p.id);

      const avgPrice =
        recentlyViewedProducts.reduce((sum, p) => sum + (p.discounted_price || p.starting_price), 0) /
        recentlyViewedProducts.length;

      const minPrice = avgPrice * 0.5;
      const maxPrice = avgPrice * 1.5;

      const result = await fetchRecommendedProducts({
        excludeProductIds: viewedProductIds,
        brandIds: brandIds.length > 0 ? brandIds : undefined,
        categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
        priceRange: { min: minPrice, max: maxPrice },
        limit: 5,
      });

      if (isFailure(result)) {
        throw result.error;
      }

      const products = result.data || [];
      const sellersMap = await fetchSellerInfoMap(extractSellerIds(products));

      return products.map((product) => ({
        ...product,
        seller_info_view: sellersMap.get(product.seller_id) || null,
      })) as ShopProduct[];
    },
    enabled: enabled && recentlyViewedProducts.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  return {
    recentlyViewedProducts,
    recommendedProducts,
    recentlyViewedIds,
  };
}

// Utility function to add a product to recently viewed
export function addToRecentlyViewed(productId: string) {
  try {
    const stored = localStorage.getItem('recentlyViewed');
    const existing: string[] = stored ? JSON.parse(stored) : [];

    // Remove if already exists, then add to front
    const filtered = existing.filter((id) => id !== productId);
    const updated = [productId, ...filtered].slice(0, 10); // Keep max 10

    localStorage.setItem('recentlyViewed', JSON.stringify(updated));
  } catch {
    // Silently fail if localStorage is not available
  }
}
