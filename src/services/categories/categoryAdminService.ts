// Category Admin Service
// Admin operations for category management (CRUD, reordering, synonyms)

import { supabase } from '@/integrations/supabase/client';
import { withErrorHandling, withMutation } from '@/services/api/apiClient';
import { uploadFile } from '@/services/storage';
import { invokeEdgeFunction } from '@/services/functions';
import { success, isFailure, type Result } from '@/types/api';

export interface ProductCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  is_active: boolean;
  display_order: number;
  synonyms: string[] | null;
  slug?: string;
}

// Fetch all categories for admin (including inactive)
export async function fetchAllCategoriesAdmin(): Promise<Result<ProductCategory[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;
    return { data: (data || []) as ProductCategory[], error: null };
  }, 'fetchAllCategoriesAdmin');
}

// Upload category icon
export async function uploadCategoryIcon(file: File): Promise<Result<string>> {
  const fileExt = file.name.split('.').pop();
  const fileName = `category-icons/${Date.now()}-${Math.random()}.${fileExt}`;

  const uploadResult = await uploadFile(file, {
    bucket: 'product-images',
    pathPrefix: 'category-icons',
    fileName: `${Date.now()}-${Math.random()}.${fileExt}`,
  });

  if (isFailure(uploadResult)) {
    return uploadResult;
  }

  return success(uploadResult.data.url);
}

// Create category
export interface CreateCategoryInput {
  name: string;
  description: string;
  icon: string;
  slug?: string;
  display_order?: number;
  is_active?: boolean;
}

export async function createCategoryAdmin(
  input: CreateCategoryInput,
  maxOrder: number,
): Promise<Result<ProductCategory>> {
  return withMutation(async () => {
    const { data, error } = await supabase
      .from('product_categories')
      .insert({
        name: input.name,
        description: input.description,
        icon: input.icon,
        slug: input.slug || input.name.toLowerCase().replace(/\s+/g, '-'),
        display_order: maxOrder + 1,
        is_active: input.is_active !== undefined ? input.is_active : true,
      })
      .select()
      .single();

    if (error) throw error;
    return { data: data as ProductCategory, error: null };
  }, 'createCategoryAdmin');
}

// Update category
export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  icon?: string;
  synonyms?: string[] | null;
}

export async function updateCategoryAdmin(
  categoryId: string,
  input: UpdateCategoryInput,
): Promise<Result<ProductCategory>> {
  return withMutation(async () => {
    const { data, error } = await supabase
      .from('product_categories')
      .update(input)
      .eq('id', categoryId)
      .select()
      .single();

    if (error) throw error;
    return { data: data as ProductCategory, error: null };
  }, 'updateCategoryAdmin');
}

// Delete category
export async function deleteCategoryAdmin(categoryId: string): Promise<Result<boolean>> {
  return withMutation(async () => {
    const { error } = await supabase.from('product_categories').delete().eq('id', categoryId);

    if (error) throw error;
    return { data: true, error: null };
  }, 'deleteCategoryAdmin');
}

// Toggle category active status
export async function toggleCategoryActive(categoryId: string, currentStatus: boolean): Promise<Result<boolean>> {
  return withMutation(async () => {
    const { error } = await supabase
      .from('product_categories')
      .update({ is_active: !currentStatus })
      .eq('id', categoryId);

    if (error) throw error;
    return { data: true, error: null };
  }, 'toggleCategoryActive');
}

// Generate synonyms for a category
export async function generateCategorySynonyms(categoryId: string, categoryName: string): Promise<Result<string[]>> {
  try {
    const result = await invokeEdgeFunction<{ synonyms?: string[] }>({
      functionName: 'generate-category-synonyms',
      body: {
        categoryName,
        categoryLevel: 1,
      },
    });

    if (isFailure(result)) {
      return result;
    }

    const synonyms = result.data?.synonyms;
    if (!synonyms || !Array.isArray(synonyms)) {
      return success([]);
    }

    // Update category with synonyms
    const updateResult = await updateCategoryAdmin(categoryId, { synonyms });
    if (isFailure(updateResult)) {
      return updateResult;
    }

    return success(synonyms);
  } catch (error) {
    return success([]);
  }
}

// Bulk generate synonyms for all categories
export async function bulkGenerateCategorySynonyms(
  categories: Array<{ id: string; name: string }>,
): Promise<Result<{ successCount: number; errorCount: number }>> {
  let successCount = 0;
  let errorCount = 0;

  for (const category of categories) {
    try {
      const result = await generateCategorySynonyms(category.id, category.name);
      if (!isFailure(result)) {
        successCount++;
      } else {
        errorCount++;
      }
    } catch (error) {
      console.error(`Failed for ${category.name}:`, error);
      errorCount++;
    }
  }

  return success({ successCount, errorCount });
}

// Reorder categories
export async function reorderCategoryAdmin(
  categoryId: string,
  swapCategoryId: string,
  currentOrder: number,
  swapOrder: number,
): Promise<Result<boolean>> {
  return withMutation(async () => {
    // Set current to -1 temporarily
    const { error: error1 } = await supabase
      .from('product_categories')
      .update({ display_order: -1 })
      .eq('id', categoryId);

    if (error1) throw error1;

    // Set swap to current order
    const { error: error2 } = await supabase
      .from('product_categories')
      .update({ display_order: currentOrder })
      .eq('id', swapCategoryId);

    if (error2) throw error2;

    // Set current to swap order
    const { error: error3 } = await supabase
      .from('product_categories')
      .update({ display_order: swapOrder })
      .eq('id', categoryId);

    if (error3) throw error3;

    return { data: true, error: null };
  }, 'reorderCategoryAdmin');
}

// Fetch all category levels for export
export interface CategoryExportData {
  level1: Array<{ id: string; name: string }>;
  level2: Array<{ id: string; name: string; category_id: string }>;
  level3: Array<{ id: string; name: string; subcategory_id: string }>;
  level4: Array<{ id: string; name: string; sub_subcategory_id: string }>;
}

export async function fetchAllCategoryLevelsForExport(): Promise<Result<CategoryExportData>> {
  return withErrorHandling(async () => {
    const [level1Result, level2Result, level3Result, level4Result] = await Promise.all([
      supabase.from('product_categories').select('id, name').order('name'),
      supabase.from('product_subcategories').select('id, name, category_id').order('name'),
      supabase.from('product_sub_subcategories').select('id, name, subcategory_id').order('name'),
      supabase.from('product_sub_sub_subcategories').select('id, name, sub_subcategory_id').order('name'),
    ]);

    if (level1Result.error) throw level1Result.error;
    if (level2Result.error) throw level2Result.error;
    if (level3Result.error) throw level3Result.error;
    if (level4Result.error) throw level4Result.error;

    return {
      data: {
        level1: (level1Result.data || []) as Array<{ id: string; name: string }>,
        level2: (level2Result.data || []) as Array<{ id: string; name: string; category_id: string }>,
        level3: (level3Result.data || []) as Array<{ id: string; name: string; subcategory_id: string }>,
        level4: (level4Result.data || []) as Array<{ id: string; name: string; sub_subcategory_id: string }>,
      },
      error: null,
    };
  }, 'fetchAllCategoryLevelsForExport');
}
