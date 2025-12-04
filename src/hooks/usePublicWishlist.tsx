import { useQuery } from '@tanstack/react-query';
import { extractSellerIds } from '@/lib/sellerNameUtils';
import { fetchProductsByIds } from '@/services/products';
import { fetchSellerInfoMap } from '@/services/users/userService';
import { fetchPublicWishlistData } from '@/services/wishlist';
import { isFailure } from '@/types/api';

export const usePublicWishlist = (shareToken: string) => {
  return useQuery({
    queryKey: ['public-wishlist', shareToken],
    queryFn: async () => {
      if (!shareToken) throw new Error('No share token provided');

      const result = await fetchPublicWishlistData(shareToken);

      if (isFailure(result)) {
        throw result.error;
      }

      const { sharedWishlist, wishlistItems, ownerName } = result.data;

      // Filter to only published listings and add seller info
      const publishedItems = wishlistItems.filter((item) => item.listings?.status === 'published');
      const listingIds = publishedItems.map((item) => item.listing_id).filter(Boolean);

      if (listingIds.length === 0) {
        return {
          sharedWishlist,
          wishlistItems: [],
          ownerName,
        };
      }

      // Fetch full product details
      const productsResult = await fetchProductsByIds(listingIds, { status: ['published'] });
      if (isFailure(productsResult)) {
        throw productsResult.error;
      }

      const products = productsResult.data || [];
      const sellersMapResult = await fetchSellerInfoMap(extractSellerIds(products));
      const sellersMap = sellersMapResult.success && sellersMapResult.data ? sellersMapResult.data : new Map();

      // Map wishlist items to include product details
      const itemsWithDetails = publishedItems
        .map((item) => {
          const product = products.find((p) => p.id === item.listing_id);
          if (!product) return null;

          return {
            id: item.id,
            listing_id: item.listing_id,
            listings: {
              ...product,
              seller_profiles: sellersMap.get(product.seller_id) || null,
            },
          };
        })
        .filter(Boolean) as unknown[];

      return {
        sharedWishlist,
        wishlistItems: itemsWithDetails,
        ownerName,
      };
    },
    enabled: !!shareToken,
    retry: false,
  });
};
