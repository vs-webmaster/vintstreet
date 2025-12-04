// App Content Service
// Centralized data access for app content operations

import { supabase } from '@/integrations/supabase/client';
import { normalizeError, logError } from '@/lib/errors';
import type { Result } from '@/types/api';
import { success, failure } from '@/types/api';

export interface CarouselItem {
  id?: string;
  image_url: string;
  text: string;
  link: string;
  display_order: number;
}

export interface GridContent {
  id: string;
  title: string;
}

export interface GridImage {
  id?: string;
  image_url: string;
  link: string;
  display_order: number;
}

export interface BrandsContent {
  id: string;
  brands_list: string;
}

export interface FeaturedContent {
  id: string;
  title: string;
}

export interface FeaturedImage {
  id?: string;
  image_url: string;
  link: string;
  display_order: number;
}

export interface LinkItem {
  id?: string;
  text: string;
  link: string;
  display_order: number;
}

// Fetch carousel items
export async function fetchCarouselItems(): Promise<Result<CarouselItem[]>> {
  try {
    const { data, error } = await supabase.from('app_content_carousel').select('*').order('display_order');

    if (error) {
      logError(error, 'fetchCarouselItems');
      return failure(normalizeError(error));
    }

    return success((data || []) as CarouselItem[]);
  } catch (error) {
    logError(error, 'fetchCarouselItems');
    return failure(normalizeError(error));
  }
}

// Fetch grid content
export async function fetchGridContent(): Promise<Result<GridContent | null>> {
  try {
    const { data, error } = await supabase.from('app_content_grid').select('*').single();

    if (error && error.code !== 'PGRST116') {
      logError(error, 'fetchGridContent');
      return failure(normalizeError(error));
    }

    return success((data || null) as GridContent | null);
  } catch (error) {
    logError(error, 'fetchGridContent');
    return failure(normalizeError(error));
  }
}

// Fetch grid images
export async function fetchGridImages(): Promise<Result<GridImage[]>> {
  try {
    const { data, error } = await supabase.from('app_content_grid_images').select('*').order('display_order').limit(4);

    if (error) {
      logError(error, 'fetchGridImages');
      return failure(normalizeError(error));
    }

    return success((data || []) as GridImage[]);
  } catch (error) {
    logError(error, 'fetchGridImages');
    return failure(normalizeError(error));
  }
}

// Fetch brands content
export async function fetchBrandsContent(): Promise<Result<BrandsContent | null>> {
  try {
    const { data, error } = await supabase.from('app_content_brands').select('*').single();

    if (error && error.code !== 'PGRST116') {
      logError(error, 'fetchBrandsContent');
      return failure(normalizeError(error));
    }

    return success((data || null) as BrandsContent | null);
  } catch (error) {
    logError(error, 'fetchBrandsContent');
    return failure(normalizeError(error));
  }
}

// Fetch featured content
export async function fetchFeaturedContent(): Promise<Result<FeaturedContent | null>> {
  try {
    const { data, error } = await supabase.from('app_content_featured').select('*').single();

    if (error && error.code !== 'PGRST116') {
      logError(error, 'fetchFeaturedContent');
      return failure(normalizeError(error));
    }

    return success((data || null) as FeaturedContent | null);
  } catch (error) {
    logError(error, 'fetchFeaturedContent');
    return failure(normalizeError(error));
  }
}

// Fetch featured images
export async function fetchFeaturedImages(): Promise<Result<FeaturedImage[]>> {
  try {
    const { data, error } = await supabase
      .from('app_content_featured_images')
      .select('*')
      .order('display_order')
      .limit(8);

    if (error) {
      logError(error, 'fetchFeaturedImages');
      return failure(normalizeError(error));
    }

    return success((data || []) as FeaturedImage[]);
  } catch (error) {
    logError(error, 'fetchFeaturedImages');
    return failure(normalizeError(error));
  }
}

// Fetch links
export async function fetchLinks(): Promise<Result<LinkItem[]>> {
  try {
    const { data, error } = await supabase.from('app_content_links').select('*').order('display_order');

    if (error) {
      logError(error, 'fetchLinks');
      return failure(normalizeError(error));
    }

    return success((data || []) as LinkItem[]);
  } catch (error) {
    logError(error, 'fetchLinks');
    return failure(normalizeError(error));
  }
}

// Create carousel item
export async function createCarouselItem(item: Omit<CarouselItem, 'id'>): Promise<Result<CarouselItem>> {
  try {
    const { data, error } = await supabase.from('app_content_carousel').insert(item).select().single();

    if (error) {
      logError(error, 'createCarouselItem');
      return failure(normalizeError(error));
    }

    return success(data as CarouselItem);
  } catch (error) {
    logError(error, 'createCarouselItem');
    return failure(normalizeError(error));
  }
}

// Update carousel item
export async function updateCarouselItem(id: string, data: Partial<CarouselItem>): Promise<Result<boolean>> {
  try {
    const { error } = await supabase.from('app_content_carousel').update(data).eq('id', id);

    if (error) {
      logError(error, 'updateCarouselItem');
      return failure(normalizeError(error));
    }

    return success(true);
  } catch (error) {
    logError(error, 'updateCarouselItem');
    return failure(normalizeError(error));
  }
}

// Delete carousel item
export async function deleteCarouselItem(id: string): Promise<Result<boolean>> {
  try {
    const { error } = await supabase.from('app_content_carousel').delete().eq('id', id);

    if (error) {
      logError(error, 'deleteCarouselItem');
      return failure(normalizeError(error));
    }

    return success(true);
  } catch (error) {
    logError(error, 'deleteCarouselItem');
    return failure(normalizeError(error));
  }
}

// Save grid content
export async function saveGridContent(title: string): Promise<Result<boolean>> {
  try {
    const { error } = await supabase.from('app_content_grid').upsert({ id: 'default', title });

    if (error) {
      logError(error, 'saveGridContent');
      return failure(normalizeError(error));
    }

    return success(true);
  } catch (error) {
    logError(error, 'saveGridContent');
    return failure(normalizeError(error));
  }
}

// Create grid image
export async function createGridImage(image: Omit<GridImage, 'id'>): Promise<Result<GridImage>> {
  try {
    const { data, error } = await supabase.from('app_content_grid_images').insert(image).select().single();

    if (error) {
      logError(error, 'createGridImage');
      return failure(normalizeError(error));
    }

    return success(data as GridImage);
  } catch (error) {
    logError(error, 'createGridImage');
    return failure(normalizeError(error));
  }
}

// Update grid image
export async function updateGridImage(id: string, data: Partial<GridImage>): Promise<Result<boolean>> {
  try {
    const { error } = await supabase.from('app_content_grid_images').update(data).eq('id', id);

    if (error) {
      logError(error, 'updateGridImage');
      return failure(normalizeError(error));
    }

    return success(true);
  } catch (error) {
    logError(error, 'updateGridImage');
    return failure(normalizeError(error));
  }
}

// Delete grid image
export async function deleteGridImage(id: string): Promise<Result<boolean>> {
  try {
    const { error } = await supabase.from('app_content_grid_images').delete().eq('id', id);

    if (error) {
      logError(error, 'deleteGridImage');
      return failure(normalizeError(error));
    }

    return success(true);
  } catch (error) {
    logError(error, 'deleteGridImage');
    return failure(normalizeError(error));
  }
}

// Save brands content
export async function saveBrandsContent(brandsList: string): Promise<Result<boolean>> {
  try {
    const { error } = await supabase.from('app_content_brands').upsert({ id: 'default', brands_list: brandsList });

    if (error) {
      logError(error, 'saveBrandsContent');
      return failure(normalizeError(error));
    }

    return success(true);
  } catch (error) {
    logError(error, 'saveBrandsContent');
    return failure(normalizeError(error));
  }
}

// Save featured content
export async function saveFeaturedContent(title: string): Promise<Result<boolean>> {
  try {
    const { error } = await supabase.from('app_content_featured').upsert({ id: 'default', title });

    if (error) {
      logError(error, 'saveFeaturedContent');
      return failure(normalizeError(error));
    }

    return success(true);
  } catch (error) {
    logError(error, 'saveFeaturedContent');
    return failure(normalizeError(error));
  }
}

// Create featured image
export async function createFeaturedImage(image: Omit<FeaturedImage, 'id'>): Promise<Result<FeaturedImage>> {
  try {
    const { data, error } = await supabase.from('app_content_featured_images').insert(image).select().single();

    if (error) {
      logError(error, 'createFeaturedImage');
      return failure(normalizeError(error));
    }

    return success(data as FeaturedImage);
  } catch (error) {
    logError(error, 'createFeaturedImage');
    return failure(normalizeError(error));
  }
}

// Update featured image
export async function updateFeaturedImage(id: string, data: Partial<FeaturedImage>): Promise<Result<boolean>> {
  try {
    const { error } = await supabase.from('app_content_featured_images').update(data).eq('id', id);

    if (error) {
      logError(error, 'updateFeaturedImage');
      return failure(normalizeError(error));
    }

    return success(true);
  } catch (error) {
    logError(error, 'updateFeaturedImage');
    return failure(normalizeError(error));
  }
}

// Delete featured image
export async function deleteFeaturedImage(id: string): Promise<Result<boolean>> {
  try {
    const { error } = await supabase.from('app_content_featured_images').delete().eq('id', id);

    if (error) {
      logError(error, 'deleteFeaturedImage');
      return failure(normalizeError(error));
    }

    return success(true);
  } catch (error) {
    logError(error, 'deleteFeaturedImage');
    return failure(normalizeError(error));
  }
}

// Create link
export async function createLink(link: Omit<LinkItem, 'id'>): Promise<Result<LinkItem>> {
  try {
    const { data, error } = await supabase.from('app_content_links').insert(link).select().single();

    if (error) {
      logError(error, 'createLink');
      return failure(normalizeError(error));
    }

    return success(data as LinkItem);
  } catch (error) {
    logError(error, 'createLink');
    return failure(normalizeError(error));
  }
}

// Update link
export async function updateLink(id: string, data: Partial<LinkItem>): Promise<Result<boolean>> {
  try {
    const { error } = await supabase.from('app_content_links').update(data).eq('id', id);

    if (error) {
      logError(error, 'updateLink');
      return failure(normalizeError(error));
    }

    return success(true);
  } catch (error) {
    logError(error, 'updateLink');
    return failure(normalizeError(error));
  }
}

// Delete link
export async function deleteLink(id: string): Promise<Result<boolean>> {
  try {
    const { error } = await supabase.from('app_content_links').delete().eq('id', id);

    if (error) {
      logError(error, 'deleteLink');
      return failure(normalizeError(error));
    }

    return success(true);
  } catch (error) {
    logError(error, 'deleteLink');
    return failure(normalizeError(error));
  }
}
