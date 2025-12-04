// Category Filter Settings Service
// Centralized data access for category filter settings

import { supabase } from '@/integrations/supabase/client';
import { withMaybeNull } from '@/services/api/apiClient';
import type { Result } from '@/types/api';

export interface CategoryFilterSettings {
  id: string;
  category_id: string | null;
  subcategory_id: string | null;
  sub_subcategory_id: string | null;
  sub_sub_subcategory_id: string | null;
  show_brand_filter: boolean;
  show_size_filter: boolean;
  show_color_filter: boolean;
  show_price_filter: boolean;
  created_at: string;
  updated_at: string;
}

// Fetch filter settings for a category hierarchy
export async function fetchCategoryFilterSettings(params: {
  categoryId?: string | null;
  subcategoryId?: string | null;
  subSubcategoryId?: string | null;
}): Promise<Result<CategoryFilterSettings>> {
  return withMaybeNull(async () => {
    let query = supabase.from('category_filter_settings').select('*');

    if (params.subSubcategoryId) {
      query = query
        .eq('category_id', params.categoryId)
        .eq('subcategory_id', params.subcategoryId)
        .eq('sub_subcategory_id', params.subSubcategoryId)
        .is('sub_sub_subcategory_id', null);
    } else if (params.subcategoryId) {
      query = query
        .eq('category_id', params.categoryId)
        .eq('subcategory_id', params.subcategoryId)
        .is('sub_subcategory_id', null)
        .is('sub_sub_subcategory_id', null);
    } else if (params.categoryId) {
      query = query
        .eq('category_id', params.categoryId)
        .is('subcategory_id', null)
        .is('sub_subcategory_id', null)
        .is('sub_sub_subcategory_id', null);
    } else {
      // Return default settings if no category specified
      return {
        data: {
          id: '',
          category_id: null,
          subcategory_id: null,
          sub_subcategory_id: null,
          sub_sub_subcategory_id: null,
          show_brand_filter: true,
          show_size_filter: true,
          show_color_filter: true,
          show_price_filter: true,
          created_at: '',
          updated_at: '',
        },
        error: null,
      };
    }

    const { data, error } = await query.maybeSingle();
    if (error) throw error;

    // Return default settings if none found
    if (!data) {
      return {
        data: {
          id: '',
          category_id: params.categoryId || null,
          subcategory_id: params.subcategoryId || null,
          sub_subcategory_id: params.subSubcategoryId || null,
          sub_sub_subcategory_id: null,
          show_brand_filter: true,
          show_size_filter: true,
          show_color_filter: true,
          show_price_filter: true,
          created_at: '',
          updated_at: '',
        },
        error: null,
      };
    }

    return { data: data as CategoryFilterSettings, error: null };
  }, 'fetchCategoryFilterSettings');
}
