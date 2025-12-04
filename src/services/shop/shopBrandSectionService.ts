// Shop Brand Section Service
// Centralized data access for shop brand section operations

import { supabase } from '@/integrations/supabase/client';
import { withErrorHandling, withMutation } from '@/services/api/apiClient';
import type { Result } from '@/types/api';

export interface BrandItem {
  id: string;
  brand_name: string;
  brand_link: string;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateBrandItemInput {
  brand_name: string;
  brand_link: string;
  display_order?: number;
  is_active?: boolean;
}

export interface UpdateBrandItemInput {
  brand_name?: string;
  brand_link?: string;
  display_order?: number;
  is_active?: boolean;
}

// Fetch all brand items
export async function fetchBrandItems(): Promise<Result<BrandItem[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('shop_brand_section')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;
    return { data: (data || []) as BrandItem[], error: null };
  }, 'fetchBrandItems');
}

// Create a new brand item
export async function createBrandItem(input: CreateBrandItemInput): Promise<Result<BrandItem>> {
  return withMutation(async () => {
    const { data, error } = await supabase
      .from('shop_brand_section')
      .insert([{ ...input, is_active: input.is_active ?? true }])
      .select()
      .single();

    if (error) throw error;
    return { data: data as BrandItem, error: null };
  }, 'createBrandItem');
}

// Update a brand item
export async function updateBrandItem(brandId: string, input: UpdateBrandItemInput): Promise<Result<BrandItem>> {
  return withMutation(async () => {
    const { data, error } = await supabase.from('shop_brand_section').update(input).eq('id', brandId).select().single();

    if (error) throw error;
    return { data: data as BrandItem, error: null };
  }, 'updateBrandItem');
}

// Delete a brand item
export async function deleteBrandItem(brandId: string): Promise<Result<boolean>> {
  return withMutation(async () => {
    const { error } = await supabase.from('shop_brand_section').delete().eq('id', brandId);

    if (error) throw error;
    return { data: true, error: null };
  }, 'deleteBrandItem');
}
