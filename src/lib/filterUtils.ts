/**
 * Generic filter utilities for filtering arrays by field values.
 * Provides null-safe filtering with improved readability.
 */

/**
 * Generic filter function that filters an array by a field value.
 * Handles null/undefined arrays gracefully.
 * 
 * @param items - Array to filter (can be null/undefined)
 * @param field - Field name to filter by
 * @param value - Value to match
 * @returns Filtered array (empty array if input is null/undefined)
 */
export function filterByField<T, K extends keyof T>(
  items: T[] | null | undefined,
  field: K,
  value: T[K]
): T[] {
  return (items ?? []).filter(item => item[field] === value);
}

// ============================================
// Convenience aliases for category hierarchy
// ============================================

/**
 * Filter items by category_id field
 */
export function filterByCategoryId<T extends { category_id: string }>(
  items: T[] | null | undefined,
  categoryId: string
): T[] {
  return filterByField(items, 'category_id', categoryId);
}

/**
 * Filter items by subcategory_id field
 */
export function filterBySubcategoryId<T extends { subcategory_id: string }>(
  items: T[] | null | undefined,
  subcategoryId: string
): T[] {
  return filterByField(items, 'subcategory_id', subcategoryId);
}

/**
 * Filter items by sub_subcategory_id field
 */
export function filterBySubSubcategoryId<T extends { sub_subcategory_id: string }>(
  items: T[] | null | undefined,
  subSubcategoryId: string
): T[] {
  return filterByField(items, 'sub_subcategory_id', subSubcategoryId);
}
