// Shop Service
// Centralized data access for shop-related operations

import { supabase } from '@/integrations/supabase/client';
import { withErrorHandling, withMutation } from '@/services/api/apiClient';
import type { Result } from '@/types/api';

// Shop Section interfaces
export interface ShopSection {
  id: string;
  title: string;
  image_url: string;
  category_id: string;
  custom_link: string | null;
  is_active: boolean;
  display_order: number;
  shop_section_products?: Array<{
    product_id: string;
    display_order: number;
    listings: {
      id: string;
      product_name: string;
      starting_price: number;
      discounted_price: number | null;
      thumbnail: string | null;
      slug: string | null;
      status: string;
    };
  }>;
}

// Fetch shop sections with products (returns raw data for component to transform)
export async function fetchShopSectionsWithProducts(): Promise<
  Result<
    Array<{
      id: string;
      title: string;
      image_url: string;
      category_id: string;
      custom_link: string | null;
      is_active: boolean;
      display_order: number;
      shop_section_products: Array<{
        product_id: string;
        display_order: number;
        listings: {
          id: string;
          product_name: string;
          starting_price: number;
          discounted_price: number | null;
          thumbnail: string | null;
          slug: string | null;
          status: string;
        };
      }>;
    }>
  >
> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('shop_sections')
      .select(
        `
        id,
        title,
        image_url,
        category_id,
        custom_link,
        is_active,
        display_order,
        shop_section_products!inner(
          product_id,
          display_order,
          listings!inner(
            id,
            product_name,
            starting_price,
            discounted_price,
            thumbnail,
            slug,
            status
          )
        )
      `,
      )
      .eq('is_active', true)
      .order('display_order')
      .order('display_order', { foreignTable: 'shop_section_products' });

    if (error) throw error;
    return { data: (data || []) as unknown, error: null };
  }, 'fetchShopSectionsWithProducts');
}

// Shop Video Config interfaces
export interface ShopVideoConfig {
  id: string;
  title: string | null;
  subtitle: string | null;
  video_url: string | null;
  phone_mockup_url: string | null;
  cta_text: string | null;
  cta_link: string | null;
  cta_bg_color: string | null;
  cta_text_color: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ShopVideoFeature {
  id: string;
  config_id: string;
  image_url: string | null;
  text: string | null;
  link: string | null;
  display_order: number;
  is_active: boolean;
}

// Fetch shop video config with features (admin - includes inactive)
export async function fetchShopVideoConfigAdmin(): Promise<
  Result<{ config: ShopVideoConfig | null; features: ShopVideoFeature[] }>
> {
  return withErrorHandling(async () => {
    const { data: config, error: configError } = await supabase
      .from('shop_video_config')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (configError) throw configError;
    if (!config) return { data: { config: null, features: [] }, error: null };

    const { data: features, error: featuresError } = await supabase
      .from('shop_video_features')
      .select('*')
      .eq('config_id', config.id)
      .order('display_order', { ascending: true });

    if (featuresError) throw featuresError;

    return {
      data: {
        config: config as ShopVideoConfig,
        features: (features || []) as ShopVideoFeature[],
      },
      error: null,
    };
  }, 'fetchShopVideoConfigAdmin');
}

// Fetch shop video config with features
export async function fetchShopVideoConfig(): Promise<
  Result<{ config: ShopVideoConfig; features: ShopVideoFeature[] } | null>
> {
  return withErrorHandling(async () => {
    const { data: config, error: configError } = await supabase
      .from('shop_video_config')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (configError) throw configError;
    if (!config) return { data: null, error: null };

    const { data: features, error: featuresError } = await supabase
      .from('shop_video_features')
      .select('*')
      .eq('config_id', config.id)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (featuresError) throw featuresError;

    return {
      data: {
        config: config as ShopVideoConfig,
        features: (features || []) as ShopVideoFeature[],
      },
      error: null,
    };
  }, 'fetchShopVideoConfig');
}

// Create or update shop video config with features
export interface CreateOrUpdateShopVideoConfigInput {
  title?: string | null;
  subtitle?: string | null;
  video_url?: string | null;
  phone_mockup_url?: string | null;
  cta_text?: string | null;
  cta_link?: string | null;
  cta_bg_color?: string;
  cta_text_color?: string;
  is_active?: boolean;
  features?: Array<{
    image_url: string;
    text?: string | null;
    link?: string | null;
    display_order: number;
    is_active?: boolean;
  }>;
}

export async function saveShopVideoConfig(
  input: CreateOrUpdateShopVideoConfigInput,
): Promise<Result<{ config: ShopVideoConfig; features: ShopVideoFeature[] }>> {
  return withMutation(async () => {
    // Fetch existing config
    const { data: existingConfig } = await supabase.from('shop_video_config').select('id').limit(1).maybeSingle();

    let configId: string;

    if (existingConfig) {
      // Update existing config
      const { data: updatedConfig, error: updateError } = await supabase
        .from('shop_video_config')
        .update({
          title: input.title ?? null,
          subtitle: input.subtitle ?? null,
          video_url: input.video_url ?? null,
          phone_mockup_url: input.phone_mockup_url ?? null,
          cta_text: input.cta_text ?? null,
          cta_link: input.cta_link ?? null,
          cta_bg_color: input.cta_bg_color || '#000000',
          cta_text_color: input.cta_text_color || '#FFFFFF',
          is_active: input.is_active ?? true,
        })
        .eq('id', existingConfig.id)
        .select()
        .single();

      if (updateError) throw updateError;
      configId = updatedConfig.id;
    } else {
      // Create new config
      const { data: newConfig, error: createError } = await supabase
        .from('shop_video_config')
        .insert({
          title: input.title ?? null,
          subtitle: input.subtitle ?? null,
          video_url: input.video_url ?? null,
          phone_mockup_url: input.phone_mockup_url ?? null,
          cta_text: input.cta_text ?? null,
          cta_link: input.cta_link ?? null,
          cta_bg_color: input.cta_bg_color || '#000000',
          cta_text_color: input.cta_text_color || '#FFFFFF',
          is_active: input.is_active ?? true,
        })
        .select()
        .single();

      if (createError) throw createError;
      configId = newConfig.id;
    }

    // Delete existing features
    const { error: deleteError } = await supabase.from('shop_video_features').delete().eq('config_id', configId);

    if (deleteError) throw deleteError;

    // Insert new features
    if (input.features && input.features.length > 0) {
      const featuresToInsert = input.features.map((f) => ({
        config_id: configId,
        image_url: f.image_url,
        text: f.text ?? null,
        link: f.link ?? null,
        display_order: f.display_order,
        is_active: f.is_active ?? true,
      }));

      const { error: insertError } = await supabase.from('shop_video_features').insert(featuresToInsert);
      if (insertError) throw insertError;
    }

    // Fetch the complete result
    const { data: config } = await supabase.from('shop_video_config').select('*').eq('id', configId).single();
    const { data: features } = await supabase
      .from('shop_video_features')
      .select('*')
      .eq('config_id', configId)
      .order('display_order', { ascending: true });

    return {
      data: {
        config: config as ShopVideoConfig,
        features: (features || []) as ShopVideoFeature[],
      },
      error: null,
    };
  }, 'saveShopVideoConfig');
}

// Shop Banner interfaces
export interface ShopBanner {
  id: string;
  title: string;
  description: string | null;
  button_text: string | null;
  button_link: string | null;
  button_bg_color: string | null;
  button_text_color: string | null;
  image_url: string;
  display_order: number;
  is_active: boolean | null;
  rotation_interval: number | null;
  created_at: string;
  updated_at: string;
}

// Fetch shop banners
export async function fetchShopBanners(): Promise<Result<ShopBanner[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('shop_banners')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return { data: (data || []) as ShopBanner[], error: null };
  }, 'fetchShopBanners');
}

// Fetch all shop banners (admin - includes inactive)
export async function fetchShopBannersAdmin(): Promise<Result<ShopBanner[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase.from('shop_banners').select('*').order('display_order', { ascending: true });

    if (error) throw error;
    return { data: (data || []) as ShopBanner[], error: null };
  }, 'fetchShopBannersAdmin');
}

// Create shop banner
export async function createShopBanner(input: {
  title: string;
  description?: string | null;
  button_text?: string | null;
  button_link?: string | null;
  image_url: string;
  is_active?: boolean;
  display_order?: number;
  rotation_interval?: number;
  button_bg_color?: string;
  button_text_color?: string;
}): Promise<Result<ShopBanner>> {
  return withMutation(async () => {
    const { data, error } = await supabase
      .from('shop_banners')
      .insert({
        title: input.title,
        description: input.description || null,
        button_text: input.button_text || null,
        button_link: input.button_link || null,
        image_url: input.image_url,
        is_active: input.is_active ?? true,
        display_order: input.display_order ?? 0,
        rotation_interval: input.rotation_interval ?? 6,
        button_bg_color: input.button_bg_color || '#000000',
        button_text_color: input.button_text_color || '#FFFFFF',
      })
      .select()
      .single();

    if (error) throw error;
    return { data: data as ShopBanner, error: null };
  }, 'createShopBanner');
}

// Update shop banner
export async function updateShopBanner(
  bannerId: string,
  updates: Partial<{
    title: string;
    description: string | null;
    button_text: string | null;
    button_link: string | null;
    image_url: string;
    is_active: boolean;
    display_order: number;
    rotation_interval: number;
    button_bg_color: string;
    button_text_color: string;
  }>,
): Promise<Result<ShopBanner>> {
  return withMutation(async () => {
    const { data, error } = await supabase.from('shop_banners').update(updates).eq('id', bannerId).select().single();

    if (error) throw error;
    return { data: data as ShopBanner, error: null };
  }, 'updateShopBanner');
}

// Delete shop banner
export async function deleteShopBanner(bannerId: string): Promise<Result<boolean>> {
  return withMutation(async () => {
    const { error } = await supabase.from('shop_banners').delete().eq('id', bannerId);

    if (error) throw error;
    return { data: true, error: null };
  }, 'deleteShopBanner');
}

// Reorder shop banner
export async function reorderShopBanner(bannerId: string, newOrder: number): Promise<Result<boolean>> {
  return withMutation(async () => {
    const { error } = await supabase.from('shop_banners').update({ display_order: newOrder }).eq('id', bannerId);

    if (error) throw error;
    return { data: true, error: null };
  }, 'reorderShopBanner');
}

// Shop Brand Section interface
export interface ShopBrandSectionItem {
  id: string;
  brand_name: string;
  brand_link: string;
  display_order: number;
  is_active: boolean;
}

// Fetch shop brand section items
export async function fetchShopBrandSectionItems(): Promise<Result<ShopBrandSectionItem[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('shop_brand_section')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return { data: (data || []) as ShopBrandSectionItem[], error: null };
  }, 'fetchShopBrandSectionItems');
}

// Shop Section Management interfaces
export interface ShopSectionAdmin {
  id: string;
  title: string;
  image_url: string;
  image_path: string | null;
  category_id: string;
  custom_link: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// Fetch all shop sections (admin)
export async function fetchShopSectionsAdmin(): Promise<Result<ShopSectionAdmin[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase.from('shop_sections').select('*').order('display_order');

    if (error) throw error;
    return { data: (data || []) as ShopSectionAdmin[], error: null };
  }, 'fetchShopSectionsAdmin');
}

// Create shop section
export async function createShopSection(input: {
  title: string;
  image_url: string;
  image_path?: string | null;
  category_id: string;
  custom_link?: string | null;
  is_active?: boolean;
  display_order?: number;
}): Promise<Result<ShopSectionAdmin>> {
  return withMutation(async () => {
    const { data, error } = await supabase
      .from('shop_sections')
      .insert({
        title: input.title,
        image_url: input.image_url,
        image_path: input.image_path || null,
        category_id: input.category_id,
        custom_link: input.custom_link || null,
        is_active: input.is_active ?? true,
        display_order: input.display_order || 0,
      })
      .select()
      .single();

    if (error) throw error;
    return { data: data as ShopSectionAdmin, error: null };
  }, 'createShopSection');
}

// Update shop section
export async function updateShopSection(
  sectionId: string,
  updates: {
    title?: string;
    image_url?: string;
    image_path?: string | null;
    category_id?: string;
    custom_link?: string | null;
    is_active?: boolean;
    display_order?: number;
  },
): Promise<Result<ShopSectionAdmin>> {
  return withMutation(async () => {
    const { data, error } = await supabase.from('shop_sections').update(updates).eq('id', sectionId).select().single();

    if (error) throw error;
    return { data: data as ShopSectionAdmin, error: null };
  }, 'updateShopSection');
}

// Delete shop section
export async function deleteShopSection(sectionId: string): Promise<Result<boolean>> {
  return withMutation(async () => {
    const { error } = await supabase.from('shop_sections').delete().eq('id', sectionId);

    if (error) throw error;
    return { data: true, error: null };
  }, 'deleteShopSection');
}

// Add products to shop section
export async function addProductsToShopSection(sectionId: string, productIds: string[]): Promise<Result<boolean>> {
  return withMutation(async () => {
    const productLinks = productIds.map((productId, index) => ({
      shop_section_id: sectionId,
      product_id: productId,
      display_order: index,
    }));

    const { error } = await supabase.from('shop_section_products').insert(productLinks);

    if (error) throw error;
    return { data: true, error: null };
  }, 'addProductsToShopSection');
}

// Remove all products from shop section
export async function removeAllProductsFromShopSection(sectionId: string): Promise<Result<boolean>> {
  return withMutation(async () => {
    const { error } = await supabase.from('shop_section_products').delete().eq('shop_section_id', sectionId);

    if (error) throw error;
    return { data: true, error: null };
  }, 'removeAllProductsFromShopSection');
}

// Fetch shop section products
export async function fetchShopSectionProducts(sectionId: string): Promise<Result<string[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('shop_section_products')
      .select('product_id')
      .eq('shop_section_id', sectionId)
      .order('display_order');

    if (error) throw error;
    return { data: (data || []).map((p) => p.product_id), error: null };
  }, 'fetchShopSectionProducts');
}
