// Utility functions for applying listing filters to Supabase queries

interface ListingFilterParams {
  activeCategory: string | null;
  activeSubcategory: string | null;
  activeSubSubcategory: string | null;
  isSubSubcategoryPage: boolean;
  selectedBrands: Set<string>;
  selectedLowestLevel: Set<string>;
}

/**
 * Applies category hierarchy and brand filters to a Supabase query
 * Works with queries that join listings table (e.g., product_attribute_values with listings!inner)
 */
export function applyListingFilters(
  query: any,
  {
    activeCategory,
    activeSubcategory,
    activeSubSubcategory,
    isSubSubcategoryPage,
    selectedBrands,
    selectedLowestLevel,
  }: ListingFilterParams
): any {
  if (activeCategory) {
    query = query.eq('listings.category_id', activeCategory);
  }
  if (activeSubcategory) {
    query = query.eq('listings.subcategory_id', activeSubcategory);
  }
  if (activeSubSubcategory && isSubSubcategoryPage) {
    query = query.eq('listings.sub_subcategory_id', activeSubSubcategory);
  }
  if (selectedLowestLevel.size > 0) {
    query = query.in('listings.sub_sub_subcategory_id', Array.from(selectedLowestLevel));
  }
  if (selectedBrands.size > 0) {
    query = query.in('listings.brand_id', Array.from(selectedBrands));
  }
  return query;
}

/**
 * Applies category hierarchy filters directly to listings table (no join prefix)
 */
export function applyDirectListingFilters(
  query: any,
  {
    activeCategory,
    activeSubcategory,
    activeSubSubcategory,
    isSubSubcategoryPage,
    selectedLowestLevel,
  }: Omit<ListingFilterParams, 'selectedBrands'>
): any {
  if (activeCategory) {
    query = query.eq('category_id', activeCategory);
  }
  if (activeSubcategory) {
    query = query.eq('subcategory_id', activeSubcategory);
  }
  if (activeSubSubcategory && isSubSubcategoryPage) {
    query = query.eq('sub_subcategory_id', activeSubSubcategory);
  }
  if (selectedLowestLevel.size > 0) {
    query = query.in('sub_sub_subcategory_id', Array.from(selectedLowestLevel));
  }
  return query;
}
