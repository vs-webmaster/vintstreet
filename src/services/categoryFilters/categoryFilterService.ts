// Category Filter Service
// Centralized data access for category filter settings operations

import { supabase } from '@/integrations/supabase/client';
import type { Result } from '@/types/api';
import { success, failure } from '@/types/api';
import { normalizeError, logError } from '@/lib/errors';

export interface CategoryAttributeFilter {
  id: string;
  category_id?: string | null;
  subcategory_id?: string | null;
  sub_subcategory_id?: string | null;
  sub_sub_subcategory_id?: string | null;
  attribute_id?: string | null;
  filter_type: 'default' | 'attribute';
  filter_name?: string | null;
  is_active: boolean;
  display_order: number;
  show_in_top_line: boolean;
}

// Fetch enabled filters for a category combination
export async function fetchCategoryFilters(params: {
  category_id?: string | null;
  subcategory_id?: string | null;
  sub_subcategory_id?: string | null;
  sub_sub_subcategory_id?: string | null;
}): Promise<Result<CategoryAttributeFilter[]>> {
  try {
    let query = supabase.from('category_attribute_filters').select('*').eq('is_active', true);

    if (params.category_id) {
      query = query.eq('category_id', params.category_id);
    } else {
      query = query.is('category_id', null);
    }

    if (params.subcategory_id) {
      query = query.eq('subcategory_id', params.subcategory_id);
    } else {
      query = query.is('subcategory_id', null);
    }

    if (params.sub_subcategory_id) {
      query = query.eq('sub_subcategory_id', params.sub_subcategory_id);
    } else {
      query = query.is('sub_subcategory_id', null);
    }

    if (params.sub_sub_subcategory_id) {
      query = query.eq('sub_sub_subcategory_id', params.sub_sub_subcategory_id);
    } else {
      query = query.is('sub_sub_subcategory_id', null);
    }

    const { data, error } = await query;

    if (error) {
      logError(error, 'fetchCategoryFilters');
      return failure(normalizeError(error));
    }

    return success((data || []) as CategoryAttributeFilter[]);
  } catch (error) {
    logError(error, 'fetchCategoryFilters');
    return failure(normalizeError(error));
  }
}

// Fetch available attributes for a category (with options check)
export async function fetchAvailableAttributesForCategory(params: {
  category_id?: string | null;
  subcategory_id?: string | null;
  sub_subcategory_id?: string | null;
}): Promise<
  Result<Array<{ id: string; name: string; display_label: string; data_type: string; hasOptions: boolean }>>
> {
  try {
    let attributeIds: string[] = [];

    // Check Level 1
    if (params.category_id) {
      const { data: catAttrs } = await supabase
        .from('attribute_categories')
        .select('attribute_id')
        .eq('category_id', params.category_id);
      if (catAttrs) attributeIds.push(...catAttrs.map((a) => a.attribute_id));
    }

    // Check Level 2
    if (params.subcategory_id) {
      const { data: subAttrs } = await supabase
        .from('attribute_subcategories')
        .select('attribute_id')
        .eq('subcategory_id', params.subcategory_id);
      if (subAttrs) attributeIds.push(...subAttrs.map((a) => a.attribute_id));
    }

    // Check Level 3
    if (params.sub_subcategory_id) {
      const { data: subSubAttrs } = await supabase
        .from('attribute_sub_subcategories')
        .select('attribute_id')
        .eq('sub_subcategory_id', params.sub_subcategory_id);
      if (subSubAttrs) attributeIds.push(...subSubAttrs.map((a) => a.attribute_id));
    }

    // Deduplicate
    attributeIds = Array.from(new Set(attributeIds));

    if (attributeIds.length === 0) return success([]);

    // Fetch all attributes linked to this category
    const { data: attrs, error } = await supabase
      .from('attributes')
      .select('id, name, display_label, data_type')
      .in('id', attributeIds)
      .order('display_label');

    if (error) {
      logError(error, 'fetchAvailableAttributesForCategory');
      return failure(normalizeError(error));
    }

    // Check which attributes have options
    const attrsWithOptionStatus = await Promise.all(
      (attrs || []).map(async (attr) => {
        const { data: options } = await supabase
          .from('attribute_options')
          .select('id')
          .eq('attribute_id', attr.id)
          .eq('is_active', true)
          .limit(1);

        return {
          ...attr,
          hasOptions: options && options.length > 0,
        };
      }),
    );

    return success(attrsWithOptionStatus);
  } catch (error) {
    logError(error, 'fetchAvailableAttributesForCategory');
    return failure(normalizeError(error));
  }
}

// Save category filters
export async function saveCategoryFilters(
  params: {
    category_id?: string | null;
    subcategory_id?: string | null;
    sub_subcategory_id?: string | null;
    sub_sub_subcategory_id?: string | null;
  },
  enabledFilterIds: string[],
  topLineFilterIds: Set<string>,
): Promise<Result<boolean>> {
  try {
    // Delete all existing filters for this category combination
    let deleteQuery = supabase.from('category_attribute_filters').delete();

    if (params.category_id) {
      deleteQuery = deleteQuery.eq('category_id', params.category_id);
    } else {
      deleteQuery = deleteQuery.is('category_id', null);
    }

    if (params.subcategory_id) {
      deleteQuery = deleteQuery.eq('subcategory_id', params.subcategory_id);
    } else {
      deleteQuery = deleteQuery.is('subcategory_id', null);
    }

    if (params.sub_subcategory_id) {
      deleteQuery = deleteQuery.eq('sub_subcategory_id', params.sub_subcategory_id);
    } else {
      deleteQuery = deleteQuery.is('sub_subcategory_id', null);
    }

    if (params.sub_sub_subcategory_id) {
      deleteQuery = deleteQuery.eq('sub_sub_subcategory_id', params.sub_sub_subcategory_id);
    } else {
      deleteQuery = deleteQuery.is('sub_sub_subcategory_id', null);
    }

    const { error: deleteError } = await deleteQuery;

    if (deleteError) {
      logError(deleteError, 'saveCategoryFilters - delete');
      return failure(normalizeError(deleteError));
    }

    // Insert new enabled filters
    if (enabledFilterIds.length > 0) {
      const filtersToInsert = enabledFilterIds.map((filterId, index) => {
        const isDefaultFilter = filterId.startsWith('default-');
        const filterName = isDefaultFilter ? filterId.replace('default-', '') : null;

        return {
          ...params,
          attribute_id: isDefaultFilter ? null : filterId,
          filter_type: isDefaultFilter ? 'default' : 'attribute',
          filter_name: filterName,
          is_active: true,
          display_order: index,
          show_in_top_line: topLineFilterIds.has(filterId),
        };
      });

      const { error: insertError } = await supabase.from('category_attribute_filters').insert(filtersToInsert);

      if (insertError) {
        logError(insertError, 'saveCategoryFilters - insert');
        return failure(normalizeError(insertError));
      }
    }

    return success(true);
  } catch (error) {
    logError(error, 'saveCategoryFilters');
    return failure(normalizeError(error));
  }
}
