// Algolia Service
// Centralized access to Algolia sync operations

import { supabase } from '@/integrations/supabase/client';
import { invokeEdgeFunction } from '@/services/functions';
import type { Result } from '@/types/api';
import { success, failure, isFailure } from '@/types/api';
import { normalizeError, logError } from '@/lib/errors';

/**
 * Manually trigger a sync for specific product IDs
 */
export async function syncProducts(productIds: string[]): Promise<Result<any>> {
  try {
    const result = await invokeEdgeFunction({
      functionName: 'sync-products-to-algolia',
      body: {
        action: 'sync',
        productIds,
      },
    });
    if (isFailure(result)) {
      throw result.error;
    }
    return result;
  } catch (error: any) {
    logError(error, 'algoliaService:syncProducts');
    return failure(normalizeError(error));
  }
}

/**
 * Delete products from Algolia
 */
export async function deleteProducts(productIds: string[]): Promise<Result<any>> {
  try {
    const result = await invokeEdgeFunction({
      functionName: 'sync-products-to-algolia',
      body: {
        action: 'delete',
        productIds,
      },
    });
    if (isFailure(result)) {
      throw result.error;
    }
    return result;
  } catch (error) {
    logError(error, 'algoliaService:deleteProducts');
    return failure(normalizeError(error));
  }
}

/**
 * Sync all published products to Algolia
 * This is useful for initial indexing
 */
export async function syncAllProducts(): Promise<
  Result<{
    success: boolean;
    message: string;
    count: number;
    batches: number;
  }>
> {
  try {
    const productIds: string[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    // Fetch all published product IDs
    while (hasMore) {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data: products, error } = await supabase
        .from('listings')
        .select('id')
        .eq('product_type', 'shop')
        .eq('status', 'published')
        .eq('archived', false)
        .range(from, to);

      if (error) throw error;

      if (!products || products.length === 0) {
        hasMore = false;
        return success({ success: true, message: 'No products to sync', count: 0, batches: 0 });
      }

      productIds.push(...products.map((p) => p.id));

      if (products.length < pageSize) {
        hasMore = false;
      } else {
        page++;
      }
    }

    // Sync in batches of 10
    const batchSize = 10;
    const batches: string[][] = [];
    for (let i = 0; i < productIds.length; i += batchSize) {
      batches.push(productIds.slice(i, i + batchSize));
    }

    const results = [];
    for (const batch of batches) {
      const result = await syncProducts(batch);
      if (!result.success) {
        return result;
      }
      results.push(result.data);
    }

    return success({
      success: true,
      message: `Synced ${productIds.length} products in ${batches.length} batches`,
      count: productIds.length,
      batches: batches.length,
    });
  } catch (error) {
    logError(error, 'algoliaService:syncAllProducts');
    return failure(normalizeError(error));
  }
}

/**
 * Manually trigger a sync for specific category IDs
 */
export async function syncCategories(categoryIds: string[]): Promise<Result<any>> {
  try {
    const result = await invokeEdgeFunction({
      functionName: 'sync-categories-to-algolia',
      body: {
        action: 'sync',
        categoryIds,
      },
    });
    if (isFailure(result)) {
      throw result.error;
    }
    return result;
  } catch (error: any) {
    logError(error, 'algoliaService:syncCategories');
    return failure(normalizeError(error));
  }
}

/**
 * Sync all active categories to Algolia
 * This is useful for initial indexing
 */
export async function syncAllCategories(): Promise<
  Result<{
    success: boolean;
    message: string;
    count: number;
    batches: number;
  }>
> {
  try {
    const categoryIds: string[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    // Fetch all active category IDs from all category tables
    // Level 1: Categories
    hasMore = true;
    page = 0;
    while (hasMore) {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data: categories, error } = await supabase
        .from('product_categories')
        .select('id')
        .eq('is_active', true)
        .range(from, to);

      if (error) throw error;

      if (!categories || categories.length === 0) {
        hasMore = false;
      } else {
        categoryIds.push(...categories.map((c) => c.id));
        if (categories.length < pageSize) {
          hasMore = false;
        } else {
          page++;
        }
      }
    }

    // Level 2: Subcategories
    hasMore = true;
    page = 0;
    while (hasMore) {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data: subcategories, error } = await supabase
        .from('product_subcategories')
        .select('id')
        .eq('is_active', true)
        .range(from, to);

      if (error) throw error;

      if (!subcategories || subcategories.length === 0) {
        hasMore = false;
      } else {
        categoryIds.push(...subcategories.map((s) => s.id));
        if (subcategories.length < pageSize) {
          hasMore = false;
        } else {
          page++;
        }
      }
    }

    // Level 3: Sub-subcategories
    hasMore = true;
    page = 0;
    while (hasMore) {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data: subSubcategories, error } = await supabase
        .from('product_sub_subcategories')
        .select('id')
        .eq('is_active', true)
        .range(from, to);

      if (error) throw error;

      if (!subSubcategories || subSubcategories.length === 0) {
        hasMore = false;
      } else {
        categoryIds.push(...subSubcategories.map((s) => s.id));
        if (subSubcategories.length < pageSize) {
          hasMore = false;
        } else {
          page++;
        }
      }
    }

    // Level 4: Sub-sub-subcategories
    hasMore = true;
    page = 0;
    while (hasMore) {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data: subSubSubcategories, error } = await supabase
        .from('product_sub_sub_subcategories')
        .select('id')
        .eq('is_active', true)
        .range(from, to);

      if (error) throw error;

      if (!subSubSubcategories || subSubSubcategories.length === 0) {
        hasMore = false;
      } else {
        categoryIds.push(...subSubSubcategories.map((s) => s.id));
        if (subSubSubcategories.length < pageSize) {
          hasMore = false;
        } else {
          page++;
        }
      }
    }

    if (categoryIds.length === 0) {
      return success({ success: true, message: 'No categories to sync', count: 0, batches: 0 });
    }

    // Sync in batches of 10
    const batchSize = 10;
    const batches: string[][] = [];
    for (let i = 0; i < categoryIds.length; i += batchSize) {
      batches.push(categoryIds.slice(i, i + batchSize));
    }

    const results = [];
    for (const batch of batches) {
      const result = await syncCategories(batch);
      if (!result.success) {
        return result;
      }
      results.push(result.data);
    }

    return success({
      success: true,
      message: `Synced ${categoryIds.length} categories in ${batches.length} batches`,
      count: categoryIds.length,
      batches: batches.length,
    });
  } catch (error) {
    logError(error, 'algoliaService:syncAllCategories');
    return failure(normalizeError(error));
  }
}

/**
 * Manually trigger a sync for specific brand IDs
 */
export async function syncBrands(brandIds: string[]): Promise<Result<any>> {
  try {
    const result = await invokeEdgeFunction({
      functionName: 'sync-brands-to-algolia',
      body: {
        action: 'sync',
        brandIds,
      },
    });
    if (isFailure(result)) {
      throw result.error;
    }
    return result;
  } catch (error: any) {
    logError(error, 'algoliaService:syncBrands');
    return failure(normalizeError(error));
  }
}

/**
 * Sync all active brands to Algolia
 * This is useful for initial indexing
 */
export async function syncAllBrands(): Promise<
  Result<{
    success: boolean;
    message: string;
    count: number;
    batches: number;
  }>
> {
  try {
    const brandIds: string[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    // Fetch all active brand IDs
    while (hasMore) {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data: brands, error } = await supabase.from('brands').select('id').eq('is_active', true).range(from, to);

      if (error) throw error;

      if (!brands || brands.length === 0) {
        hasMore = false;
        return success({ success: true, message: 'No brands to sync', count: 0, batches: 0 });
      }

      brandIds.push(...brands.map((b) => b.id));

      if (brands.length < pageSize) {
        hasMore = false;
      } else {
        page++;
      }
    }

    // Sync in batches of 10
    const batchSize = 10;
    const batches: string[][] = [];
    for (let i = 0; i < brandIds.length; i += batchSize) {
      batches.push(brandIds.slice(i, i + batchSize));
    }

    const results = [];
    for (const batch of batches) {
      const result = await syncBrands(batch);
      if (!result.success) {
        return result;
      }
      results.push(result.data);
    }

    return success({
      success: true,
      message: `Synced ${brandIds.length} brands in ${batches.length} batches`,
      count: brandIds.length,
      batches: batches.length,
    });
  } catch (error) {
    logError(error, 'algoliaService:syncAllBrands');
    return failure(normalizeError(error));
  }
}
