// Shop Hero Image Service
// Centralized data access for shop hero image operations

import { supabase } from '@/integrations/supabase/client';
import { withErrorHandling, withMutation } from '@/services/api/apiClient';
import type { Result } from '@/types/api';

export interface ShopHeroImage {
  id: string;
  image_url: string;
  title: string | null;
  link: string;
  button_text: string;
  display_order: number;
}

// Fetch all shop hero images
export async function fetchShopHeroImages(): Promise<Result<ShopHeroImage[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase.from('shop_hero_images').select('*').order('display_order');

    if (error) throw error;
    return { data: (data || []) as ShopHeroImage[], error: null };
  }, 'fetchShopHeroImages');
}

// Save shop hero images (replaces all existing)
export async function saveShopHeroImages(images: ShopHeroImage[]): Promise<Result<boolean>> {
  return withMutation(async () => {
    // First, delete all existing records
    const { error: deleteError } = await supabase
      .from('shop_hero_images')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

    if (deleteError) throw deleteError;

    // Then insert all images that have content
    const imagesToInsert = images.filter((image) => image.image_url || image.button_text || image.link || image.title);

    if (imagesToInsert.length > 0) {
      const { error: insertError } = await supabase.from('shop_hero_images').insert(imagesToInsert);

      if (insertError) throw insertError;
    }

    return { data: true, error: null };
  }, 'saveShopHeroImages');
}
