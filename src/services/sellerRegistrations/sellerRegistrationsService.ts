// Seller Registrations Service
// Centralized data access for seller registration operations

import { supabase } from '@/integrations/supabase/client';
import { withErrorHandling, withMutation } from '@/services/api/apiClient';
import type { Result } from '@/types/api';

export interface SellerRegistration {
  id: string;
  email: string;
  shop_name: string | null;
  categories: string[];
  selling_methods: string[];
  created_at: string;
}

// Fetch all seller registrations (admin)
export async function fetchSellerRegistrations(): Promise<Result<SellerRegistration[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('seller_registrations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: (data || []) as SellerRegistration[], error: null };
  }, 'fetchSellerRegistrations');
}

// Create a seller registration
export async function createSellerRegistration(input: {
  email: string;
  shop_name?: string | null;
  categories: string[];
  selling_methods: string[];
}): Promise<Result<SellerRegistration>> {
  return withMutation(async () => {
    const { data, error } = await supabase
      .from('seller_registrations')
      .insert({
        email: input.email.trim(),
        shop_name: input.shop_name?.trim() || null,
        categories: input.categories,
        selling_methods: input.selling_methods,
      })
      .select()
      .single();

    if (error) throw error;
    return { data: data as SellerRegistration, error: null };
  }, 'createSellerRegistration');
}
