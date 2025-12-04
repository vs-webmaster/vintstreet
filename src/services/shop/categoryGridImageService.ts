// Category Grid Image Service
// Centralized data access for category grid image operations

import { supabase } from '@/integrations/supabase/client';
import { withErrorHandling, withMutation } from '@/services/api/apiClient';
import type { Result } from '@/types/api';

export interface CategoryGridImage {
  id?: string;
  category_id: string;
  image_url: string;
  button_text: string;
  link: string;
  display_order: number;
}

// Fetch category grid images by category ID
export async function fetchCategoryGridImages(categoryId: string): Promise<Result<CategoryGridImage[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('category_grid_images')
      .select('*')
      .eq('category_id', categoryId)
      .order('display_order');

    if (error) throw error;
    return { data: (data || []) as CategoryGridImage[], error: null };
  }, 'fetchCategoryGridImages');
}

// Save category grid images (upsert based on id)
export async function saveCategoryGridImages(images: CategoryGridImage[]): Promise<Result<boolean>> {
  return withMutation(async () => {
    for (const image of images) {
      if (image.id) {
        // Update existing
        const { error } = await supabase
          .from('category_grid_images')
          .update({
            image_url: image.image_url,
            button_text: image.button_text,
            link: image.link,
          })
          .eq('id', image.id);

        if (error) throw error;
      } else if (image.image_url || image.button_text || image.link) {
        // Insert new only if there's content
        const { error } = await supabase.from('category_grid_images').insert({
          category_id: image.category_id,
          image_url: image.image_url,
          button_text: image.button_text,
          link: image.link,
          display_order: image.display_order,
        });

        if (error) throw error;
      }
    }

    return { data: true, error: null };
  }, 'saveCategoryGridImages');
}
