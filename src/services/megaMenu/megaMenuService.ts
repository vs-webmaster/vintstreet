// Mega Menu Service
// Centralized data access for mega menu operations
/* eslint-disable @typescript-eslint/no-explicit-any */

import { supabase } from '@/integrations/supabase/client';
import { withErrorHandling, withMutation } from '@/services/api/apiClient';
import type { Result } from '@/types/api';

// Fetch mega menu category brands
export async function fetchMegaMenuCategoryBrands(): Promise<
  Result<
    Array<{
      id: string;
      category_id: string;
      brand_id: string;
      display_order: number;
      brands: { id: string; name: string };
    }>
  >
> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('mega_menu_category_brands')
      .select('id, category_id, brand_id, display_order, brands(id, name)')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return { data: (data || []) as any, error: null };
  }, 'fetchMegaMenuCategoryBrands');
}

// Fetch mega menu trending items (public - with full fields)
export async function fetchMegaMenuTrendingItems(): Promise<
  Result<
    Array<{
      category_id: string;
      item_level: number;
      subcategory_id: string | null;
      sub_subcategory_id: string | null;
      sub_sub_subcategory_id: string | null;
    }>
  >
> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('mega_menu_trending_items')
      .select('category_id, item_level, subcategory_id, sub_subcategory_id, sub_sub_subcategory_id')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return { data: (data || []) as any, error: null };
  }, 'fetchMegaMenuTrendingItems');
}

// Fetch mega menu best sellers (public - with full fields)
export async function fetchMegaMenuBestSellers(): Promise<
  Result<
    Array<{
      category_id: string;
      item_level: number;
      subcategory_id: string | null;
      sub_subcategory_id: string | null;
      sub_sub_subcategory_id: string | null;
    }>
  >
> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('mega_menu_best_sellers')
      .select('category_id, item_level, subcategory_id, sub_subcategory_id, sub_sub_subcategory_id')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return { data: (data || []) as any, error: null };
  }, 'fetchMegaMenuBestSellers');
}

// Fetch mega menu luxury brands
export async function fetchMegaMenuLuxuryBrands(): Promise<
  Result<
    Array<{
      id: string;
      category_id: string;
      brand_id: string;
      display_order: number;
      brands: { id: string; name: string };
    }>
  >
> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('mega_menu_luxury_brands')
      .select('id, category_id, brand_id, display_order, brands(id, name)')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return { data: (data || []) as any, error: null };
  }, 'fetchMegaMenuLuxuryBrands');
}

// Fetch mega menu trending items (admin - with full details)
export async function fetchMegaMenuTrendingItemsAdmin(): Promise<Result<any[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('mega_menu_trending_items')
      .select(
        `
        id, 
        category_id, 
        item_level,
        subcategory_id,
        sub_subcategory_id,
        sub_sub_subcategory_id, 
        display_order,
        product_subcategories(name, slug),
        product_sub_subcategories(name, slug),
        product_sub_sub_subcategories(name, slug)
      `,
      )
      .eq('is_active', true)
      .order('display_order');

    if (error) throw error;
    return { data: (data || []) as any, error: null };
  }, 'fetchMegaMenuTrendingItemsAdmin');
}

// Fetch mega menu best sellers (admin - with full details)
export async function fetchMegaMenuBestSellersAdmin(): Promise<Result<any[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('mega_menu_best_sellers')
      .select(
        `
        id, 
        category_id, 
        item_level,
        subcategory_id,
        sub_subcategory_id,
        sub_sub_subcategory_id, 
        display_order,
        product_subcategories(name, slug),
        product_sub_subcategories(name, slug),
        product_sub_sub_subcategories(name, slug)
      `,
      )
      .eq('is_active', true)
      .order('display_order');

    if (error) throw error;
    return { data: (data || []) as any, error: null };
  }, 'fetchMegaMenuBestSellersAdmin');
}

// Fetch mega menu luxury brands (admin - with full details)
export async function fetchMegaMenuLuxuryBrandsAdmin(): Promise<Result<any[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('mega_menu_luxury_brands')
      .select('id, category_id, brand_id, display_order, brands(id, name)')
      .eq('is_active', true)
      .order('display_order');

    if (error) throw error;
    return { data: (data || []) as any, error: null };
  }, 'fetchMegaMenuLuxuryBrandsAdmin');
}

// Toggle show_in_mega_menu for category levels
export async function toggleCategoryMegaMenuVisibility(
  id: string,
  table: 'product_subcategories' | 'product_sub_subcategories' | 'product_sub_sub_subcategories',
  currentValue: boolean,
): Promise<Result<boolean>> {
  return withMutation(async () => {
    const { error } = await supabase.from(table).update({ show_in_mega_menu: !currentValue }).eq('id', id);

    if (error) throw error;
    return { data: true, error: null };
  }, 'toggleCategoryMegaMenuVisibility');
}

// Add brand to category
export async function addMegaMenuCategoryBrand(categoryId: string, brandId: string): Promise<Result<boolean>> {
  return withMutation(async () => {
    const { error } = await supabase.from('mega_menu_category_brands').insert({
      category_id: categoryId,
      brand_id: brandId,
      is_active: true,
    });

    if (error) throw error;
    return { data: true, error: null };
  }, 'addMegaMenuCategoryBrand');
}

// Remove brand from category
export async function removeMegaMenuCategoryBrand(linkId: string): Promise<Result<boolean>> {
  return withMutation(async () => {
    const { error } = await supabase.from('mega_menu_category_brands').delete().eq('id', linkId);

    if (error) throw error;
    return { data: true, error: null };
  }, 'removeMegaMenuCategoryBrand');
}

// Add trending item
export async function addMegaMenuTrendingItem(insertData: {
  category_id: string;
  item_level: number;
  subcategory_id?: string;
  sub_subcategory_id?: string;
  sub_sub_subcategory_id?: string;
  display_order?: number;
  is_active?: boolean;
}): Promise<Result<boolean>> {
  return withMutation(async () => {
    // Calculate display_order if not provided
    let displayOrder = insertData.display_order;
    if (displayOrder === undefined) {
      const { count } = await supabase
        .from('mega_menu_trending_items')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', insertData.category_id);
      displayOrder = count || 0;
    }

    const { error } = await supabase.from('mega_menu_trending_items').insert({
      ...insertData,
      display_order: displayOrder,
      is_active: insertData.is_active ?? true,
    });

    if (error) throw error;
    return { data: true, error: null };
  }, 'addMegaMenuTrendingItem');
}

// Remove trending item
export async function removeMegaMenuTrendingItem(itemId: string): Promise<Result<boolean>> {
  return withMutation(async () => {
    const { error } = await supabase.from('mega_menu_trending_items').delete().eq('id', itemId);

    if (error) throw error;
    return { data: true, error: null };
  }, 'removeMegaMenuTrendingItem');
}

// Add best seller
export async function addMegaMenuBestSeller(insertData: {
  category_id: string;
  item_level: number;
  subcategory_id?: string;
  sub_subcategory_id?: string;
  sub_sub_subcategory_id?: string;
  display_order?: number;
  is_active?: boolean;
}): Promise<Result<boolean>> {
  return withMutation(async () => {
    // Calculate display_order if not provided
    let displayOrder = insertData.display_order;
    if (displayOrder === undefined) {
      const { count } = await supabase
        .from('mega_menu_best_sellers')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', insertData.category_id);
      displayOrder = count || 0;
    }

    const { error } = await supabase.from('mega_menu_best_sellers').insert({
      ...insertData,
      display_order: displayOrder,
      is_active: insertData.is_active ?? true,
    });

    if (error) throw error;
    return { data: true, error: null };
  }, 'addMegaMenuBestSeller');
}

// Remove best seller
export async function removeMegaMenuBestSeller(itemId: string): Promise<Result<boolean>> {
  return withMutation(async () => {
    const { error } = await supabase.from('mega_menu_best_sellers').delete().eq('id', itemId);

    if (error) throw error;
    return { data: true, error: null };
  }, 'removeMegaMenuBestSeller');
}

// Add luxury brand
export async function addMegaMenuLuxuryBrand(categoryId: string, brandId: string): Promise<Result<boolean>> {
  return withMutation(async () => {
    const { error } = await supabase.from('mega_menu_luxury_brands').insert({
      category_id: categoryId,
      brand_id: brandId,
      is_active: true,
    });

    if (error) throw error;
    return { data: true, error: null };
  }, 'addMegaMenuLuxuryBrand');
}

// Remove luxury brand
export async function removeMegaMenuLuxuryBrand(linkId: string): Promise<Result<boolean>> {
  return withMutation(async () => {
    const { error } = await supabase.from('mega_menu_luxury_brands').delete().eq('id', linkId);

    if (error) throw error;
    return { data: true, error: null };
  }, 'removeMegaMenuLuxuryBrand');
}

// Mega Menu Layout interfaces
export interface MegaMenuLayout {
  id: string;
  category_id: string;
  template_type: string;
  columns: Array<{ items: Array<{ type: string; label: string }> }>;
  image_url: string | null;
  image_alt: string | null;
  image_link: string | null;
  image_column_start: number | null;
  image_column_span: number | null;
  created_at: string;
  updated_at: string;
}

// Fetch mega menu layouts
export async function fetchMegaMenuLayouts(): Promise<Result<MegaMenuLayout[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('mega_menu_layouts')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return {
      data: (data || []).map((item) => {
        let columns = item.columns as any;
        // Normalize old format to new format
        if (columns && Array.isArray(columns)) {
          if (columns.length > 0 && !columns[0].items) {
            columns = columns.map((col: unknown) => ({
              items: [{ type: col.type, label: col.label }],
            }));
          }
        }
        return {
          ...item,
          columns,
        };
      }) as MegaMenuLayout[],
      error: null,
    };
  }, 'fetchMegaMenuLayouts');
}

// Upsert mega menu layout
export async function upsertMegaMenuLayout(
  categoryId: string,
  layoutData: Partial<MegaMenuLayout>,
): Promise<Result<MegaMenuLayout>> {
  return withMutation(async () => {
    const { data, error } = await supabase
      .from('mega_menu_layouts')
      .upsert(
        {
          category_id: categoryId,
          ...layoutData,
        },
        {
          onConflict: 'category_id',
        },
      )
      .select()
      .single();

    if (error) throw error;

    // Normalize columns data (same logic as fetchMegaMenuLayouts)
    let columns = data.columns as any;
    if (columns && Array.isArray(columns)) {
      if (columns.length > 0 && !columns[0].items) {
        columns = columns.map((col: unknown) => ({
          items: [{ type: col.type, label: col.label }],
        }));
      }
    }

    return {
      data: {
        ...data,
        columns,
      } as MegaMenuLayout,
      error: null,
    };
  }, 'upsertMegaMenuLayout');
}

// Mega Menu Image interfaces
export interface MegaMenuImage {
  id: string;
  layout_id: string;
  image_url: string;
  image_alt: string | null;
  image_link: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Fetch mega menu images by layout ID
export async function fetchMegaMenuImages(layoutId: string): Promise<Result<MegaMenuImage[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('mega_menu_images')
      .select('*')
      .eq('layout_id', layoutId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return { data: (data || []) as MegaMenuImage[], error: null };
  }, 'fetchMegaMenuImages');
}

// Fetch all active mega menu images
export async function fetchAllMegaMenuImages(): Promise<Result<MegaMenuImage[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('mega_menu_images')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return { data: (data || []) as MegaMenuImage[], error: null };
  }, 'fetchAllMegaMenuImages');
}

// Create mega menu image
export async function createMegaMenuImage(input: {
  layout_id: string;
  image_url: string;
  image_alt?: string | null;
  image_link?: string | null;
  display_order?: number;
  is_active?: boolean;
}): Promise<Result<MegaMenuImage>> {
  return withMutation(async () => {
    const { data, error } = await supabase
      .from('mega_menu_images')
      .insert({
        layout_id: input.layout_id,
        image_url: input.image_url,
        image_alt: input.image_alt || null,
        image_link: input.image_link || null,
        display_order: input.display_order ?? 0,
        is_active: input.is_active ?? true,
      })
      .select()
      .single();

    if (error) throw error;
    return { data: data as MegaMenuImage, error: null };
  }, 'createMegaMenuImage');
}

// Update mega menu image
export async function updateMegaMenuImage(
  imageId: string,
  updates: Partial<{
    image_url: string;
    image_alt: string | null;
    image_link: string | null;
    display_order: number;
    is_active: boolean;
  }>,
): Promise<Result<MegaMenuImage>> {
  return withMutation(async () => {
    const { data, error } = await supabase.from('mega_menu_images').update(updates).eq('id', imageId).select().single();

    if (error) throw error;
    return { data: data as MegaMenuImage, error: null };
  }, 'updateMegaMenuImage');
}

// Delete mega menu image
export async function deleteMegaMenuImage(imageId: string): Promise<Result<boolean>> {
  return withMutation(async () => {
    const { error } = await supabase.from('mega_menu_images').delete().eq('id', imageId);

    if (error) throw error;
    return { data: true, error: null };
  }, 'deleteMegaMenuImage');
}

// Mega Menu Custom List interfaces
export interface MegaMenuCustomList {
  id: string;
  name: string;
  system_name: string;
  list_type?: string;
  display_order?: number;
  is_active?: boolean;
  category_id?: string | null;
}

// Fetch mega menu custom lists
export async function fetchMegaMenuCustomLists(): Promise<Result<MegaMenuCustomList[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('mega_menu_custom_lists')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return { data: (data || []) as MegaMenuCustomList[], error: null };
  }, 'fetchMegaMenuCustomLists');
}

// Fetch a single custom list by ID
export async function fetchMegaMenuCustomListById(listId: string): Promise<Result<MegaMenuCustomList | null>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase.from('mega_menu_custom_lists').select('*').eq('id', listId).maybeSingle();

    if (error) throw error;
    return { data: (data || null) as MegaMenuCustomList | null, error: null };
  }, 'fetchMegaMenuCustomListById');
}

// Create a custom list
export async function createMegaMenuCustomList(input: {
  name: string;
  system_name: string;
  list_type?: string;
  is_active?: boolean;
}): Promise<Result<MegaMenuCustomList>> {
  return withMutation(async () => {
    // Check if system_name already exists
    const { data: existing } = await supabase
      .from('mega_menu_custom_lists')
      .select('id')
      .eq('system_name', input.system_name)
      .maybeSingle();

    if (existing) {
      throw new Error(
        `A list with system name "${input.system_name}" already exists. Please use a different system name.`,
      );
    }

    const { data, error } = await supabase
      .from('mega_menu_custom_lists')
      .insert({
        name: input.name,
        system_name: input.system_name,
        list_type: input.list_type || 'standard',
        is_active: input.is_active ?? true,
      })
      .select()
      .single();

    if (error) throw error;
    return { data: data as MegaMenuCustomList, error: null };
  }, 'createMegaMenuCustomList');
}

// Update a custom list
export async function updateMegaMenuCustomList(
  listId: string,
  updates: { name?: string; system_name?: string },
): Promise<Result<MegaMenuCustomList>> {
  return withMutation(async () => {
    const { data, error } = await supabase
      .from('mega_menu_custom_lists')
      .update(updates)
      .eq('id', listId)
      .select()
      .single();

    if (error) throw error;
    return { data: data as MegaMenuCustomList, error: null };
  }, 'updateMegaMenuCustomList');
}

// Delete a custom list
export async function deleteMegaMenuCustomList(listId: string): Promise<Result<boolean>> {
  return withMutation(async () => {
    const { error } = await supabase.from('mega_menu_custom_lists').delete().eq('id', listId);

    if (error) throw error;
    return { data: true, error: null };
  }, 'deleteMegaMenuCustomList');
}

// Mega Menu Custom List Item interface
export interface MegaMenuCustomListItem {
  id: string;
  list_id: string;
  name: string;
  url: string | null;
  category_id: string | null;
  category_level: number | null;
  display_order: number;
  is_active: boolean;
}

// Fetch mega menu custom list items
export async function fetchMegaMenuCustomListItems(): Promise<Result<MegaMenuCustomListItem[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('mega_menu_custom_list_items')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return { data: (data || []) as MegaMenuCustomListItem[], error: null };
  }, 'fetchMegaMenuCustomListItems');
}

// Fetch custom list items by list ID
export async function fetchMegaMenuCustomListItemsByListId(listId: string): Promise<Result<MegaMenuCustomListItem[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('mega_menu_custom_list_items')
      .select('*')
      .eq('list_id', listId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return { data: (data || []) as MegaMenuCustomListItem[], error: null };
  }, 'fetchMegaMenuCustomListItemsByListId');
}

// Create a custom list item
export async function createMegaMenuCustomListItem(input: {
  list_id: string;
  name: string;
  url?: string | null;
  category_id?: string | null;
  category_level?: number | null;
  is_active?: boolean;
}): Promise<Result<MegaMenuCustomListItem>> {
  return withMutation(async () => {
    const { data, error } = await supabase
      .from('mega_menu_custom_list_items')
      .insert({
        list_id: input.list_id,
        name: input.name,
        url: input.url || null,
        category_id: input.category_id || null,
        category_level: input.category_level || null,
        is_active: input.is_active ?? true,
      })
      .select()
      .single();

    if (error) throw error;
    return { data: data as MegaMenuCustomListItem, error: null };
  }, 'createMegaMenuCustomListItem');
}

// Update a custom list item
export async function updateMegaMenuCustomListItem(
  itemId: string,
  updates: {
    name?: string;
    url?: string | null;
    category_id?: string | null;
    category_level?: number | null;
  },
): Promise<Result<MegaMenuCustomListItem>> {
  return withMutation(async () => {
    const { data, error } = await supabase
      .from('mega_menu_custom_list_items')
      .update(updates)
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    return { data: data as MegaMenuCustomListItem, error: null };
  }, 'updateMegaMenuCustomListItem');
}

// Delete a custom list item
export async function deleteMegaMenuCustomListItem(itemId: string): Promise<Result<boolean>> {
  return withMutation(async () => {
    const { error } = await supabase.from('mega_menu_custom_list_items').delete().eq('id', itemId);

    if (error) throw error;
    return { data: true, error: null };
  }, 'deleteMegaMenuCustomListItem');
}

// Update category disable_main_link
export async function updateCategoryDisableMainLink(
  categoryId: string,
  disableMainLink: boolean,
): Promise<Result<boolean>> {
  return withMutation(async () => {
    const { error } = await supabase
      .from('product_categories')
      .update({ disable_main_link: disableMainLink })
      .eq('id', categoryId);

    if (error) throw error;
    return { data: true, error: null };
  }, 'updateCategoryDisableMainLink');
}

// Update subcategory mega menu visibility
export async function updateSubcategoryMegaMenuVisibility(
  id: string,
  table: 'product_subcategories' | 'product_sub_subcategories',
  showInMegaMenu: boolean,
): Promise<Result<boolean>> {
  return withMutation(async () => {
    const { error } = await supabase.from(table).update({ show_in_mega_menu: showInMegaMenu }).eq('id', id);

    if (error) throw error;
    return { data: true, error: null };
  }, 'updateSubcategoryMegaMenuVisibility');
}
