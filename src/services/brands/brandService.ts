// Brand Service
// Centralized data access for brand-related operations

import { supabase } from '@/integrations/supabase/client';
import { withErrorHandling, withMutation } from '@/services/api/apiClient';
import type { Result } from '@/types/api';

export interface Brand {
  id: string;
  name: string;
  description?: string | null;
  logo_url?: string | null;
  is_active?: boolean | null;
  is_popular?: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface BrandFilters {
  isActive?: boolean;
  isPopular?: boolean;
  search?: string;
}

export interface CreateBrandInput {
  name: string;
  description?: string;
  logo_url?: string;
  is_active?: boolean;
  is_popular?: boolean;
}

export interface UpdateBrandInput {
  name?: string;
  description?: string | null;
  logo_url?: string | null;
  is_active?: boolean;
  is_popular?: boolean;
}

// Fetch all brands with optional filters
export async function fetchBrands(
  filters: BrandFilters = {}
): Promise<Result<Brand[]>> {
  return withErrorHandling(async () => {
    let query = supabase
      .from('brands')
      .select('*')
      .order('name', { ascending: true });

    if (filters.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }
    if (filters.isPopular !== undefined) {
      query = query.eq('is_popular', filters.isPopular);
    }
    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { data: data as Brand[], error: null };
  }, 'fetchBrands');
}

// Fetch a single brand by ID
export async function fetchBrandById(brandId: string): Promise<Result<Brand>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .eq('id', brandId)
      .single();

    if (error) throw error;
    return { data: data as Brand, error: null };
  }, 'fetchBrandById');
}

// Fetch brand by name
export async function fetchBrandByName(name: string): Promise<Result<Brand | null>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .ilike('name', name)
      .maybeSingle();

    if (error) throw error;
    return { data: data as Brand | null, error: null };
  }, 'fetchBrandByName') as Promise<Result<Brand | null>>;
}

// Create a new brand
export async function createBrand(input: CreateBrandInput): Promise<Result<Brand | null>> {
  return withMutation(async () => {
    const { data, error } = await supabase
      .from('brands')
      .insert({
        name: input.name,
        description: input.description,
        logo_url: input.logo_url,
        is_active: input.is_active ?? true,
        is_popular: input.is_popular ?? false,
      })
      .select()
      .single();

    if (error) throw error;
    return { data: data as Brand, error: null };
  }, 'createBrand');
}

// Update a brand
export async function updateBrand(
  brandId: string,
  updates: UpdateBrandInput
): Promise<Result<Brand | null>> {
  return withMutation(async () => {
    const { data, error } = await supabase
      .from('brands')
      .update(updates)
      .eq('id', brandId)
      .select()
      .single();

    if (error) throw error;
    return { data: data as Brand, error: null };
  }, 'updateBrand');
}

// Delete a brand
export async function deleteBrand(brandId: string): Promise<Result<boolean | null>> {
  return withMutation(async () => {
    const { error } = await supabase
      .from('brands')
      .delete()
      .eq('id', brandId);

    if (error) throw error;
    return { data: true, error: null };
  }, 'deleteBrand');
}

// Toggle brand active status
export async function toggleBrandActive(brandId: string): Promise<Result<Brand | null>> {
  return withMutation(async () => {
    // First get current status
    const { data: current, error: fetchError } = await supabase
      .from('brands')
      .select('is_active')
      .eq('id', brandId)
      .single();

    if (fetchError) throw fetchError;

    // Toggle it
    const { data, error } = await supabase
      .from('brands')
      .update({ is_active: !current.is_active })
      .eq('id', brandId)
      .select()
      .single();

    if (error) throw error;
    return { data: data as Brand, error: null };
  }, 'toggleBrandActive');
}

// Toggle brand popular status
export async function toggleBrandPopular(brandId: string): Promise<Result<Brand | null>> {
  return withMutation(async () => {
    const { data: current, error: fetchError } = await supabase
      .from('brands')
      .select('is_popular')
      .eq('id', brandId)
      .single();

    if (fetchError) throw fetchError;

    const { data, error } = await supabase
      .from('brands')
      .update({ is_popular: !current.is_popular })
      .eq('id', brandId)
      .select()
      .single();

    if (error) throw error;
    return { data: data as Brand, error: null };
  }, 'toggleBrandPopular');
}

// Bulk create brands
export async function bulkCreateBrands(
  brands: CreateBrandInput[]
): Promise<Result<Brand[] | null>> {
  return withMutation(async () => {
    const { data, error } = await supabase
      .from('brands')
      .insert(
        brands.map((b) => ({
          name: b.name,
          description: b.description,
          logo_url: b.logo_url,
          is_active: b.is_active ?? true,
          is_popular: b.is_popular ?? false,
        }))
      )
      .select();

    if (error) throw error;
    return { data: data as Brand[], error: null };
  }, 'bulkCreateBrands');
}
