// Category Service
// Centralized data access for category-related operations

import { supabase } from '@/integrations/supabase/client';
import { withErrorHandling, withMaybeNull, withMutation } from '@/services/api/apiClient';
import type { Result } from '@/types/api';
import type { Category, Subcategory, SubSubcategory, SubSubSubcategory, CategoryHierarchy } from '@/types/category';

// Fetch all active Level 1 categories
export async function fetchCategories(): Promise<Result<Category[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return { data: data || [], error: null };
  }, 'fetchCategories');
}

// Fetch a single category by ID or slug
export async function fetchCategoryByIdOrSlug(idOrSlug: string): Promise<Result<Category | null>> {
  return withMaybeNull(async () => {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    let query = supabase.from('product_categories').select('*').eq('is_active', true);

    if (isUUID) {
      query = query.eq('id', idOrSlug);
    } else {
      query = query.eq('slug', idOrSlug);
    }

    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return { data, error: null };
  }, 'fetchCategoryByIdOrSlug');
}

// Fetch Level 2 subcategories for a category
export async function fetchSubcategories(categoryId: string): Promise<Result<Subcategory[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('product_subcategories')
      .select('*')
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return { data: data || [], error: null };
  }, 'fetchSubcategories');
}

// Fetch a single subcategory by ID or slug
export async function fetchSubcategoryByIdOrSlug(
  idOrSlug: string,
  categoryId?: string,
): Promise<Result<Subcategory | null>> {
  return withMaybeNull(async () => {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    let query = supabase.from('product_subcategories').select('*').eq('is_active', true);

    if (isUUID) {
      query = query.eq('id', idOrSlug);
    } else {
      query = query.eq('slug', idOrSlug);
    }

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return { data, error: null };
  }, 'fetchSubcategoryByIdOrSlug');
}

// Fetch Level 3 sub-subcategories for a subcategory
export async function fetchSubSubcategories(subcategoryId: string): Promise<Result<SubSubcategory[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('product_sub_subcategories')
      .select('*')
      .eq('subcategory_id', subcategoryId)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return { data: data || [], error: null };
  }, 'fetchSubSubcategories');
}

// Fetch Level 4 sub-sub-subcategories
export async function fetchSubSubSubcategories(subSubcategoryId: string): Promise<Result<SubSubSubcategory[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('product_sub_sub_subcategories')
      .select('*')
      .eq('sub_subcategory_id', subSubcategoryId)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return { data: data || [], error: null };
  }, 'fetchSubSubSubcategories');
}

// Fetch Level 3 sub-subcategories for multiple subcategory IDs
export async function fetchSubSubcategoriesBySubcategoryIds(
  subcategoryIds: string[],
): Promise<Result<SubSubcategory[]>> {
  return withErrorHandling(async () => {
    if (subcategoryIds.length === 0) {
      return { data: [], error: null };
    }

    const { data, error } = await supabase
      .from('product_sub_subcategories')
      .select('id,name,slug,description,synonyms,subcategory_id,is_active,image_url,show_in_category_grid')
      .in('subcategory_id', subcategoryIds)
      .order('name', { ascending: true });

    if (error) throw error;
    return { data: (data || []) as SubSubcategory[], error: null };
  }, 'fetchSubSubcategoriesBySubcategoryIds');
}

// Fetch Level 4 sub-sub-subcategories for multiple sub-subcategory IDs
export async function fetchSubSubSubcategoriesBySubSubcategoryIds(
  subSubcategoryIds: string[],
): Promise<Result<SubSubSubcategory[]>> {
  return withErrorHandling(async () => {
    if (subSubcategoryIds.length === 0) {
      return { data: [], error: null };
    }

    const { data, error } = await supabase
      .from('product_sub_sub_subcategories')
      .select('id,name,slug,description,synonyms,sub_subcategory_id,is_active')
      .in('sub_subcategory_id', subSubcategoryIds)
      .order('name', { ascending: true });

    if (error) throw error;
    return { data: (data || []) as SubSubSubcategory[], error: null };
  }, 'fetchSubSubSubcategoriesBySubSubcategoryIds');
}

// Fetch full category hierarchy for a given category slug path
export async function fetchCategoryHierarchy(
  categorySlug: string,
  subcategorySlug?: string,
  subSubcategorySlug?: string,
): Promise<Result<CategoryHierarchy>> {
  return withErrorHandling(async () => {
    const hierarchy: CategoryHierarchy = {
      level1: null,
      level2: null,
      level3: null,
      level4Items: [],
    };

    // Fetch Level 1 category
    const { data: category } = await supabase
      .from('product_categories')
      .select('*')
      .eq('slug', categorySlug)
      .eq('is_active', true)
      .maybeSingle();

    if (!category) {
      return { data: hierarchy, error: null };
    }
    hierarchy.level1 = category;

    // Fetch Level 2 subcategory if provided
    if (subcategorySlug) {
      const { data: subcategory } = await supabase
        .from('product_subcategories')
        .select('*')
        .eq('slug', subcategorySlug)
        .eq('category_id', category.id)
        .eq('is_active', true)
        .maybeSingle();

      if (subcategory) {
        hierarchy.level2 = subcategory;

        // Fetch Level 3 sub-subcategory if provided
        if (subSubcategorySlug) {
          const { data: subSubcategory } = await supabase
            .from('product_sub_subcategories')
            .select('*')
            .eq('slug', subSubcategorySlug)
            .eq('subcategory_id', subcategory.id)
            .eq('is_active', true)
            .maybeSingle();

          if (subSubcategory) {
            hierarchy.level3 = subSubcategory;

            // Fetch Level 4 items
            const { data: level4Items } = await supabase
              .from('product_sub_sub_subcategories')
              .select('*')
              .eq('sub_subcategory_id', subSubcategory.id)
              .eq('is_active', true)
              .order('name', { ascending: true });

            hierarchy.level4Items = level4Items || [];
          }
        }
      }
    }

    return { data: hierarchy, error: null };
  }, 'fetchCategoryHierarchy');
}

// Level 3 category display item type
export interface Level3DisplayCategory {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  subcategory_id: string;
  show_in_category_grid: boolean | null;
  parentSlug: string;
}

// Fetch Level 3 categories for display on category page
export async function fetchLevel3CategoriesForDisplay(categoryId: string): Promise<Result<Level3DisplayCategory[]>> {
  return withErrorHandling(async () => {
    // Get all level 2 subcategories for this category
    const { data: level2Data, error: level2Error } = await supabase
      .from('product_subcategories')
      .select('id, slug')
      .eq('category_id', categoryId)
      .eq('is_active', true);

    if (level2Error || !level2Data?.length) {
      return { data: [], error: null };
    }

    const level2Ids = level2Data.map((l2) => l2.id);
    const level2SlugMap = new Map(level2Data.map((l2) => [l2.id, l2.slug]));

    // Get all level 3 sub-subcategories
    const { data, error } = await supabase
      .from('product_sub_subcategories')
      .select('id, name, slug, image_url, subcategory_id, show_in_category_grid')
      .in('subcategory_id', level2Ids)
      .eq('is_active', true)
      .eq('show_in_category_grid', true)
      .order('name', { ascending: true });

    if (error) throw error;

    const result: Level3DisplayCategory[] = (data || []).map((l3) => ({
      id: l3.id,
      name: l3.name,
      slug: l3.slug,
      image_url: l3.image_url,
      subcategory_id: l3.subcategory_id,
      show_in_category_grid: l3.show_in_category_grid,
      parentSlug: level2SlugMap.get(l3.subcategory_id) || '',
    }));

    return { data: result, error: null };
  }, 'fetchLevel3CategoriesForDisplay');
}

// Fetch brands associated with a category
export async function fetchBrandsForCategory(
  categoryId: string,
  subcategoryId?: string,
  subSubcategoryId?: string,
): Promise<Result<{ id: string; name: string }[]>> {
  return withErrorHandling(async () => {
    let query = supabase
      .from('listings')
      .select('brand_id, brands(id, name)')
      .eq('product_type', 'shop')
      .eq('archived', false)
      .eq('status', 'published')
      .not('brand_id', 'is', null);

    if (subSubcategoryId) {
      query = query.eq('sub_subcategory_id', subSubcategoryId);
    } else if (subcategoryId) {
      query = query.eq('subcategory_id', subcategoryId);
    } else if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Extract unique brands
    const brandsMap = new Map<string, { id: string; name: string }>();
    data?.forEach((item: unknown) => {
      if (item.brands?.id && item.brands?.name) {
        brandsMap.set(item.brands.id, {
          id: item.brands.id,
          name: item.brands.name,
        });
      }
    });

    return {
      data: Array.from(brandsMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
      error: null,
    };
  }, 'fetchBrandsForCategory');
}

// Fetch category grid images
export interface CategoryGridImage {
  id: string;
  category_id: string;
  image_url: string;
  button_text: string;
  link: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export async function fetchCategoryGridImages(categoryId: string): Promise<Result<CategoryGridImage[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('category_grid_images')
      .select('*')
      .eq('category_id', categoryId)
      .order('display_order');

    if (error) throw error;
    return { data: data || [], error: null };
  }, 'fetchCategoryGridImages');
}

// Fetch simple category list (id, name only)
export async function fetchCategoryList(): Promise<Result<{ id: string; name: string }[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('product_categories')
      .select('id, name')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return { data: data || [], error: null };
  }, 'fetchCategoryList');
}

// Fetch simple subcategory list (id, name only) with optional filter
export async function fetchSubcategoryList(categoryId?: string): Promise<Result<{ id: string; name: string }[]>> {
  return withErrorHandling(async () => {
    let query = supabase.from('product_subcategories').select('id, name').eq('is_active', true).order('name');

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { data: data || [], error: null };
  }, 'fetchSubcategoryList');
}

// Fetch all categories with synonyms (for search)
export async function fetchAllCategoriesWithSynonyms(): Promise<Result<Category[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('product_categories')
      .select('id, name, slug, synonyms')
      .eq('is_active', true);

    if (error) throw error;
    return { data: (data || []) as Category[], error: null };
  }, 'fetchAllCategoriesWithSynonyms');
}

// Fetch all subcategories with synonyms (for search)
export async function fetchAllSubcategoriesWithSynonyms(): Promise<Result<Subcategory[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('product_subcategories')
      .select('id, name, slug, synonyms')
      .eq('is_active', true);

    if (error) throw error;
    return { data: (data || []) as Subcategory[], error: null };
  }, 'fetchAllSubcategoriesWithSynonyms');
}

// Fetch all sub-subcategories with synonyms (for search)
export async function fetchAllSubSubcategoriesWithSynonyms(): Promise<Result<SubSubcategory[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('product_sub_subcategories')
      .select('id, name, slug, synonyms')
      .eq('is_active', true);

    if (error) throw error;
    return { data: (data || []) as SubSubcategory[], error: null };
  }, 'fetchAllSubSubcategoriesWithSynonyms');
}

// Fetch all active subcategories (for bulk operations)
export async function fetchAllSubcategories(): Promise<
  Result<Array<{ id: string; name: string; slug: string; category_id: string }>>
> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('product_subcategories')
      .select('id, name, slug, category_id')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return {
      data: (data || []) as Array<{ id: string; name: string; slug: string; category_id: string }>,
      error: null,
    };
  }, 'fetchAllSubcategories');
}

// Fetch all active sub-subcategories (for bulk operations)
export async function fetchAllSubSubcategories(): Promise<
  Result<Array<{ id: string; name: string; slug: string; subcategory_id: string }>>
> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('product_sub_subcategories')
      .select('id, name, slug, subcategory_id')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return {
      data: (data || []) as Array<{ id: string; name: string; slug: string; subcategory_id: string }>,
      error: null,
    };
  }, 'fetchAllSubSubcategories');
}

// Fetch all active sub-sub-subcategories (for bulk operations)
export async function fetchAllSubSubSubcategories(): Promise<
  Result<Array<{ id: string; name: string; slug: string; sub_subcategory_id: string }>>
> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('product_sub_sub_subcategories')
      .select('id, name, slug, sub_subcategory_id')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return {
      data: (data || []) as Array<{ id: string; name: string; slug: string; sub_subcategory_id: string }>,
      error: null,
    };
  }, 'fetchAllSubSubSubcategories');
}

// Fetch categories with minimal fields (id, name, slug) for dropdowns
export async function fetchCategoriesMinimal(): Promise<Result<Array<{ id: string; name: string; slug: string }>>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('product_categories')
      .select('id, name, slug')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return { data: (data || []) as Array<{ id: string; name: string; slug: string }>, error: null };
  }, 'fetchCategoriesMinimal');
}

// Fetch subcategories with minimal fields for a category
export async function fetchSubcategoriesMinimal(
  categoryId: string,
): Promise<Result<Array<{ id: string; name: string; slug: string }>>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('product_subcategories')
      .select('id, name, slug')
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return { data: (data || []) as Array<{ id: string; name: string; slug: string }>, error: null };
  }, 'fetchSubcategoriesMinimal');
}

// Fetch sub-subcategories with minimal fields for a subcategory
export async function fetchSubSubcategoriesMinimal(
  subcategoryId: string,
): Promise<Result<Array<{ id: string; name: string; slug: string }>>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('product_sub_subcategories')
      .select('id, name, slug')
      .eq('subcategory_id', subcategoryId)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return { data: (data || []) as Array<{ id: string; name: string; slug: string }>, error: null };
  }, 'fetchSubSubcategoriesMinimal');
}

// Fetch sub-sub-subcategories with minimal fields for a sub-subcategory
export async function fetchSubSubSubcategoriesMinimal(
  subSubcategoryId: string,
): Promise<Result<Array<{ id: string; name: string; slug: string }>>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('product_sub_sub_subcategories')
      .select('id, name, slug')
      .eq('sub_subcategory_id', subSubcategoryId)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return { data: (data || []) as Array<{ id: string; name: string; slug: string }>, error: null };
  }, 'fetchSubSubSubcategoriesMinimal');
}

// Fetch category by ID and level (for enriching custom list items)
export async function fetchCategoryByIdAndLevel(
  categoryId: string,
  level: number,
): Promise<Result<{ id: string; name: string; slug: string } | null>> {
  return withErrorHandling(async () => {
    const tableName =
      level === 1
        ? 'product_categories'
        : level === 2
          ? 'product_subcategories'
          : level === 3
            ? 'product_sub_subcategories'
            : 'product_sub_sub_subcategories';

    const { data, error } = await supabase.from(tableName).select('id, name, slug').eq('id', categoryId).maybeSingle();

    if (error) throw error;
    return { data: (data || null) as { id: string; name: string; slug: string } | null, error: null };
  }, 'fetchCategoryByIdAndLevel');
}

// Fetch category slug by ID
export async function fetchCategorySlug(categoryId: string): Promise<Result<string | null>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase.from('product_categories').select('slug').eq('id', categoryId).maybeSingle();

    if (error) throw error;
    return { data: data?.slug || null, error: null };
  }, 'fetchCategorySlug');
}

// Fetch subcategory slug by ID
export async function fetchSubcategorySlug(subcategoryId: string): Promise<Result<string | null>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('product_subcategories')
      .select('slug')
      .eq('id', subcategoryId)
      .maybeSingle();

    if (error) throw error;
    return { data: data?.slug || null, error: null };
  }, 'fetchSubcategorySlug');
}

// Fetch sub-subcategory slug by ID
export async function fetchSubSubcategorySlug(subSubcategoryId: string): Promise<Result<string | null>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('product_sub_subcategories')
      .select('slug')
      .eq('id', subSubcategoryId)
      .maybeSingle();

    if (error) throw error;
    return { data: data?.slug || null, error: null };
  }, 'fetchSubSubcategorySlug');
}

// Fetch sub-sub-subcategory slug by ID
export async function fetchSubSubSubcategorySlug(subSubSubcategoryId: string): Promise<Result<string | null>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('product_sub_sub_subcategories')
      .select('slug')
      .eq('id', subSubSubcategoryId)
      .maybeSingle();

    if (error) throw error;
    return { data: data?.slug || null, error: null };
  }, 'fetchSubSubSubcategorySlug');
}

// Fetch Level 3 categories with optional filters (by Level 1 or Level 2)
export async function fetchLevel3CategoriesWithFilters(filters: {
  level1Id?: string;
  level2Id?: string;
}): Promise<Result<Array<{ id: string; name: string }>>> {
  return withErrorHandling(async () => {
    let query = supabase.from('product_sub_subcategories').select('id, name').eq('is_active', true);

    if (filters.level2Id) {
      query = query.eq('subcategory_id', filters.level2Id);
    } else if (filters.level1Id) {
      // Use inner join to filter by Level 1 category
      query = supabase
        .from('product_sub_subcategories')
        .select('id, name, product_subcategories!inner(category_id)')
        .eq('is_active', true)
        .eq('product_subcategories.category_id', filters.level1Id);
    }

    const { data, error } = await query;
    if (error) throw error;

    return { data: (data || []) as Array<{ id: string; name: string }>, error: null };
  }, 'fetchLevel3CategoriesWithFilters');
}

// Fetch Level 4 categories with optional filters (by Level 1, 2, or 3)
export async function fetchLevel4CategoriesWithFilters(filters: {
  level1Id?: string;
  level2Id?: string;
  level3Ids?: string[];
}): Promise<Result<Array<{ id: string; name: string }>>> {
  return withErrorHandling(async () => {
    // First get Level 3 IDs matching the filter
    let level3IdsToFilter: string[] = [];

    if (filters.level3Ids && filters.level3Ids.length > 0) {
      level3IdsToFilter = filters.level3Ids;
    } else if (filters.level2Id || filters.level1Id) {
      // Get all Level 3 IDs that match the Level 1/2 filter
      let l3Query = supabase.from('product_sub_subcategories').select('id').eq('is_active', true);

      if (filters.level2Id) {
        l3Query = l3Query.eq('subcategory_id', filters.level2Id);
      } else if (filters.level1Id) {
        l3Query = supabase
          .from('product_sub_subcategories')
          .select('id, product_subcategories!inner(category_id)')
          .eq('is_active', true)
          .eq('product_subcategories.category_id', filters.level1Id);
      }

      const { data: l3Data } = await l3Query;
      level3IdsToFilter = l3Data?.map((item) => item.id) || [];
    }

    // Now fetch Level 4 categories
    let query = supabase.from('product_sub_sub_subcategories').select('id, name').eq('is_active', true);

    if (level3IdsToFilter.length > 0) {
      query = query.in('sub_subcategory_id', level3IdsToFilter);
    }

    const { data, error } = await query;
    if (error) throw error;

    if (!data || data.length === 0) return { data: [], error: null };

    return { data: data as Array<{ id: string; name: string }>, error: null };
  }, 'fetchLevel4CategoriesWithFilters');
}

// Fetch all sub-sub-subcategories with synonyms (for search)
export async function fetchAllSubSubSubcategoriesWithSynonyms(): Promise<Result<SubSubSubcategory[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('product_sub_sub_subcategories')
      .select('id, name, slug, synonyms')
      .eq('is_active', true);

    if (error) throw error;
    return { data: (data || []) as SubSubSubcategory[], error: null };
  }, 'fetchAllSubSubSubcategoriesWithSynonyms');
}

// Fetch all subcategories with category name (for guide assignments)
export async function fetchAllSubcategoriesWithCategoryName(): Promise<
  Result<Array<{ id: string; name: string; category_id: string; product_categories: { name: string } | null }>>
> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('product_subcategories')
      .select('id, name, category_id, product_categories!category_id(name)')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return {
      data: (data || []) as Array<{
        id: string;
        name: string;
        category_id: string;
        product_categories: { name: string } | null;
      }>,
      error: null,
    };
  }, 'fetchAllSubcategoriesWithCategoryName');
}

// Fetch all sub-subcategories without is_active filter (for guide assignments)
export async function fetchAllSubSubcategoriesForAssignments(): Promise<
  Result<Array<{ id: string; name: string; subcategory_id: string }>>
> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('product_sub_subcategories')
      .select('id, name, subcategory_id')
      .order('name');

    if (error) throw error;
    return {
      data: (data || []) as Array<{ id: string; name: string; subcategory_id: string }>,
      error: null,
    };
  }, 'fetchAllSubSubcategoriesForAssignments');
}

// Fetch all sub-sub-subcategories without is_active filter (for guide assignments)
export async function fetchAllSubSubSubcategoriesForAssignments(): Promise<
  Result<Array<{ id: string; name: string; sub_subcategory_id: string }>>
> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('product_sub_sub_subcategories')
      .select('id, name, sub_subcategory_id')
      .order('name');

    if (error) throw error;
    return {
      data: (data || []) as Array<{ id: string; name: string; sub_subcategory_id: string }>,
      error: null,
    };
  }, 'fetchAllSubSubSubcategoriesForAssignments');
}

// ==================== MUTATION FUNCTIONS ====================

export interface CreateSubcategoryInput {
  name: string;
  slug: string;
  description?: string | null;
  category_id: string;
  is_active?: boolean;
}

export interface CreateSubSubcategoryInput {
  name: string;
  slug: string;
  description?: string | null;
  subcategory_id: string;
  is_active?: boolean;
}

export interface CreateSubSubSubcategoryInput {
  name: string;
  slug: string;
  description?: string | null;
  sub_subcategory_id: string;
  is_active?: boolean;
}

// Create subcategory (Level 2)
export async function createSubcategory(input: CreateSubcategoryInput): Promise<Result<Subcategory>> {
  return withMutation(async () => {
    const { data, error } = await supabase
      .from('product_subcategories')
      .insert([{ ...input, is_active: input.is_active ?? true }])
      .select()
      .single();

    if (error) throw error;
    return { data: data as Subcategory, error: null };
  }, 'createSubcategory');
}

// Create sub-subcategory (Level 3)
export async function createSubSubcategory(input: CreateSubSubcategoryInput): Promise<Result<SubSubcategory>> {
  return withMutation(async () => {
    const { data, error } = await supabase
      .from('product_sub_subcategories')
      .insert([{ ...input, is_active: input.is_active ?? true }])
      .select()
      .single();

    if (error) throw error;
    return { data: data as SubSubcategory, error: null };
  }, 'createSubSubcategory');
}

// Create sub-sub-subcategory (Level 4)
export async function createSubSubSubcategory(input: CreateSubSubSubcategoryInput): Promise<Result<SubSubSubcategory>> {
  return withMutation(async () => {
    const { data, error } = await supabase
      .from('product_sub_sub_subcategories')
      .insert([{ ...input, is_active: input.is_active ?? true }])
      .select()
      .single();

    if (error) throw error;
    return { data: data as SubSubSubcategory, error: null };
  }, 'createSubSubSubcategory');
}

// Delete subcategory (Level 2)
export async function deleteSubcategory(subcategoryId: string): Promise<Result<boolean>> {
  return withMutation(async () => {
    const { error } = await supabase.from('product_subcategories').delete().eq('id', subcategoryId);

    if (error) throw error;
    return { data: true, error: null };
  }, 'deleteSubcategory');
}

// Delete sub-subcategory (Level 3)
export async function deleteSubSubcategory(subSubcategoryId: string): Promise<Result<boolean>> {
  return withMutation(async () => {
    const { error } = await supabase.from('product_sub_subcategories').delete().eq('id', subSubcategoryId);

    if (error) throw error;
    return { data: true, error: null };
  }, 'deleteSubSubcategory');
}

// Delete sub-sub-subcategory (Level 4)
export async function deleteSubSubSubcategory(subSubSubcategoryId: string): Promise<Result<boolean>> {
  return withMutation(async () => {
    const { error } = await supabase.from('product_sub_sub_subcategories').delete().eq('id', subSubSubcategoryId);

    if (error) throw error;
    return { data: true, error: null };
  }, 'deleteSubSubSubcategory');
}

export interface UpdateSubcategoryInput {
  name?: string;
  slug?: string;
  description?: string | null;
  synonyms?: string[] | null;
  image_url?: string | null;
  is_active?: boolean;
}

export interface UpdateSubSubcategoryInput {
  name?: string;
  slug?: string;
  description?: string | null;
  synonyms?: string[] | null;
  image_url?: string | null;
  show_in_category_grid?: boolean | null;
  is_active?: boolean;
}

export interface UpdateSubSubSubcategoryInput {
  name?: string;
  slug?: string;
  description?: string | null;
  synonyms?: string[] | null;
  is_active?: boolean;
}

// Update subcategory (Level 2)
export async function updateSubcategory(
  subcategoryId: string,
  input: UpdateSubcategoryInput,
): Promise<Result<Subcategory>> {
  return withMutation(async () => {
    const { data, error } = await supabase
      .from('product_subcategories')
      .update(input)
      .eq('id', subcategoryId)
      .select()
      .single();

    if (error) throw error;
    return { data: data as Subcategory, error: null };
  }, 'updateSubcategory');
}

// Update sub-subcategory (Level 3)
export async function updateSubSubcategory(
  subSubcategoryId: string,
  input: UpdateSubSubcategoryInput,
): Promise<Result<SubSubcategory>> {
  return withMutation(async () => {
    const { data, error } = await supabase
      .from('product_sub_subcategories')
      .update(input)
      .eq('id', subSubcategoryId)
      .select()
      .single();

    if (error) throw error;
    return { data: data as SubSubcategory, error: null };
  }, 'updateSubSubcategory');
}

// Update sub-sub-subcategory (Level 4)
export async function updateSubSubSubcategory(
  subSubSubcategoryId: string,
  input: UpdateSubSubSubcategoryInput,
): Promise<Result<SubSubSubcategory>> {
  return withMutation(async () => {
    const { data, error } = await supabase
      .from('product_sub_sub_subcategories')
      .update(input)
      .eq('id', subSubSubcategoryId)
      .select()
      .single();

    if (error) throw error;
    return { data: data as SubSubSubcategory, error: null };
  }, 'updateSubSubSubcategory');
}
