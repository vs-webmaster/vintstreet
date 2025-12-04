import { useQuery } from '@tanstack/react-query';
import {
  fetchProductAttributes,
  fetchProductAttributeByName,
  fetchProductIdsByAttributeValue,
} from '@/services/attributes';
import {
  fetchProductByIdOrSlug,
  fetchProductsByIdsWithFilters,
  fetchProductsByBrandOrCategory,
} from '@/services/products';
import { fetchSellerProfilesByUserIds, fetchProfilesByUserIds } from '@/services/users';
import { isFailure } from '@/types/api';

export interface Product {
  id: string;
  slug?: string;
  product_name: string;
  starting_price: number;
  thumbnail: string | null;
  product_images: string[] | null;
  product_image_alts?: string[] | null;
  product_description: string | null;
  seller_id: string;
  category_id: string | null;
  subcategory_id: string | null;
  discounted_price: number | null;
  brand_id: string | null;
  status: 'draft' | 'published' | 'private' | 'out_of_stock';
  offers_enabled: boolean;
  created_at: string;
  auction_type?: string | null;
  product_categories: { id: string; name: string } | null;
  product_subcategories: { id: string; name: string } | null;
  product_sub_subcategories: { id: string; name: string } | null;
  product_sub_sub_subcategories: { id: string; name: string } | null;
  brands: { id: string; name: string; logo_url?: string | null } | null;
  seller_profiles: {
    shop_name: string;
    display_name_format?: string;
    profile?: { full_name?: string; username?: string };
    profiles?: { full_name?: string; username?: string };
  } | null;
  stock_quantity?: number | null;
  excerpt?: string | null;
  sku?: string | null;
}

export const useProductData = (productIdOrSlug: string | undefined) => {
  // Fetch product details by slug or ID
  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productIdOrSlug],
    queryFn: async () => {
      if (!productIdOrSlug) throw new Error('No product identifier provided');

      const result = await fetchProductByIdOrSlug(productIdOrSlug);

      if (isFailure(result)) {
        throw result.error;
      }

      return result.data;
    },
    enabled: !!productIdOrSlug,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch product attributes
  const { data: productAttributes = [] } = useQuery({
    queryKey: ['product-attributes', product?.id],
    queryFn: async () => {
      if (!product?.id) return [];

      const result = await fetchProductAttributes(product.id);

      if (isFailure(result)) {
        throw result.error;
      }

      return result.data || [];
    },
    enabled: !!product?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch related products
  const { data: relatedProducts = [] } = useQuery({
    queryKey: ['related-products', product?.category_id, product?.brand_id, product?.subcategory_id, product?.id],
    queryFn: async () => {
      if (!product?.id) return [];

      // First, get the color attribute for the current product
      const colorAttrResult = await fetchProductAttributeByName(product.id, 'colour');
      const productColor = colorAttrResult.success && colorAttrResult.data ? colorAttrResult.data.value_text : null;

      let allProducts: any[] = [];
      const seenIds = new Set([product.id]);

      // If product has a color, prioritize same color products
      if (productColor) {
        // Get product IDs with matching color
        const colorProductIdsResult = await fetchProductIdsByAttributeValue(
          'colour',
          productColor,
          product.category_id,
          product.subcategory_id,
          product.sub_subcategory_id,
          product.id,
        );
        const colorProductIds = colorProductIdsResult.success ? colorProductIdsResult.data : [];

        if (colorProductIds.length > 0) {
          // Priority 1: Same color + same brand
          if (product.brand_id) {
            const brandColorResult = await fetchProductsByIdsWithFilters(colorProductIds, {
              brandId: product.brand_id,
              limit: 4,
            });

            if (brandColorResult.success && brandColorResult.data) {
              brandColorResult.data.forEach((p) => {
                if (!seenIds.has(p.id)) {
                  allProducts.push(p);
                  seenIds.add(p.id);
                }
              });
            }
          }

          // Priority 2: Same color + same category (to mix with brand matches)
          if (allProducts.length < 4 && product.category_id) {
            const categoryColorResult = await fetchProductsByIdsWithFilters(colorProductIds, {
              categoryId: product.category_id,
              limit: 4 - allProducts.length,
            });

            if (categoryColorResult.success && categoryColorResult.data) {
              categoryColorResult.data.forEach((p) => {
                if (!seenIds.has(p.id)) {
                  allProducts.push(p);
                  seenIds.add(p.id);
                }
              });
            }
          }
        }
      }

      // // Priority 3: Same brand (without color filter if we need more)
      if (allProducts.length < 4 && product.brand_id) {
        const brandResult = await fetchProductsByBrandOrCategory({
          brandId: product.brand_id,
          excludeProductId: product.id,
          limit: 4 - allProducts.length,
        });

        if (brandResult.success && brandResult.data) {
          brandResult.data.forEach((p) => {
            if (!seenIds.has(p.id)) {
              allProducts.push(p);
              seenIds.add(p.id);
            }
          });
        }
      }

      // // Priority 4: Same category (fallback)
      if (allProducts.length < 4 && product.category_id) {
        const categoryResult = await fetchProductsByBrandOrCategory({
          categoryId: product.category_id,
          excludeProductId: product.id,
          limit: 4 - allProducts.length,
        });

        if (categoryResult.success && categoryResult.data) {
          categoryResult.data.forEach((p) => {
            if (!seenIds.has(p.id)) {
              allProducts.push(p);
              seenIds.add(p.id);
            }
          });
        }
      }

      if (allProducts.length === 0) return [];

      // Batch fetch all seller profiles and user profiles at once
      const sellerIds = allProducts.map((listing) => listing.seller_id);
      const [sellerProfilesResult, userProfilesResult] = await Promise.all([
        fetchSellerProfilesByUserIds(sellerIds),
        fetchProfilesByUserIds(sellerIds),
      ]);

      const sellerProfiles = sellerProfilesResult.success ? sellerProfilesResult.data : [];
      const userProfiles = userProfilesResult.success ? userProfilesResult.data : [];

      const sellerMap = new Map(sellerProfiles.map((seller) => [seller.user_id, seller]));
      const profileMap = new Map(userProfiles.map((profile) => [profile.user_id, profile]));

      const productsWithSellers = allProducts.map((listing) => {
        const sellerProfile = sellerMap.get(listing.seller_id);
        const userProfile = profileMap.get(listing.seller_id);

        return {
          ...listing,
          seller_profiles: sellerProfile
            ? {
                ...sellerProfile,
                profile: userProfile,
                profiles: userProfile,
              }
            : null,
          product_subcategories: null,
          product_sub_subcategories: null,
        };
      });

      return productsWithSellers as Product[];
    },
    enabled: !!product?.id,
    staleTime: 5 * 60 * 1000,
  });

  return {
    product,
    isLoading,
    productAttributes,
    relatedProducts,
  };
};
