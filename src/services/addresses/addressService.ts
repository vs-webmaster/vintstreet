// Addresses Service
// Centralized data access for saved addresses

import { supabase } from '@/integrations/supabase/client';
import { withErrorHandling, withMutation } from '@/services/api/apiClient';
import type { Result } from '@/types/api';

export interface SavedAddress {
  id: string;
  user_id: string;
  label: string;
  first_name: string;
  last_name: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string | null;
  postal_code: string;
  country: string;
  phone: string | null;
  is_default: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CreateAddressInput {
  user_id: string;
  label: string;
  first_name: string;
  last_name: string;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state?: string | null;
  postal_code: string;
  country: string;
  phone?: string | null;
  is_default?: boolean;
}

export interface UpdateAddressInput {
  label?: string;
  first_name?: string;
  last_name?: string;
  address_line1?: string;
  address_line2?: string | null;
  city?: string;
  state?: string | null;
  postal_code?: string;
  country?: string;
  phone?: string | null;
  is_default?: boolean;
}

// Fetch all addresses for a user
export async function fetchAddresses(userId: string): Promise<Result<SavedAddress[]>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase
      .from('saved_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: (data || []) as SavedAddress[], error: null };
  }, 'fetchAddresses');
}

// Fetch a single address by ID
export async function fetchAddressById(addressId: string): Promise<Result<SavedAddress | null>> {
  return withErrorHandling(async () => {
    const { data, error } = await supabase.from('saved_addresses').select('*').eq('id', addressId).maybeSingle();

    if (error) throw error;
    return { data: (data as SavedAddress) || null, error: null };
  }, 'fetchAddressById');
}

// Create a new address
export async function createAddress(input: CreateAddressInput): Promise<Result<SavedAddress>> {
  return withMutation(async () => {
    // If this is set as default, unset other defaults
    if (input.is_default) {
      await supabase
        .from('saved_addresses')
        .update({ is_default: false })
        .eq('user_id', input.user_id)
        .eq('is_default', true);
    }

    const { data, error } = await supabase
      .from('saved_addresses')
      .insert([
        {
          ...input,
          phone: input.phone || '',
          state: input.state || '',
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return { data: data as SavedAddress, error: null };
  }, 'createAddress');
}

// Update an existing address
export async function updateAddress(addressId: string, input: UpdateAddressInput): Promise<Result<SavedAddress>> {
  return withMutation(async () => {
    // If this is set as default, unset other defaults
    if (input.is_default) {
      const { data: address } = await supabase.from('saved_addresses').select('user_id').eq('id', addressId).single();

      if (address) {
        await supabase
          .from('saved_addresses')
          .update({ is_default: false })
          .eq('user_id', address.user_id)
          .eq('is_default', true)
          .neq('id', addressId);
      }
    }

    const { data, error } = await supabase.from('saved_addresses').update(input).eq('id', addressId).select().single();

    if (error) throw error;
    return { data: data as SavedAddress, error: null };
  }, 'updateAddress');
}

// Delete an address
export async function deleteAddress(addressId: string): Promise<Result<boolean>> {
  return withMutation(async () => {
    const { error } = await supabase.from('saved_addresses').delete().eq('id', addressId);

    if (error) throw error;
    return { data: true, error: null };
  }, 'deleteAddress');
}
