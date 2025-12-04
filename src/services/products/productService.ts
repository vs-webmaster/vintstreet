/* eslint-disable @typescript-eslint/no-explicit-any */
// Product Service
// Centralized product data access layer

import { supabase } from '@/integrations/supabase/client';
import { normalizeError, logError, NotFoundError } from '@/lib/errors';
import type { Result } from '@/types/api';
import { success, failure, isFailure } from '@/types/api';
import type { Product, ProductFilters, ProductListResponse, ProductSortOption } from '@/types/product';

// Base select for product queries (without seller_info_view which requires separate fetch)
const DEFAULT_SELECT = `
  id,
  slug,
  product_name,
  starting_price,
  discounted_price,
  thumbnail,
  product_description,
  seller_id,
  category_id,
  subcategory_id,
  sub_subcategory_id,
  sub_sub_subcategory_id,
  brand_id,
  status,
  stock_quantity,
  created_at,
  auction_type,
  product_categories (id, name, slug),
  product_subcategories (id, name),
  product_sub_subcategories (id, name),
  product_sub_sub_subcategories (id, name),
  brands (id, name, logo_url)
`;

// Build sort order
const getSortOrder = (sortBy: ProductSortOption): { column: string; ascending: boolean } => {
  switch (sortBy) {
    case 'newest':
      return { column: 'created_at', ascending: false };
    case 'price-low':
      return { column: 'starting_price', ascending: true };
    case 'price-high':
      return { column: 'starting_price', ascending: false };
    case 'name-asc':
      return { column: 'product_name', ascending: true };
    case 'name-desc':
      return { column: 'product_name', ascending: false };
    case 'featured':
    default:
      return { column: 'created_at', ascending: false };
  }
};

// Fetch products with filters and pagination
export async function fetchProducts(
  filters: ProductFilters = {},
  page: number = 1,
  pageSize: number = 32,
): Promise<Result<ProductListResponse>> {
  try {
    let query = supabase
      .from('listings')
      .select(DEFAULT_SELECT, { count: 'exact' })
      .eq('product_type', 'shop')
      .eq('archived', false);

    // Apply status filter (default to published/active)
    if (filters.status && filters.status.length > 0) {
      query = query.in('status', filters.status);
    } else {
      query = query.in('status', ['published', 'active']);
    }

    // Apply category filters
    if (filters.subSubSubcategoryId) {
      query = query.eq('sub_sub_subcategory_id', filters.subSubSubcategoryId);
    } else if (filters.subSubcategoryId) {
      query = query.eq('sub_subcategory_id', filters.subSubcategoryId);
    } else if (filters.subcategoryId) {
      query = query.eq('subcategory_id', filters.subcategoryId);
    } else if (filters.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }

    // Apply brand filter
    if (filters.brandIds && filters.brandIds.length > 0) {
      query = query.in('brand_id', filters.brandIds);
    }

    // Apply seller filter
    if (filters.sellerId) {
      query = query.eq('seller_id', filters.sellerId);
    }

    // Apply price range filter
    if (filters.priceRange) {
      if (filters.priceRange.min > 0) {
        query = query.gte('starting_price', filters.priceRange.min);
      }
      if (filters.priceRange.max > 0) {
        query = query.lte('starting_price', filters.priceRange.max);
      }
    }

    // Apply search filter
    if (filters.search) {
      query = query.ilike('product_name', `%${filters.search}%`);
    }

    // Apply sorting
    const { column, ascending } = getSortOrder(filters.sortBy || 'featured');
    query = query.order(column, { ascending });

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    const totalCount = count || 0;
    const hasMore = from + pageSize < totalCount;

    // Transform data to Product type
    const products = (data || []).map((item) => ({
      ...item,
      seller_info_view: null, // Would need separate fetch if needed
    })) as unknown as Product[];

    return success({
      products,
      totalCount,
      hasMore,
      nextPage: hasMore ? page + 1 : undefined,
    });
  } catch (error) {
    logError(error, 'productService:fetchProducts');
    return failure(normalizeError(error));
  }
}

// Fetch single product by ID or slug
export async function fetchProductByIdOrSlug(idOrSlug: string): Promise<Result<Product>> {
  try {
    // Try UUID first
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    let query = supabase.from('listings').select(`
        ${DEFAULT_SELECT},
        product_image,
        product_images,
        excerpt,
        weight,
        width,
        height,
        length,
        offers_enabled,
        meta_title,
        meta_description
      `);

    if (isUuid) {
      query = query.eq('id', idOrSlug);
    } else {
      query = query.eq('slug', idOrSlug);
    }

    query = query.eq('product_type', 'shop').eq('archived', false);

    const { data, error } = await query.maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return failure(new NotFoundError('Product', idOrSlug));
    }

    // Fetch seller profile and user profile in parallel
    const [sellerResult, profileResult] = await Promise.all([
      supabase.from('seller_profiles').select('shop_name, display_name_format').eq('user_id', data.seller_id).single(),
      supabase.from('profiles').select('full_name, username').eq('user_id', data.seller_id).single(),
    ]);

    // Transform to Product type with seller info
    const product = {
      ...data,
      seller_profiles: sellerResult.data
        ? {
            ...sellerResult.data,
            profile: profileResult.data || null,
            profiles: profileResult.data || null,
          }
        : null,
    } as unknown as Product;

    return success(product);
  } catch (error) {
    logError(error, 'productService:fetchProductByIdOrSlug');
    return failure(normalizeError(error));
  }
}

// Fetch products by seller
export async function fetchProductsBySeller(
  sellerId: string,
  options: { status?: string[]; limit?: number; includeArchived?: boolean; productType?: string } = {},
): Promise<Result<Product[]>> {
  try {
    let query = supabase
      .from('listings')
      .select(DEFAULT_SELECT)
      .eq('seller_id', sellerId)
      .eq('product_type', options.productType || 'shop');

    if (!options.includeArchived) {
      query = query.eq('archived', false);
    }

    if (options.status && options.status.length > 0) {
      query = query.in('status', options.status);
    }

    query = query.order('created_at', { ascending: false });

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const products = (data || []).map((item) => ({
      ...item,
      seller_info_view: null,
    })) as unknown as Product[];

    return success(products);
  } catch (error) {
    logError(error, 'productService:fetchProductsBySeller');
    return failure(normalizeError(error));
  }
}

// Fetch product updated_at timestamp (for optimistic locking)
export async function fetchProductTimestamp(productId: string): Promise<Result<{ updated_at: string } | null>> {
  try {
    const { data, error } = await supabase.from('listings').select('updated_at').eq('id', productId).maybeSingle();

    if (error) throw error;
    return success((data as { updated_at: string }) || null);
  } catch (error) {
    logError(error, 'productService:fetchProductTimestamp');
    return failure(normalizeError(error));
  }
}

// Fetch product images only
export async function fetchProductImages(productId: string): Promise<Result<string[] | null>> {
  try {
    const { data, error } = await supabase.from('listings').select('product_images').eq('id', productId).maybeSingle();

    if (error) throw error;
    return success((data?.product_images as string[]) || null);
  } catch (error) {
    logError(error, 'productService:fetchProductImages');
    return failure(normalizeError(error));
  }
}

// Fetch product for conflict checking (for optimistic locking)
export async function fetchProductForConflictCheck(
  productId: string,
): Promise<Result<{ updated_at: string; product_name: string; product_images: string[] | null } | null>> {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select('updated_at, product_name, product_images')
      .eq('id', productId)
      .maybeSingle();

    if (error) throw error;
    return success((data as { updated_at: string; product_name: string; product_images: string[] | null }) || null);
  } catch (error) {
    logError(error, 'productService:fetchProductForConflictCheck');
    return failure(normalizeError(error));
  }
}

// Update product with optimistic locking
export async function updateProductWithLock(
  productId: string,
  updates: Partial<Product>,
  expectedUpdatedAt: string | null,
  options?: { forceOverwrite?: boolean },
): Promise<Result<{ product: Product | null; conflictData?: unknown }>> {
  try {
    // Remove relation fields that can't be updated directly
    const { product_categories, brands, seller_info_view, auctions, ...cleanUpdates } = updates;

    // If force overwrite, use the provided updated_at or expected one
    const updatedAtToCheck = options?.forceOverwrite
      ? cleanUpdates.updated_at || expectedUpdatedAt || ''
      : expectedUpdatedAt || '';

    const updateData = {
      ...cleanUpdates,
      updated_at: new Date().toISOString(),
    };

    let query = supabase.from('listings').update(updateData).eq('id', productId);

    // Only add updated_at check if we have an expected value
    if (updatedAtToCheck) {
      query = query.eq('updated_at', updatedAtToCheck);
    }

    const { data, error } = await query.select(DEFAULT_SELECT).maybeSingle();

    if (error) {
      // If no rows were updated (PGRST116), it's likely a conflict
      if (error.code === 'PGRST116') {
        // Fetch current data to show what changed
        const currentResult = await fetchProductByIdOrSlug(productId);
        const conflictData = !isFailure(currentResult) ? currentResult.data : null;

        // Return success with conflict data to indicate a conflict occurred
        return success({ product: null, conflictData });
      }

      throw error;
    }

    const product = data
      ? ({
          ...data,
          seller_info_view: null,
        } as unknown as Product)
      : null;

    return success({ product });
  } catch (error) {
    logError(error, 'productService:updateProductWithLock');
    return failure(normalizeError(error));
  }
}

// Fetch products by stream ID
export async function fetchProductsByStream(
  streamId: string,
  options: { status?: string | string[] } = {},
): Promise<Result<Product[]>> {
  try {
    let query = supabase.from('listings').select(DEFAULT_SELECT).eq('stream_id', streamId).eq('archived', false);

    if (options.status) {
      if (Array.isArray(options.status)) {
        query = query.in('status', options.status);
      } else {
        query = query.eq('status', options.status);
      }
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const products = (data || []).map((item) => ({
      ...item,
      seller_info_view: null,
    })) as unknown as Product[];

    return success(products);
  } catch (error) {
    logError(error, 'productService:fetchProductsByStream');
    return failure(normalizeError(error));
  }
}

// Fetch related products
export async function fetchRelatedProducts(product: Product, limit: number = 8): Promise<Result<Product[]>> {
  try {
    let query = supabase
      .from('listings')
      .select(DEFAULT_SELECT)
      .eq('product_type', 'shop')
      .eq('archived', false)
      .in('status', ['published', 'active'])
      .neq('id', product.id);

    // Prioritize same brand, then same category
    if (product.brand_id) {
      query = query.eq('brand_id', product.brand_id);
    } else if (product.category_id) {
      query = query.eq('category_id', product.category_id);
    }

    query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const products = (data || []).map((item) => ({
      ...item,
      seller_info_view: null,
    })) as unknown as Product[];

    return success(products);
  } catch (error) {
    logError(error, 'productService:fetchRelatedProducts');
    return failure(normalizeError(error));
  }
}

// Update product
export async function updateProduct(productId: string, updates: Partial<Product>): Promise<Result<Product>> {
  try {
    // Remove relation fields that can't be updated directly
    const { product_categories, brands, seller_info_view, auctions, ...updateData } = updates;

    const { data, error } = await supabase
      .from('listings')
      .update(updateData)
      .eq('id', productId)
      .select(DEFAULT_SELECT)
      .single();

    if (error) {
      throw error;
    }

    const product = {
      ...data,
      seller_info_view: null,
    } as unknown as Product;

    return success(product);
  } catch (error) {
    logError(error, 'productService:updateProduct');
    return failure(normalizeError(error));
  }
}

// Delete product (soft delete via archive)
export async function archiveProduct(productId: string): Promise<Result<boolean>> {
  try {
    const { error } = await supabase.from('listings').update({ archived: true }).eq('id', productId);

    if (error) {
      throw error;
    }

    return success(true);
  } catch (error) {
    logError(error, 'productService:archiveProduct');
    return failure(normalizeError(error));
  }
}

// Unarchive product
export async function unarchiveProduct(productId: string): Promise<Result<boolean>> {
  try {
    const { error } = await supabase.from('listings').update({ archived: false }).eq('id', productId);

    if (error) {
      throw error;
    }

    return success(true);
  } catch (error) {
    logError(error, 'productService:unarchiveProduct');
    return failure(normalizeError(error));
  }
}

// Toggle archive status
export async function toggleArchiveProduct(productId: string, isArchived: boolean): Promise<Result<boolean>> {
  return isArchived ? unarchiveProduct(productId) : archiveProduct(productId);
}

// Search products with complex filters (for search page)
export interface SearchProductsInput {
  searchQuery?: string;
  brandQuery?: string;
  selectedBrands?: string[];
  colorFilteredProductIds?: string[] | null;
  sizeFilteredProductIds?: string[] | null;
  selectedPriceRange?: string;
  sortBy?: string;
  page?: number;
  pageSize?: number;
  nonSuspendedSellerIds?: string[];
}

export interface SearchProductsResponse {
  products: Product[];
  total: number;
  nextPage?: number;
}

export async function searchProducts(input: SearchProductsInput): Promise<Result<SearchProductsResponse>> {
  try {
    const {
      searchQuery = '',
      brandQuery = '',
      selectedBrands = [],
      colorFilteredProductIds,
      sizeFilteredProductIds,
      selectedPriceRange = 'all',
      sortBy = 'featured',
      page = 0,
      pageSize = 32,
      nonSuspendedSellerIds = [],
    } = input;

    const offset = page * pageSize;

    let query = supabase
      .from('listings')
      .select('*, product_categories(*), brands(id, name)', { count: 'exact' })
      .eq('status', 'published')
      .eq('archived', false);

    if (nonSuspendedSellerIds.length > 0) {
      query = query.in('seller_id', nonSuspendedSellerIds);
    }

    // Apply brand filter
    if (selectedBrands.length > 0) {
      query = query.in('brand_id', selectedBrands);
    }

    // Apply color filter
    if (colorFilteredProductIds && colorFilteredProductIds.length > 0) {
      query = query.in('id', colorFilteredProductIds);
    } else if (colorFilteredProductIds !== null && colorFilteredProductIds !== undefined) {
      // Empty array means no matches
      return success({
        products: [],
        total: 0,
        nextPage: undefined,
      });
    }

    // Apply size filter
    if (sizeFilteredProductIds && sizeFilteredProductIds.length > 0) {
      query = query.in('id', sizeFilteredProductIds);
    } else if (sizeFilteredProductIds !== null && sizeFilteredProductIds !== undefined) {
      // Empty array means no matches
      return success({
        products: [],
        total: 0,
        nextPage: undefined,
      });
    }

    // Apply brand query filter
    if (brandQuery.trim()) {
      // This should be handled by the caller with brand_id, but keeping for compatibility
      // The caller should resolve brandQuery to brand_id before calling
    }

    // Apply search filter with synonym-aware category matching
    if (searchQuery.trim()) {
      const { findCategoriesBySynonyms } = await import('@/lib/categorySearch');
      const categoryMatches = await findCategoriesBySynonyms(searchQuery);

      if (categoryMatches.length > 0) {
        const categoryIds = categoryMatches.filter((c) => c.level === 1).map((c) => c.id);
        const level2Ids = categoryMatches.filter((c) => c.level === 2).map((c) => c.id);
        const level3Ids = categoryMatches.filter((c) => c.level === 3).map((c) => c.id);
        const level4Ids = categoryMatches.filter((c) => c.level === 4).map((c) => c.id);

        const conditions = [];
        if (categoryIds.length > 0) {
          conditions.push(`category_id.in.(${categoryIds.join(',')})`);
        }
        if (level2Ids.length > 0) {
          conditions.push(`subcategory_id.in.(${level2Ids.join(',')})`);
        }
        if (level3Ids.length > 0) {
          conditions.push(`sub_subcategory_id.in.(${level3Ids.join(',')})`);
        }
        if (level4Ids.length > 0) {
          conditions.push(`sub_sub_subcategory_id.in.(${level4Ids.join(',')})`);
        }
        conditions.push(`product_name.ilike.%${searchQuery}%`);

        query = query.or(conditions.join(','));
      } else {
        query = query.ilike('product_name', `%${searchQuery}%`);
      }
    }

    // Apply price filter
    if (selectedPriceRange !== 'all') {
      const [min, max] = selectedPriceRange.split('-').map(Number);
      if (!isNaN(min)) {
        query = query.gte('starting_price', min);
      }
      if (!isNaN(max)) {
        query = query.lte('starting_price', max);
      }
    }

    // Apply sorting
    let orderBy = 'created_at';
    let ascending = false;
    switch (sortBy) {
      case 'price-low':
        orderBy = 'starting_price';
        ascending = true;
        break;
      case 'price-high':
        orderBy = 'starting_price';
        ascending = false;
        break;
      case 'newest':
        orderBy = 'created_at';
        ascending = false;
        break;
      case 'oldest':
        orderBy = 'created_at';
        ascending = true;
        break;
      default:
        orderBy = 'created_at';
        ascending = false;
    }

    query = query.order(orderBy, { ascending }).range(offset, offset + pageSize - 1);

    const { data: products, error, count } = await query;

    if (error) throw error;

    const transformedProducts = (products || []).map((item) => ({
      ...item,
      seller_info_view: null,
    })) as unknown as Product[];

    return success({
      products: transformedProducts,
      total: count || 0,
      nextPage: products && products.length === pageSize ? page + 1 : undefined,
    });
  } catch (error) {
    logError(error, 'productService:searchProducts');
    return failure(normalizeError(error));
  }
}

// Fetch products by IDs (for recently viewed, wishlists, etc.)
export async function fetchProductsByIds(
  productIds: string[],
  options: { status?: string[] } = {},
): Promise<Result<Product[]>> {
  try {
    if (productIds.length === 0) {
      return success([]);
    }

    let query = supabase.from('listings').select(DEFAULT_SELECT).in('id', productIds);

    if (options.status && options.status.length > 0) {
      query = query.in('status', options.status);
    } else {
      query = query.eq('status', 'published');
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const products = (data || []).map((item) => ({
      ...item,
      seller_info_view: null,
    })) as unknown as Product[];

    return success(products);
  } catch (error) {
    logError(error, 'productService:fetchProductsByIds');
    return failure(normalizeError(error));
  }
}

// Fetch recommended products based on criteria
export async function fetchRecommendedProducts(
  options: {
    excludeProductIds?: string[];
    brandIds?: string[];
    categoryIds?: string[];
    priceRange?: { min: number; max: number };
    limit?: number;
  } = {},
): Promise<Result<Product[]>> {
  try {
    let query = supabase
      .from('listings')
      .select(DEFAULT_SELECT)
      .eq('product_type', 'shop')
      .eq('archived', false)
      .eq('status', 'published');

    if (options.excludeProductIds && options.excludeProductIds.length > 0) {
      query = query.not('id', 'in', `(${options.excludeProductIds.join(',')})`);
    }

    if (options.priceRange) {
      if (options.priceRange.min > 0) {
        query = query.gte('starting_price', options.priceRange.min);
      }
      if (options.priceRange.max > 0) {
        query = query.lte('starting_price', options.priceRange.max);
      }
    }

    if (options.brandIds && options.brandIds.length > 0) {
      query = query.in('brand_id', options.brandIds);
    }

    if (options.categoryIds && options.categoryIds.length > 0) {
      query = query.in('sub_sub_subcategory_id', options.categoryIds);
    }

    if (options.brandIds && options.categoryIds && options.brandIds.length > 0 && options.categoryIds.length > 0) {
      // If both brand and category filters, use OR
      query = query.or(
        `brand_id.in.(${options.brandIds.join(',')}),sub_sub_subcategory_id.in.(${options.categoryIds.join(',')})`,
      );
    }

    query = query.limit(options.limit || 5);

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const products = (data || []).map((item) => ({
      ...item,
      seller_info_view: null,
    })) as unknown as Product[];

    return success(products);
  } catch (error) {
    logError(error, 'productService:fetchRecommendedProducts');
    return failure(normalizeError(error));
  }
}

// Search products by name (for category search)
export async function searchProductsByName(
  searchTerm: string,
  options: { limit?: number; includeDetails?: boolean } = {},
): Promise<
  Result<
    Array<{ id: string; product_name: string; slug: string | null; thumbnail?: string | null; starting_price?: number }>
  >
> {
  try {
    const limit = options.limit || 10;
    const selectFields = options.includeDetails
      ? 'id, product_name, slug, thumbnail, starting_price'
      : 'id, product_name, slug';

    const { data, error } = await supabase
      .from('listings')
      .select(selectFields)
      .ilike('product_name', `%${searchTerm}%`)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return success((data || []) as any);
  } catch (error) {
    logError(error, 'productService:searchProductsByName');
    return failure(normalizeError(error));
  }
}

// Fetch products by IDs with optional filters (for related products)
export async function fetchProductsByIdsWithFilters(
  productIds: string[],
  filters: {
    brandId?: string;
    categoryId?: string;
    limit?: number;
  } = {},
): Promise<Result<Product[]>> {
  try {
    if (productIds.length === 0) {
      return success([]);
    }

    let query = supabase
      .from('listings')
      .select(DEFAULT_SELECT)
      .eq('product_type', 'shop')
      .eq('archived', false)
      .eq('status', 'published')
      .in('id', productIds);

    if (filters.brandId) {
      query = query.eq('brand_id', filters.brandId);
    }

    if (filters.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;

    return success((data || []) as Product[]);
  } catch (error) {
    logError(error, 'productService:fetchProductsByIdsWithFilters');
    return failure(normalizeError(error));
  }
}

// Fetch products by brand and/or category (for related products)
export async function fetchProductsByBrandOrCategory(filters: {
  brandId?: string;
  categoryId?: string;
  excludeProductId?: string;
  limit?: number;
}): Promise<Result<Product[]>> {
  try {
    let query = supabase
      .from('listings')
      .select(DEFAULT_SELECT)
      .eq('product_type', 'shop')
      .eq('archived', false)
      .eq('status', 'published');

    if (filters.brandId) {
      query = query.eq('brand_id', filters.brandId);
    }

    if (filters.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }

    if (filters.excludeProductId) {
      query = query.neq('id', filters.excludeProductId);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;

    return success((data || []) as unknown as Product[]);
  } catch (error) {
    logError(error, 'productService:fetchProductsByBrandOrCategory');
    return failure(normalizeError(error));
  }
}

// Fetch product IDs with category info (for smart search)
export async function fetchProductIdsWithCategoryInfo(filters: {
  brandId?: string;
  categoryId?: string;
  categoryLevel?: number;
  limit?: number;
}): Promise<
  Result<
    Array<{
      id: string;
      category_id?: string;
      subcategory_id?: string;
      sub_subcategory_id?: string;
      sub_sub_subcategory_id?: string;
    }>
  >
> {
  try {
    let query = supabase
      .from('listings')
      .select('id, category_id, subcategory_id, sub_subcategory_id, sub_sub_subcategory_id')
      .eq('status', 'published')
      .eq('product_type', 'shop')
      .eq('archived', false);

    if (filters.brandId) {
      query = query.eq('brand_id', filters.brandId);
    }

    if (filters.categoryId && filters.categoryLevel) {
      switch (filters.categoryLevel) {
        case 1:
          query = query.eq('category_id', filters.categoryId);
          break;
        case 2:
          query = query.eq('subcategory_id', filters.categoryId);
          break;
        case 3:
          query = query.eq('sub_subcategory_id', filters.categoryId);
          break;
        case 4:
          query = query.eq('sub_sub_subcategory_id', filters.categoryId);
          break;
      }
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;

    return success(
      (data || []) as Array<{
        id: string;
        category_id?: string;
        subcategory_id?: string;
        sub_subcategory_id?: string;
        sub_sub_subcategory_id?: string;
      }>,
    );
  } catch (error) {
    logError(error, 'productService:fetchProductIdsWithCategoryInfo');
    return failure(normalizeError(error));
  }
}

// Fetch related brands for a category (for smart search)
export async function fetchRelatedBrandsForCategory(
  excludeBrandId: string | undefined,
  categoryId: string,
  categoryLevel: number,
): Promise<Result<Array<{ id: string; name: string; productCount: number }>>> {
  try {
    let query = supabase
      .from('listings')
      .select('brand_id, brands!inner(id, name)', { count: 'exact' })
      .eq('status', 'published')
      .eq('product_type', 'shop')
      .eq('archived', false);

    if (excludeBrandId) {
      query = query.neq('brand_id', excludeBrandId);
    }

    switch (categoryLevel) {
      case 1:
        query = query.eq('category_id', categoryId);
        break;
      case 2:
        query = query.eq('subcategory_id', categoryId);
        break;
      case 3:
        query = query.eq('sub_subcategory_id', categoryId);
        break;
      case 4:
        query = query.eq('sub_sub_subcategory_id', categoryId);
        break;
    }

    const { data, error } = await query.limit(100);

    if (error) throw error;

    // Count products per brand
    const brandMap = new Map<string, { name: string; count: number }>();
    (data || []).forEach((item: { brands?: { id: string; name: string }; brand_id?: string }) => {
      const brand = item.brands;
      if (brand && brand.id) {
        if (!brandMap.has(brand.id)) {
          brandMap.set(brand.id, { name: brand.name, count: 0 });
        }
        brandMap.get(brand.id)!.count++;
      }
    });

    const result = Array.from(brandMap.entries())
      .map(([id, v]) => ({ id, name: v.name, productCount: v.count }))
      .sort((a, b) => b.productCount - a.productCount);

    return success(result);
  } catch (error) {
    logError(error, 'productService:fetchRelatedBrandsForCategory');
    return failure(normalizeError(error));
  }
}

// Fetch shop products with complex filters (for shop pages with infinite scroll)
export async function fetchShopProducts(options: {
  sellerIds?: string[];
  productIds?: string[];
  categoryId?: string;
  subcategoryId?: string;
  subSubcategoryId?: string;
  categoryIds?: string[];
  subcategoryIds?: string[];
  subSubcategoryIds?: string[];
  brandIds?: string[];
  showLandingPage?: boolean;
  offset?: number;
  limit?: number;
}): Promise<Result<{ products: Product[]; total: number }>> {
  try {
    let query = supabase
      .from('listings')
      .select(DEFAULT_SELECT, { count: 'exact' })
      .eq('status', 'published')
      .eq('product_type', 'shop')
      .eq('archived', false);

    if (options.sellerIds && options.sellerIds.length > 0) {
      query = query.in('seller_id', options.sellerIds);
    }

    if (options.productIds && options.productIds.length > 0) {
      query = query.in('id', options.productIds);
    }

    if (options.showLandingPage) {
      query = query.eq('is_webp_main_image', true);
    }

    if (options.categoryId) {
      query = query.eq('category_id', options.categoryId);
    }

    if (options.subcategoryId) {
      query = query.eq('subcategory_id', options.subcategoryId);
    }

    if (options.subSubcategoryId) {
      query = query.eq('sub_subcategory_id', options.subSubcategoryId);
    }

    if (options.categoryIds && options.categoryIds.length > 0) {
      query = query.in('category_id', options.categoryIds);
    }

    if (options.subcategoryIds && options.subcategoryIds.length > 0) {
      query = query.in('subcategory_id', options.subcategoryIds);
    }

    if (options.subSubcategoryIds && options.subSubcategoryIds.length > 0) {
      query = query.in('sub_subcategory_id', options.subSubcategoryIds);
    }

    if (options.brandIds && options.brandIds.length > 0) {
      query = query.in('brand_id', options.brandIds);
    }

    query = query.order('created_at', { ascending: false });

    if (options.offset !== undefined && options.limit !== undefined) {
      query = query.range(options.offset, options.offset + options.limit - 1);
    } else if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    const products = (data || []).map((item) => ({
      ...item,
      seller_info_view: null,
    })) as unknown as Product[];

    return success({
      products,
      total: count || 0,
    });
  } catch (error) {
    logError(error, 'productService:fetchShopProducts');
    return failure(normalizeError(error));
  }
}

// Create product/listing interface
export interface CreateProductInput {
  seller_id: string;
  stream_id: string;
  product_name: string;
  starting_price: number;
  product_description?: string | null;
  product_image?: string | null;
  thumbnail?: string | null;
  product_type?: 'livestream' | 'shop';
  category_id?: string | null;
  subcategory_id?: string | null;
  sub_subcategory_id?: string | null;
  sub_sub_subcategory_id?: string | null;
  brand_id?: string | null;
  status?: string;
  stock_quantity?: number | null;
  discounted_price?: number | null;
  offers_enabled?: boolean;
  [key: string]: unknown; // Allow additional fields
}

// Create a new product/listing
export async function createProduct(input: CreateProductInput): Promise<Result<Product>> {
  try {
    const insertData: Record<string, unknown> = {
      seller_id: input.seller_id,
      stream_id: input.stream_id,
      product_name: input.product_name.trim(),
      starting_price: input.starting_price,
      product_description: input.product_description?.trim() || null,
      product_image: input.product_image || null,
      product_type: input.product_type || 'shop',
      category_id: input.category_id || null,
      subcategory_id: input.subcategory_id || null,
      sub_subcategory_id: input.sub_subcategory_id || null,
      sub_sub_subcategory_id: input.sub_sub_subcategory_id || null,
      brand_id: input.brand_id || null,
      status: input.status || 'draft',
      stock_quantity: input.stock_quantity || null,
      discounted_price: input.discounted_price || null,
      offers_enabled: input.offers_enabled || false,
    };

    // Handle additional fields like product_images, thumbnail, auction_type, etc.
    if (input.product_images) insertData.product_images = input.product_images;
    if (input.thumbnail) insertData.thumbnail = input.thumbnail;
    if (input.auction_type) insertData.auction_type = input.auction_type;
    if (input.moderation_status) insertData.moderation_status = input.moderation_status;
    if (input.moderation_reason) insertData.moderation_reason = input.moderation_reason;

    const { data, error } = await supabase.from('listings').insert(insertData).select(DEFAULT_SELECT).single();

    if (error) throw error;

    const product = {
      ...data,
      seller_info_view: null,
    } as unknown as Product;

    return success(product);
  } catch (error) {
    logError(error, 'productService:createProduct');
    return failure(normalizeError(error));
  }
}

// Create a stream auction listing
export interface CreateStreamAuctionListingInput {
  seller_id: string;
  stream_id: string;
  product_name: string;
  product_description?: string;
  starting_price: number;
  current_bid: number;
  auction_end_time: string;
}

export async function createStreamAuctionListing(
  input: CreateStreamAuctionListingInput,
): Promise<Result<{ id: string }>> {
  try {
    const { data, error } = await supabase
      .from('listings')
      .insert({
        seller_id: input.seller_id,
        stream_id: input.stream_id,
        product_name: input.product_name,
        product_description: input.product_description || 'Live auction item from stream',
        starting_price: input.starting_price,
        current_bid: input.current_bid,
        is_active: true,
        auction_end_time: input.auction_end_time,
        product_type: 'stream',
        status: 'active',
      })
      .select('id')
      .single();

    if (error) throw error;
    return success({ id: data.id });
  } catch (error) {
    logError(error, 'productService:createStreamAuctionListing');
    return failure(normalizeError(error));
  }
}

// End a stream auction listing
export async function endStreamAuction(listingId: string): Promise<Result<boolean>> {
  try {
    const { error } = await supabase
      .from('listings')
      .update({
        is_active: false,
        auction_end_time: null,
      })
      .eq('id', listingId);

    if (error) throw error;
    return success(true);
  } catch (error) {
    logError(error, 'productService:endStreamAuction');
    return failure(normalizeError(error));
  }
}

// Bulk archive/unarchive products
export async function bulkArchiveProducts(productIds: string[], archived: boolean): Promise<Result<boolean>> {
  try {
    if (productIds.length === 0) {
      return success(true);
    }

    const { error } = await supabase.from('listings').update({ archived }).in('id', productIds);

    if (error) throw error;
    return success(true);
  } catch (error) {
    logError(error, 'productService:bulkArchiveProducts');
    return failure(normalizeError(error));
  }
}

// Duplicate a product with all related data
export async function duplicateProduct(productId: string): Promise<Result<Product>> {
  try {
    // Fetch the original product
    const productResult = await fetchProductByIdOrSlug(productId);
    if (isFailure(productResult)) {
      throw productResult.error;
    }
    const originalProduct = productResult.data;

    // Fetch product attribute values
    const { data: attributeValues } = await supabase
      .from('product_attribute_values')
      .select('*')
      .eq('product_id', productId);

    // Fetch product level 4 categories
    const { data: level4Categories } = await supabase
      .from('product_level4_categories')
      .select('*')
      .eq('product_id', productId);

    // Fetch product tag links
    const { data: productTagLinks } = await supabase.from('product_tag_links').select('*').eq('product_id', productId);

    // Create new product with modified data
    const { id, created_at, updated_at, slug, ...productData } = originalProduct as any;
    const newProductName = `${originalProduct.product_name} (Copy)`;
    const newSlug = `${slug || originalProduct.product_name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;

    const { data: newProductData, error: insertError } = await supabase
      .from('listings')
      .insert({
        ...productData,
        product_name: newProductName,
        slug: newSlug,
        status: 'draft',
      })
      .select(DEFAULT_SELECT)
      .single();

    if (insertError) throw insertError;

    const newProduct = {
      ...newProductData,
      seller_info_view: null,
    } as unknown as Product;

    // Copy attribute values
    if (attributeValues && attributeValues.length > 0) {
      const newAttributeValues = attributeValues.map((av: Record<string, unknown>) => {
        const { id, created_at, updated_at, ...attrData } = av;
        return {
          ...attrData,
          product_id: newProduct.id,
        };
      });

      const { error: attrError } = await supabase.from('product_attribute_values').insert(newAttributeValues);
      if (attrError) throw attrError;
    }

    // Copy level 4 categories
    if (level4Categories && level4Categories.length > 0) {
      const newLevel4Categories = level4Categories.map((cat: Record<string, unknown>) => {
        const { id, created_at, ...catData } = cat;
        return {
          ...catData,
          product_id: newProduct.id,
        };
      });

      const { error: catError } = await supabase.from('product_level4_categories').insert(newLevel4Categories);
      if (catError) throw catError;
    }

    // Copy product tag links
    if (productTagLinks && productTagLinks.length > 0) {
      const newProductTagLinks = productTagLinks.map((tag: Record<string, unknown>) => {
        const { id, created_at, ...tagData } = tag;
        return {
          ...tagData,
          product_id: newProduct.id,
        };
      });

      const { error: tagError } = await supabase.from('product_tag_links').insert(newProductTagLinks);
      if (tagError) throw tagError;
    }

    return success(newProduct);
  } catch (error) {
    logError(error, 'productService:duplicateProduct');
    return failure(normalizeError(error));
  }
}

// Fetch product level 2 categories
export async function fetchProductLevel2Categories(productId: string): Promise<Result<string[]>> {
  try {
    const { data, error } = await supabase
      .from('product_level2_categories')
      .select('subcategory_id')
      .eq('product_id', productId);

    if (error) throw error;
    return success((data || []).map((d) => d.subcategory_id));
  } catch (error) {
    logError(error, 'productService:fetchProductLevel2Categories');
    return failure(normalizeError(error));
  }
}

// Fetch product level 3 categories
export async function fetchProductLevel3Categories(productId: string): Promise<Result<string[]>> {
  try {
    const { data, error } = await supabase
      .from('product_level3_categories')
      .select('sub_subcategory_id')
      .eq('product_id', productId);

    if (error) throw error;
    return success((data || []).map((d) => d.sub_subcategory_id));
  } catch (error) {
    logError(error, 'productService:fetchProductLevel3Categories');
    return failure(normalizeError(error));
  }
}

// Fetch product level 4 categories
export async function fetchProductLevel4Categories(productId: string): Promise<Result<string[]>> {
  try {
    const { data, error } = await supabase
      .from('product_level4_categories')
      .select('sub_sub_subcategory_id')
      .eq('product_id', productId);

    if (error) throw error;
    return success((data || []).map((d) => d.sub_sub_subcategory_id));
  } catch (error) {
    logError(error, 'productService:fetchProductLevel4Categories');
    return failure(normalizeError(error));
  }
}

// Add product level 2 category
export async function addProductLevel2Category(productId: string, subcategoryId: string): Promise<Result<boolean>> {
  try {
    const { error } = await supabase.from('product_level2_categories').insert({
      product_id: productId,
      subcategory_id: subcategoryId,
    });

    if (error) throw error;
    return success(true);
  } catch (error) {
    logError(error, 'productService:addProductLevel2Category');
    return failure(normalizeError(error));
  }
}

// Remove product level 2 category
export async function removeProductLevel2Category(productId: string, subcategoryId: string): Promise<Result<boolean>> {
  try {
    const { error } = await supabase
      .from('product_level2_categories')
      .delete()
      .eq('product_id', productId)
      .eq('subcategory_id', subcategoryId);

    if (error) throw error;
    return success(true);
  } catch (error) {
    logError(error, 'productService:removeProductLevel2Category');
    return failure(normalizeError(error));
  }
}

// Add product level 3 category
export async function addProductLevel3Category(productId: string, subSubcategoryId: string): Promise<Result<boolean>> {
  try {
    const { error } = await supabase.from('product_level3_categories').insert({
      product_id: productId,
      sub_subcategory_id: subSubcategoryId,
    });

    if (error) throw error;
    return success(true);
  } catch (error) {
    logError(error, 'productService:addProductLevel3Category');
    return failure(normalizeError(error));
  }
}

// Remove product level 3 category
export async function removeProductLevel3Category(
  productId: string,
  subSubcategoryId: string,
): Promise<Result<boolean>> {
  try {
    const { error } = await supabase
      .from('product_level3_categories')
      .delete()
      .eq('product_id', productId)
      .eq('sub_subcategory_id', subSubcategoryId);

    if (error) throw error;
    return success(true);
  } catch (error) {
    logError(error, 'productService:removeProductLevel3Category');
    return failure(normalizeError(error));
  }
}

// Add product level 4 category
export async function addProductLevel4Category(
  productId: string,
  subSubSubcategoryId: string,
): Promise<Result<boolean>> {
  try {
    const { error } = await supabase.from('product_level4_categories').insert({
      product_id: productId,
      sub_sub_subcategory_id: subSubSubcategoryId,
    });

    if (error) throw error;
    return success(true);
  } catch (error) {
    logError(error, 'productService:addProductLevel4Category');
    return failure(normalizeError(error));
  }
}

// Remove product level 4 category
export async function removeProductLevel4Category(
  productId: string,
  subSubSubcategoryId: string,
): Promise<Result<boolean>> {
  try {
    const { error } = await supabase
      .from('product_level4_categories')
      .delete()
      .eq('product_id', productId)
      .eq('sub_sub_subcategory_id', subSubSubcategoryId);

    if (error) throw error;
    return success(true);
  } catch (error) {
    logError(error, 'productService:removeProductLevel4Category');
    return failure(normalizeError(error));
  }
}

// Fetch product count by status
export async function fetchProductCountByStatus(
  status: 'published' | 'private' | 'draft' | 'missing-images',
): Promise<Result<number>> {
  try {
    let query = supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('product_type', 'shop')
      .eq('archived', false);

    if (status === 'published') {
      query = query.in('status', ['active', 'published']);
    } else if (status === 'missing-images') {
      query = query.or('product_image.is.null,product_image.eq.');
    } else {
      query = query.eq('status', status);
    }

    const { count, error } = await query;
    if (error) throw error;
    return success(count || 0);
  } catch (error) {
    logError(error, 'productService:fetchProductCountByStatus');
    return failure(normalizeError(error));
  }
}

// Fetch sold products count
export async function fetchSoldProductsCount(): Promise<Result<number>> {
  try {
    const { data, error } = await supabase.from('product_sales_status').select('product_id').eq('has_sales', true);

    if (error) throw error;
    return success(data?.length || 0);
  } catch (error) {
    logError(error, 'productService:fetchSoldProductsCount');
    return failure(normalizeError(error));
  }
}

// Fetch products for export/download with all related data
export async function fetchProductsForExport(filters: {
  categoryId?: string;
  subcategoryId?: string;
  limit?: number;
  offset?: number;
}): Promise<
  Result<
    Array<{
      id: string;
      [key: string]: unknown;
      product_categories?: { name: string } | null;
      product_subcategories?: { name: string } | null;
      product_sub_subcategories?: { name: string } | null;
      product_sub_sub_subcategories?: { name: string } | null;
      brands?: { name: string } | null;
    }>
  >
> {
  try {
    let query = supabase
      .from('listings')
      .select(
        `
          *,
          product_categories(name),
          product_subcategories(name),
          product_sub_subcategories(name),
          product_sub_sub_subcategories(name),
          brands(name)
        `,
      )
      .eq('archived', false)
      .eq('product_type', 'shop')
      .order('created_at', { ascending: false });

    if (filters.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }

    if (filters.subcategoryId && filters.subcategoryId !== '__all__') {
      query = query.eq('subcategory_id', filters.subcategoryId);
    }

    if (filters.offset !== undefined && filters.limit !== undefined) {
      query = query.range(filters.offset, filters.offset + filters.limit - 1);
    } else if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;

    return success(
      (data || []) as Array<{
        id: string;
        [key: string]: unknown;
        product_categories?: { name: string } | null;
        product_subcategories?: { name: string } | null;
        product_sub_subcategories?: { name: string } | null;
        product_sub_sub_subcategories?: { name: string } | null;
        brands?: { name: string } | null;
      }>,
    );
  } catch (error) {
    logError(error, 'productService:fetchProductsForExport');
    return failure(normalizeError(error));
  }
}

// Fetch marketplace products with filters (excluding system seller)
export async function fetchMarketplaceProducts(filters: {
  excludeSellerId?: string;
  searchTerm?: string;
  moderationStatus?: string;
  categoryId?: string;
  subcategoryId?: string;
  brandId?: string;
  createdAfter?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}): Promise<
  Result<
    Array<{
      id: string;
      [key: string]: unknown;
      brands?: { name: string } | null;
      product_categories?: { name: string } | null;
      product_subcategories?: { name: string } | null;
    }>
  >
> {
  try {
    let query = supabase
      .from('listings')
      .select(
        `
          *,
          brands(name),
          product_categories(name),
          product_subcategories(name)
        `,
      )
      .eq('product_type', 'shop')
      .eq('archived', false);

    if (filters.excludeSellerId) {
      query = query.neq('seller_id', filters.excludeSellerId);
    }

    if (filters.searchTerm) {
      query = query.ilike('product_name', `%${filters.searchTerm}%`);
    }

    if (filters.moderationStatus && filters.moderationStatus !== 'all') {
      query = query.eq('moderation_status', filters.moderationStatus);
    }

    if (filters.categoryId && filters.categoryId !== 'all') {
      query = query.eq('category_id', filters.categoryId);
    }

    if (filters.subcategoryId && filters.subcategoryId !== 'all') {
      query = query.eq('subcategory_id', filters.subcategoryId);
    }

    if (filters.brandId && filters.brandId !== 'all') {
      query = query.eq('brand_id', filters.brandId);
    }

    if (filters.createdAfter) {
      query = query.gte('created_at', filters.createdAfter);
    }

    // Apply sorting
    const sortField = filters.sortField || 'created_at';
    const ascending = filters.sortDirection === 'asc';
    query = query.order(sortField, { ascending });

    const { data, error } = await query;
    if (error) throw error;

    return success(
      (data || []) as Array<{
        id: string;
        [key: string]: unknown;
        brands?: { name: string } | null;
        product_categories?: { name: string } | null;
        product_subcategories?: { name: string } | null;
      }>,
    );
  } catch (error) {
    logError(error, 'productService:fetchMarketplaceProducts');
    return failure(normalizeError(error));
  }
}

// Update product moderation status
export async function updateProductModerationStatus(
  productId: string,
  moderationStatus: string,
): Promise<Result<boolean>> {
  try {
    const updateData: Record<string, unknown> = {
      moderation_status: moderationStatus,
    };

    // Also update status based on moderation status
    if (moderationStatus === 'suspended') {
      updateData.status = 'draft';
    } else if (moderationStatus === 'approved') {
      updateData.status = 'published';
    }

    const { error } = await supabase.from('listings').update(updateData).eq('id', productId);

    if (error) throw error;
    return success(true);
  } catch (error) {
    logError(error, 'productService:updateProductModerationStatus');
    return failure(normalizeError(error));
  }
}

// Fetch available brands with listing filters
export async function fetchAvailableBrands(params: {
  categoryId?: string | null;
  subcategoryId?: string | null;
  subSubcategoryId?: string | null;
  subSubSubcategoryIds?: string[];
  isSubSubcategoryPage?: boolean;
}): Promise<Result<Array<{ id: string; name: string }>>> {
  try {
    const { categoryId, subcategoryId, subSubcategoryId, subSubSubcategoryIds, isSubSubcategoryPage } = params;

    let query = supabase
      .from('listings')
      .select('brand_id, brands(id, name)')
      .eq('status', 'published')
      .not('brand_id', 'is', null);

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    if (subcategoryId) {
      query = query.eq('subcategory_id', subcategoryId);
    }
    if (subSubcategoryId && isSubSubcategoryPage) {
      query = query.eq('sub_subcategory_id', subSubcategoryId);
    }
    if (subSubSubcategoryIds && subSubSubcategoryIds.length > 0) {
      query = query.in('sub_sub_subcategory_id', subSubSubcategoryIds);
    }

    const { data, error } = await query;
    if (error) throw error;

    const brandsMap = new Map<string, { id: string; name: string }>();
    data?.forEach((item: { brands?: { id: string; name: string }; brand_id?: string }) => {
      if (item.brands && item.brand_id) {
        brandsMap.set(item.brand_id, item.brands);
      }
    });

    return success(Array.from(brandsMap.values()).sort((a, b) => a.name.localeCompare(b.name)));
  } catch (error) {
    logError(error, 'productService:fetchAvailableBrands');
    return failure(normalizeError(error));
  }
}

// Fetch product IDs with sales
export async function fetchProductIdsWithSales(): Promise<Result<string[]>> {
  try {
    const { data, error } = await supabase.from('product_sales_status').select('product_id').eq('has_sales', true);

    if (error) throw error;
    return success(data?.map((d) => d.product_id) || []);
  } catch (error) {
    logError(error, 'productService:fetchProductIdsWithSales');
    return failure(normalizeError(error));
  }
}

// Fetch sales status for multiple products
export async function fetchSalesStatusForProducts(
  productIds: string[],
): Promise<Result<Array<{ product_id: string; has_sales: boolean }>>> {
  try {
    if (productIds.length === 0) {
      return success([]);
    }

    const { data, error } = await supabase
      .from('product_sales_status')
      .select('product_id, has_sales')
      .in('product_id', productIds);

    if (error) throw error;
    return success((data || []) as Array<{ product_id: string; has_sales: boolean }>);
  } catch (error) {
    logError(error, 'productService:fetchSalesStatusForProducts');
    return failure(normalizeError(error));
  }
}

// Fetch product IDs by level4 category IDs
export async function fetchProductIdsByLevel4Categories(level4CategoryIds: string[]): Promise<Result<string[]>> {
  try {
    if (level4CategoryIds.length === 0) {
      return success([]);
    }

    const { data, error } = await supabase
      .from('product_level4_categories')
      .select('product_id')
      .in('sub_sub_subcategory_id', level4CategoryIds);

    if (error) throw error;
    return success(data?.map((d) => d.product_id) || []);
  } catch (error) {
    logError(error, 'productService:fetchProductIdsByLevel4Categories');
    return failure(normalizeError(error));
  }
}

// Fetch level4 categories for multiple products
export async function fetchLevel4CategoriesForProducts(productIds: string[]): Promise<
  Result<
    Array<{
      product_id: string;
      sub_sub_subcategory_id: string;
      product_sub_sub_subcategories: { name: string } | null;
    }>
  >
> {
  try {
    if (productIds.length === 0) {
      return success([]);
    }

    const { data, error } = await supabase
      .from('product_level4_categories')
      .select('product_id, sub_sub_subcategory_id, product_sub_sub_subcategories(name)')
      .in('product_id', productIds);

    if (error) throw error;
    return success(
      (data || []) as Array<{
        product_id: string;
        sub_sub_subcategory_id: string;
        product_sub_sub_subcategories: { name: string } | null;
      }>,
    );
  } catch (error) {
    logError(error, 'productService:fetchLevel4CategoriesForProducts');
    return failure(normalizeError(error));
  }
}

// Fetch products missing attribute (RPC call)
export async function fetchProductsMissingAttribute(params: {
  attributeId: string;
  sellerId?: string | null;
  archived?: boolean;
}): Promise<Result<string[]>> {
  try {
    const { attributeId, sellerId, archived = false } = params;

    const { data, error } = await supabase.rpc('get_products_missing_attribute', {
      p_attribute_id: attributeId,
      p_seller_id: sellerId || null,
      p_archived: archived,
    });

    if (error) throw error;
    return success((data || []).map((row: { product_id: string }) => row.product_id));
  } catch (error) {
    logError(error, 'productService:fetchProductsMissingAttribute');
    return failure(normalizeError(error));
  }
}

// Fetch products by IDs for bulk edit (no status filtering)
export async function fetchProductsByIdsForBulkEdit(productIds: string[]): Promise<
  Result<
    Array<{
      id: string;
      product_name: string;
      thumbnail?: string | null;
      starting_price: number;
      discounted_price?: number | null;
      stock_quantity?: number | null;
      sku?: string | null;
      weight?: number | null;
      category_id?: string | null;
      subcategory_id?: string | null;
      sub_subcategory_id?: string | null;
      sub_sub_subcategory_id?: string | null;
      brand_id?: string | null;
      status?: string;
      created_at?: string;
      updated_at?: string;
    }>
  >
> {
  try {
    if (productIds.length === 0) {
      return success([]);
    }

    const { data, error } = await supabase
      .from('listings')
      .select(
        'id, product_name, thumbnail, starting_price, discounted_price, stock_quantity, sku, weight, category_id, subcategory_id, sub_subcategory_id, sub_sub_subcategory_id, brand_id, status, created_at, updated_at',
      )
      .in('id', productIds);

    if (error) throw error;
    return success(
      (data || []) as Array<{
        id: string;
        product_name: string;
        thumbnail?: string | null;
        starting_price: number;
        discounted_price?: number | null;
        stock_quantity?: number | null;
        sku?: string | null;
        weight?: number | null;
        category_id?: string | null;
        subcategory_id?: string | null;
        sub_subcategory_id?: string | null;
        sub_sub_subcategory_id?: string | null;
        brand_id?: string | null;
        status?: string;
        created_at?: string;
        updated_at?: string;
      }>,
    );
  } catch (error) {
    logError(error, 'productService:fetchProductsByIdsForBulkEdit');
    return failure(normalizeError(error));
  }
}

// Bulk update products
export async function bulkUpdateProducts(
  updates: Array<{ id: string; updates: Record<string, any> }>,
): Promise<Result<boolean>> {
  try {
    const updatePromises = updates.map(({ id, updates: updateData }) =>
      supabase
        .from('listings')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id),
    );

    const results = await Promise.all(updatePromises);

    for (const result of results) {
      if (result.error) {
        throw result.error;
      }
    }

    return success(true);
  } catch (error) {
    logError(error, 'productService:bulkUpdateProducts');
    return failure(normalizeError(error));
  }
}

// Fetch products count with complex filters (for admin/product management)
export async function fetchProductsCountWithFilters(params: {
  systemSellerId?: string;
  showArchivedProducts?: boolean;
  showSoldProducts?: boolean;
  showDraftProducts?: boolean;
  showPrivateProducts?: boolean;
  showMissingImages?: boolean;
  showPublishedProducts?: boolean;
  searchTerm?: string;
  filterBrand?: string;
  filterLevel1?: string;
  filterLevel2?: string;
  filterLevel3?: string[];
  filterLevel4?: string[];
  filterColors?: string[];
  soldProductIds?: string[] | null;
  level4FilteredProductIds?: string[] | null;
  colorFilteredProductIds?: string[] | null;
  missingAttributeProductIds?: string[] | null;
  missingLevel2?: boolean;
  missingLevel3?: boolean;
  missingLevel4?: boolean;
  lastUpdatedFilter?: string;
  statusFilter?: string;
}): Promise<Result<number>> {
  try {
    const {
      systemSellerId,
      showArchivedProducts = false,
      showSoldProducts = false,
      showDraftProducts = false,
      showPrivateProducts = false,
      showMissingImages = false,
      showPublishedProducts = false,
      searchTerm,
      filterBrand,
      filterLevel1,
      filterLevel2,
      filterLevel3 = [],
      filterLevel4 = [],
      filterColors = [],
      soldProductIds,
      level4FilteredProductIds,
      colorFilteredProductIds,
      missingAttributeProductIds,
      missingLevel2 = false,
      missingLevel3 = false,
      missingLevel4 = false,
      lastUpdatedFilter = 'all',
      statusFilter = 'all',
    } = params;

    let countQuery = supabase
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .eq('product_type', 'shop')
      .eq('archived', showArchivedProducts);

    if (systemSellerId) {
      countQuery = countQuery.eq('seller_id', systemSellerId);
    }

    // Apply status filter from explicit statusFilter or from boolean flags
    if (statusFilter !== 'all') {
      countQuery = countQuery.eq('status', statusFilter);
    } else if (showDraftProducts) {
      countQuery = countQuery.eq('status', 'draft');
    } else if (showPrivateProducts) {
      countQuery = countQuery.eq('status', 'private');
    } else if (showPublishedProducts) {
      countQuery = countQuery.in('status', ['active', 'published']);
    }

    // Apply filters with word-boundary search for better accuracy
    if (searchTerm) {
      const term = searchTerm.trim();
      countQuery = countQuery.or(
        `product_name.ilike.% ${term} %,` + // " cap " - middle of text
          `product_name.ilike.${term} %,` + // "cap " - start of text
          `product_name.ilike.% ${term},` + // " cap" - end of text
          `product_name.eq.${term},` + // "cap" - exact match
          `sku.eq.${term},` + // Exact SKU match
          `sku.ilike.${term}%`, // SKU prefix match
      );
    }
    if (filterBrand && filterBrand !== 'all') {
      countQuery = countQuery.eq('brand_id', filterBrand);
    }
    if (filterLevel1 && filterLevel1 !== 'all') {
      countQuery = countQuery.eq('category_id', filterLevel1);
    }
    if (filterLevel2 && filterLevel2 !== 'all') {
      countQuery = countQuery.eq('subcategory_id', filterLevel2);
    }
    if (filterLevel3.length > 0) {
      countQuery = countQuery.in('sub_subcategory_id', filterLevel3);
    }
    if (filterLevel4.length > 0) {
      // Include products that have Level 4 in primary field OR in junction table
      if (level4FilteredProductIds && level4FilteredProductIds.length > 0) {
        countQuery = countQuery.or(
          `sub_sub_subcategory_id.in.(${filterLevel4.join(',')}),id.in.(${level4FilteredProductIds.join(',')})`,
        );
      } else {
        countQuery = countQuery.in('sub_sub_subcategory_id', filterLevel4);
      }
    }
    if (colorFilteredProductIds && colorFilteredProductIds.length > 0) {
      countQuery = countQuery.in('id', colorFilteredProductIds);
    } else if (filterColors.length > 0) {
      // If color filter is active but no products match, return 0
      return success(0);
    }

    // Apply missing attribute filter
    if (Array.isArray(missingAttributeProductIds)) {
      if (missingAttributeProductIds.length > 0) {
        countQuery = countQuery.in('id', missingAttributeProductIds);
      } else {
        // Missing attribute filter applied but no products match
        return success(0);
      }
    }

    // Apply missing category filters
    if (missingLevel2) {
      countQuery = countQuery.is('subcategory_id', null);
    }
    if (missingLevel3) {
      countQuery = countQuery.is('sub_subcategory_id', null);
    }
    if (missingLevel4) {
      countQuery = countQuery.is('sub_sub_subcategory_id', null);
    }

    // Apply missing images filter
    if (showMissingImages) {
      countQuery = countQuery.or('product_image.is.null,product_image.eq.');
    }

    // Apply sold products filter
    if (showSoldProducts && soldProductIds && soldProductIds.length > 0) {
      countQuery = countQuery.in('id', soldProductIds);
    } else if (showSoldProducts) {
      // If sold filter is active but no products match, return 0
      return success(0);
    }

    // Apply last updated filter (database-side)
    if (lastUpdatedFilter !== 'all') {
      const now = new Date();
      if (lastUpdatedFilter === '24hours') {
        const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        countQuery = countQuery.gte('updated_at', cutoff.toISOString());
      } else if (lastUpdatedFilter === '7days') {
        const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        countQuery = countQuery.gte('updated_at', cutoff.toISOString());
      } else if (lastUpdatedFilter === '30days') {
        const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        countQuery = countQuery.gte('updated_at', cutoff.toISOString());
      } else if (lastUpdatedFilter === '90days') {
        const cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        countQuery = countQuery.gte('updated_at', cutoff.toISOString());
      }
    }

    const { count, error } = await countQuery;
    if (error) throw error;
    return success(count || 0);
  } catch (error) {
    logError(error, 'productService:fetchProductsCountWithFilters');
    return failure(normalizeError(error));
  }
}

// Fetch products with complex filters and pagination (for admin/product management)
export async function fetchProductsWithFiltersAndPagination(params: {
  systemSellerId?: string;
  showArchivedProducts?: boolean;
  showSoldProducts?: boolean;
  showDraftProducts?: boolean;
  showPrivateProducts?: boolean;
  showMissingImages?: boolean;
  showPublishedProducts?: boolean;
  currentPage: number;
  itemsPerPage: number;
  searchTerm?: string;
  filterBrand?: string;
  filterLevel1?: string;
  filterLevel2?: string;
  filterLevel3?: string[];
  filterLevel4?: string[];
  filterColors?: string[];
  soldProductIds?: string[] | null;
  level4FilteredProductIds?: string[] | null;
  colorFilteredProductIds?: string[] | null;
  missingAttributeProductIds?: string[] | null;
  missingLevel2?: boolean;
  missingLevel3?: boolean;
  missingLevel4?: boolean;
  lastUpdatedFilter?: string;
  sortField?: string | null;
  sortDirection?: 'asc' | 'desc';
  statusFilter?: string;
}): Promise<Result<any[]>> {
  try {
    const {
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
      filterLevel3 = [],
      filterLevel4 = [],
      filterColors = [],
      soldProductIds,
      level4FilteredProductIds,
      colorFilteredProductIds,
      missingAttributeProductIds,
      missingLevel2 = false,
      missingLevel3 = false,
      missingLevel4 = false,
      lastUpdatedFilter = 'all',
      sortField,
      sortDirection = 'asc',
      statusFilter = 'all',
    } = params;

    const from = (currentPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    const selectFields = `
      *,
      product_categories(name, master_category_id, master_categories(name)),
      product_subcategories(name),
      product_sub_subcategories(name),
      product_sub_sub_subcategories(name),
      brands(name),
      auctions(id, reserve_price, starting_bid, auction_duration, status, end_time)
    `;

    let query = supabase
      .from('listings')
      .select(selectFields)
      .eq('product_type', 'shop')
      .eq('archived', showArchivedProducts);

    if (systemSellerId) {
      query = query.eq('seller_id', systemSellerId);
    }

    // Apply status filter from explicit statusFilter or from boolean flags
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    } else if (showDraftProducts) {
      query = query.eq('status', 'draft');
    } else if (showPrivateProducts) {
      query = query.eq('status', 'private');
    } else if (showPublishedProducts) {
      query = query.in('status', ['active', 'published']);
    }

    // Apply filters with word-boundary search for better accuracy
    if (searchTerm) {
      const term = searchTerm.trim();
      query = query.or(
        `product_name.ilike.% ${term} %,` + // " hat " - middle of text
          `product_name.ilike.${term} %,` + // "hat " - start of text
          `product_name.ilike.% ${term},` + // " hat" - end of text
          `product_name.eq.${term},` + // "hat" - exact match (case-insensitive by default)
          `sku.eq.${term},` + // Exact SKU match
          `sku.ilike.${term}%`, // SKU prefix match
      );
    }
    if (filterBrand && filterBrand !== 'all') {
      query = query.eq('brand_id', filterBrand);
    }
    if (filterLevel1 && filterLevel1 !== 'all') {
      query = query.eq('category_id', filterLevel1);
    }
    if (filterLevel2 && filterLevel2 !== 'all') {
      query = query.eq('subcategory_id', filterLevel2);
    }
    if (filterLevel3.length > 0) {
      query = query.in('sub_subcategory_id', filterLevel3);
    }
    if (filterLevel4.length > 0) {
      // Include products that have Level 4 in primary field OR in junction table
      if (level4FilteredProductIds && level4FilteredProductIds.length > 0) {
        query = query.or(
          `sub_sub_subcategory_id.in.(${filterLevel4.join(',')}),id.in.(${level4FilteredProductIds.join(',')})`,
        );
      } else {
        query = query.in('sub_sub_subcategory_id', filterLevel4);
      }
    }
    if (colorFilteredProductIds && colorFilteredProductIds.length > 0) {
      query = query.in('id', colorFilteredProductIds);
    } else if (filterColors.length > 0) {
      // If color filter is active but no products match, return empty
      return success([]);
    }

    // Apply missing attribute filter
    if (Array.isArray(missingAttributeProductIds)) {
      if (missingAttributeProductIds.length > 0) {
        query = query.in('id', missingAttributeProductIds);
      } else {
        // Missing attribute filter applied but no products match
        return success([]);
      }
    }

    // Apply missing category filters
    if (missingLevel2) {
      query = query.is('subcategory_id', null);
    }
    if (missingLevel3) {
      query = query.is('sub_subcategory_id', null);
    }
    if (missingLevel4) {
      query = query.is('sub_sub_subcategory_id', null);
    }

    // Apply missing images filter
    if (showMissingImages) {
      query = query.or('product_image.is.null,product_image.eq.');
    }

    // Apply sold products filter
    if (showSoldProducts && soldProductIds && soldProductIds.length > 0) {
      query = query.in('id', soldProductIds);
    } else if (showSoldProducts) {
      // If sold filter is active but no products match, return empty
      return success([]);
    }

    // Apply last updated filter (database-side)
    if (lastUpdatedFilter !== 'all') {
      const now = new Date();
      if (lastUpdatedFilter === '24hours') {
        const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        query = query.gte('updated_at', cutoff.toISOString());
      } else if (lastUpdatedFilter === '7days') {
        const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        query = query.gte('updated_at', cutoff.toISOString());
      } else if (lastUpdatedFilter === '30days') {
        const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        query = query.gte('updated_at', cutoff.toISOString());
      } else if (lastUpdatedFilter === '90days') {
        const cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        query = query.gte('updated_at', cutoff.toISOString());
      }
    }

    // Apply sorting before pagination
    if (sortField && sortField !== 'custom_opts') {
      const ascending = sortDirection === 'asc';

      // Handle special cases for related table sorting
      if (sortField === 'brand_name') {
        query = query.order('brand_id', { ascending, nullsFirst: false }).order('id', { ascending: true });
      } else if (
        sortField === 'subcategory_id' ||
        sortField === 'sub_subcategory_id' ||
        sortField === 'sub_sub_subcategory_id'
      ) {
        // Sort by category IDs (will group by category)
        query = query.order(sortField, { ascending, nullsFirst: false }).order('id', { ascending: true });
      } else if (sortField === 'sku') {
        // Sort by SKU with secondary sort by ID for consistency
        query = query.order(sortField, { ascending, nullsFirst: false }).order('id', { ascending: true });
      } else if (sortField === 'status') {
        // Sort by status with secondary sort by ID for consistent ordering
        query = query.order(sortField, { ascending, nullsFirst: false }).order('id', { ascending: true });
      } else {
        query = query.order(sortField, { ascending, nullsFirst: false }).order('id', { ascending: true });
      }
    } else if (sortField !== 'custom_opts') {
      // Default sorting (skip if sorting by custom_opts which is done client-side)
      query = query.order('created_at', { ascending: false }).order('id', { ascending: true });
    }

    // Apply pagination
    query = query.range(from, to);

    const { data, error } = await query;
    if (error) throw error;

    return success(data || []);
  } catch (error) {
    logError(error, 'productService:fetchProductsWithFiltersAndPagination');
    return failure(normalizeError(error));
  }
}
