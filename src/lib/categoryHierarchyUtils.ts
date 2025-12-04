/**
 * Utility functions for building category hierarchy structures
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { filterByCategoryId, filterBySubcategoryId, filterBySubSubcategoryId } from './filterUtils';

// ============================================
// Type definitions with meaningful names
// ============================================

interface BaseCategory {
  id: string;
  [key: string]: unknown;
}

interface Level2Category extends BaseCategory {
  category_id: string;
}

interface Level3Category extends BaseCategory {
  subcategory_id: string;
}

interface Level4Category extends BaseCategory {
  sub_subcategory_id: string;
}

interface HierarchyOptions {
  /** Property name for Level 3 categories array (default: 'product_sub_subcategories') */
  level3Key?: string;
  /** Property name for Level 4 categories array (default: 'product_sub_sub_subcategories') */
  level4Key?: string;
}

// ============================================
// Main hierarchy builder functions
// ============================================

/**
 * Builds a nested category hierarchy from flat arrays of categories at each level.
 * Uses semantic variable names: level2, level3, level4 instead of sub/subSub/subSubSub
 * 
 * @param parentCategoryId - The parent category ID to filter Level 2 categories by
 * @param level2Items - Array of Level 2 categories
 * @param level3Items - Array of Level 3 categories
 * @param level4Items - Array of Level 4 categories
 * @param options - Optional configuration for property names
 * @returns Nested hierarchy array
 */
export function buildCategoryHierarchy<T extends Level2Category>(
  parentCategoryId: string,
  level2Items: T[] | null | undefined,
  level3Items: Level3Category[] | null | undefined,
  level4Items: Level4Category[] | null | undefined,
  options: HierarchyOptions = {}
): unknown[] {
  const {
    level3Key = 'product_sub_subcategories',
    level4Key = 'product_sub_sub_subcategories',
  } = options;

  // Early bailout for empty data
  if (!level2Items?.length) return [];

  return filterByCategoryId(level2Items, parentCategoryId)
    .map(level2Category => ({
      ...level2Category,
      [level3Key]: filterBySubcategoryId(level3Items, level2Category.id)
        .map(level3Category => ({
          ...level3Category,
          [level4Key]: filterBySubSubcategoryId(level4Items, level3Category.id),
        })),
    }));
}

/**
 * Builds category hierarchy with 'subcategories' naming (for admin/management views)
 */
export function buildAdminCategoryHierarchy<T extends Level2Category>(
  parentCategoryId: string,
  level2Items: T[] | null | undefined,
  level3Items: Level3Category[] | null | undefined,
  level4Items: Level4Category[] | null | undefined
): unknown[] {
  return buildCategoryHierarchy(parentCategoryId, level2Items, level3Items, level4Items, {
    level3Key: 'sub_subcategories',
    level4Key: 'sub_sub_subcategories',
  });
}

// ============================================
// Category level maps for quick lookups
// ============================================

export interface CategoryLevelMaps {
  l1Map: Map<string, any>;
  l2Map: Map<string, any>;
  l3Map: Map<string, any>;
  l4Map: Map<string, any>;
}

/**
 * Creates Maps for quick category lookups by ID at each hierarchy level.
 * 
 * @param l1Data - Array of Level 1 categories (optional)
 * @param l2Data - Array of Level 2 categories
 * @param l3Data - Array of Level 3 categories
 * @param l4Data - Array of Level 4 categories
 * @returns Object containing Maps for each level
 */
export function buildCategoryLevelMaps(
  l1Data: unknown[] | null | undefined,
  l2Data: unknown[] | null | undefined,
  l3Data: unknown[] | null | undefined,
  l4Data: unknown[] | null | undefined
): CategoryLevelMaps {
  return {
    l1Map: new Map((l1Data || []).map((item) => [item.id, item])),
    l2Map: new Map((l2Data || []).map((item) => [item.id, item])),
    l3Map: new Map((l3Data || []).map((item) => [item.id, item])),
    l4Map: new Map((l4Data || []).map((item) => [item.id, item])),
  };
}
