// Helper functions for syncing products to Algolia
// DEPRECATED: Use services/algolia instead
import {
  syncProducts,
  deleteProducts,
  syncAllProducts,
  syncCategories,
  syncAllCategories,
  syncBrands,
  syncAllBrands,
} from '@/services/algolia';
import { isFailure } from '@/types/api';

/**
 * Manually trigger a sync for specific product IDs
 * @deprecated Use syncProducts from '@/services/algolia' instead
 */
export const syncProductsToAlgolia = async (productIds: string[]) => {
  const result = await syncProducts(productIds);
  if (isFailure(result)) {
    throw result.error;
  }
  return result.data;
};

/**
 * Delete products from Algolia
 * @deprecated Use deleteProducts from '@/services/algolia' instead
 */
export const deleteProductsFromAlgolia = async (productIds: string[]) => {
  const result = await deleteProducts(productIds);
  if (isFailure(result)) {
    throw result.error;
  }
  return result.data;
};

/**
 * Sync all published products to Algolia
 * @deprecated Use syncAllProducts from '@/services/algolia' instead
 */
export const syncAllProductsToAlgolia = async () => {
  const result = await syncAllProducts();
  if (isFailure(result)) {
    throw result.error;
  }
  return result.data;
};

/**
 * Manually trigger a sync for specific category IDs
 * @deprecated Use syncCategories from '@/services/algolia' instead
 */
export const syncCategoriesToAlgolia = async (categoryIds: string[]) => {
  const result = await syncCategories(categoryIds);
  if (isFailure(result)) {
    throw result.error;
  }
  return result.data;
};

/**
 * Sync all active categories to Algolia
 * @deprecated Use syncAllCategories from '@/services/algolia' instead
 */
export const syncAllCategoriesToAlgolia = async () => {
  const result = await syncAllCategories();
  if (isFailure(result)) {
    throw result.error;
  }
  return result.data;
};

/**
 * Manually trigger a sync for specific brand IDs
 * @deprecated Use syncBrands from '@/services/algolia' instead
 */
export const syncBrandsToAlgolia = async (brandIds: string[]) => {
  const result = await syncBrands(brandIds);
  if (isFailure(result)) {
    throw result.error;
  }
  return result.data;
};

/**
 * Sync all active brands to Algolia
 * @deprecated Use syncAllBrands from '@/services/algolia' instead
 */
export const syncAllBrandsToAlgolia = async () => {
  const result = await syncAllBrands();
  if (isFailure(result)) {
    throw result.error;
  }
  return result.data;
};
